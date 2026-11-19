// Copyright (c) 2026 Zeke Sikelianos
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { parseArtifacts, parseSurface } from "../../../lib/artifacts";
import {
  type CompletionSource,
  getProgress,
  markExerciseComplete,
  markExerciseIncomplete,
  markLessonComplete,
  markLessonIncomplete,
  resetProgress,
} from "../../../lib/progress";
import {
  completionTarget,
  parseJsonObject,
  undoTarget,
} from "../../../lib/request-body";
import { isValidStudentId } from "../../../lib/student-id";
import {
  getAgentOnlySlugs,
  getValidSlugs,
  validateSlug,
} from "../../../lib/valid-slugs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function notFound(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const GET: APIRoute = async ({ params }) => {
  const { studentId } = params;
  if (!studentId || !isValidStudentId(studentId)) {
    return badRequest("Invalid student ID format");
  }

  const progress = await getProgress(env.PROGRESS, studentId);
  if (!progress) {
    return notFound("Student not found");
  }

  return new Response(JSON.stringify(progress), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { studentId } = params;
  if (!studentId || !isValidStudentId(studentId)) {
    return badRequest("Invalid student ID format");
  }

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return badRequest(parsed.error);
  const body = parsed.body;

  const target = completionTarget(body);
  if (!target.ok) return badRequest(target.error);
  const { kind, slug } = target;

  if (
    body.source !== undefined &&
    body.source !== "agent" &&
    body.source !== "browser"
  ) {
    return badRequest('Invalid source: must be "agent" or "browser"');
  }
  const source: CompletionSource =
    body.source === "agent" ? "agent" : "browser";

  if (body.model !== undefined && typeof body.model !== "string") {
    return badRequest("Invalid model: must be a string");
  }
  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim().slice(0, 128)
      : undefined;

  const surface = parseSurface(body.surface);
  if (!surface.ok) return badRequest(surface.error);
  const artifacts = parseArtifacts(body.artifacts);
  if (!artifacts.ok) return badRequest(artifacts.error);
  if (artifacts.artifacts.length > 0 && source !== "agent") {
    return badRequest(
      'Only the tutor can report artifacts (send "source": "agent")',
    );
  }

  const { lessonSlugs, exerciseSlugs } = await getValidSlugs();
  const slugError =
    kind === "exercise"
      ? validateSlug(slug, exerciseSlugs, "exercise")
      : validateSlug(slug, lessonSlugs, "lesson");
  if (slugError) {
    return badRequest(slugError);
  }

  // Agent-only lessons cannot be completed from the browser
  if (kind === "lesson" && source === "browser") {
    const agentOnlySlugs = await getAgentOnlySlugs();
    if (agentOnlySlugs.has(slug)) {
      return new Response(
        JSON.stringify({
          error:
            'This lesson can only be completed by the Vibe agent (send "source": "agent")',
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
  }

  const extras = {
    model,
    surface: surface.surface,
    artifacts: artifacts.artifacts,
  };
  const progress =
    kind === "exercise"
      ? await markExerciseComplete(
          env.PROGRESS,
          studentId,
          slug,
          source,
          extras,
        )
      : await markLessonComplete(env.PROGRESS, studentId, slug, source, extras);
  if (!progress) {
    return notFound("Student not found");
  }

  return new Response(JSON.stringify(progress), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const { studentId } = params;
  if (!studentId || !isValidStudentId(studentId)) {
    return badRequest("Invalid student ID format");
  }

  const parsed = await parseJsonObject(request);
  if (!parsed.ok) return badRequest(parsed.error);

  const target = undoTarget(parsed.body);
  if (!target.ok) return badRequest(target.error);

  if (target.kind !== "reset") {
    const { lessonSlugs, exerciseSlugs } = await getValidSlugs();
    const slugError =
      target.kind === "exercise"
        ? validateSlug(target.slug, exerciseSlugs, "exercise")
        : validateSlug(target.slug, lessonSlugs, "lesson");
    if (slugError) {
      return badRequest(slugError);
    }
  }

  let progress: Awaited<ReturnType<typeof resetProgress>>;
  if (target.kind === "reset") {
    progress = await resetProgress(env.PROGRESS, studentId);
  } else if (target.kind === "exercise") {
    progress = await markExerciseIncomplete(
      env.PROGRESS,
      studentId,
      target.slug,
    );
  } else {
    progress = await markLessonIncomplete(env.PROGRESS, studentId, target.slug);
  }

  if (!progress) {
    return notFound("Student not found");
  }

  return new Response(JSON.stringify(progress), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};

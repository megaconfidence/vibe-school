// Copyright (c) 2026 Zeke Sikelianos
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { getCollection } from "astro:content";
import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { buildAgentInstructions } from "../../../lib/agent-instructions";
import { getProfile } from "../../../lib/progress";
import { isValidStudentId } from "../../../lib/student-id";

export const prerender = false;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const GET: APIRoute = async ({ params, request }) => {
  const lessons = await getCollection("lessons");
  const lesson = lessons.find((l) => l.data.slug === params.slug);

  if (!lesson) {
    return new Response(JSON.stringify({ error: "Lesson not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const studentId = new URL(request.url).searchParams.get("studentId");
  const profile =
    studentId && isValidStudentId(studentId)
      ? await getProfile(env.PROGRESS, studentId)
      : null;

  const body = {
    title: lesson.data.title,
    slug: lesson.data.slug,
    description: lesson.data.description,
    order: lesson.data.order,
    quiz: lesson.data.quiz,
    track: lesson.data.track,
    surfaces: lesson.data.surfaces,
    agentOnly: lesson.data.agentOnly,
    goals: lesson.data.goals,
    minutes: lesson.data.minutes ?? null,
    checklist: lesson.data.checklist,
    selfPaced: lesson.data.selfPaced,
    agentInstructions: buildAgentInstructions(lesson.data.agentInstructions, {
      origin: new URL(request.url).origin,
      quiz: lesson.data.quiz,
      pace: profile?.pace,
    }),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

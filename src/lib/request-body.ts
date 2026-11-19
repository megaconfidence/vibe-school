// Parsing and validation for JSON request bodies of the progress and profile
// API routes. Kept free of Astro/Cloudflare imports so it can be unit tested.

export type JsonObject = Record<string, unknown>;

export type ParseResult =
  | { ok: true; body: JsonObject }
  | { ok: false; error: string };

/**
 * Parse a request body that must be a JSON object. `null`, primitives and
 * arrays are valid JSON but not valid bodies for these routes.
 */
export async function parseJsonObject(request: Request): Promise<ParseResult> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "JSON body must be an object" };
  }
  return { ok: true, body: body as JsonObject };
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export type CompletionTarget =
  | { ok: true; kind: "lesson" | "exercise"; slug: string }
  | { ok: false; error: string };

/** Body of PUT /api/progress/:id: exactly one of lessonSlug / exerciseSlug. */
export function completionTarget(body: JsonObject): CompletionTarget {
  const hasLesson = nonEmptyString(body.lessonSlug);
  const hasExercise = nonEmptyString(body.exerciseSlug);
  if (hasLesson && hasExercise) {
    return {
      ok: false,
      error: 'Send either "lessonSlug" or "exerciseSlug", not both',
    };
  }
  if (hasLesson) {
    return { ok: true, kind: "lesson", slug: body.lessonSlug as string };
  }
  if (hasExercise) {
    return { ok: true, kind: "exercise", slug: body.exerciseSlug as string };
  }
  return {
    ok: false,
    error: 'Missing or invalid "lessonSlug" or "exerciseSlug" field',
  };
}

export type UndoTarget =
  | { ok: true; kind: "reset" }
  | { ok: true; kind: "lesson" | "exercise"; slug: string }
  | { ok: false; error: string };

/** Body of DELETE /api/progress/:id: exactly one of reset / lessonSlug / exerciseSlug. */
export function undoTarget(body: JsonObject): UndoTarget {
  const isReset = body.reset === true;
  const hasLesson = nonEmptyString(body.lessonSlug);
  const hasExercise = nonEmptyString(body.exerciseSlug);
  const count = [isReset, hasLesson, hasExercise].filter(Boolean).length;
  if (count > 1) {
    return {
      ok: false,
      error: 'Send only one of "lessonSlug", "exerciseSlug", or "reset": true',
    };
  }
  if (isReset) return { ok: true, kind: "reset" };
  if (hasLesson) {
    return { ok: true, kind: "lesson", slug: body.lessonSlug as string };
  }
  if (hasExercise) {
    return { ok: true, kind: "exercise", slug: body.exerciseSlug as string };
  }
  return {
    ok: false,
    error: 'Provide "lessonSlug", "exerciseSlug", or "reset": true',
  };
}

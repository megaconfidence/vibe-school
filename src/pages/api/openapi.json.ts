// Copyright (c) 2026 Zeke Sikelianos
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0
// Modified for Vibe School.
import type { APIRoute } from "astro";
import {
  ARTIFACT_KINDS,
  MAX_ARTIFACT_NAME,
  MAX_ARTIFACTS_PER_CALL,
} from "../../lib/artifacts";
import { SURFACES, TRACKS } from "../../lib/tracks";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const GET: APIRoute = (context) => {
  const origin = new URL(context.request.url).origin;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Vibe School API",
      description:
        "API for fetching lesson and exercise content, enrolling students, and tracking progress through Vibe School.",
      version: "1.0.0",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/lessons": {
        get: {
          summary: "List all lessons",
          description:
            'Returns all lessons sorted by order, including agent instructions. Quiz lessons only include quiz instructions when the student\'s pace is "thorough"; pass studentId to get pace-aware instructions.',
          parameters: [
            {
              name: "studentId",
              in: "query",
              required: false,
              schema: { type: "string" },
              example: "steady-mistral-4821",
              description:
                "Student ID, used to look up pace and shape whether quiz instructions are included. Omitted or unknown IDs default to fast pace (no quiz).",
            },
          ],
          responses: {
            "200": {
              description: "Array of all lessons",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Lesson" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/lessons/{slug}": {
        get: {
          summary: "Get a single lesson",
          description:
            'Returns a single lesson by slug, including agent instructions. Quiz lessons only include quiz instructions when the student\'s pace is "thorough"; pass studentId to get pace-aware instructions.',
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "installation",
            },
            {
              name: "studentId",
              in: "query",
              required: false,
              schema: { type: "string" },
              example: "steady-mistral-4821",
              description:
                "Student ID, used to look up pace and shape whether quiz instructions are included. Omitted or unknown IDs default to fast pace (no quiz).",
            },
          ],
          responses: {
            "200": {
              description: "Lesson found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Lesson" },
                },
              },
            },
            "404": {
              description: "Lesson not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/exercises": {
        get: {
          summary: "List all exercises",
          description:
            "Returns all exercises sorted by order, including agent instructions.",
          responses: {
            "200": {
              description: "Array of all exercises",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Exercise" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/exercises/{slug}": {
        get: {
          summary: "Get a single exercise",
          description:
            "Returns a single exercise by slug, including agent instructions.",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "build-a-website",
            },
          ],
          responses: {
            "200": {
              description: "Exercise found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Exercise" },
                },
              },
            },
            "404": {
              description: "Exercise not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/enroll": {
        post: {
          summary: "Enroll a new student",
          description:
            "Generates a unique student ID and creates an empty progress record.",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deviceId: {
                      type: "string",
                      description:
                        "Anonymous device identifier generated by the client. Used to correlate multiple enrollments from the same device without capturing PII.",
                      example: "550e8400-e29b-41d4-a716-446655440000",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Student enrolled",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      studentId: {
                        type: "string",
                        example: "steady-mistral-4821",
                      },
                      progress: { $ref: "#/components/schemas/Progress" },
                    },
                    required: ["studentId", "progress"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/progress/{studentId}": {
        get: {
          summary: "Get student progress",
          description:
            "Returns the student's progress, including which lessons they have completed.",
          parameters: [
            {
              name: "studentId",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "steady-mistral-4821",
            },
          ],
          responses: {
            "200": {
              description: "Progress found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Progress" },
                },
              },
            },
            "400": {
              description: "Invalid student ID format",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Student not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          summary: "Mark a lesson or exercise as complete",
          description:
            "Marks a lesson or exercise as complete for the given student. Supply either lessonSlug or exerciseSlug (not both; sending both is a 400). Idempotent for the completion itself: marking an already-completed item keeps its original date, but any surface and artifacts sent are still recorded. The slug must match an existing lesson or exercise; unknown slugs are rejected with a 400 error. Agents can also send surface and artifacts so the student's homepage shows what they built and where.",
          parameters: [
            {
              name: "studentId",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "steady-mistral-4821",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lessonSlug: {
                      type: "string",
                      description:
                        "Slug of the lesson to mark complete. Must match an existing lesson. Provide this or exerciseSlug.",
                      example: "installation",
                    },
                    exerciseSlug: {
                      type: "string",
                      description:
                        "Slug of the exercise to mark complete. Must match an existing exercise. Provide this or lessonSlug.",
                      example: "build-a-website",
                    },
                    source: {
                      type: "string",
                      enum: ["browser", "agent"],
                      description:
                        'Who marked the item complete. Omit or use "browser" for student-initiated completions; use "agent" when an AI agent marks it complete on the student\'s behalf.',
                      example: "agent",
                    },
                    model: {
                      type: "string",
                      description:
                        "The model ID used by the agent to complete this item, up to 128 characters (longer values are cut). Omit it if you don't know your model ID.",
                      example: "mistral-large-4",
                    },
                    surface: {
                      type: "string",
                      enum: [...SURFACES],
                      description:
                        "Where the tutor is running: cli, vscode or desktop (code-web or work only if the agent really runs there). Shown as the student's surfaces used.",
                      example: "cli",
                    },
                    artifacts: {
                      type: "array",
                      maxItems: MAX_ARTIFACTS_PER_CALL,
                      description:
                        'What the student built in this lesson, named by the lesson instructions. Agent only (source must be "agent"). Never send file contents, absolute paths, secrets or personal data. An artifact with the same kind and name as an earlier one replaces it.',
                      items: { $ref: "#/components/schemas/ArtifactInput" },
                      example: [
                        { kind: "skill", name: "new-command" },
                        { kind: "skill", name: "code-review" },
                      ],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Progress updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Progress" },
                },
              },
            },
            "400": {
              description: "Invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "403": {
              description:
                "Lesson is agent-only and cannot be completed from the browser",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Student not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        delete: {
          summary: "Undo a completion or reset all progress",
          description:
            'Removes a lesson or exercise from the student\'s completed list, or resets all progress. Send { "lessonSlug": "..." } to uncomplete a lesson, { "exerciseSlug": "..." } to uncomplete an exercise, or { "reset": true } to clear all completions. Resetting clears completions, artifacts and surfacesUsed, and preserves the student\'s profile, enrollment date, and device ID. The slug must match an existing lesson or exercise; unknown slugs are rejected with a 400 error.',
          parameters: [
            {
              name: "studentId",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "steady-mistral-4821",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lessonSlug: {
                      type: "string",
                      description:
                        "Slug of the lesson to mark incomplete. Provide this, exerciseSlug, or reset.",
                      example: "installation",
                    },
                    exerciseSlug: {
                      type: "string",
                      description:
                        "Slug of the exercise to mark incomplete. Provide this, lessonSlug, or reset.",
                      example: "build-a-website",
                    },
                    reset: {
                      type: "boolean",
                      description:
                        "Set to true to clear all completed lessons and exercises. Preserves profile and enrollment metadata.",
                      example: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Progress updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Progress" },
                },
              },
            },
            "400": {
              description: "Invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Student not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/profile/{studentId}": {
        get: {
          summary: "Get student profile",
          description:
            "Returns the student's profile: their preferences and background from the interview lesson.",
          parameters: [
            {
              name: "studentId",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "steady-mistral-4821",
            },
          ],
          responses: {
            "200": {
              description: "Profile found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      profile: {
                        $ref: "#/components/schemas/StudentProfile",
                      },
                    },
                    required: ["profile"],
                  },
                },
              },
            },
            "400": {
              description: "Invalid student ID format",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Student not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update student profile",
          description:
            "Merges new profile fields into the student's existing profile. Partial updates are supported: only include the fields you want to set or change.",
          parameters: [
            {
              name: "studentId",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "steady-mistral-4821",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StudentProfile",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Profile updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      profile: {
                        $ref: "#/components/schemas/StudentProfile",
                      },
                    },
                    required: ["profile"],
                  },
                },
              },
            },
            "400": {
              description: "Invalid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Student not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Lesson: {
          type: "object",
          properties: {
            order: { type: "integer", example: 1 },
            slug: { type: "string", example: "installation" },
            title: { type: "string", example: "Installation" },
            description: {
              type: "string",
              example: "Install Vibe and send your first prompt.",
            },
            track: {
              type: "string",
              enum: [...TRACKS],
              description: "Course track the lesson belongs to.",
              example: "start",
            },
            surfaces: {
              type: "array",
              items: {
                type: "string",
                enum: [...SURFACES],
              },
              description:
                "Vibe surfaces where the hands-on part of this item can be done.",
              example: ["cli", "vscode", "desktop"],
            },
            agentOnly: {
              type: "boolean",
              description:
                'If true, only the agent can mark this lesson complete (source must be "agent").',
              example: false,
            },
            goals: {
              type: "array",
              items: { type: "string" },
              description:
                "What the student will learn, as 3 or 4 short bullets.",
            },
            minutes: {
              type: ["integer", "null"],
              description: "Rough time to finish with a tutor, in minutes.",
              example: 15,
            },
            checklist: {
              type: "array",
              items: { type: "string" },
              description:
                "Browser steps for Work and Code Web lessons. A student without a local tutor follows them on the lesson page and marks the lesson complete there.",
            },
            selfPaced: {
              type: "boolean",
              description:
                "If true, the lesson is done by reading the page (Installation, before Vibe is installed).",
            },
            quiz: {
              type: "boolean",
              description:
                "If true, this lesson has quiz topics. Quiz instructions are appended to agentInstructions at serve time only for students on thorough pace (pass studentId).",
              example: false,
            },
            agentInstructions: {
              type: "string",
              example:
                "Verify completion by running `vibe --version` and confirming it prints a version number.",
            },
          },
          required: [
            "order",
            "slug",
            "title",
            "description",
            "track",
            "surfaces",
            "agentOnly",
            "quiz",
            "agentInstructions",
          ],
        },
        Exercise: {
          type: "object",
          properties: {
            order: { type: "integer", example: 1 },
            slug: { type: "string", example: "build-a-website" },
            title: { type: "string", example: "Build a website" },
            description: {
              type: "string",
              example: "Build and preview a small website with Vibe.",
            },
            surfaces: {
              type: "array",
              items: {
                type: "string",
                enum: [...SURFACES],
              },
              description:
                "Vibe surfaces where the hands-on part of this item can be done.",
              example: ["cli", "vscode", "desktop"],
            },
            agentInstructions: {
              type: "string",
              example:
                "Guide the student through building a small static website with Vibe and previewing it locally.",
            },
          },
          required: [
            "order",
            "slug",
            "title",
            "description",
            "surfaces",
            "agentInstructions",
          ],
        },
        ArtifactInput: {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { type: "string", enum: [...ARTIFACT_KINDS] },
            name: {
              type: "string",
              maxLength: MAX_ARTIFACT_NAME,
              pattern: "^[A-Za-z0-9._\\-/:]+$",
              description:
                "Short identifier, model tag or relative path, for example new-command, devstral:24b or .vibe/config.toml. No absolute paths, no ..",
            },
          },
          required: ["kind"],
        },
        Artifact: {
          type: "object",
          properties: {
            kind: { type: "string", enum: [...ARTIFACT_KINDS] },
            name: { type: "string" },
            lesson: {
              type: "string",
              description: "Lesson that reported it, if any.",
            },
            surface: { type: "string", enum: [...SURFACES] },
            at: { type: "string", format: "date-time" },
          },
          required: ["kind", "at"],
        },
        CompletedExercise: {
          type: "object",
          properties: {
            slug: { type: "string", example: "build-a-website" },
            completedAt: { type: "string", format: "date-time" },
            source: { type: "string", enum: ["browser", "agent"] },
            model: {
              type: "string",
              description:
                "The model ID used by the agent to complete this exercise, if applicable.",
              example: "mistral-large-4",
            },
            surface: { type: "string", enum: [...SURFACES] },
          },
          required: ["slug", "completedAt", "source"],
        },
        CompletedLesson: {
          type: "object",
          properties: {
            slug: { type: "string", example: "installation" },
            completedAt: { type: "string", format: "date-time" },
            source: { type: "string", enum: ["browser", "agent"] },
            model: {
              type: "string",
              description:
                "The model ID used by the agent to complete this lesson, if applicable.",
              example: "mistral-large-4",
            },
            surface: { type: "string", enum: [...SURFACES] },
          },
          required: ["slug", "completedAt", "source"],
        },
        StudentProfile: {
          type: "object",
          description:
            "Student preferences and background from the interview lesson. All fields are optional.",
          properties: {
            codingExperience: {
              type: "string",
              enum: ["rookie", "dabbler", "builder", "sage"],
              description:
                "Programming experience level. rookie = never written code, dabbler = tinkered a bit, builder = builds regularly, sage = lives in the code.",
            },
            pace: {
              type: "string",
              enum: ["fast", "thorough"],
              description:
                "Course pace. fast (default) skips quizzes and keeps explanations minimal. thorough includes quizzes and fuller explanations.",
            },
            aiTools: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "le-chat",
                  "chatgpt",
                  "gemini",
                  "claude",
                  "claude-code",
                  "openai-codex",
                  "copilot",
                  "cursor",
                  "opencode",
                ],
              },
              description: "AI tools the student has used.",
            },
            editor: {
              type: "string",
              enum: [
                "vscode",
                "jetbrains",
                "cursor",
                "windsurf",
                "zed",
                "vim",
                "emacs",
                "other",
                "none",
              ],
              description:
                'Code editor the student uses. "none" means they don\'t have one yet.',
            },
            terminalComfort: {
              type: "string",
              enum: ["none", "some", "very"],
              description:
                "Terminal comfort level. none = not at all, some = can get around, very = very comfortable.",
            },
            learningStyle: {
              type: "string",
              enum: ["concepts-first", "hands-on", "examples"],
              description:
                "Preferred learning style. concepts-first = explain then practice, hands-on = jump into tasks, examples = learn by example.",
            },
            depthPreference: {
              type: "string",
              enum: ["brief", "some-context", "all-details"],
              description:
                "Preferred explanation depth. brief = short and direct, some-context = moderate detail, all-details = thorough.",
            },
            languages: {
              type: "array",
              items: {
                type: "string",
                enum: ["javascript", "typescript", "python", "go", "rust"],
              },
              description:
                "Programming languages the student uses. Only populated for experienced programmers (builder/sage).",
            },
            surfaces: {
              type: "array",
              items: {
                type: "string",
                enum: [...SURFACES],
              },
              description:
                "Vibe surfaces the student uses or wants to learn: cli, vscode (VS Code extension), desktop (Vibe Desktop), code-web (Vibe Code Web), work (Vibe Work).",
            },
            role: {
              type: "string",
              enum: ["developer", "team-lead", "knowledge-worker"],
              description:
                "Picked on the homepage at enrollment. Use it to choose examples.",
            },
            os: {
              type: "string",
              description:
                "Operating system, auto-detected by the agent (e.g. macos, linux, windows).",
            },
          },
        },
        Progress: {
          type: "object",
          properties: {
            completedLessons: {
              type: "array",
              items: { $ref: "#/components/schemas/CompletedLesson" },
              example: [
                {
                  slug: "installation",
                  completedAt: "2026-03-17T12:00:00Z",
                  source: "browser",
                },
              ],
            },
            completedExercises: {
              type: "array",
              items: { $ref: "#/components/schemas/CompletedExercise" },
              example: [
                {
                  slug: "build-a-website",
                  completedAt: "2026-03-20T14:30:00Z",
                  source: "agent",
                },
              ],
            },
            profile: {
              $ref: "#/components/schemas/StudentProfile",
            },
            artifacts: {
              type: "array",
              description:
                "What the student has built, as reported by the tutor. Newest last, at most 100.",
              items: { $ref: "#/components/schemas/Artifact" },
            },
            surfacesUsed: {
              type: "array",
              description:
                "Surfaces the tutor has run in, in the order first seen.",
              items: { type: "string", enum: [...SURFACES] },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deviceId: {
              type: "string",
              description:
                "Anonymous device identifier. Present only if the client supplied one at enrollment time.",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
          },
          required: [
            "completedLessons",
            "completedExercises",
            "artifacts",
            "surfacesUsed",
            "createdAt",
            "updatedAt",
          ],
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
          required: ["error"],
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
};

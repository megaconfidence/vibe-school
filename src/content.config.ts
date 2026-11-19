// Copyright (c) 2026 Zeke Sikelianos
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0
// Adapted for Vibe School.

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { SURFACES, TRACKS } from "./lib/tracks";

export { SURFACES, TRACKS };

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    order: z.number(),
    track: z.enum(TRACKS),
    surfaces: z.array(z.enum(SURFACES)).default([]),
    quiz: z.boolean(),
    agentOnly: z.boolean().default(false),
    /** 3 or 4 short "What you'll learn" bullets shown above the fold. */
    goals: z.array(z.string()).max(5).default([]),
    /** Rough time to finish with a tutor, in minutes. */
    minutes: z.number().int().positive().optional(),
    /**
     * Steps for lessons done in the browser (chat.mistral.ai). Shown as a
     * checklist so Work-only learners can follow without a local tutor.
     */
    checklist: z.array(z.string()).default([]),
    /**
     * Done by reading the page, without a tutor (Installation: Vibe isn't
     * installed yet). The notes open by default and "Mark complete" leads.
     */
    selfPaced: z.boolean().default(false),
    agentInstructions: z.string(),
  }),
});

const exercises = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/exercises" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    order: z.number(),
    surfaces: z.array(z.enum(SURFACES)).default([]),
    agentInstructions: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/pages" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
  }),
});

export const collections = { lessons, exercises, pages };

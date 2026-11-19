// Artifacts are small, non-sensitive facts a tutor reports when it marks a
// lesson complete ("the student now has a skill called new-command"). They
// power the "Your Vibe setup" panel. Kept free of Astro/Cloudflare imports so
// it can be unit tested.

import { SURFACES, type Surface } from "./tracks";

export const ARTIFACT_KINDS = [
  "project",
  "config",
  "permission",
  "instructions",
  "model",
  "skill",
  "agent",
  "mcp",
  "hook",
  "plugin",
  "automation",
  "worktree",
  "rollout",
] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export const ARTIFACT_LABELS: Record<ArtifactKind, string> = {
  project: "Project",
  config: "Config",
  permission: "Permissions",
  instructions: "Instructions",
  model: "Model",
  skill: "Skills",
  agent: "Agents",
  mcp: "MCP servers",
  hook: "Hooks",
  plugin: "Plugins",
  automation: "Automation",
  worktree: "Worktrees",
  rollout: "Team rollout",
};

export const MAX_ARTIFACTS_PER_CALL = 10;
export const MAX_ARTIFACTS_STORED = 100;
export const MAX_ARTIFACT_NAME = 64;

/** Letters, digits and . _ - / : only (":" for model tags like devstral:24b). No spaces, no absolute paths. */
const NAME_RE = /^[A-Za-z0-9._\-/:]+$/;

export interface Artifact {
  kind: ArtifactKind;
  name?: string;
  lesson?: string;
  surface?: Surface;
  at: string;
}

export type ArtifactInput = { kind: ArtifactKind; name?: string };

export type ParsedArtifacts =
  | { ok: true; artifacts: ArtifactInput[] }
  | { ok: false; error: string };

function isSafeName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= MAX_ARTIFACT_NAME &&
    NAME_RE.test(name) &&
    !name.startsWith("/") &&
    !name.includes("..")
  );
}

/** Validate the optional `artifacts` field of PUT /api/progress/:id. */
export function parseArtifacts(value: unknown): ParsedArtifacts {
  if (value === undefined) return { ok: true, artifacts: [] };
  if (!Array.isArray(value)) {
    return { ok: false, error: '"artifacts" must be an array' };
  }
  if (value.length > MAX_ARTIFACTS_PER_CALL) {
    return {
      ok: false,
      error: `"artifacts" can have at most ${MAX_ARTIFACTS_PER_CALL} items`,
    };
  }
  const out: ArtifactInput[] = [];
  for (const item of value) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "Each artifact must be an object" };
    }
    const { kind, name, ...rest } = item as Record<string, unknown>;
    if (Object.keys(rest).length > 0) {
      return {
        ok: false,
        error: `Unknown artifact field: ${Object.keys(rest)[0]}. Only "kind" and "name" are allowed`,
      };
    }
    if (!ARTIFACT_KINDS.includes(kind as ArtifactKind)) {
      return {
        ok: false,
        error: `Invalid artifact kind: must be one of ${ARTIFACT_KINDS.join(", ")}`,
      };
    }
    if (name !== undefined && (typeof name !== "string" || !isSafeName(name))) {
      return {
        ok: false,
        error: `Invalid artifact name: up to ${MAX_ARTIFACT_NAME} letters, digits and . _ - / : characters, not an absolute path`,
      };
    }
    out.push(
      name === undefined
        ? { kind: kind as ArtifactKind }
        : { kind: kind as ArtifactKind, name: name as string },
    );
  }
  return { ok: true, artifacts: out };
}

export type ParsedSurface =
  | { ok: true; surface?: Surface }
  | { ok: false; error: string };

/** Validate the optional `surface` field of PUT /api/progress/:id. */
export function parseSurface(value: unknown): ParsedSurface {
  if (value === undefined) return { ok: true };
  if (SURFACES.includes(value as Surface)) {
    return { ok: true, surface: value as Surface };
  }
  return {
    ok: false,
    error: `Invalid surface: must be one of ${SURFACES.join(", ")}`,
  };
}

/**
 * Merge new artifacts into the stored list. An artifact with the same kind
 * and name replaces the older one, so re-running a lesson doesn't duplicate.
 * Keeps the newest MAX_ARTIFACTS_STORED.
 */
export function mergeArtifacts(
  existing: Artifact[],
  incoming: ArtifactInput[],
  context: { lesson?: string; surface?: Surface; at: string },
): Artifact[] {
  const key = (a: { kind: string; name?: string }) =>
    `${a.kind}:${a.name ?? ""}`;
  // Within one call, the last occurrence of a kind and name wins.
  const unique = [
    ...new Map(incoming.map((a) => [key(a), a] as const)).values(),
  ];
  const fresh: Artifact[] = unique.map((a) => ({
    ...a,
    ...(context.lesson ? { lesson: context.lesson } : {}),
    ...(context.surface ? { surface: context.surface } : {}),
    at: context.at,
  }));
  const freshKeys = new Set(fresh.map(key));
  const kept = existing.filter((a) => !freshKeys.has(key(a)));
  return [...kept, ...fresh].slice(-MAX_ARTIFACTS_STORED);
}

/** Add a surface to the list of surfaces the student has used. */
export function mergeSurfaces(existing: string[], surface?: Surface): string[] {
  if (!surface || existing.includes(surface)) return existing;
  return [...existing, surface];
}

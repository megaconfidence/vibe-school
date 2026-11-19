// Suggested lesson paths by role, shown as a filter on the homepage.
// The full course ("all") is every lesson in order.

export const PATH_IDS = [
  "all",
  "vscode",
  "cli",
  "desktop",
  "work",
  "team-lead",
] as const;
export type PathId = (typeof PATH_IDS)[number];

export const PATH_LABELS: Record<PathId, string> = {
  all: "Full course",
  vscode: "VS Code developer",
  cli: "Terminal developer",
  desktop: "Desktop user",
  work: "Vibe Work only",
  "team-lead": "Team lead",
};

export const PATHS: Record<Exclude<PathId, "all">, string[]> = {
  vscode: [
    "installation",
    "interview",
    "surfaces",
    "vscode",
    "configuration",
    "permissions",
    "instructions",
    "models",
    "context",
    "skills",
    "agents",
    "mcp",
  ],
  cli: [
    "installation",
    "interview",
    "surfaces",
    "cli",
    "configuration",
    "permissions",
    "instructions",
    "context",
    "sessions",
    "skills",
    "agents",
    "hooks",
    "automation",
    "parallel",
  ],
  desktop: [
    "installation",
    "interview",
    "surfaces",
    "desktop",
    "configuration",
    "permissions",
    "instructions",
    "models",
    "sessions",
    "skills",
    "agents",
    "parallel",
    "code-web",
    "work",
  ],
  // Work-only learners use the browser: no Vibe Code install or interview.
  work: ["surfaces", "work", "projects", "connectors", "canvas", "automations"],
  "team-lead": [
    "installation",
    "interview",
    "surfaces",
    "configuration",
    "permissions",
    "instructions",
    "skills",
    "agents",
    "hooks",
    "plugins",
    "code-web",
    "work",
    "team-rollout",
  ],
};

/** Map a homepage role + surface choice to a starting path. */
export function defaultPath(
  role?: string | null,
  surface?: string | null,
): PathId {
  if (role === "team-lead") return "team-lead";
  if (role === "knowledge-worker" || surface === "work") return "work";
  if (surface === "vscode" || surface === "cli" || surface === "desktop")
    return surface;
  return "all";
}

/** The surface a path is built around, or null when it spans them all. */
export const PATH_SURFACE: Record<PathId, string | null> = {
  all: null,
  vscode: "vscode",
  cli: "cli",
  desktop: "desktop",
  work: "work",
  "team-lead": null,
};

/** Whether an exercise with these surfaces fits a path. */
export function exerciseFits(
  path: PathId,
  surfaces: readonly string[],
): boolean {
  const want = PATH_SURFACE[path];
  return !want || surfaces.includes(want);
}

/** Lesson slugs on a path, in course order. "all" returns `allSlugs`. */
export function pathSlugs(path: PathId, allSlugs: string[]): string[] {
  if (path === "all") return allSlugs;
  const on = new Set(PATHS[path]);
  return allSlugs.filter((s) => on.has(s));
}

/** The lesson after `slug` on a path, or null at the end. */
export function nextOnPath(
  slug: string,
  path: PathId,
  allSlugs: string[],
): string | null {
  const list = pathSlugs(path, allSlugs);
  const i = list.indexOf(slug);
  if (i !== -1) return list[i + 1] ?? null;
  // Off the path: the next path lesson after this one in course order.
  const pos = allSlugs.indexOf(slug);
  return list.find((s) => allSlugs.indexOf(s) > pos) ?? null;
}

/** The first lesson on a path that isn't done yet, or null when all are. */
export function upNext(
  path: PathId,
  allSlugs: string[],
  done: Set<string>,
): string | null {
  return pathSlugs(path, allSlugs).find((s) => !done.has(s)) ?? null;
}

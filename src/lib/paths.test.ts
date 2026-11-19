import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  defaultPath,
  exerciseFits,
  nextOnPath,
  PATH_IDS,
  PATH_SURFACE,
  PATHS,
  pathSlugs,
  upNext,
} from "./paths";

const slugs = new Set(
  readdirSync("src/content/lessons").map(
    (f) =>
      /^slug:\s*(\S+)/m.exec(
        readFileSync(`src/content/lessons/${f}`, "utf8"),
      )?.[1],
  ),
);

describe("PATHS", () => {
  it.each(
    Object.entries(PATHS),
  )("%s only lists real lesson slugs", (_id, list) => {
    for (const slug of list) expect(slugs.has(slug)).toBe(true);
  });
});

describe("defaultPath", () => {
  it("prefers role, then surface", () => {
    expect(defaultPath("team-lead", "vscode")).toBe("team-lead");
    expect(defaultPath("knowledge-worker", "cli")).toBe("work");
    expect(defaultPath("developer", "vscode")).toBe("vscode");
    expect(defaultPath("developer", "code-web")).toBe("all");
    expect(defaultPath(null, null)).toBe("all");
  });
});

describe("coverage", () => {
  it("puts every lesson on at least one filtered path", () => {
    const onSome = new Set(Object.values(PATHS).flat());
    for (const slug of slugs) expect(onSome.has(slug as string)).toBe(true);
  });
});

describe("path navigation", () => {
  const all = [
    "installation",
    "interview",
    "surfaces",
    "cli",
    "vscode",
    "work",
    "projects",
  ];
  it("filters to the path in course order", () => {
    expect(pathSlugs("work", all)).toEqual(["surfaces", "work", "projects"]);
    expect(pathSlugs("all", all)).toEqual(all);
  });
  it("finds the next lesson on the path, even from off the path", () => {
    expect(nextOnPath("surfaces", "work", all)).toBe("work");
    expect(nextOnPath("cli", "work", all)).toBe("work");
    expect(nextOnPath("projects", "work", all)).toBeNull();
  });
  it("finds the first unfinished lesson", () => {
    expect(upNext("work", all, new Set(["surfaces"]))).toBe("work");
    expect(
      upNext("work", all, new Set(["surfaces", "work", "projects"])),
    ).toBeNull();
  });
});

describe("school.js getPath default", () => {
  it("matches defaultPath for every role and surface", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("public/school.js", "utf8");
    const store: Record<string, string> = {};
    const win: Record<string, unknown> = {
      __schoolPaths: PATHS,
      __schoolCourse: [],
      location: { search: "" },
    };
    const g = globalThis as unknown as Record<string, unknown>;
    g.window = win;
    g.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    g.document = {
      documentElement: { dataset: {}, classList: { toggle() {} } },
      querySelectorAll: () => [],
      dispatchEvent() {},
    };
    new Function(src)();
    // biome-ignore lint/suspicious/noExplicitAny: plain JS module
    const school = (win as any).school;
    for (const role of [null, "developer", "team-lead", "knowledge-worker"]) {
      for (const surface of [
        null,
        "cli",
        "vscode",
        "desktop",
        "code-web",
        "work",
      ]) {
        for (const k of Object.keys(store)) delete store[k];
        if (role) store["school:role"] = role;
        if (surface) store["school:surface"] = surface;
        expect(school.getPath()).toBe(defaultPath(role, surface));
      }
    }
  });
});

describe("exerciseFits", () => {
  it("keeps exercises on the path's surface", () => {
    expect(exerciseFits("cli", ["cli", "vscode"])).toBe(true);
    expect(exerciseFits("cli", ["work"])).toBe(false);
    expect(exerciseFits("work", ["work"])).toBe(true);
  });
  it("keeps every exercise on paths without one surface", () => {
    expect(exerciseFits("all", ["work"])).toBe(true);
    expect(exerciseFits("team-lead", ["code-web"])).toBe(true);
  });
  it("names a surface for every path", () => {
    for (const id of PATH_IDS) expect(id in PATH_SURFACE).toBe(true);
  });
});

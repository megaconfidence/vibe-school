import { describe, expect, it } from "vitest";
import {
  MAX_ARTIFACTS_PER_CALL,
  MAX_ARTIFACTS_STORED,
  mergeArtifacts,
  mergeSurfaces,
  parseArtifacts,
  parseSurface,
} from "./artifacts";

describe("parseArtifacts", () => {
  it("accepts a missing field as no artifacts", () => {
    expect(parseArtifacts(undefined)).toEqual({ ok: true, artifacts: [] });
  });

  it("accepts model tags with a colon", () => {
    expect(parseArtifacts([{ kind: "model", name: "devstral:24b" }]).ok).toBe(
      true,
    );
  });

  it("accepts kinds with and without names", () => {
    const r = parseArtifacts([
      { kind: "skill", name: "new-command" },
      { kind: "config", name: ".vibe/config.toml" },
      { kind: "project" },
    ]);
    expect(r).toEqual({
      ok: true,
      artifacts: [
        { kind: "skill", name: "new-command" },
        { kind: "config", name: ".vibe/config.toml" },
        { kind: "project" },
      ],
    });
  });

  it.each([
    ["not an array", { kind: "skill" }],
    ["null item", [null]],
    ["unknown kind", [{ kind: "secret" }]],
    ["extra field", [{ kind: "skill", content: "..." }]],
    [
      "absolute path",
      [{ kind: "config", name: "/Users/me/.vibe/config.toml" }],
    ],
    ["parent path", [{ kind: "config", name: "../x" }]],
    ["spaces", [{ kind: "skill", name: "my skill" }]],
    ["too long", [{ kind: "skill", name: "a".repeat(65) }]],
    ["non-string name", [{ kind: "skill", name: 3 }]],
    [
      "too many",
      Array.from({ length: MAX_ARTIFACTS_PER_CALL + 1 }, () => ({
        kind: "skill",
      })),
    ],
  ])("rejects %s", (_label, value) => {
    expect(parseArtifacts(value).ok).toBe(false);
  });
});

describe("parseSurface", () => {
  it("accepts known surfaces and undefined", () => {
    expect(parseSurface("vscode")).toEqual({ ok: true, surface: "vscode" });
    expect(parseSurface(undefined)).toEqual({ ok: true });
  });
  it("rejects unknown surfaces", () => {
    expect(parseSurface("emacs").ok).toBe(false);
  });
});

describe("mergeArtifacts", () => {
  const at = "2026-11-19T00:00:00.000Z";

  it("tags new artifacts with lesson, surface and time", () => {
    expect(
      mergeArtifacts([], [{ kind: "agent", name: "builder" }], {
        lesson: "agents",
        surface: "cli",
        at,
      }),
    ).toEqual([
      { kind: "agent", name: "builder", lesson: "agents", surface: "cli", at },
    ]);
  });

  it("replaces an artifact with the same kind and name", () => {
    const first = mergeArtifacts([], [{ kind: "skill", name: "a" }], {
      lesson: "skills",
      at,
    });
    const second = mergeArtifacts(first, [{ kind: "skill", name: "a" }], {
      lesson: "plugins",
      at,
    });
    expect(second).toHaveLength(1);
    expect(second[0].lesson).toBe("plugins");
  });

  it("dedupes within one call, last one wins", () => {
    const list = mergeArtifacts(
      [],
      [
        { kind: "hook", name: "same" },
        { kind: "hook", name: "same" },
      ],
      { lesson: "hooks", at },
    );
    expect(list).toHaveLength(1);
  });

  it("keeps at most the newest stored artifacts", () => {
    let list = mergeArtifacts([], [], { at });
    for (let i = 0; i < MAX_ARTIFACTS_STORED + 5; i++) {
      list = mergeArtifacts(list, [{ kind: "skill", name: `s${i}` }], { at });
    }
    expect(list).toHaveLength(MAX_ARTIFACTS_STORED);
    expect(list.at(-1)?.name).toBe(`s${MAX_ARTIFACTS_STORED + 4}`);
  });
});

describe("mergeSurfaces", () => {
  it("adds a surface once", () => {
    expect(mergeSurfaces(["cli"], "vscode")).toEqual(["cli", "vscode"]);
    expect(mergeSurfaces(["cli"], "cli")).toEqual(["cli"]);
    expect(mergeSurfaces(["cli"], undefined)).toEqual(["cli"]);
  });
});

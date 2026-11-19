import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  adminConfigToml,
  lines,
  previewBash,
  projectConfigToml,
  teamAgentsMd,
  tomlString,
} from "./config-builder";

// Parse with Python's tomllib when available, so the snippets are real TOML.
function parseToml(text: string): unknown | null {
  try {
    const out = execFileSync(
      "python3",
      [
        "-c",
        "import sys,tomllib,json;print(json.dumps(tomllib.loads(sys.stdin.read())))",
      ],
      { input: text },
    );
    return JSON.parse(out.toString());
  } catch (e) {
    if ((e as { code?: string }).code === "ENOENT") return null;
    throw e;
  }
}

describe("tomlString", () => {
  it("escapes quotes and backslashes", () => {
    expect(tomlString('say "hi" \\ bye')).toBe('"say \\"hi\\" \\\\ bye"');
  });
});

describe("lines", () => {
  it("trims, drops blanks and duplicates", () => {
    expect(lines(" a \n\nb\na\n")).toEqual(["a", "b"]);
  });
});

describe("projectConfigToml", () => {
  it("produces valid TOML with the expected keys", () => {
    const toml = projectConfigToml({
      defaultAgent: "accept-edits",
      bashAllow: ["python3 -m unittest", 'echo "x"'],
      bashDeny: ["rm -rf"],
      writeFile: "always",
      edit: "ask",
    });
    const parsed = parseToml(toml);
    if (parsed === null) return;
    expect(parsed).toEqual({
      default_agent: "accept-edits",
      tools: {
        bash: {
          allowlist: ["python3 -m unittest", 'echo "x"'],
          denylist: ["rm -rf"],
        },
        write_file: { permission: "always" },
        edit: { permission: "ask" },
      },
    });
  });
});

describe("previewBash", () => {
  const allow = ["python3 -m unittest", "git status"];
  const deny = ["rm -rf"];
  it("matches prefixes on word boundaries", () => {
    expect(previewBash("python3 -m unittest -v", allow, deny, "ask")).toBe(
      "runs",
    );
    expect(previewBash("git statusx", allow, deny, "ask")).toBe("asks");
  });
  it("denylist wins, even in auto-approve", () => {
    expect(previewBash("rm -rf build", allow, deny, "auto-approve")).toBe(
      "blocked",
    );
  });
  it("auto-approve runs everything else", () => {
    expect(previewBash("npm publish", allow, deny, "auto-approve")).toBe(
      "runs",
    );
  });
});

describe("adminConfigToml", () => {
  it("produces valid TOML and omits unset options", () => {
    const toml = adminConfigToml({
      allowedModels: ["mistral-medium-*"],
      blockAutoApprove: true,
      blockMcp: false,
      disabledTools: ["web_fetch"],
      disableTelemetry: false,
    });
    const parsed = parseToml(toml);
    if (parsed === null) return;
    expect(parsed).toEqual({
      allowed_models: ["mistral-medium-*"],
      enable_auto_approve: false,
      disabled_tools: ["web_fetch"],
    });
  });
});

describe("teamAgentsMd", () => {
  it("lists rules and falls back to a default", () => {
    expect(teamAgentsMd("Platform", ["Rule one"])).toContain("- Rule one");
    expect(teamAgentsMd("", [])).toContain("our team");
  });
});

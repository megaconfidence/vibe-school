// Builds the TOML snippets for the ConfigBuilder and StarterPack widgets.
// Kept pure so it can be unit tested. Keys and values follow
// `vibe config schema` (vibe 3.1.3) and the admin config docs.

export const BUILTIN_AGENTS = [
  "ask",
  "accept-edits",
  "smart-approve",
  "auto-approve",
] as const;
export type BuiltinAgent = (typeof BUILTIN_AGENTS)[number];

export const PERMISSIONS = ["always", "ask", "never"] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** TOML basic string with the characters TOML requires escaped. */
export function tomlString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")}"`;
}

export function tomlArray(values: string[]): string {
  return `[${values.map(tomlString).join(", ")}]`;
}

/** Split a textarea into trimmed, non-empty, unique lines. */
export function lines(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const v = raw.trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

export interface ProjectConfigInput {
  defaultAgent: BuiltinAgent | string;
  bashAllow: string[];
  bashDeny: string[];
  writeFile: Permission;
  edit: Permission;
}

export function projectConfigToml(input: ProjectConfigInput): string {
  const out: string[] = [
    "# .vibe/config.toml (project). Loaded only in a trusted folder.",
    `default_agent = ${tomlString(input.defaultAgent)}`,
  ];
  if (input.bashAllow.length || input.bashDeny.length) {
    out.push("", "[tools.bash]");
    if (input.bashAllow.length)
      out.push(`allowlist = ${tomlArray(input.bashAllow)}`);
    if (input.bashDeny.length)
      out.push(`denylist = ${tomlArray(input.bashDeny)}`);
  }
  out.push(
    "",
    "[tools.write_file]",
    `permission = ${tomlString(input.writeFile)}`,
  );
  out.push("", "[tools.edit]", `permission = ${tomlString(input.edit)}`);
  return `${out.join("\n")}\n`;
}

/**
 * Plain-language preview of what Vibe does with a bash command under the
 * snippet. Simplified: real matching is per command segment, by prefix.
 */
export function previewBash(
  command: string,
  allow: string[],
  deny: string[],
  agent: string,
): "runs" | "asks" | "blocked" {
  const cmd = command.trim();
  if (!cmd) return "asks";
  const matches = (p: string) => cmd === p || cmd.startsWith(`${p} `);
  if (deny.some(matches)) return "blocked";
  if (agent === "auto-approve") return "runs";
  if (allow.some(matches)) return "runs";
  return "asks";
}

export interface AdminConfigInput {
  allowedModels: string[];
  blockAutoApprove: boolean;
  blockMcp: boolean;
  disabledTools: string[];
  defaultAgent?: string;
  disableTelemetry: boolean;
}

export function adminConfigToml(input: AdminConfigInput): string {
  const out: string[] = [
    "# Admin config: Admin Panel > Vibe > Preferences > Vibe Code Clients managed config.",
    "# Test it in a test Organization or Workspace first.",
  ];
  if (input.defaultAgent)
    out.push(`default_agent = ${tomlString(input.defaultAgent)}`);
  if (input.allowedModels.length)
    out.push(`allowed_models = ${tomlArray(input.allowedModels)}`);
  if (input.blockAutoApprove) out.push("enable_auto_approve = false");
  if (input.blockMcp) out.push("enable_mcp = false");
  if (input.disabledTools.length)
    out.push(`disabled_tools = ${tomlArray(input.disabledTools)}`);
  if (input.disableTelemetry) out.push("enable_telemetry = false");
  return `${out.join("\n")}\n`;
}

export function teamAgentsMd(team: string, rules: string[]): string {
  const name = team.trim() || "our team";
  const body = rules.length
    ? rules.map((r) => `- ${r}`).join("\n")
    : "- Explain the plan before editing more than one file.";
  return `# Working on ${name} projects

Vibe reads this file at the start of every session in this repository.

## Rules

${body}

## How we work with Vibe

- Use the project skills in .vibe/skills/ when a task matches.
- Run the tests before saying a change is done.
`;
}

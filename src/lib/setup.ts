// Rows of the "Your Vibe setup" panel. Each row lights up when the tutor
// reports an artifact of that kind, or when its lesson is complete.

import type { ArtifactKind } from "./artifacts";

export interface SetupRow {
  kind: ArtifactKind;
  /** What it looks like in the student's project. */
  path: string;
  label: string;
  lesson: string;
}

export const SETUP_ROWS: SetupRow[] = [
  {
    kind: "project",
    path: "vibe-todo/",
    label: "Your project",
    lesson: "configuration",
  },
  {
    kind: "config",
    path: ".vibe/config.toml",
    label: "Project config",
    lesson: "configuration",
  },
  {
    kind: "permission",
    path: "[tools.bash] allowlist",
    label: "Permissions",
    lesson: "permissions",
  },
  {
    kind: "instructions",
    path: "AGENTS.md, tests/AGENTS.md",
    label: "Instructions",
    lesson: "instructions",
  },
  { kind: "model", path: "active_model", label: "Model", lesson: "models" },
  { kind: "skill", path: ".vibe/skills/", label: "Skills", lesson: "skills" },
  { kind: "agent", path: ".vibe/agents/", label: "Agents", lesson: "agents" },
  { kind: "mcp", path: "[[mcp_servers]]", label: "MCP servers", lesson: "mcp" },
  { kind: "hook", path: ".vibe/hooks.toml", label: "Hooks", lesson: "hooks" },
  {
    kind: "plugin",
    path: ".vibe/plugins/",
    label: "Plugin",
    lesson: "plugins",
  },
  {
    kind: "automation",
    path: "vibe -p",
    label: "Automation",
    lesson: "automation",
  },
  {
    kind: "worktree",
    path: "worktrees",
    label: "Parallel work",
    lesson: "parallel",
  },
  {
    kind: "rollout",
    path: "team starter",
    label: "Team rollout",
    lesson: "team-rollout",
  },
];

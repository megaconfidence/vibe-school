# Vibe School: plan

A course site that teaches people to use Mistral Vibe on every surface.
Modeled on opencode.school and pi-school (same mechanics: enroll, agent-taught
lessons via `/llms.txt` + lessons API, progress in KV, quizzes, exercises).

## Audience

Developers and technical folks new to agentic coding, plus knowledge workers
who want Vibe Work. Some comfort with a terminal helps for the Code track but
the course offers VS Code and Desktop paths for every Code concept lesson.

## Decisions

- Name: Vibe School. Deployed to Cloudflare Workers with `script/deploy`
  (see README); `SITE_URL` and the KV id live in `wrangler.jsonc`.
- Scope: Code + Work.
- Surface-agnostic: shared concept lessons with `<SurfaceTabs>` where steps
  differ, plus one dedicated lesson per surface.
- The tutor is always a local Vibe Code session (CLI, VS Code extension, or
  Desktop local session), because it can run `curl` and inspect files. Web
  lessons (Code Web, Work) are taught from that session while the student
  clicks around chat.mistral.ai.
- Brand: Mistral palette (orange `#FA500F` default theme, sunset ramp for
  signature moments), paper/ink backgrounds, official logo SVGs.

## Sources

- Official docs: https://docs.mistral.ai/vibe (66 pages, `.md` versions listed
  in https://docs.mistral.ai/llms.txt). Local copy: `/tmp/schools/docs/vibe/`.
- CLI source: https://github.com/mistralai/mistral-vibe. Local clone:
  `/tmp/schools/mistral-vibe/` (README, CHANGELOG.md, docs/, vibe/).
- Installed CLI: `vibe --version` (3.1.3 at time of writing), the `/help`
  output, and `vibe --help`.

## Overhaul (Nov 2026, branch `overhaul`)

Done, following the overhaul plan (`../reviews/02-overhaul-plan.md`, git-ignored) with these changes:

- Mistral design system: paper and ink, hairlines, ALT Mistral headings, Space Mono labels, pixel icons, light/dark toggle. Top nav, track rail on lesson pages, footer. Colour picker, credit-card ID and confetti removed.
- Onboarding: pick main surface and role, get a Vibe Pass (pixel M build, surfaces used, progress).
- Homepage dashboard: "Your Vibe setup" panel (from tutor-reported `artifacts`), path filter by role, track cards with progress.
- One growing project: Code lessons 8 to 20 and 26 build `vibe-todo` from `/examples/starter.zip`; after lesson 15 it matches the example.
- API: `surface` and `artifacts` on completion, `surfacesUsed`, profile `role` (validated, tested, in OpenAPI and llms.txt).
- `vibe-school` plugin (`/vibe-school:next|lesson|exercise|status`), install page `/plugin`. Tested in `~/.vibe/plugins` with vibe 3.1.3, then removed.
- Launch bar replaces the prompt box: CLI / VS Code / Desktop / Plugin tabs, chat.mistral.ai button on web lessons.
- Widgets: SurfacePicker (lesson 3), ConfigBuilder (lesson 9), StarterPack (lesson 26).

Checked by the overhaul review (`../reviews/04-overhaul-feedback.md`, section 5):
project-level `[[mcp_servers]]`, Windows shell tool names, lesson 20 worktrees
(with the remote-default-branch caveat) and lesson 15's builder spawning the
reviewer are confirmed. Plugin skills are **not** filtered by `enabled_skills`
on primary agents (lesson 18 fixed; the docs page `code/cli/plugins.md` says
otherwise and should be reported upstream). Hook `system_message` shows in the
CLI only. Custom agents in the Desktop UI remain untested.

## UX simplification (after the human review)

From `../reviews/user-review-feedback.md` plus the author's note that the site
showed too much at once and needed visible progress:

- Homepage (enrolled): progress strip with milestones, one "Up next" card,
  surfaces and Vibe Pass as small cards, project panel only once the project
  exists (never on the Work path), lessons filtered to the path with only the
  current section open, exercises collapsed and filtered by surface.
- Lesson pages: path progress bar, "What you'll learn", one "Start in Vibe"
  card (prompt + "I'm using" select limited to the lesson's surfaces, or the
  plugin), browser checklist for Work and Code Web lessons, notes folded,
  "Next on your path" separate from "Mark complete".
- Header progress meter on every page; completion banner says how many are
  left. Work-only path skips Installation and Interview.
- Content: Work "+" menu (no Tools), VS Code rewind/fork and Auto Approve,
  Desktop shortcuts, quieter tutor start, VS Code plugin reload.

## Lessons (26)

| # | Slug | Title | Track | Surfaces | Quiz | Notes |
|---|---|---|---|---|---|---|
| 1 | installation | Installation | start | cli, vscode, desktop | no | Browser-only. What Vibe is, Work vs Code, the 4 Code surfaces. Install tabs: CLI (install.sh / uv), VS Code extension, Desktop. Sign in (Mistral account / API key, plans). Send a first prompt. |
| 2 | interview | Interview | start | cli, vscode, desktop | no | agentOnly. Pace + profile, incl. which surfaces the student uses. |
| 3 | surfaces | Surfaces | start | all | yes | Work vs Code, choosing between CLI / VS Code / Desktop / Code Web, what's shared (config, sessions) and what isn't. Verify: student names the surface they'll use most; agent detects which surface it's running in. |
| 4 | cli | CLI | surfaces | cli | yes | Terminal-native features: `/` `@` `!`, keyboard shortcuts, queue, Ctrl+G editor, voice (`/voice`, Ctrl+T), themes, terminal support, `/status`, `/whoami`, `/pr`, update. |
| 5 | vscode | VS Code | surfaces | vscode | yes | Install + authenticate, editor context (active file, selection), review actions, slash commands parity, shared config, other IDEs via ACP (JetBrains, Zed). |
| 6 | desktop | Desktop | surfaces | desktop | yes | Local vs cloud sessions, projects, panels (files, terminal, browser, PR), parallel tasks with worktrees and sub-sessions, review changes, command palette. |
| 7 | code-web | Code Web | surfaces | code-web | yes | Connect GitHub, projects, sessions lifecycle, sandbox, limits, PRs, Slack integration, security (prompt injection). Verify: PR/branch via `gh` or student confirms. |
| 8 | configuration | Configuration | code | cli, vscode, desktop | yes | `~/.vibe/config.toml`, `VIBE_HOME`, `.vibe/config.toml` (trusted), `/config`, `/reload`, `VIBE_*` env vars, `vibe config schema`, theme. Verify config.toml exists and has a setting the student chose. |
| 9 | permissions | Permissions | code | cli, vscode, desktop | yes | Built-in agents (ask, accept-edits, smart-approve, auto-approve), approvals, per-tool permission + allow/deny lists, sensitive files, outside-workdir, trusted folders, `--trust`. Verify a `[tools.bash] allowlist` entry or default_agent set. |
| 10 | instructions | Instructions | code | cli, vscode, desktop | yes | `~/.vibe/AGENTS.md`, project `AGENTS.md`, lazy subfolder `AGENTS.md`, no `/init`. Verify ~/.vibe/AGENTS.md exists with real content. |
| 11 | models | Models | code | cli, vscode, desktop | yes | `/model`, `/thinking`, `active_model`, plans and usage gauge, providers/models in config, offline/local models (vLLM, llama.cpp), allowed_models. |
| 12 | context | Context | code | cli, vscode, desktop | yes | Context window, `/context`, `/compact`, auto-compaction, `@` file mentions, images, `!` shell commands, todo panel. |
| 13 | sessions | Sessions | code | cli, vscode, desktop | yes | `/resume`, `vibe -c`, `--resume`, `/rename`, `/rewind` (Esc Esc), `/branch`, `/retry`, folder-scoped history, sessions shared CLI <-> VS Code, `/clear`. |
| 14 | skills | Skills | code | cli, vscode, desktop | yes | SKILL.md format, locations (`.vibe/skills`, `.agents/skills`, `~/.vibe/skills`, `~/.agents/skills`), `/skills`, `/skill-name`, `user-invocable`, enabled/disabled_skills. Hands-on: create a skill. |
| 15 | agents | Agents | code | cli, vscode, desktop | yes | Custom agent TOML (`~/.vibe/agents/`, `.vibe/agents/`), `agent_type = "subagent"`, `safety`, `instructions`, `enabled_tools`, `default_agent`. Hands-on: create a plan-style read-only agent. |
| 16 | mcp | MCP | code | cli, vscode, desktop | yes | MCP servers (`vibe mcp add`, `/mcp`, `[[mcp_servers]]`, OAuth, stdio), connectors, tool naming + permissions. Hands-on: add a server. |
| 17 | hooks | Hooks | code | cli, vscode, desktop | yes | `hooks.toml`, event types, matchers, stdout JSON contract, examples (format after edit, guard rm -rf, notifications). |
| 18 | plugins | Plugins | code | cli, vscode, desktop | yes | Plugin layout, `plugin.json`, what plugins can ship, `/plugins`, `/reload-plugins`, foreign formats (Claude Code, Codex). |
| 19 | automation | Automation | code | cli | yes | Programmatic mode (`vibe -p`, `--output json`, `--max-turns`, `--max-price`, `--auto-approve`), `/loop`, `/goal`, GitHub Action (`action.yml`), worktrees (`--worktree`). |
| 20 | parallel | Parallel work | code | cli, desktop, code-web | yes | vibe --worktree, Desktop Worktree mode and sub-sessions, subagents, several Code Web sessions; merging results. |
| 21 | work | Work | work | work | yes | Open Work, fast/think or reasoning level, todos and progress, approvals, Temporary Chat, web search, voice, Work in Desktop (local folders). |
| 22 | projects | Projects | work | work | yes | Projects, custom instructions, Knowledge, Libraries. |
| 23 | connectors | Connectors | work | work | yes | Featured connectors, custom MCP connectors, per-function permissions, approvals. Connectors also show up in the CLI. |
| 24 | canvas | Canvas | work | work | yes | Files, Canvas, Code Interpreter, spreadsheets, mini apps, image generation. |
| 25 | automations | Automations | work | work | yes | Work skills (`/` or by name), workflows, scheduled tasks. |
| 26 | team-rollout | Team rollout | team | cli, vscode, desktop | yes | Capstone. Shared repo setup, admin-managed config, admin console (workspaces, roles, SCIM, usage), OpenTelemetry, rollout checklist. |
| 2 | fix-a-bug-in-the-cloud | Fix a bug in the cloud | code-web, desktop |
| 3 | review-a-pull-request | Review a pull request | vscode, cli |
| 4 | run-parallel-agents | Run parallel agents | desktop, cli |
| 5 | automate-ci | Automate CI | cli |
| 6 | drive-a-browser | Drive a browser | cli, vscode, desktop |
| 7 | package-a-team-setup | Package a team setup | cli, vscode, desktop |
| 8 | research-a-topic | Research a topic | work |
| 9 | schedule-a-digest | Schedule a digest | work |
| 10 | build-a-mini-app | Build a mini app | work |
| 11 | work-across-surfaces | Work across surfaces | cli, vscode, desktop, code-web |

## Pages

about, tips, cheatsheet, glossary, contributing, troubleshooting, disenroll, 404, robots.txt, examples/agents-skills-instructions (with zip download at /examples/agents-skills-instructions.zip; source copy in src/examples/).

## Real-surface test run status

Tested end to end with real students and a local tutor (Nov 2026):

| Lesson | Surface | Status |
|---|---|---|
| Interview | Vibe Desktop (local session) | Done |
| Desktop | Vibe Desktop (local session) | Done |
| VS Code | VS Code extension 1.29 | Done |
| Code Web | chat.mistral.ai Code tab (draft PR via cloud session) | Done |
| Work | chat.mistral.ai Work (Temporary Chat + web search) | Done |
| Skills | CLI (`vibe -p`) | Done |

### TODO (next time)

Run these Work lessons end to end on chat.mistral.ai. Their UI labels were
checked read-only, but the hands-on steps create real items in the workspace
(projects, connector connections, Libraries, uploaded files, skills, scheduled
tasks), so they still need a full run:

- [ ] Projects (22): create a project with instructions and a file, set custom instructions, Library
- [ ] Connectors (23): connect a service, set per-function permissions, try a read-only task
- [ ] Canvas (24): upload the sample CSV, analyze and chart it in Canvas
- [ ] Automations (25): create a Work skill and a scheduled task

Note: the test workspace was the internal Mistral org, so model menus showed
internal models. Check menus again with a public account.

### TODO: course additions from the review (`../reviews/01-feedback.md`)

- [ ] Enterprise governance and networking lesson (proxies, allowed models, data retention, admin policies)
- [ ] Migrating a team from another coding agent (`vibe:import`, Claude Code / Codex / OpenCode setups)
- [ ] Offline or local model exercise (vLLM or llama.cpp provider end to end)
- [ ] Slack to pull request exercise (Code Web Slack integration)
- [ ] Admin config audit exercise (review a team's shared `.vibe/` and admin-managed config)
- [ ] Power-user CLI shortcuts page or lesson section
- [ ] "Ask Vibe about Vibe" (the built-in `vibe` skill as a self-help tool)
- [ ] Lean (Mistral's Lean agent) once it is documented
- [ ] Undocumented Work features seen in the UI, once docs exist

### Keeping the example in sync

`src/examples/agents-skills-instructions/` and the zip are copies of
`../agents-skills-instructions/`. After editing the example, refresh both:

```sh
rsync -a --delete --exclude __pycache__ --exclude .DS_Store --exclude .todo.json ../agents-skills-instructions/ src/examples/agents-skills-instructions/
(cd .. && rm -f vibe-school/public/examples/agents-skills-instructions.zip && zip -rq vibe-school/public/examples/agents-skills-instructions.zip agents-skills-instructions -x '*__pycache__*' '*.DS_Store' '*.todo.json')
```

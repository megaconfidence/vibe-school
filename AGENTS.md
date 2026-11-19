# vibe-school

A free, self-paced course for learning [Mistral Vibe](https://docs.mistral.ai/vibe)
on every surface: the CLI, the VS Code extension, Vibe Desktop, Vibe Code Web
and Vibe Work. The enrollment flow, agent API and lesson format come from
[pi-school](https://github.com/agentschools/pi-school) and
[opencode.school](https://github.com/agentschools/opencode.school) (both
Apache-2.0); the design, onboarding, plugin and project-based curriculum are
Vibe School's own. Keep it that way: don't reintroduce the colour picker,
credit-card student ID, confetti or left sidebar.

## Design system

- Tokens live in `src/styles/main.css` (`--bg`, `--text`, `--text-muted`,
  `--accent`, `--accent-text`, `--hair`). Use them, not Tailwind gray/stone.
- Building blocks: `.label` (Space Mono caps), `.panel`, `.btn btn-primary`
  (ink button, orange arrow), `.btn-ghost`, `.chip`, `.choice` (selectable
  card with `aria-pressed`/`aria-checked`), `.sunset-bar`.
- Headings use `font-display` (ALT Mistral, falls back to Inter 500).
- Pixel icons from `public/pixel/` with the `pixel` class and `alt=""`.
  Sunset gradient only for signature moments (top bar, Vibe Pass).
- Light and dark: test both. `#FA500F` is decorative; text uses
  `--accent-text`.
- Motion: use the tokens (`--ease-out`, `--dur-1/2/3`) and the helpers in
  `main.css`: `.rise` with `style="--d:N"` for a staggered entrance, `.lift`
  for hoverable cards, `.banner-in`, `.nudge`. `<details>` open smoothly on
  their own. Page changes cross-fade (`@view-transition`). Keep it small:
  under 0.5s, no motion on scroll, and everything turns off under
  `prefers-reduced-motion`.
- Feedback: `school.celebrate(el)` (a burst of sunset squares) only when
  something is finished; `school.toast(text)` for quick confirmations such
  as copying.

## How the course works

Students enroll on the homepage by picking a main surface and a role, and get
a Vibe Pass with a student ID. The Code lessons build one project,
`vibe-todo` (starter at `/examples/starter.zip`, source in `starter/`). Lesson 1 (Installation)
is done in the browser. After that, each lesson page shows a **prompt** the
student copies into Vibe Code (CLI, VS Code extension, or a local session in
Vibe Desktop). The agent fetches `/llms.txt`, reads the lesson's
`agentInstructions` from the API, teaches it, quizzes (thorough pace only),
verifies the result on the student's machine, and marks the lesson complete
with `curl`, sending `surface` and `artifacts` (what the student built, see
`src/lib/artifacts.ts`). The browser polls progress, ticks the lesson and
fills in the "Your Vibe setup" panel. Students can also install the
`vibe-school` plugin (`plugin/vibe-school/`, page `/plugin`) and run
`/vibe-school:next`; the plugin's skills just point the agent at `/llms.txt`.

When a lesson adds to vibe-todo, its verification step names the artifacts
to report (one short line). If the student skipped a lesson, the tutor
creates missing prerequisites. After editing `plugin/`, `starter/` or
`../agents-skills-instructions/`, run `script/build-assets`.

Vibe Work and Vibe Code Web lessons happen in the browser at
chat.mistral.ai, but the student's local Vibe Code session is still the tutor:
it explains, quizzes, and verifies what it can (for example with `gh` for a
pull request), then asks the student to confirm the rest.

## Stack

- Astro 7, `@astrojs/cloudflare` adapter, `output: "server"`
- MDX content collections: `lessons`, `exercises`, `pages` (`src/content.config.ts`)
- Tailwind CSS v4 via `@tailwindcss/vite`, `stone` palette for dark mode
- Cloudflare KV for student progress (binding `PROGRESS`). Local dev uses
  Miniflare's local KV, no account needed.
- Biome for lint/format, Vitest for unit tests

## Scripts

| Script | What it does |
|---|---|
| `script/dev` | `astro dev` on http://localhost:4321 |
| `script/build` | `astro build` |
| `script/lint` | `biome check .` + `astro check` |
| `script/test` | `vitest run` |
| `script/deploy` | Clean build of the current commit, then `wrangler deploy` |

Run `script/lint` and `script/test` before committing. Keep test files in
`src/lib/`: anything under `src/pages/` becomes a public route.

## Content authoring

### Lesson frontmatter

```yaml
---
title: "Skills"                 # sentence case, short (1-2 words ideal)
slug: skills                    # URL + API key, never change once published
description: "One sentence, what the student will be able to do."
order: 10                       # global order across all tracks
track: code                     # start | surfaces | code | work | team (src/lib/tracks.ts)
surfaces: [cli, vscode, desktop] # where the hands-on part works
quiz: true                      # teach -> quiz -> verify (thorough pace)
agentOnly: false                # true = only the agent can mark it complete
goals:                          # 3-4 short "What you'll learn" bullets, shown above the fold
  - "Write a SKILL.md Vibe loads on demand"
minutes: 15                     # rough time with a tutor
checklist: []                   # browser steps, only for Work and Code Web lessons
selfPaced: false                # true = done by reading (Installation), no tutor prompt
agentInstructions: |
  Cover these four topics:

  1. ...
  2. ...
  3. ...
  4. ...

  After teaching, verify completion by ...
---
```

- `agentInstructions` always uses a YAML literal block (`|`).
- For `quiz: true` lessons, list **four topics** (one or two sentences each)
  and **one verification step**. Do not write quiz boilerplate, the API adds it
  (`src/lib/quiz-instructions.ts`) for thorough-pace students only.
- The API also appends shared notes (`src/lib/formatting-instructions.ts`):
  how to call the API with `curl`, and formatting rules. Don't repeat them.
- Use `{origin}` for the site origin in `agentInstructions`; the API replaces
  it at serve time. Never hardcode a domain.
- Verification should check real state on the student's machine whenever
  possible (a file exists, `vibe --version` works, a skill folder has a
  `SKILL.md`). When it can't (web-only features), ask the student to confirm
  or paste what they see.

### Lesson body

The page template renders the header, the "What you'll learn" bullets, the
"Start in Vibe" card (or the browser checklist) and the bottom navigation. The
MDX body is the **lesson notes**: a reference shown folded under the start
card. So in the body:

- Don't add `<AgentPrompt>`; the template renders it once.
- Import only what you use:

  ```mdx
  import SurfaceTabs from '../../components/SurfaceTabs.astro'
  import SurfaceTab from '../../components/SurfaceTab.astro'
  ```

- Start with one intro paragraph, then reference sections.
- Use `<SurfaceTabs>` with `<SurfaceTab surface="cli|vscode|desktop|code-web|work">`
  when the steps differ by surface. Leave a blank line after the opening tag
  and before the closing tag so the markdown inside renders.
- Link terms to the glossary (`/glossary#skill`) and to the official docs
  (`https://docs.mistral.ai/vibe/...`) for depth.
- Sentence case for every title and heading.
- Be concrete: real paths (`~/.vibe/config.toml`), real commands, real keys.
  Every fact must come from the official docs, the `mistral-vibe` source, or
  the installed CLI. If a source doesn't confirm it, leave it out.
- Voice: short, direct, friendly. No em dashes. No "comprehensive",
  "leverage", "seamless", "unlock", "powerful".

### UI principles

- Show only what's needed now. The homepage leads with one "Up next" card
  that holds the progress bar; sections other than the current one start
  collapsed; the project panel appears once the project exists; lesson notes
  are folded; exercises for other surfaces fold under "Other exercises".
- One line of meta per page header (time and surfaces as icons), one row of
  navigation at the bottom (previous, Mark complete when it applies, Next).
  Secondary pages start with a single "← Course" link.
- Always show progress on the student's path (header meter, lesson bar,
  completion banner with how many are left).
- Navigation never marks anything complete. Completion is Vibe's job, or an
  explicit "Mark complete" button.

### Vibe facts that apply everywhere

- Vibe has two modes: **Work** (productivity, chat.mistral.ai web/mobile and
  Desktop) and **Code** (CLI, VS Code extension, Vibe Desktop, Vibe Code Web).
- The CLI and VS Code extension share config and sessions (`~/.vibe/`).
  Desktop local sessions share the CLI's core engine and session logs.
- User config: `~/.vibe/config.toml` (`VIBE_HOME` overrides `~/.vibe`).
  Project config: `.vibe/config.toml`, loaded only in a **trusted folder**.
- Global instructions: `~/.vibe/AGENTS.md`. Project: `AGENTS.md` from the
  project root, plus subfolder `AGENTS.md` files loaded lazily when the agent
  reads a file there.
- There is no `/init` command. Ask Vibe to write the `AGENTS.md`.
- Built-in agents: `ask`, `accept-edits` (default), `smart-approve`,
  `auto-approve`; subagent `explore`; installable `lean`. `Shift+Tab` cycles.

### Exercises

Same frontmatter minus `track`, `quiz`, `agentOnly`. `agentInstructions`
describes the steps and how to know it's done. Exercises are open-ended
projects done after the lessons, in any order.

## Agent-facing API

- `/llms.txt` (`src/pages/llms.txt.ts`) is the entry point for agents.
- `/api/openapi.json` (`src/pages/api/openapi.json.ts`) documents every route.
- When adding or changing a route, update both in the same commit.

# Vibe School

A free, self-paced course for learning [Mistral Vibe](https://docs.mistral.ai/vibe)
on every surface: the CLI, the VS Code extension, Vibe Desktop, Vibe Code Web
and Vibe Work.

Vibe teaches the course itself. Each lesson page has a prompt you paste into
Vibe, or you install the Vibe School plugin and type `/vibe-school:next`.
Vibe reads the lesson from this site's API, teaches it, checks your work on
your machine, marks it complete, and reports what you built.

What makes it different:

- **One project, built lesson by lesson.** The Vibe Code lessons grow a
  starter app, `vibe-todo`, into a full setup: 2 `AGENTS.md` files, 2 skills,
  2 custom agents, a hook and a plugin. The homepage shows it filling in.
- **Every surface.** Pick your main surface and role when you enroll; lessons
  lead with that surface and the homepage highlights a path for you. The
  Vibe Pass shows which surfaces you've actually used.
- **Runs inside Vibe.** The `vibe-school` plugin (`plugin/vibe-school/`) is a
  real Vibe plugin, which is also a worked example for the Plugins lesson.
- **Hands-on widgets** in the Surfaces, Permissions and Team rollout lessons.

The enrollment flow, agent-facing API and teach, quiz, verify format come
from [OpenCode School](https://github.com/agentschools/opencode.school) and
[Pi School](https://github.com/agentschools/pi-school) (Apache 2.0).

## Run it locally

```bash
npm install
script/dev            # http://localhost:4321
```

Student progress uses a local KV store in dev, so no Cloudflare account is
needed.

Then:

1. Open http://localhost:4321, pick a surface and role, and click
   **Get my Vibe Pass**.
2. Follow lesson 1 (Installation) in the browser.
3. From lesson 2 on, copy the prompt from each lesson page into Vibe (CLI,
   VS Code extension, or a local session in Vibe Desktop), or install the
   plugin from `/plugin`.

## Course

- **Get started**: Installation, Interview, Surfaces
- **Surfaces**: CLI, VS Code, Desktop, Code Web
- **Vibe Code**: Configuration, Permissions, Instructions, Models, Context,
  Sessions, Skills, Agents, MCP, Hooks, Plugins, Automation, Parallel work
- **Vibe Work**: Work, Projects, Connectors, Canvas, Automations
- **Team**: Team rollout (capstone)
- **Example project**: `/examples/agents-skills-instructions`, the finished
  vibe-todo setup with 2 agents, 2 skills and 2 instruction files (zip
  download). The starter is `/examples/starter.zip`.
- **Exercises**: open-ended projects to do after the lessons

See [plan.md](plan.md) for the full curriculum.

## Development

| Script | What it does |
|---|---|
| `script/dev` | Dev server |
| `script/build` | Production build |
| `script/lint` | Biome + `astro check` |
| `script/test` | Vitest |
| `script/build-assets` | Rebuild the plugin, starter and example zips in `public/` |
| `script/check-assets` | Fail if those zips are out of date (runs in CI) |
| `script/fetch-brand-fonts` | Copy the licensed ALT Mistral font in (git-ignored) |
| `script/deploy` | Build a clean copy of the current commit and deploy it to Cloudflare |

## Deploy

The site runs on Cloudflare Workers: prerendered pages and files are static
assets, and the API and `llms.txt` run in the Worker with student progress in
Workers KV.

One-time setup:

1. `npx wrangler login`
2. `npx wrangler kv namespace create PROGRESS`, then put the id in
   `wrangler.jsonc` (`kv_namespaces[0].id`).
3. Set `vars.SITE_URL` in `wrangler.jsonc` to the deployed address.

Then commit and run:

```bash
script/deploy --dry-run   # build and check, upload nothing
script/deploy             # deploy
```

`script/deploy` clones the current commit into a temp folder, copies in the
ALT Mistral font, runs lint, tests and the asset check, builds, and deploys.
It refuses to run with uncommitted changes, so the live site always matches a
commit. Logs and traces are on (`observability` in `wrangler.jsonc`).

## Repository layout

```
vibe-school/
├── src/content/        lessons, exercises, pages (MDX)
├── src/components/     AgentPrompt (launch bar), SurfaceTabs, widgets
├── src/lib/            tracks, paths, artifacts, progress, config builder
├── src/pages/          site and API routes
├── plugin/vibe-school/ the Vibe School plugin (source of the zip)
├── starter/vibe-todo/  the course project starter (source of the zip)
└── public/             fonts, pixel icons, school.js, built zips
```

## Brand assets and fonts

Pixel icons, cat sprites and the M come from Mistral's brand kit. Headings use
**ALT Mistral**, a typeface licensed to Mistral for its own use. It is **not
in this repository** (`public/fonts/ALTMistral-*.woff2` is git-ignored).
Inside Mistral, run `script/fetch-brand-fonts` to copy it in for local
development; `script/deploy` copies it into the deployed site. Without it, headings fall back to Inter 500, which is the
brand's documented fallback. Inter and Space Mono are OFL.

## License

Apache 2.0

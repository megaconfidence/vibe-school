# 0 to 60 with Mistral Vibe

A minimal, working example of a Mistral Vibe project with:

- **2 custom agents**: `builder` (you pick it) and `reviewer` (a subagent the builder starts)
- **2 skills**: `new-command` and `code-review`
- **2 instruction files**: `AGENTS.md` (the whole project) and `tests/AGENTS.md` (only the `tests/` folder)

The project is a tiny Python todo CLI. You ask the `builder` agent for a new
command. It follows a skill to write the code and tests, then asks the
`reviewer` subagent to check the work against the project rules.

## Project structure

```
agents-skills-instructions/
├── AGENTS.md                      # Instruction file 1: project rules, loaded at startup
├── .vibe/                         # Project-local Vibe config (loaded only in a trusted folder)
│   ├── config.toml                # default_agent = "builder"
│   ├── agents/
│   │   ├── builder.toml           # Agent 1: primary agent, you select it
│   │   └── reviewer.toml          # Agent 2: read-only subagent, the builder spawns it
│   └── skills/
│       ├── new-command/SKILL.md   # Skill 1: how to add a subcommand + test
│       └── code-review/SKILL.md   # Skill 2: review checklist + output format
├── todo/                          # The app
│   ├── cli.py                     # argparse + one cmd_<name>() per subcommand
│   ├── store.py                   # JSON load/save (the only module doing file I/O)
│   └── __main__.py
└── tests/
    ├── AGENTS.md                  # Instruction file 2: test rules, loaded when tests/ is read
    └── test_cli.py
```

Everything Vibe-specific is in **`.vibe/`** plus the **`AGENTS.md`** files. To
give your own project the same setup, copy those over.

## How the pieces link together

```
you ──▶ vibe (Vibe reads .vibe/config.toml → default_agent = "builder")
         │
         ├─ system prompt = Vibe prompt + AGENTS.md + builder.toml `instructions`
         │
         ▼
      builder ──loads skill──▶ new-command/SKILL.md
         │                        └─ "read tests/test_cli.py" ──▶ Vibe injects tests/AGENTS.md
         │  edits todo/cli.py + tests/test_cli.py, runs python3 -m unittest
         │
         └──spawns subagent "reviewer"──▶ reviewer ──loads skill──▶ code-review/SKILL.md
                                              └─ returns [PASS|FAIL] lines + APPROVE / CHANGES NEEDED
```

| Link | Where it is set |
|------|-----------------|
| Which agent starts | `.vibe/config.toml` → `default_agent = "builder"` (or `vibe --agent builder`) |
| Agent → skills it can use | `enabled_skills = [...]` in each agent TOML |
| Agent → instructions telling it when to use a skill | `instructions = """..."""` in the agent TOML |
| Agent → subagent | `builder` instructions name the subagent type `reviewer`; `reviewer.toml` has `agent_type = "subagent"` |
| Agent → tools/permissions | `enabled_tools`, `[tools.<name>] permission / allowlist` in the agent TOML |
| Instructions → every agent | `AGENTS.md` at the project root, loaded at startup |
| Instructions → one folder | `tests/AGENTS.md`, injected the first time an agent reads a file in `tests/` |
| Skill → when the model picks it | `description:` in the SKILL.md frontmatter |
| Skill → `/slash` command for you | `user-invocable: true` in the frontmatter |

## The files, one by one

### Agent 1: `.vibe/agents/builder.toml` (primary agent)

The file name is the agent's name. `agent_type = "agent"` means **you** select
it, with `vibe --agent builder` or `Shift+Tab` inside Vibe.

```toml
display_name = "Builder"
description  = "Adds features to the todo CLI using the new-command skill, then asks the reviewer subagent to check the work."
safety       = "neutral"        # safe | neutral | destructive | smart | yolo (colours the mode label)
agent_type   = "agent"

instructions = """
You are the Builder for this todo CLI.
1. When the user asks for a new command, load the `new-command` skill and follow it.
2. When the tests pass, spawn the `reviewer` subagent (agent type `reviewer`) ...
"""

enabled_skills = ["new-command", "code-review"]

[tools.write_file]
permission = "always"           # edit files without asking
[tools.edit]
permission = "always"
[tools.bash]
allowlist = ["python3 -m unittest", "python3 -m todo", "ls", "cat", "git status", "git diff", "git log"]   # anything else asks
```

Any `config.toml` key (`active_model`, `enabled_tools`, `[tools.*]`, …) can go
in an agent file. It applies only while that agent runs.

### Agent 2: `.vibe/agents/reviewer.toml` (subagent)

`agent_type = "subagent"` means **the model** starts it, not you. It is not in
the `Shift+Tab` list. The builder spawns it by its type name, `reviewer`.

```toml
display_name = "Reviewer"
description  = "Read-only reviewer. Checks the todo CLI against the project rules ..."   # required for subagents
safety       = "safe"
agent_type   = "subagent"
instructions = "You are a strict, read-only code reviewer ... Load the `code-review` skill ..."

enabled_tools  = ["read_file", "skill"]   # read-only: no write_file, edit or bash
enabled_skills = ["code-review"]
```

### Skill 1: `.vibe/skills/new-command/SKILL.md`

A skill is a folder containing a `SKILL.md`: YAML frontmatter plus Markdown
steps. The model sees each skill's `name` and `description` and loads the full
body when needed. With `user-invocable: true` you can also type `/new-command`.

```markdown
---
name: new-command
description: Add a new subcommand to the todo CLI, with its test. Use when the user asks for a new todo command such as remove, clear, edit or stats.
user-invocable: true
---
# Add a new todo subcommand
1. Read `todo/cli.py` and `tests/test_cli.py` ...
```

### Skill 2: `.vibe/skills/code-review/SKILL.md`

A six-point checklist that mirrors the rules in `AGENTS.md`, plus a fixed
output format (`[PASS|FAIL] <check #> <file>:<line> ...` then `APPROVE` or
`CHANGES NEEDED`). Run it yourself with `/code-review`.

### Instruction file 1: `AGENTS.md`

Project-wide rules: standard library only, one `cmd_<name>` per command, only
`store.py` does I/O, and how to run the tests. Vibe loads it **at startup** for
every agent and subagent.

### Instruction file 2: `tests/AGENTS.md`

Rules for tests only: use `unittest`, call the CLI through `run_cli()`, never
touch the real `.todo.json`. Vibe loads it **lazily**: it is added to the
context the first time an agent reads a file under `tests/`. Folder-specific
rules don't fill the context until they are needed.

| | Instructions in `AGENTS.md` | Instructions in an agent's `instructions` | Skill |
|---|---|---|---|
| Who gets them | Every agent working in that folder | Only that agent | Any agent that has the skill enabled |
| When they load | Startup (root) / on first read (subfolder) | When the agent starts | On demand, when the task matches its `description` |
| Use for | Facts and rules about the code | The agent's role and workflow | A repeatable procedure |

## Run it

### 0. Prerequisites

```bash
uv tool install --python 3.14 mistral-vibe   # or: brew install mistral-vibe
vibe --setup                                 # sign in / add your Mistral API key
python3 --version                            # 3.10+
```

### 1. Check that the app works without Vibe

Run every command from this folder (`agents-skills-instructions/`). Vibe reads
`.vibe/` and `AGENTS.md` from the folder it starts in.

```bash
cd agents-skills-instructions
python3 -m unittest            # Ran 5 tests ... OK
python3 -m todo add "Buy milk"
python3 -m todo list           # [ ] #1 Buy milk
```

### 2. Start Vibe and trust the folder

```bash
vibe
```

Answer **Trust folder** at the prompt. Project-local `.vibe/` config is ignored in
untrusted folders, and then you get the built-in agents only. The mode label on
the input box should read **Builder**.

### 3. Explore the setup inside Vibe

| Try | What you see |
|-----|--------------|
| `Shift+Tab` | Cycles agents: `builder` is listed, `reviewer` is not (it's a subagent) |
| `/` | The slash menu lists `/new-command` and `/code-review` with a `project ·` prefix |
| `/context` | Shows how much of the context the system prompt (including `AGENTS.md`) and skills use |

### 4. Ask for a feature

```
Add a remove command that deletes a task by id.
```

What happens:

```
builder loads skill new-command
  → reads todo/cli.py, tests/test_cli.py   (tests/AGENTS.md is injected here)
  → edits todo/cli.py + tests/test_cli.py
  → runs python3 -m unittest               (allowlisted, no prompt)
  → spawns subagent reviewer
       → loads skill code-review → reads files → [PASS] x6 → APPROVE
  → summary: files changed, test result, reviewer verdict
```

Sample final answer from a real run:

```
I added `todo remove <id>`, which deletes a task by its id. All 7 tests pass
and the reviewer approved the change with no findings.

Files changed
- todo/cli.py: added cmd_remove(args) -> int, registered `remove` in build_parser()
- tests/test_cli.py: test_remove, test_remove_unknown_id
Test result: python3 -m unittest → Ran 7 tests, OK.
Reviewer verdict: APPROVE, all six checks passed.
```

### 5. Same thing without the interactive UI

```bash
vibe --trust --agent builder -p "Add a stats command that prints how many tasks are open and done."
```

`--trust` trusts the folder for this run only. In `-p` mode a tool call that
would need approval is denied, so the builder's `[tools.bash] allowlist` sets
which commands it can run. Add `--auto-approve` to allow everything.

## Make it yours

| To… | Do this |
|-----|---------|
| Add an agent | Drop `.vibe/agents/<name>.toml`. Use `agent_type = "subagent"` if the model should start it, not you |
| Add a skill | Create `.vibe/skills/<name>/SKILL.md` and add `<name>` to the `enabled_skills` of the agents that should use it |
| Add folder-specific rules | Put an `AGENTS.md` in that folder |
| Share agents/skills across all projects | Put them in `~/.vibe/agents/` and `~/.vibe/skills/` instead |
| Pick up changes without restarting | `/reload` |

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `builder` not in the `Shift+Tab` list, skills missing | Folder not trusted. Run `/trusted-folders`, or start with `vibe --trust` |
| A **Warnings** box at startup mentions an agent file | Invalid TOML, unknown `safety`/`agent_type`, or a subagent without a `description` |
| The builder doesn't start the reviewer | The subagent must be spawned by its type name (`reviewer`), which is why `builder.toml`'s instructions name it |
| A skill never loads | Check that its `description` says *when* to use it and that the agent's `enabled_skills` includes it |

Docs: <https://docs.mistral.ai/vibe/code/overview>

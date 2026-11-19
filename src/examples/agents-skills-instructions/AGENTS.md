# Project instructions (instruction file 1 of 2)

Vibe loads this file at startup, for every agent and subagent working in this
folder. Put rules here that apply to the whole project.

## What this project is

`todo` is a tiny command line todo list written in Python.

```
todo/cli.py     # argparse parser + one cmd_<name>() per subcommand
todo/store.py   # load()/save() tasks to a JSON file (the ONLY module doing I/O)
tests/          # unittest suite (has its own AGENTS.md)
```

## Rules

- Python 3.10+, standard library only. Never add a dependency.
- Every subcommand is a `cmd_<name>(args) -> int` function in `todo/cli.py`,
  registered in `build_parser()`.
- Return `0` on success and `1` when a task id does not exist.
- Only `todo/store.py` reads or writes files.
- Use type hints and keep functions short.

## Commands

- Run the tests: `python3 -m unittest`
- Run the CLI:   `python3 -m todo <command> ...`

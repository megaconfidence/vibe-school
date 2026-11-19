---
name: new-command
description: Add a new subcommand to the todo CLI, with its test. Use when the user asks for a new todo command such as remove, clear, edit or stats.
user-invocable: true
---

# Add a new todo subcommand

Follow these steps in order.

1. Read `todo/cli.py` and `tests/test_cli.py` to see the existing pattern.
2. In `todo/cli.py`, add a `cmd_<name>(args: argparse.Namespace) -> int` function.
   Load tasks with `store.load()`, save them with `store.save()`.
3. Register it in `build_parser()`:

   ```python
   p_<name> = sub.add_parser("<name>", help="<one line help>")
   # add arguments here
   p_<name>.set_defaults(func=cmd_<name>)
   ```

4. In `tests/test_cli.py`, add a success test using the `run_cli` helper,
   plus an unknown-id test if the command takes a task id.
   (Reading this file also loads `tests/AGENTS.md`: follow its rules.)
5. Run `python3 -m unittest`. Fix anything that fails.
6. Show the user an example call, for example `python3 -m todo <name> ...`.

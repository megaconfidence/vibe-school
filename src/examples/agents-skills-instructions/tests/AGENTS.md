# Test instructions (instruction file 2 of 2)

This file is scoped to `tests/`. Vibe does not load it at startup: it injects it
the first time an agent reads a file in this folder (for example
`tests/test_cli.py`). Put rules here that only matter when working on tests.

## Rules

- Use `unittest` only (no pytest, no third-party libraries).
- Call the CLI through the `run_cli(*argv)` helper. It returns `(exit_code, stdout)`.
- Never touch the real `.todo.json`: `setUp()` points `TODO_FILE` at a temp file.
- Every command needs a success test. Commands that take a task id also need
  a failure test: an unknown id must return `1`.
- Name tests `test_<command>` and `test_<command>_<case>`.

---
name: code-review
description: Review the todo CLI code against this project's rules and return a short list of findings. Use when asked to review, check or audit code in this repo.
user-invocable: true
---

# Code review checklist

Read the changed files (or all of `todo/` and `tests/` if none are named),
then check each point below.

| # | Check |
|---|-------|
| 1 | Only the Python standard library is imported. |
| 2 | Each command is a `cmd_<name>` function registered in `build_parser()`. |
| 3 | Only `todo/store.py` reads or writes files. |
| 4 | Commands return `0` on success and `1` for an unknown task id. |
| 5 | Every command has a success test in `tests/test_cli.py`; commands taking a task id also have an unknown-id test. |
| 6 | Functions have type hints and stay short. |

## Output format

Reply with one line per finding:

```
[PASS|FAIL] <check #> <file>:<line> <one sentence>
```

End with a one-line verdict: `APPROVE` or `CHANGES NEEDED`.
Do not edit any file. You only report.

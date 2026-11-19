# Starter project

Source of `public/examples/starter.zip`, the app students download in the
Configuration lesson. It's the app from `../agents-skills-instructions/`
without any Vibe config: no `AGENTS.md`, no `.vibe/`. Rebuild the zip with:

```sh
(cd starter && rm -f ../public/examples/starter.zip && zip -rq ../public/examples/starter.zip vibe-todo -x '*__pycache__*' '*.DS_Store' '*.todo.json')
```

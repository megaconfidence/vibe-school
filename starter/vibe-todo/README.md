# vibe-todo

A tiny command line todo list in Python, standard library only. It's the
project you build up during the Vibe Code lessons of Vibe School.

```sh
python3 -m todo add "Buy milk"
python3 -m todo list
python3 -m todo done 1
python3 -m unittest
```

Tasks are stored in `.todo.json` in the current folder (set `TODO_FILE` to
change it).

Taking Vibe School? You got this folder in the Configuration lesson. Keep
working from it: each Code lesson adds a piece.

By the end of the course this folder will also hold two `AGENTS.md` files
(one at the root and one in `tests/`) and a `.vibe/` folder with
`config.toml` (default agent, permissions and an MCP server), two skills,
two custom agents, a hook and a plugin.

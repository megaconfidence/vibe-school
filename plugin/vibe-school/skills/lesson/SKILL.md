---
name: lesson
description: Run a specific Vibe School lesson by slug, for example /vibe-school:lesson skills. Use when the user names a Vibe School lesson to work on.
user-invocable: true
---

# Vibe School: a specific lesson

## Setup

Read `student.json` two folders up from this skill's base directory (the
plugin root). It holds `{"studentId": "...", "origin": "..."}`.

- If it is missing or unreadable, ask the student for their student ID (shown
  in the top bar of the Vibe School site) and the site address, then continue
  with those. Tell them to rerun the install command from `<origin>/plugin`
  so you remember next time.
- Never read `~/.vibe/.env` or any other `.env` file.

Then fetch `<origin>/llms.txt` with `curl -s` and follow it for the whole
lesson: it explains the API, how to teach, how to mark work complete, and how
to report the surface and artifacts. Make every API call with `curl -s`.

## Run the lesson

The text after the command is the lesson slug (for example `skills` or
`team-rollout`). If it is missing or unknown, list the lessons from
`<origin>/api/lessons` and ask which one.

Fetch `<origin>/api/lessons/<slug>?studentId=<studentId>` and teach it as
its `agentInstructions` say. If it is already complete, ask whether to redo
it before starting.

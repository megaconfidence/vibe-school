---
name: exercise
description: Run a Vibe School exercise by slug, for example /vibe-school:exercise build-a-website. Use when the user names a Vibe School exercise.
user-invocable: true
---

# Vibe School: an exercise

## Setup

Read `student.json` two folders up from this skill's base directory (the
plugin root). It holds `{"studentId": "...", "origin": "..."}`.

- If it is missing or unreadable, ask the student for their student ID (shown
  in the top bar of the Vibe School site) and the site address, then continue
  with those. Tell them to rerun the install command from `<origin>/plugin`
  so you remember next time.
- Never read `~/.vibe/.env` or any other `.env` file.

Then fetch `<origin>/llms.txt` with `curl -s` and follow it for the whole
exercise: it explains the API, how to teach, how to mark work complete, and how
to report the surface and artifacts. Make every API call with `curl -s`.

## Run the exercise

The text after the command is the exercise slug. If it is missing or unknown,
list `<origin>/api/exercises` and ask which one.

Fetch `<origin>/api/exercises/<slug>?studentId=<studentId>` and follow its
`agentInstructions`. Exercises are marked complete with `exerciseSlug`, not
`lessonSlug`.

---
name: next
description: Start or continue the student's next Vibe School lesson. Use when the user types /vibe-school:next or asks to continue the Vibe School course.
user-invocable: true
---

# Vibe School: next lesson

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

## Find the next lesson

1. `curl -s <origin>/api/progress/<studentId>` for their progress.
2. `curl -s "<origin>/api/lessons?studentId=<studentId>"` for the lessons in order.
3. The next lesson is the first one, by `order`, that is not in
   `completedLessons`. If the student named a lesson or said to skip
   ahead, use that instead.
4. Tell the student in one line which lesson you are starting, then fetch
   `<origin>/api/lessons/<slug>?studentId=<studentId>` and teach it as its
   `agentInstructions` say.

If every lesson is complete, congratulate them and suggest an exercise from
`<origin>/api/exercises`.

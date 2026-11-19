---
name: status
description: Show the student's Vibe School progress, what they have built and their next lesson. Use when the user types /vibe-school:status or asks how far along they are.
user-invocable: true
---

# Vibe School: status

## Setup

Read `student.json` two folders up from this skill's base directory (the
plugin root). It holds `{"studentId": "...", "origin": "..."}`.

- If it is missing or unreadable, ask the student for their student ID (shown
  in the top bar of the Vibe School site) and the site address, then continue
  with those. Tell them to rerun the install command from `<origin>/plugin`
  so you remember next time.
- Never read `~/.vibe/.env` or any other `.env` file.

Then fetch `<origin>/llms.txt` with `curl -s` and follow it for the API
details: it explains the routes and the progress data. Make every API call
with `curl -s`.

## Report

1. `curl -s <origin>/api/progress/<studentId>` and
   `curl -s <origin>/api/lessons`.
2. Reply with a short summary, no more than 12 lines:
   - lessons done out of the total, per track. Label the tracks with the
     site's names, not the API ids: `start` is "Get started", `surfaces`
     is "Surfaces", `code` is "Vibe Code", `work` is "Vibe Work", `team`
     is "Team";
   - what they have built (`artifacts`, grouped by kind);
   - surfaces used;
   - the next lesson, and that `/vibe-school:next` starts it.
3. Don't start teaching unless they ask.

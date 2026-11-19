# vibe-school plugin

Lets students run the Vibe School course from inside Vibe instead of
pasting a prompt per lesson. Skills:

| Command | What it does |
|---|---|
| `/vibe-school:next` | Start or continue the next lesson |
| `/vibe-school:lesson <slug>` | Run a specific lesson |
| `/vibe-school:exercise <slug>` | Run an exercise |
| `/vibe-school:status` | Progress, what you've built, next step |

`student.json` (student ID and site origin) is written by the install command
on the site's `/plugin` page. It is not part of the zip.

Rebuild the zip after editing: `script/build-assets` (from `vibe-school/`).

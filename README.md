# Meadow House Repairs

A small browser app for staff at Meadow House (a fictional care home) to report repairs, track their progress and see what was done. Built with Vue 3 and Vite. Jobs are saved in the browser's local storage, so there's no server, account or API key.

## Running it

You need Node 20 or newer.

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm test          # runs the test suite once
npm run build     # production build into dist/
npm run preview   # serves the built app
```

The build uses relative paths, so `dist/` can be dropped onto any static host (GitHub Pages, Netlify and so on).

## How it works

1. **Report a repair**: description, reporter name and Normal or Urgent priority. Blank or space-only fields are rejected with a message next to the field, and anything else you typed stays put.
2. Each report becomes a **job** with its own id (`MH-0001`, `MH-0002`...), a date and time, the house name and status **New**.
3. Pick a job from the list to open it. **Start work** moves it to **In Progress**, then you can **Save note** as many times as you like.
4. **Complete job** needs a completion note saying what was done. Once completed, the job is read-only.
5. Every change is added to the job's history with a date and time. Nothing in the history is ever removed.

All text is shown as plain text, so something like `<b>check gate</b>` appears exactly as typed.

## Project layout

```
src/
  App.vue                  page layout, which job is selected
  composables/useJobs.js   job data, the actions on it and saving to local storage
  components/
    ReportForm.vue         the report form and its validation
    JobList.vue            list of jobs, newest first
    JobDetail.vue          one job: details, start / note / complete, outcome
    JobHistory.vue         dated history for a job
    JobTags.vue            status and priority tags
  format.js                date formatting
  style.css                colours, base styles, shared buttons, fields and tags
tests/
  judging.spec.js          the ten judging tests from the brief, plus a few a11y checks
  useJobs.spec.js          unit tests for the data layer
```

## Tests

`tests/judging.spec.js` follows the published judging tests one by one (valid report, required fields, priority, independent jobs, progress, completion, refresh, plain text). The refresh test unmounts the app and mounts it again from local storage, the same thing a page reload does.

## Notes

- Clearing the site's data in the browser removes all jobs.
- All names and repairs used in the tests are made up.

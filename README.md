# Lock-in 30

Your 30-week training plan and logbook, rebuilt from the original single-file HTML tracker as a small React app. Each exercise now shows an animated illustration of the movement.

- **No server, no database.** Everything you log is saved in your browser (localStorage). Use **Settings → Download backup** now and then.
- **Old backups restore as-is.** The data format is unchanged, so backup text from the original HTML file restores here.
- **Installable and offline.** Add it to your home screen and it works with no signal. Each animation is cached the first time you view it.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

## Test it

```bash
npm test           # unit tests (Vitest): plan logic, dates, saving, backups, data integrity
npm run build      # type-check + production build
npm run test:e2e   # end-to-end tests (Playwright) on phone and desktop sizes, using your installed Chrome
npm run test:all   # all of the above in order
```

## Deploy to Vercel (free plan)

The project is a static site, so the free Hobby plan covers it. There's nothing to configure and no environment variables. `vercel.json` already sets the build command and output folder.

**From GitHub:** push this folder to a GitHub repo, then on vercel.com choose *Add New → Project*, import the repo, and click *Deploy*.

**From your terminal:** `npx vercel` (first time: log in and accept the defaults), then `npx vercel --prod`.

After it's live, open the URL on your phone and add it to your home screen:
- **iPhone:** in Safari, tap Share, then *Add to Home Screen*.
- **Android:** in Chrome, open the menu and tap *Install app*.

On iPhone this matters: Safari can clear website data for sites you haven't installed.

## Exercise animations

The animations, target muscles and step-by-step instructions come from the free **ExerciseDB v1 API by [AscendAPI](https://ascendapi.com)** (`oss.exercisedb.dev`).
- **Terms:** the free tier allows personal and non-commercial projects, with credit to AscendAPI. The app shows that credit in the exercise viewer, the Plan tab and Settings.
- **Hosting:** GIFs are not bundled. They load from ExerciseDB's CDN only when an exercise scrolls into view (~80–110 KB each), and the service worker keeps them for offline use.
- **Bundled metadata:** `src/data/exercises.json` holds the names, muscles and steps (about 60 exercises), so the app never calls the API at runtime.

### Change or add an animation

1. Find the exercise ID. For example, open `https://oss.exercisedb.dev/api/v1/exercises?name=goblet%20squat` and copy its `exerciseId`. Each `gifUrl` shows you the animation.
2. In `src/data/plan.ts`, set the exercise's `anim` (or `altAnim` for the swap option) to `gif("<exerciseId>", "Optional label")`.
3. Run `npm run exercises:sync`. It fetches the metadata into `src/data/exercises.json` and checks that every animation exists. ExerciseDB is missing GIFs for some exercises, so this check matters.

`npm run exercises:check` re-checks that every animation the plan uses still exists, without changing anything.

If ExerciseDB ever changes its free tier, `gifUrl()` in `src/lib/anim.ts` is the only place to update to switch image sources.

## Project layout

```
src/
  data/plan.ts           the whole plan: phases, sessions, exercises, complex, backups, mobility
  data/exercises.json    ExerciseDB metadata for the animations used (generated)
  lib/store.ts           saved state (localStorage) and the useStore hook
  lib/actions.ts         every change to saved data
  lib/logic.ts           schedule, phases, progression hints, streaks, catch-up
  components/            Header (plate bar), WeekView, SessionSheet, ExerciseViewer, Progress, Plan, Settings
scripts/sync-exercises.mjs
tests/unit/              Vitest
tests/e2e/               Playwright
```

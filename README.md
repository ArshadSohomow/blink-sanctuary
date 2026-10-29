# Blink — Digital Sanctuary (demo)

**Live demo:** https://blink-4fd.pages.dev

*Return to yourself.* A working prototype of Blink: the HOLD ritual, a living rock-stack sanctuary, short activities, focus sessions, a private journal, a gentle daily rhythm and a simulated check-in call.

## Run it

Needs Node 18+.

```bash
git clone https://github.com/ArshadSohomow/blink-sanctuary.git
cd blink-sanctuary
```

```bash
npm install
npm run dev      # http://localhost:5173, rebuilds on change
npm run build    # production build in dist/
```

`dist/` is a plain static site with no server and no environment variables.

## Deploy to Cloudflare Pages

**Option A: upload in the dashboard**
1. Cloudflare dashboard → Workers & Pages → Create → Pages → *Upload assets*.
2. Name the project (e.g. `blink`) and drop in the contents of `dist/` (or `blink-dist.zip`).
3. Deploy. `_headers` (security headers + caching) is applied automatically.

**Option B: connect this GitHub repo (auto-deploys on every push)**
Workers & Pages → Create → Pages → Connect to Git → choose `blink-sanctuary`. Framework preset: *None*. Build command `npm run build`, output directory `dist`.

**Option C: Wrangler**
`npx wrangler pages deploy dist --project-name blink`

## What's in it

| Area | What works |
|---|---|
| Entry ritual | Press-and-hold bubble, random 3–8 blinks at 0.6 s each (0.3 s expand + 0.3 s contract), early-release message, burst, skip link, keyboard (hold Space) |
| Sanctuary | Time-of-day sky (morning/day/dusk/night or manual), drifting clouds, stars, a grassy knoll and ledge, a stone stack that grows, settles, leans and sways in passing gusts |
| Stack model | `src/model/stack.ts`: activities add growth (1.0 = one stone), stability and garden details. Repeating an activity gives less, growth is capped daily, time away adds a gentle lean with a floor, and nothing is ever lost |
| Activities | 4 breathing modes (incl. a breath-free one), five-senses grounding, body check, 5 thinking exercises with difficulty/hints/explanations, 4 micro-lessons (labelled demo content), movement resets, 4 sanctuary-care activities, anti-scroll intervention |
| Focus | Tasks/goals (create, edit, complete, delete, priority/upcoming, recurring), focus ritual with 5/10/20/custom min, pause/resume/end early, survives reload, "What moved forward?" |
| Journal | Mood picker + 14-day history, journal with prompts/drafts/mood, entries list, a record of returning |
| Rhythm | Editable routine (sample included), skip/move today, reminder settings (quiet hours, window, frequency, snooze, categories), optional browser notifications, in-app reminders, demo buttons, scroll estimate (labelled as an estimate), daily reflection, intervention log |
| Check-in call | Incoming-call UI, scripted caller (read aloud by browser TTS), browser speech recognition when supported or a typed fallback, editable transcript, one clarifying prompt, nothing saved unless chosen |
| Settings | Appearance, motion, text size, ambient sound (generated, never autoplays), export data, delete everything |

## Architecture

```
src/
  types.ts          data model
  model/            pure logic: stack progression, geometry, time, schedule
  state/            store (localStorage-backed) + hash router
  services/         storage, notifications, speech, sound (swap for real backends later)
  content/          puzzles, lessons, prompts, catalogue
  components/       RockStack, Environment, EntryRitual, ReminderHost, Onboarding…
  activities/       one component per activity + ActivityRunner
  pages/            Sanctuary, Activities, Focus, Journal, Rhythm, Settings
```

React 19 + TypeScript, bundled with esbuild. All visuals are CSS and SVG, with no images, video or 3D.

## Honest limits (by design)

- Data lives only in this browser's localStorage. It doesn't sync, and clearing site data removes it. Export/delete are in Settings.
- No AI service is connected. Caller lines are scripted and labelled.
- Screen time can't be measured from a website. Scrolling figures are user estimates.
- Browser notifications only work while the browser is running and permission is granted. There is no background push.

## Towards "real"

- Accounts + sync: implement `StorageAdapter` (`src/services/storage.ts`) against an authenticated API (e.g. Cloudflare Workers + D1), and keep secrets server-side.
- AI check-ins / speech-to-text: proxy through a Worker, never with keys in the frontend.
- Push notifications: Web Push via the existing service worker (`public/sw.js`) + a push service.
- Mobile apps: the model/services layers are UI-free and can be reused in React Native. Screen Time (iOS) / UsageStats (Android) belong there.

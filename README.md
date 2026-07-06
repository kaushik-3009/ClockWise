<div align="center">

# ClockWise

**A Pomodoro timer with project tracking, analytics, and cross-device sync.**

Sign in, focus, and see exactly where your time goes — from any device.

[![CI](https://github.com/kaushik-3009/ClockWise/actions/workflows/ci.yml/badge.svg)](https://github.com/kaushik-3009/ClockWise/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## What it does

ClockWise is a Pomodoro focus timer that automatically tracks where your time goes. Pick a project (or task), start the timer, and every second is logged — no manual entry. Over time, heatmaps, trend charts, and streak tracking show you exactly how you spend your focus hours. Data syncs across devices via Firebase and is fully usable offline.

**Key features:**

- **Pomodoro timer** with configurable focus/break phases, three display modes (digital, analog, clock), and keyboard shortcuts (Space, R, S, Esc)
- **Project & task tracking** — organize work into color-coded projects, assign tasks, or create either inline from the "I'm focusing on…" picker without leaving the timer
- **Quick context switch mid-session** — reassign the running timer to a different project/task without pausing or losing progress
- **Analytics dashboard** — heatmaps, trend charts, session breakdowns, weekday/time-of-day analysis
- **Ambient sounds** — rain, white noise, brown noise, cafe — real looping audio files, with a shared Web Audio context for UI sound effects
- **Templates** — save and switch timer configurations (Classic Pomodoro, Deep Work, Quick Sprint)
- **Streak tracking** — daily goals, streak counting, consistency scoring
- **Accounts + cross-device sync** — Firebase Authentication (email/password, password reset) with per-user Firestore data
- **Offline-first** — Firestore persistent local cache with multi-tab support, plus an offline banner when the network drops; installable PWA
- **Data export** — JSON and CSV export with auto-backup
- **Responsive layout** — scales up through custom `3xl`/`4xl` Tailwind breakpoints for large and ultra-wide monitors
- **Dark mode** — full theme support via CSS custom properties, themed scrollbars

---

## Routing & auth flow

| Route | Who sees it | Behavior |
|---|---|---|
| `/` | Everyone | Landing page for signed-out users; signed-in users are redirected straight to `/timer` |
| `/login`, `/signup` | Signed-out users | Signed-in users are redirected to `/timer` |
| `/timer`, `/statistics`, `/projects`, … | Signed-in users only | `ProtectedRoute` redirects signed-out users back to `/` |

Every CTA on the landing page ("Start Focusing", "Open App", "View Your Stats") routes through `/login` rather than assuming an active session — clicking through as a signed-out visitor lands on the login screen, and a successful login drops you into `/timer`. Logging out sends you back to `/`, not a dead end.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React 18 + TypeScript (strict) + React Router          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │  Timer   │   │ Projects │   │ Insights │  ...pages   │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘             │
│       │              │              │                   │
│  ┌────┴──────────────┴──────────────┴────┐              │
│  │           Zustand Stores              │              │
│  │   timerStore (not persisted)          │              │
│  │   uiStore (persisted to localStorage) │              │
│  └───────────────────┬───────────────────┘              │
│                      │                                  │
│  ┌───────────────────┴───────────────────┐              │
│  │         Web Worker (timer.worker)     │              │
│  │   setInterval → postMessage('tick')   │              │
│  └───────────────────────────────────────┘              │
│                                                          │
│  ┌────────────────────────────────────────┐             │
│  │      Firebase Auth + Firestore         │             │
│  │  users/{uid}/{projects,tasks,sessions, │             │
│  │   streaks,settings,templates,backups}  │             │
│  │  persistentLocalCache (offline, multi- │             │
│  │  tab) via initializeFirestore          │             │
│  └────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Technical choices:**

| Decision | Why |
|---|---|
| Web Worker for timer | `setInterval` on the main thread drifts when the tab is throttled. The worker keeps ticking accurately. |
| Firestore over a custom backend | Per-user subcollections give free auth-scoped security rules, live `onSnapshot` sync, and offline persistence out of the box. |
| `initializeFirestore` + `persistentLocalCache` | Firestore's default cache doesn't survive across tabs. `persistentMultipleTabManager` keeps writes consistent when the app is open in more than one tab. |
| Generation-counter cancellation in `useTimer` | A plain boolean `cancelledRef` can't distinguish "this reset cancelled effect run #1" from "a new run #2 already started" — a monotonically increasing generation counter can. Prevents orphaned session documents on rapid reset→play→reset. |
| Zustand over Context | Timer ticks 60 times/minute. Zustand's selector pattern (`useStore(s => s.field)`) prevents unnecessary re-renders on every tick. |
| CSS variables over Tailwind `dark:` | CSS variables override cleanly via `[data-theme="dark"]`. Tailwind's variant doesn't compose well with dynamic themes. |
| Real audio files for ambient sound, Web Audio API for effects | Looping ambient tracks (rain, cafe, etc.) sound better as authored audio than synthesized noise; short UI sounds (click, chime) stay synthesized and share one `AudioContext`. |
| Recharts with custom tooltips | Default Recharts tooltip text inherits bar fill color, making light bars invisible in light mode. Custom HTML tooltips fix this. |

---

## Quick start

```bash
# Clone
git clone https://github.com/kaushik-3009/ClockWise.git
cd ClockWise

# Install
npm install

# Configure Firebase — copy and fill in your project's config
cp .env.example .env.local

# Develop
npm run dev

# Build
npm run build

# Test
npm test
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm test` | Run all tests (Vitest) |
| `npm run lint` | ESLint on `src/` |
| `npm run format` | Prettier on `src/` |
| `npx tsc --noEmit` | Type-check only |

---

## Project structure

```
src/
  components/
    ui/           Modal, Toast, ConfirmDialog, SettingsModal, Skeleton, ErrorBoundary
    layout/       AppShell, Sidebar, BottomNav, OfflineBanner
    auth/         ProtectedRoute
    timer/        TimerDisplay, TimerControls, PhaseBadge, FocusingOnBar, TaskPicker, TemplateSelector
    projects/     ProjectCard, TaskRow, ProjectForm, TaskForm
    stats/        HeatmapCalendar, FocusTimeChart, SessionsChart, TrendChart, StatCard
    insights/     DaytimeChart, WeekdayChart, FocusDistribution
  hooks/          useTimer, useProjects, useTasks, useSessions, useSettings, useTemplates, useOnlineStatus
  stores/         timerStore (Zustand), uiStore (Zustand + persist)
  db/             queries/ (Firestore reads/writes per collection), seed.ts
  workers/        timer.worker.ts (Web Worker)
  lib/            firebase.ts, auth.tsx, time.ts, phases.ts, stats.ts, sounds.ts, ambient.ts, streaks.ts, exportImport.ts
  types/          index.ts (canonical types)
  pages/          Timer, Login, Signup, Statistics, Projects, ProjectDetail, Tasks, History, Streaks, Insights, Templates
public/
  sounds/         Ambient audio files (rain, white noise, brown noise, cafe — see sounds/README.md)
.github/
  workflows/      CI pipeline
```

---

## Testing

```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
```

**Coverage:**

- Unit tests: `time.ts`, `phases.ts`, `stats.ts`, `streaks.ts`, `exportImport.ts`
- Store tests: `timerStore.ts`
- 50 tests across 6 test files

---

## Data storage & sync

Data lives in Firestore under a per-user subcollection tree (`users/{uid}/...`), so it's private by default and available on any device you sign into.

```
Firestore (users/{uid}/)
├── projects, tasks, sessions, streaks
├── settings, templates
└── backups (auto-backup snapshots)

Local (per browser)
├── Firestore persistentLocalCache — offline reads/writes, synced when back online
└── localStorage — uiStore (theme, sidebar state)
```

- Firestore's persistent local cache means the app keeps working offline; writes queue and sync once you're back online (surfaced via the offline banner)
- Auto-backup saves a full snapshot on every session completion
- Export to JSON or CSV at any time

---

## Technical highlights

**Web Worker timer with drift compensation**
The timer runs in a Web Worker using `setInterval`. The worker sends `'tick'` messages to the main thread, which updates the Zustand store. This keeps the timer accurate even when the tab is throttled (browsers throttle `setInterval` on background tabs to save battery).

**Firestore offline persistence**
`initializeFirestore` is configured with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` so reads/writes work offline and stay consistent if the app is open in multiple tabs. An `useOnlineStatus` hook + `OfflineBanner` component surface connectivity state to the user.

**Race-safe session lifecycle**
Session documents are created in Firestore when a phase starts running. A monotonically increasing generation counter (rather than a single boolean flag) tracks which effect run is "current," so a fast reset → play → reset sequence can't leave an orphaned session document behind or apply a stale session ID.

**CSS variables in SVG**
Recharts renders inline SVG. CSS custom properties (`var(--color-brand)`) don't resolve inside SVG elements. The chart components detect the current theme via JavaScript and apply hex colors directly to SVG attributes.

**Ambient sound + effects split**
Looping ambient tracks (rain, white noise, brown noise, cafe) play as real audio files via `HTMLAudioElement`, swapped without an audible gap when only the volume changes. Short UI sound effects (click, chime, warning) stay synthesized via a shared `AudioContext` so there's no duplicate audio-file overhead for one-shot sounds.

**Import validation without Zod**
Data imports are validated with TypeScript type guards. Every field of every entity type is checked for correct type, range, and enum membership. Hex color format is validated with regex. No schema library dependency.

**Incremental stats computation**
Statistics are computed in `lib/stats.ts` as pure functions. Sessions are grouped by day into a `Map<string, Session[]>` index, then all derived stats (totals, deltas, best day, consistency) are computed from that index. Memoized via `useMemo` in page components.

---

## CI/CD

GitHub Actions runs on every push and PR:

```
TypeScript → ESLint → Vitest → Vite build
```

All four must pass. The pipeline is defined in `.github/workflows/ci.yml`.

---

## License

MIT

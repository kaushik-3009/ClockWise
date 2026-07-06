<div align="center">

# ClockWise

**A Pomodoro timer that tracks where your focus time actually goes, synced across devices.**

[![CI](https://github.com/kaushik-3009/ClockWise/actions/workflows/ci.yml/badge.svg)](https://github.com/kaushik-3009/ClockWise/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Why

Most Pomodoro apps are timers with a bell attached. ClockWise treats every session as data: pick a project or task, start the timer, and the session gets logged automatically — no manual entry, no end-of-day guessing. Over weeks, that turns into heatmaps, streaks, and trend charts that answer "where did my time actually go this week?"

It started as a local-only IndexedDB app, then moved to Firebase (Auth + Firestore) so the same data follows you across devices and survives a wiped browser, while still working offline.

---

## Features

- **Timer** — configurable focus/break phases, three display modes (digital, analog, clock), keyboard shortcuts (Space, R, S, Esc)
- **Projects & tasks** — color-coded projects with tasks, creatable inline from the "I'm focusing on…" picker without leaving the timer; switch context mid-session without losing progress
- **Analytics** — heatmaps, trend charts, session breakdowns, weekday/time-of-day analysis
- **Streaks** — daily goals, streak counting, consistency scoring
- **Templates** — saved timer configurations (Classic Pomodoro, Deep Work, Quick Sprint)
- **Ambient sound** — looping audio (rain, white noise, brown noise, cafe) alongside synthesized UI sound effects
- **Accounts & sync** — Firebase email/password auth with per-user Firestore data, offline persistence, installable PWA
- **Export** — JSON and CSV, with automatic backup snapshots

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React 18 + TypeScript (strict) + React Router           │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐              │
│  │  Timer   │   │ Projects │   │ Insights │  ...pages    │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘              │
│       │              │              │                    │
│  ┌────┴──────────────┴──────────────┴────┐               │
│  │           Zustand Stores               │              │
│  │   timerStore (in-memory)               │              │
│  │   uiStore (persisted to localStorage)  │              │
│  └───────────────────┬───────────────────┘               │
│                      │                                   │
│  ┌───────────────────┴───────────────────┐               │
│  │        Web Worker (timer.worker)      │               │
│  │   setInterval → postMessage('tick')   │               │
│  └────────────────────────────────────────┘              │
│                                                           │
│  ┌────────────────────────────────────────┐              │
│  │       Firebase Auth + Firestore        │              │
│  │  users/{uid}/{projects, tasks,         │              │
│  │   sessions, streaks, settings,         │              │
│  │   templates, backups}                  │              │
│  │  initializeFirestore + persistent      │              │
│  │  LocalCache — offline, multi-tab safe  │              │
│  └────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

**Routing:** `/` is the landing page for signed-out visitors and redirects signed-in users to `/timer`. Every landing CTA routes through `/login` rather than assuming a session, so a signed-out click always lands somewhere real instead of silently bouncing. `ProtectedRoute` sends signed-out users hitting an app route back to `/`.

**Notable decisions:**

- **Timer runs in a Web Worker**, not `setInterval` on the main thread — background-tab throttling can't make it drift, and heavy chart re-renders can't stall it.
- **Firestore over a custom backend** — per-user subcollections get auth-scoped security rules and live sync for free; `persistentMultipleTabManager` keeps offline writes consistent across tabs.
- **Generation counter instead of a boolean cancel flag** in `useTimer` — a plain `cancelledRef` can't tell "this run was cancelled" from "a newer run already replaced it," which let rapid reset→play→reset leave orphaned session documents in Firestore. A monotonically increasing counter fixes that.
- **Zustand with selectors, not Context** — the timer ticks every second; selecting individual fields (`useStore(s => s.field)`) keeps components that don't care about the tick from re-rendering.
- **Real audio files for ambient loops, synthesized Web Audio for UI sounds** — looping rain/cafe/noise sounds better as authored audio; short one-shot clicks/chimes stay synthesized through a single shared `AudioContext` so they don't need their own audio files.
- **Recharts with custom HTML tooltips** — Recharts' default tooltip text inherits the bar's fill color, which makes it invisible in light mode; custom tooltip components sidestep it. Same reason CSS variables don't drive chart colors directly (they don't resolve inside inline SVG) — chart components detect the theme in JS and use hex fallbacks.
- **Hand-written type guards for import validation**, no schema library — every field of every entity is checked for type, range, and enum membership.

---

## Running it

```bash
git clone https://github.com/kaushik-3009/ClockWise.git
cd ClockWise
npm install

cp .env.example .env.local   # fill in your Firebase project config

npm run dev      # start dev server
npm run build    # type-check + production build
npm test         # run tests
```

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm test` | Run tests (Vitest) |
| `npm run lint` | ESLint on `src/` |
| `npx tsc --noEmit` | Type-check only |

---

## Project structure

```
src/
  components/
    ui/           Modal, Toast, ConfirmDialog, SettingsModal, ErrorBoundary
    layout/       AppShell, Sidebar, BottomNav, OfflineBanner
    auth/         ProtectedRoute
    timer/        TimerDisplay, TimerControls, PhaseBadge, FocusingOnBar, TaskPicker, TemplateSelector
    projects/     ProjectCard, TaskRow, ProjectForm, TaskForm
    stats/        HeatmapCalendar, FocusTimeChart, SessionsChart, TrendChart, StatCard
    insights/     DaytimeChart, WeekdayChart, FocusDistribution
  hooks/          useTimer, useProjects, useTasks, useSessions, useSettings, useTemplates, useOnlineStatus
  stores/         timerStore, uiStore (Zustand)
  db/queries/     Firestore reads/writes, one file per collection
  workers/        timer.worker.ts
  lib/            firebase.ts, auth.tsx, stats.ts, sounds.ts, ambient.ts, streaks.ts, exportImport.ts
  pages/          Timer, Login, Signup, Statistics, Projects, ProjectDetail, Tasks, History, Streaks, Insights, Templates
public/sounds/    Ambient audio files
```

---

## Testing

```bash
npm test            # run once
npm run test:watch  # watch mode
```

50 tests across 6 files: `time.ts`, `phases.ts`, `stats.ts`, `streaks.ts`, `exportImport.ts`, `timerStore.ts`.

---

## Data & sync

Everything lives under `users/{uid}/` in Firestore — private by default, available on any device you sign into. Firestore's persistent local cache means the app keeps working offline; writes queue and sync once you're back (an offline banner tells you when). Auto-backup snapshots on every session completion, plus manual JSON/CSV export.

---

## CI

GitHub Actions runs TypeScript → ESLint → Vitest → Vite build on every push and PR. All four must pass (`.github/workflows/ci.yml`).

---

## License

MIT

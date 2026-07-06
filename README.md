<div align="center">

# ClockWise

**A Pomodoro timer that tracks where your focus time actually goes, synced across devices.**

[![CI](https://github.com/kaushik-3009/ClockWise/actions/workflows/ci.yml/badge.svg)](https://github.com/kaushik-3009/ClockWise/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-installable-purple.svg)](https://web.dev/progressive-web-apps/)

[Live Demo](https://your-demo-url.here) · [Report a Bug](https://github.com/kaushik-3009/ClockWise/issues) · [Request a Feature](https://github.com/kaushik-3009/ClockWise/issues)

</div>

---

## Why

Every Pomodoro app I tried was either covered in ads or locked the useful stuff behind a paywall. Heatmaps? Pro plan. Session history? Upgrade. Basic analytics? $8/month. I got tired of it and built my own.

It started as a local-only app for personal use. Then I figured if I was building it anyway, I might as well add accounts and sync so anyone could use it. No ads, no freemium tiers, no strings attached. Pick a project, start the timer, and everything gets logged automatically. Over weeks that becomes heatmaps, streaks, and trend charts that actually answer "where did my time go this week?"

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript (strict), React Router |
| State | Zustand (with per-field selectors) |
| Timer | Web Worker (`timer.worker.ts`) |
| Backend / Auth | Firebase Auth + Firestore |
| Build | Vite |
| Testing | Vitest |
| CI | GitHub Actions |

---

## Features

- **Timer** -- configurable focus/break phases, three display modes (digital, analog, clock), keyboard shortcuts (`Space`, `R`, `S`, `Esc`)
- **Projects & tasks** -- color-coded projects with tasks, creatable inline from the *"I'm focusing on..."* picker without leaving the timer; switch context mid-session without losing progress
- **Analytics** -- heatmaps, trend charts, session breakdowns, weekday and time-of-day analysis
- **Streaks** -- daily goals, streak counting, consistency scoring
- **Templates** -- saved timer configurations (Classic Pomodoro, Deep Work, Quick Sprint)
- **Ambient sound** -- looping audio (rain, white noise, brown noise, cafe) plus synthesized UI sound effects
- **Sync & offline** -- Firebase email/password auth, per-user Firestore data, offline persistence, installable PWA
- **Export** -- JSON and CSV, with automatic backup snapshots on every session completion

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A Firebase project with **Authentication** (email/password) and **Firestore** enabled

### Setup

```bash
git clone https://github.com/kaushik-3009/ClockWise.git
cd ClockWise
npm install

cp .env.example .env.local   # add your Firebase project config
npm run dev                  # start the dev server at localhost:5173
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Watch mode |
| `npm run lint` | ESLint on `src/` |
| `npx tsc --noEmit` | Type-check only |

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
│  │  LocalCache -- offline, multi-tab safe │              │
│  └────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

**Routing:** `/` is the landing page for signed-out visitors and redirects signed-in users to `/timer`. Every CTA routes through `/login` rather than assuming a session, so signed-out clicks always land somewhere real. `ProtectedRoute` redirects signed-out users hitting app routes back to `/`.

### Notable Design Decisions

- **Timer runs in a Web Worker** -- background-tab throttling can't cause drift, and heavy chart re-renders can't stall it. No `setInterval` on the main thread.
- **Firestore instead of a custom backend** -- per-user subcollections get auth-scoped security rules and live sync for free; `persistentMultipleTabManager` keeps offline writes consistent across tabs.
- **Generation counter, not a boolean cancel flag** -- a plain `cancelledRef` can't distinguish "this run was cancelled" from "a newer run replaced it," which caused rapid reset->play->reset to leave orphaned session documents. A monotonically increasing counter fixes that.
- **Zustand with selectors** -- the timer ticks every second; `useStore(s => s.field)` keeps components that don't care about the tick from re-rendering on every tick.
- **Real audio files for ambient loops, synthesized Web Audio for UI sounds** -- looping rain/cafe/noise sounds better as authored audio; short one-shot clicks/chimes are synthesized through a single shared `AudioContext` and need no audio files.
- **Recharts with custom HTML tooltips** -- Recharts' default tooltip text inherits the bar's fill color, which makes it invisible in light mode. Custom tooltip components fix that. Chart colors are detected in JS with hex fallbacks because CSS variables don't resolve inside inline SVG.
- **Hand-written type guards for import validation** -- every field of every entity is checked for type, range, and enum membership; no schema library dependency.

---

## Project Structure

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

50 tests across 6 files covering core logic: `time.ts`, `phases.ts`, `stats.ts`, `streaks.ts`, `exportImport.ts`, `timerStore.ts`.

```bash
npm test             # run once
npm run test:watch   # watch mode
```

---

## Data & Sync

Everything lives under `users/{uid}/` in Firestore -- private by default, available on any signed-in device. Firestore's persistent local cache keeps the app working offline; writes queue and sync when you reconnect (an offline banner makes the state visible). Sessions trigger automatic backup snapshots; manual JSON/CSV export is always available.

---

## CI

GitHub Actions runs **TypeScript type-check -> ESLint -> Vitest -> Vite build** on every push and pull request. All four gates must pass -- see [`.github/workflows/ci.yml`](https://github.com/kaushik-3009/ClockWise/blob/main/.github/workflows/ci.yml).

---

## License

[MIT](./LICENSE)

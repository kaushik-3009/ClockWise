<div align="center">

# ClockWise

**A minimal Pomodoro timer with project tracking and analytics.**

No sign-up. No cloud. No distractions. Your data stays in your browser.

[![CI](https://github.com/user/clockwise/actions/workflows/ci.yml/badge.svg)](https://github.com/user/clockwise/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## What it does

ClockWise is a Pomodoro focus timer that automatically tracks where your time goes. Pick a project, start the timer, and every second is logged — no manual entry. Over time, heatmaps, trend charts, and streak tracking show you exactly how you spend your focus hours.

**Key features:**

- **Pomodoro timer** with configurable focus/break phases and three display modes (digital, analog, clock)
- **Project & task tracking** — organize work into color-coded projects, assign tasks
- **Analytics dashboard** — heatmaps, trend charts, session breakdowns, weekday analysis
- **Ambient sounds** — rain, white noise, brown noise, cafe (generated via Web Audio API, no files)
- **Templates** — save and switch timer configurations (Classic Pomodoro, Deep Work, Quick Sprint)
- **Streak tracking** — daily goals, streak counting, consistency scoring
- **Offline PWA** — installable, works without internet, all data in IndexedDB
- **Data export** — JSON and CSV export with auto-backup
- **Dark mode** — full theme support via CSS custom properties

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React 18 + TypeScript (strict)                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │  Timer   │   │ Projects │   │  Stats   │  ...pages   │
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
│                                                         │
│  ┌────────────────────────────────────────┐             │
│  │           Dexie.js (IndexedDB)         │             │
│  │  projects │ tasks │ sessions │ streaks │             │
│  │    settings │ templates │ backups      │             │
│  └────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

**Technical choices:**

| Decision | Why |
|---|---|
| Web Worker for timer | `setInterval` on the main thread drifts when the tab is throttled. The worker keeps ticking accurately. |
| IndexedDB over localStorage | localStorage is synchronous and has a 5-10MB quota. IndexedDB is async, unlimited, and supports indexes. |
| Zustand over Context | Timer ticks 60 times/minute. Zustand's selector pattern prevents unnecessary re-renders. |
| CSS variables over Tailwind `dark:` | CSS variables override cleanly via `[data-theme="dark"]`. Tailwind's variant doesn't compose well with dynamic themes. |
| Web Audio API for sounds | No external audio files to download or host. Generated programmatically, works offline. |
| Recharts with custom tooltips | Default Recharts tooltip text inherits bar fill color, making light bars invisible in light mode. Custom HTML tooltips fix this. |

---

## Quick start

```bash
# Clone
git clone https://github.com/user/clockwise.git
cd clockwise

# Install
npm install

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
    layout/       AppShell, Sidebar, BottomNav
    timer/        TimerDisplay, TimerControls, PhaseBadge, FocusingOnBar, TemplateSelector
    projects/     ProjectCard, TaskRow, ProjectForm, TaskForm
    stats/        HeatmapCalendar, FocusTimeChart, SessionsChart, TrendChart, StatCard
    insights/     DaytimeChart, WeekdayChart, FocusDistribution
  hooks/          useTimer, useProjects, useTasks, useSessions, useSettings, useTemplates
  stores/         timerStore (Zustand), uiStore (Zustand + persist)
  db/             schema.ts (Dexie v3), queries/, seed.ts
  workers/        timer.worker.ts (Web Worker)
  lib/            time.ts, phases.ts, stats.ts, sounds.ts, ambient.ts, streaks.ts, exportImport.ts
  types/          index.ts (canonical types)
  pages/          Timer, Statistics, Projects, ProjectDetail, Tasks, History, Streaks, Insights, Templates
public/
  landing.html    Product landing page
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

- Unit tests: `time.ts`, `phases.ts`, `stats.ts`, `streaks.ts`
- Store tests: `timerStore.ts`
- DB query tests: sessions, projects, tasks
- Integration tests: `useTimer` hook with IndexedDB
- Export/import validation tests
- 82 tests across 10 test files

---

## Data storage

Everything is local. No server, no API, no account.

```
Browser
├── IndexedDB (Dexie.js)
│   ├── projects, tasks, sessions, streaks
│   ├── settings, templates
│   └── backups (auto-backup snapshots)
└── localStorage
    └── uiStore (theme, sidebar state)
```

- IndexedDB persists across browser restarts
- Auto-backup saves a full snapshot on every session completion
- Export to JSON or CSV at any time

---

## Technical highlights

**Web Worker timer with drift compensation**
The timer runs in a Web Worker using `setInterval`. The worker sends `'tick'` messages to the main thread, which updates the Zustand store. This keeps the timer accurate even when the tab is throttled (browsers throttle `setInterval` on background tabs to save battery).

**CSS variables in SVG**
Recharts renders inline SVG. CSS custom properties (`var(--color-brand)`) don't resolve inside SVG elements. The chart components detect the current theme via JavaScript and apply hex colors directly to SVG attributes.

**Web Audio API ambient sounds**
Rain, white noise, brown noise, and cafe sounds are generated programmatically using Web Audio API buffers. No external audio files. iOS Safari requires a user interaction before `AudioContext` can play — handled with a first-click unlock. These are currently imperfect but will be improved soon.

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

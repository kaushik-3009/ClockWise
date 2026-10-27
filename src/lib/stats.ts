import { formatDateKey } from './time';
import type { Session } from '@/types';

/**
 * Definitions used everywhere in the app:
 * - Focus time  = duration of every focus session, finished or not (it was real work).
 * - Sessions    = focus sessions; breaks are not counted as sessions of work.
 * - Finished    = focus sessions that ran to the end (not skipped or reset).
 * - Total time  = focus + break time.
 * - Active day  = a calendar day with at least one minute of focus.
 */
export const ACTIVE_DAY_MIN_SECONDS = 60;

export function isFocus(s: Session): boolean {
  return s.type === 'focus';
}

function inRange(s: Session, startMs: number, endMs: number) {
  return s.started_at >= startMs && s.started_at <= endMs;
}

/** Total focus seconds grouped by a key (project_id, task_id, …). */
export function focusSecondsBy(
  sessions: Session[],
  key: (s: Session) => string | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (!isFocus(s)) continue;
    const k = key(s);
    if (k) map.set(k, (map.get(k) ?? 0) + s.duration_seconds);
  }
  return map;
}

/** Number of finished focus sessions grouped by a key. */
export function completedFocusCountBy(
  sessions: Session[],
  key: (s: Session) => string | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (!isFocus(s) || !s.completed) continue;
    const k = key(s);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export interface StatsPeriod {
  focus_seconds: number;
  break_seconds: number;
  total_seconds: number;
  /** Focus sessions started. */
  sessions_started: number;
  /** Focus sessions that ran to the end. */
  sessions_completed: number;
}

export function computePeriodStats(sessions: Session[], start: Date, end: Date): StatsPeriod {
  const startMs = start.getTime();
  const endMs = end.getTime();
  let focus = 0;
  let breaks = 0;
  let started = 0;
  let completed = 0;
  for (const s of sessions) {
    if (!inRange(s, startMs, endMs)) continue;
    if (isFocus(s)) {
      focus += s.duration_seconds;
      started++;
      if (s.completed) completed++;
    } else {
      breaks += s.duration_seconds;
    }
  }
  return {
    focus_seconds: focus,
    break_seconds: breaks,
    total_seconds: focus + breaks,
    sessions_started: started,
    sessions_completed: completed,
  };
}

export function groupSessionsByDay(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = formatDateKey(new Date(s.started_at));
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return map;
}

export function groupFocusSessionsByDay(sessions: Session[]): Map<string, Session[]> {
  return groupSessionsByDay(sessions.filter(isFocus));
}

/** Focus seconds per local calendar day. */
export function focusSecondsByDay(sessions: Session[]): Map<string, number> {
  return focusSecondsBy(sessions, (s) => formatDateKey(new Date(s.started_at)));
}

/**
 * Percentage change from `previous` to `current`. Returns null when there is no
 * baseline (previous = 0), so the UI can say "new" instead of a fake +100%.
 */
export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Start (Monday 00:00) and end (Sunday 23:59:59.999) of the week containing `date`. */
export function weekBounds(date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Total focus seconds for the current calendar week (Mon–Sun). */
export function computeCurrentWeekFocusSeconds(sessions: Session[], now = new Date()): number {
  const { start, end } = weekBounds(now);
  return computePeriodStats(sessions, start, end).focus_seconds;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Weekday with the most focus in the period, or null if there was none. */
export function computeBestDay(
  sessions: Session[],
  start: Date,
  end: Date
): { name: string; seconds: number } | null {
  const totals = WEEKDAYS.map(() => 0);
  for (const s of sessions) {
    if (!isFocus(s) || !inRange(s, start.getTime(), end.getTime())) continue;
    totals[new Date(s.started_at).getDay()] += s.duration_seconds;
  }
  const max = Math.max(...totals);
  if (max === 0) return null;
  return { name: WEEKDAYS[totals.indexOf(max)], seconds: max };
}

/** Calendar days in [start, end], counted by date (correct across DST changes). */
export function countDays(start: Date, end: Date): number {
  if (end < start) return 0;
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  let n = 0;
  for (const d = a; d <= b; d.setDate(d.getDate() + 1)) n++;
  return n;
}

/**
 * Active days and elapsed days in the period. Future days aren't counted, so a
 * period that's still in progress isn't penalised for days that haven't happened.
 */
export function computeConsistency(
  sessions: Session[],
  start: Date,
  end: Date,
  now = new Date()
): { activeDays: number; totalDays: number; pct: number } {
  const effectiveEnd = end > now ? now : end;
  const totalDays = countDays(start, effectiveEnd);
  const byDay = focusSecondsByDay(
    sessions.filter((s) => inRange(s, start.getTime(), effectiveEnd.getTime()))
  );
  const activeDays = [...byDay.values()].filter((sec) => sec >= ACTIVE_DAY_MIN_SECONDS).length;
  return {
    activeDays,
    totalDays,
    pct: totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0,
  };
}

/** Sum of top-N distribution percentages */
export function computeTopNShare(
  distribution: { seconds: number; pct: number }[],
  n: number
): number {
  return distribution.slice(0, n).reduce((sum, item) => sum + item.pct, 0);
}

/** Best calendar month by focus time, e.g. { name: 'March 2026', focusSeconds }. */
export function computeBestMonth(sessions: Session[]): { name: string; focusSeconds: number } {
  const months = new Map<string, number>();
  for (const s of sessions) {
    if (!isFocus(s)) continue;
    const d = new Date(s.started_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.set(key, (months.get(key) ?? 0) + s.duration_seconds);
  }
  let bestKey = '';
  let bestVal = 0;
  for (const [key, val] of months) {
    if (val > bestVal) {
      bestVal = val;
      bestKey = key;
    }
  }
  if (!bestKey) return { name: '—', focusSeconds: 0 };
  const [year, month] = bestKey.split('-').map(Number);
  return {
    name: new Date(year, month - 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    focusSeconds: bestVal,
  };
}

/** Active days vs days elapsed in the current month. */
export function computeActiveDaysThisMonth(
  sessions: Session[],
  now = new Date()
): { active: number; total: number } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const c = computeConsistency(sessions, start, end, now);
  return { active: c.activeDays, total: c.totalDays };
}

/** Heatmap intensity (0-4) for a day's focus time. */
export function getHeatmapIntensityLevel(focusSeconds: number): 0 | 1 | 2 | 3 | 4 {
  const hours = focusSeconds / 3600;
  if (focusSeconds < ACTIVE_DAY_MIN_SECONDS) return 0;
  if (hours < 1) return 1;
  if (hours < 2.5) return 2;
  if (hours < 4) return 3;
  return 4;
}

export const HEATMAP_GREEN = [
  'var(--heatmap-0)',
  'var(--heatmap-1)',
  'var(--heatmap-2)',
  'var(--heatmap-3)',
  'var(--heatmap-4)',
] as const;

export interface DistributionItem {
  key: string;
  name: string;
  color: string;
  seconds: number;
  pct: number;
}

/**
 * Focus time per project in [start, end], largest first. Includes archived
 * projects and buckets for "No project" and deleted projects, so the
 * percentages add up to the real total.
 */
export function projectDistribution(
  sessions: Session[],
  projects: { id: string; name: string; color: string }[],
  start: Date,
  end: Date
): { items: DistributionItem[]; total: number } {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const map = new Map<string, DistributionItem>();
  let total = 0;
  for (const s of sessions) {
    if (!isFocus(s) || !inRange(s, start.getTime(), end.getTime())) continue;
    const project = s.project_id ? byId.get(s.project_id) : undefined;
    const key = s.project_id ? (project ? project.id : 'deleted') : 'none';
    const item = map.get(key) ?? {
      key,
      name: project?.name ?? (key === 'none' ? 'No project' : 'Deleted projects'),
      color: project?.color ?? 'slate',
      seconds: 0,
      pct: 0,
    };
    item.seconds += s.duration_seconds;
    total += s.duration_seconds;
    map.set(key, item);
  }
  const items = [...map.values()]
    .map((i) => ({ ...i, pct: total > 0 ? Math.round((i.seconds / total) * 100) : 0 }))
    .sort((a, b) => b.seconds - a.seconds);
  return { items, total };
}

/** Focus seconds for each of the last `days` days, oldest first. */
export function dailyFocusSeries(
  sessions: Session[],
  days: number,
  now = new Date()
): { date: Date; key: string; focusSeconds: number }[] {
  const byDay = focusSecondsByDay(sessions);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = formatDateKey(d);
    out.push({ date: d, key, focusSeconds: byDay.get(key) ?? 0 });
  }
  return out;
}

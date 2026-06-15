import { formatDateKey } from './time';
import type { Session } from '@/types';

export interface StatsPeriod {
  focus_seconds: number;
  total_seconds: number;
  sessions_started: number;
  sessions_completed: number;
}

export function computePeriodStats(sessions: Session[], start: Date, end: Date): StatsPeriod {
  const startMs = start.getTime();
  const endMs = end.getTime();

  const inRange = sessions.filter((s) => s.started_at >= startMs && s.started_at <= endMs);

  const focus_seconds = inRange
    .filter((s) => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration_seconds, 0);

  const total_seconds = inRange
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.duration_seconds, 0);

  const sessions_started = inRange.length;
  const sessions_completed = inRange.filter((s) => s.completed).length;

  return {
    focus_seconds,
    total_seconds,
    sessions_started,
    sessions_completed,
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
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    if (s.type !== 'focus') continue;
    const key = formatDateKey(new Date(s.started_at));
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return map;
}

export function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/** Compute total focus seconds for the current calendar week (Mon-Sun) */
export function computeCurrentWeekFocusSeconds(sessions: Session[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return sessions
    .filter(
      (s) =>
        s.type === 'focus' && s.started_at >= monday.getTime() && s.started_at <= sunday.getTime()
    )
    .reduce((sum, s) => sum + s.duration_seconds, 0);
}

/** Best weekday in the period — returns { name, seconds } */
export function computeBestDay(
  sessions: Session[],
  start: Date,
  end: Date
): { name: string; seconds: number } {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const stats = days.map(() => 0);

  for (const s of sessions) {
    if (s.type !== 'focus') continue;
    if (s.started_at < startMs || s.started_at > endMs) continue;
    const day = new Date(s.started_at).getDay();
    stats[day] += s.duration_seconds;
  }

  let maxIdx = 0;
  let maxVal = 0;
  for (let i = 0; i < 7; i++) {
    if (stats[i] > maxVal) {
      maxVal = stats[i];
      maxIdx = i;
    }
  }
  return { name: days[maxIdx], seconds: maxVal };
}

/** Active days / total days in period (0-100) */
export function computeConsistency(sessions: Session[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const totalDays = Math.max(Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1, 1);

  const activeDays = new Set<string>();
  for (const s of sessions) {
    if (s.type !== 'focus') continue;
    if (s.started_at < startMs || s.started_at > endMs) continue;
    activeDays.add(formatDateKey(new Date(s.started_at)));
  }

  return Math.round((activeDays.size / totalDays) * 100);
}

/** Sum of top-N distribution percentages */
export function computeTopNShare(
  distribution: { seconds: number; pct: number }[],
  n: number
): number {
  return distribution.slice(0, n).reduce((sum, item) => sum + item.pct, 0);
}

/** Compare current period stats vs previous period of same length */
export function computePeriodDelta(
  sessions: Session[],
  currentStart: Date,
  currentEnd: Date
): { focusSecondsDelta: number; sessionsDelta: number } {
  const length = currentEnd.getTime() - currentStart.getTime();
  const prevStart = new Date(currentStart.getTime() - length);
  const prevEnd = new Date(currentEnd.getTime() - length);

  const currentStats = computePeriodStats(sessions, currentStart, currentEnd);
  const prevStats = computePeriodStats(sessions, prevStart, prevEnd);

  return {
    focusSecondsDelta: deltaPercent(currentStats.focus_seconds, prevStats.focus_seconds),
    sessionsDelta: deltaPercent(currentStats.sessions_completed, prevStats.sessions_completed),
  };
}

/** Best month by total focus time — returns { name, focusSeconds } */
export function computeBestMonth(sessions: Session[]): { name: string; focusSeconds: number } {
  const months = new Map<string, number>();
  for (const s of sessions) {
    if (s.type !== 'focus') continue;
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

  if (!bestKey) return { name: '-', focusSeconds: 0 };
  const [year, month] = bestKey.split('-').map(Number);
  const date = new Date(year, month - 1);
  return { name: date.toLocaleString('default', { month: 'long' }), focusSeconds: bestVal };
}

/** Active days vs total days in current month so far */
export function computeActiveDaysThisMonth(sessions: Session[]): { active: number; total: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const total = now.getDate(); // days elapsed so far

  const byDay = groupFocusSessionsByDay(sessions);
  let active = 0;
  for (const key of byDay.keys()) {
    const [y, m] = key.split('-').map(Number);
    if (y === year && m - 1 === month) {
      active++;
    }
  }

  return { active, total };
}

/** GitHub-style green intensity for heatmap cells (0-4) */
export function getHeatmapIntensityLevel(focusSeconds: number): 0 | 1 | 2 | 3 | 4 {
  const hours = focusSeconds / 3600;
  if (hours === 0) return 0;
  if (hours < 1) return 1;
  if (hours < 2.5) return 2;
  if (hours < 4) return 3;
  return 4;
}

export const HEATMAP_GREEN = [
  'var(--heatmap-0)', // 0 — none
  'var(--heatmap-1)', // 1 — light
  'var(--heatmap-2)', // 2 — medium
  'var(--heatmap-3)', // 3 — heavy
  'var(--heatmap-4)', // 4 — very heavy
] as const;

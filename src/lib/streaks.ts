import { formatDateKey } from './time';
import { ACTIVE_DAY_MIN_SECONDS, focusSecondsByDay } from './stats';
import type { Session } from '@/types';

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from a to b (DST-safe: compares local dates, not ms). */
function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/**
 * Sorted date keys of days with at least a minute of focus. Zero-length or
 * trivially short sessions (e.g. abandoned instantly) don't make a day active.
 */
export function getActiveDays(sessions: Session[]): string[] {
  return [...focusSecondsByDay(sessions)]
    .filter(([, seconds]) => seconds >= ACTIVE_DAY_MIN_SECONDS)
    .map(([key]) => key)
    .sort();
}

/**
 * Consecutive active days ending today — or yesterday, so a streak isn't shown
 * as broken before you've had a chance to focus today. No upper limit.
 */
export function computeCurrentStreak(sessions: Session[], now = new Date()): number {
  const active = new Set(getActiveDays(sessions));
  if (active.size === 0) return 0;

  const check = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!active.has(formatDateKey(check))) {
    check.setDate(check.getDate() - 1);
    if (!active.has(formatDateKey(check))) return 0;
  }

  let streak = 0;
  while (active.has(formatDateKey(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export function computeLongestStreak(sessions: Session[]): number {
  const activeDays = getActiveDays(sessions);
  if (activeDays.length === 0) return 0;

  let maxStreak = 1;
  let current = 1;
  for (let i = 1; i < activeDays.length; i++) {
    if (daysBetween(parseDateKey(activeDays[i - 1]), parseDateKey(activeDays[i])) === 1) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else {
      current = 1;
    }
  }
  return maxStreak;
}

import { formatDateKey } from './time';
import type { Session } from '@/types';

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function getActiveDays(sessions: Session[]): string[] {
  const active = new Set<string>();
  for (const s of sessions) {
    if (s.type !== 'focus') continue;
    active.add(formatDateKey(new Date(s.started_at)));
  }
  return Array.from(active).sort();
}

export function isDayActive(date: string, sessions: Session[]): boolean {
  return getActiveDays(sessions).includes(date);
}

export function computeCurrentStreak(sessions: Session[]): number {
  const activeDays = getActiveDays(sessions);
  if (activeDays.length === 0) return 0;

  const today = formatDateKey(new Date());
  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateKey(yesterdayDate);

  const mostRecentDay = activeDays[activeDays.length - 1];
  if (mostRecentDay !== today && mostRecentDay !== yesterday) {
    return 0;
  }

  let streak = 0;
  const checkDate = mostRecentDay === today ? new Date(todayDate) : new Date(yesterdayDate);

  for (let i = 0; i < 365; i++) {
    const key = formatDateKey(checkDate);
    if (activeDays.includes(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function computeLongestStreak(sessions: Session[]): number {
  const activeDays = getActiveDays(sessions);
  if (activeDays.length === 0) return 0;

  let maxStreak = 0;
  let currentStreak = 1;
  let prevDate = parseDateKey(activeDays[0]);

  for (let i = 1; i < activeDays.length; i++) {
    const date = parseDateKey(activeDays[i]);
    if (daysBetween(prevDate, date) === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
    prevDate = date;
  }

  return Math.max(maxStreak, currentStreak);
}

import { describe, it, expect } from 'vitest';
import { computePeriodStats, groupSessionsByDay, deltaPercent } from '../stats';
import type { Session } from '@/types';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    type: 'focus',
    started_at: Date.now(),
    duration_seconds: 1500,
    phase_number: 1,
    completed: true,
    ...overrides,
  };
}

describe('computePeriodStats', () => {
  const now = new Date('2026-05-31T12:00:00');
  const dayStart = new Date('2026-05-31T00:00:00');
  const dayEnd = new Date('2026-05-31T23:59:59');

  it('sums focus time for completed focus sessions', () => {
    const sessions = [
      makeSession({ started_at: now.getTime(), duration_seconds: 1500, type: 'focus' }),
      makeSession({ started_at: now.getTime(), duration_seconds: 300, type: 'short_break' }),
    ];
    const stats = computePeriodStats(sessions, dayStart, dayEnd);
    expect(stats.focus_seconds).toBe(1500);
    expect(stats.total_seconds).toBe(1800);
    expect(stats.sessions_started).toBe(2);
    expect(stats.sessions_completed).toBe(2);
  });

  it('counts incomplete focus sessions in focus time (intentional work)', () => {
    const sessions = [
      makeSession({
        started_at: now.getTime(),
        duration_seconds: 1500,
        completed: false,
        type: 'focus',
      }),
    ];
    const stats = computePeriodStats(sessions, dayStart, dayEnd);
    expect(stats.focus_seconds).toBe(1500); // focus time counts even if incomplete
    expect(stats.total_seconds).toBe(0); // total only includes completed sessions
    expect(stats.sessions_started).toBe(1);
    expect(stats.sessions_completed).toBe(0);
  });

  it('ignores incomplete break sessions in both focus and total', () => {
    const sessions = [
      makeSession({
        started_at: now.getTime(),
        duration_seconds: 300,
        completed: false,
        type: 'short_break',
      }),
    ];
    const stats = computePeriodStats(sessions, dayStart, dayEnd);
    expect(stats.focus_seconds).toBe(0);
    expect(stats.total_seconds).toBe(0);
    expect(stats.sessions_started).toBe(1);
    expect(stats.sessions_completed).toBe(0);
  });

  it('ignores sessions outside range', () => {
    const sessions = [makeSession({ started_at: new Date('2026-05-30').getTime() })];
    const stats = computePeriodStats(sessions, dayStart, dayEnd);
    expect(stats.sessions_started).toBe(0);
  });
});

describe('groupSessionsByDay', () => {
  it('groups by YYYY-MM-DD', () => {
    const sessions = [
      makeSession({ started_at: new Date('2026-05-31T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-31T14:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-30T10:00:00').getTime() }),
    ];
    const map = groupSessionsByDay(sessions);
    expect(map.get('2026-05-31')).toHaveLength(2);
    expect(map.get('2026-05-30')).toHaveLength(1);
  });
});

describe('deltaPercent', () => {
  it('computes positive delta', () => {
    expect(deltaPercent(150, 100)).toBe(50);
  });

  it('computes negative delta', () => {
    expect(deltaPercent(50, 100)).toBe(-50);
  });

  it('handles zero previous', () => {
    expect(deltaPercent(100, 0)).toBe(100);
    expect(deltaPercent(0, 0)).toBe(0);
  });
});

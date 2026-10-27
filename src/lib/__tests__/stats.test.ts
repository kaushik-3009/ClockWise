import { describe, it, expect } from 'vitest';
import {
  computePeriodStats,
  groupSessionsByDay,
  deltaPercent,
  computeConsistency,
  countDays,
  projectDistribution,
} from '../stats';
import { periodFor, previousPeriod } from '../period';
import type { Session } from '@/types';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    user_id: 'u1',
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

  it('splits focus and break time; total is their sum', () => {
    const stats = computePeriodStats(
      [
        makeSession({ started_at: now.getTime(), duration_seconds: 1500 }),
        makeSession({ started_at: now.getTime(), duration_seconds: 300, type: 'short_break' }),
      ],
      dayStart,
      dayEnd
    );
    expect(stats.focus_seconds).toBe(1500);
    expect(stats.break_seconds).toBe(300);
    expect(stats.total_seconds).toBe(1800);
    // Sessions count focus only.
    expect(stats.sessions_started).toBe(1);
    expect(stats.sessions_completed).toBe(1);
  });

  it('counts unfinished focus time as focus (total can never be below focus)', () => {
    const stats = computePeriodStats(
      [makeSession({ started_at: now.getTime(), completed: false })],
      dayStart,
      dayEnd
    );
    expect(stats.focus_seconds).toBe(1500);
    expect(stats.total_seconds).toBeGreaterThanOrEqual(stats.focus_seconds);
    expect(stats.sessions_completed).toBe(0);
  });

  it('ignores sessions outside range', () => {
    const stats = computePeriodStats(
      [makeSession({ started_at: new Date('2026-05-30').getTime() })],
      dayStart,
      dayEnd
    );
    expect(stats.sessions_started).toBe(0);
  });
});

describe('groupSessionsByDay', () => {
  it('groups by local YYYY-MM-DD', () => {
    const map = groupSessionsByDay([
      makeSession({ started_at: new Date('2026-05-31T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-31T14:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-30T10:00:00').getTime() }),
    ]);
    expect(map.get('2026-05-31')).toHaveLength(2);
    expect(map.get('2026-05-30')).toHaveLength(1);
  });
});

describe('deltaPercent', () => {
  it('computes changes', () => {
    expect(deltaPercent(150, 100)).toBe(50);
    expect(deltaPercent(50, 100)).toBe(-50);
  });
  it('returns null when there is no baseline instead of a fake +100%', () => {
    expect(deltaPercent(100, 0)).toBeNull();
    expect(deltaPercent(0, 0)).toBe(0);
  });
});

describe('computeConsistency', () => {
  it('a perfect week is 100%', () => {
    const { start, end } = periodFor('week', new Date('2026-03-04T12:00:00'));
    const sessions = Array.from({ length: 7 }, (_, i) =>
      makeSession({ started_at: new Date(2026, 2, 2 + i, 10).getTime() })
    );
    expect(computeConsistency(sessions, start, end, new Date('2026-04-01')).pct).toBe(100);
  });

  it('does not count future days in an in-progress period', () => {
    const { start, end } = periodFor('week', new Date('2026-03-04T12:00:00'));
    const sessions = [0, 1, 2].map((i) =>
      makeSession({ started_at: new Date(2026, 2, 2 + i, 10).getTime() })
    );
    const c = computeConsistency(sessions, start, end, new Date('2026-03-04T18:00:00'));
    expect(c.totalDays).toBe(3);
    expect(c.pct).toBe(100);
  });

  it('ignores trivially short focus', () => {
    const { start, end } = periodFor('day', new Date('2026-03-04T12:00:00'));
    const c = computeConsistency(
      [makeSession({ started_at: new Date(2026, 2, 4, 10).getTime(), duration_seconds: 5 })],
      start,
      end,
      new Date('2026-03-05')
    );
    expect(c.activeDays).toBe(0);
  });
});

describe('countDays', () => {
  it('counts calendar days across a DST change', () => {
    expect(countDays(new Date(2026, 2, 1), new Date(2026, 2, 31, 23, 59))).toBe(31);
    expect(countDays(new Date(2026, 9, 1), new Date(2026, 9, 31, 23, 59))).toBe(31);
  });
});

describe('previousPeriod', () => {
  it('compares a full past month with the full previous calendar month', () => {
    const march = periodFor('month', new Date(2026, 2, 15));
    const prev = previousPeriod('month', march, new Date(2026, 5, 1));
    expect(prev.start).toEqual(new Date(2026, 1, 1));
    expect(prev.end.getMonth()).toBe(1);
    expect(prev.end.getDate()).toBe(28);
  });

  it('compares an in-progress week with the same elapsed time last week', () => {
    const now = new Date('2026-03-04T12:00:00'); // Wednesday noon
    const week = periodFor('week', now);
    const prev = previousPeriod('week', week, now);
    expect(prev.start).toEqual(new Date(2026, 1, 23));
    expect(prev.end.getTime()).toBe(new Date('2026-02-25T12:00:00').getTime());
  });

  it('month navigation from the 31st does not skip a month', () => {
    const p = periodFor('month', new Date(2026, 2, 31));
    expect(p.start).toEqual(new Date(2026, 2, 1));
  });
});

describe('projectDistribution', () => {
  it('includes no-project and deleted-project time so percentages add up', () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 2);
    const t = new Date(2026, 0, 1, 10).getTime();
    const { items, total } = projectDistribution(
      [
        makeSession({ started_at: t, project_id: 'p1', duration_seconds: 600 }),
        makeSession({ started_at: t, duration_seconds: 300 }),
        makeSession({ started_at: t, project_id: 'gone', duration_seconds: 100 }),
      ],
      [{ id: 'p1', name: 'P', color: 'blue' }],
      start,
      end
    );
    expect(total).toBe(1000);
    expect(items.map((i) => i.name)).toEqual(['P', 'No project', 'Deleted projects']);
  });
});

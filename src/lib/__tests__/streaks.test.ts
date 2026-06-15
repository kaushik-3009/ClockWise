import { describe, it, expect, vi } from 'vitest';
import { computeCurrentStreak, computeLongestStreak, getActiveDays } from '../streaks';
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

describe('getActiveDays', () => {
  it('returns unique sorted date keys for focus sessions', () => {
    const now = new Date('2026-05-31T12:00:00');
    const sessions = [
      makeSession({ started_at: now.getTime() }),
      makeSession({ started_at: now.getTime() + 3600000 }),
      makeSession({ started_at: new Date('2026-05-30T10:00:00').getTime() }),
      makeSession({ type: 'short_break', started_at: new Date('2026-05-29T10:00:00').getTime() }),
    ];
    const days = getActiveDays(sessions);
    expect(days).toEqual(['2026-05-30', '2026-05-31']);
  });
});

describe('computeCurrentStreak', () => {
  it('returns 0 when there are no sessions', () => {
    expect(computeCurrentStreak([])).toBe(0);
  });

  it('counts streak ending today', () => {
    const today = new Date('2026-05-31T12:00:00');
    vi.setSystemTime(today);
    const sessions = [
      makeSession({ started_at: new Date('2026-05-31T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-30T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-29T10:00:00').getTime() }),
    ];
    expect(computeCurrentStreak(sessions)).toBe(3);
    vi.useRealTimers();
  });

  it('counts streak ending yesterday when today is empty', () => {
    const today = new Date('2026-05-31T12:00:00');
    vi.setSystemTime(today);
    const sessions = [
      makeSession({ started_at: new Date('2026-05-30T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-29T10:00:00').getTime() }),
    ];
    expect(computeCurrentStreak(sessions)).toBe(2);
    vi.useRealTimers();
  });

  it('returns 0 when last session was before yesterday', () => {
    const today = new Date('2026-05-31T12:00:00');
    vi.setSystemTime(today);
    const sessions = [makeSession({ started_at: new Date('2026-05-28T10:00:00').getTime() })];
    expect(computeCurrentStreak(sessions)).toBe(0);
    vi.useRealTimers();
  });
});

describe('computeLongestStreak', () => {
  it('returns 0 when there are no sessions', () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  it('finds longest consecutive streak', () => {
    const sessions = [
      makeSession({ started_at: new Date('2026-05-25T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-26T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-27T10:00:00').getTime() }),
      makeSession({ started_at: new Date('2026-05-29T10:00:00').getTime() }),
    ];
    expect(computeLongestStreak(sessions)).toBe(3);
  });
});

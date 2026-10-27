import { describe, it, expect, beforeEach } from 'vitest';
import { useTimerStore, initialTimerData, isFreshSession, MIN_RECORD_SECONDS } from '../timerStore';
import { DEFAULT_SETTINGS } from '@/db/queries/settings';
import type { TimerSettings } from '@/types';

const MIN = 60_000;
const T0 = 1_700_000_000_000;

const store = () => useTimerStore.getState();

function setup(overrides: Partial<TimerSettings> = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...overrides };
  useTimerStore.setState({ ...initialTimerData(settings), owner_uid: 'u1' });
}

describe('timerStore', () => {
  beforeEach(() => setup());

  it('starts idle on a 25-minute focus phase', () => {
    const s = store();
    expect(s.status).toBe('idle');
    expect(s.phase_number).toBe(1);
    expect(s.phase_type).toBe('focus');
    expect(s.remaining_seconds).toBe(1500);
    expect(isFreshSession(s)).toBe(true);
  });

  it('computes remaining time from the wall clock, not from tick count', () => {
    store().play(T0);
    // A single tick 10 minutes later (e.g. the app was frozen in the background).
    store().tick(T0 + 10 * MIN);
    expect(store().remaining_seconds).toBe(15 * 60);
    expect(store().elapsed_seconds).toBe(10 * 60);
  });

  it('pausing freezes the remaining time across long gaps', () => {
    store().play(T0);
    store().pause(T0 + 5 * MIN);
    store().tick(T0 + 60 * MIN);
    expect(store().status).toBe('paused');
    expect(store().remaining_seconds).toBe(20 * 60);
    store().play(T0 + 60 * MIN);
    store().tick(T0 + 61 * MIN);
    expect(store().remaining_seconds).toBe(19 * 60);
  });

  it('completes a phase at its exact end time and records it', () => {
    store().setContext('p1', 't1');
    store().play(T0);
    const fx = store().tick(T0 + 26 * MIN);
    expect(fx.finished).toEqual(['focus']);
    expect(fx.records).toHaveLength(1);
    expect(fx.records[0]).toMatchObject({
      type: 'focus',
      started_at: T0,
      ended_at: T0 + 25 * MIN,
      duration_seconds: 1500,
      completed: true,
      project_id: 'p1',
      task_id: 't1',
    });
    // Without auto-start the break waits for the user.
    expect(store().status).toBe('idle');
    expect(store().phase_type).toBe('short_break');
    expect(store().remaining_seconds).toBe(300);
  });

  it('catches up over several phases after the app was suspended (auto-start)', () => {
    setup({ auto_start: true });
    store().play(T0);
    // Phone locked for 62 minutes: F 0–25, S 25–30, F 30–55, S 55–60, then 2 min into F.
    const fx = store().tick(T0 + 62 * MIN);
    expect(fx.records.map((r) => r.type)).toEqual(['focus', 'short_break', 'focus', 'short_break']);
    expect(fx.records[1].started_at).toBe(T0 + 25 * MIN);
    expect(fx.records[2].ended_at).toBe(T0 + 55 * MIN);
    expect(store().status).toBe('running');
    expect(store().phase_number).toBe(5);
    expect(store().remaining_seconds).toBe(23 * 60);
    expect(store().session_focus_seconds).toBe(50 * 60);
  });

  it('starting again after a finished session begins with focus, not a break', () => {
    setup({ phases_per_session: 2 });
    store().play(T0);
    store().tick(T0 + 25 * MIN);
    store().play(T0 + 25 * MIN);
    const fx = store().tick(T0 + 31 * MIN);
    expect(fx.sessionComplete).toBe(true);
    expect(store().status).toBe('session_complete');

    store().play(T0 + 40 * MIN);
    expect(store().status).toBe('running');
    expect(store().phase_number).toBe(1);
    expect(store().phase_type).toBe('focus');
    expect(store().session_focus_seconds).toBe(0);
  });

  it('skip records a partial focus as unfinished, and ignores very short ones', () => {
    store().play(T0);
    let fx = store().skip(T0 + 3_000);
    expect(fx.records).toHaveLength(0);
    expect(store().phase_type).toBe('short_break');

    setup();
    store().play(T0);
    fx = store().skip(T0 + 10 * MIN);
    expect(fx.records).toHaveLength(1);
    expect(fx.records[0]).toMatchObject({ completed: false, duration_seconds: 600 });
    expect(fx.finished).toHaveLength(0);
  });

  it('reset keeps partial focus time and returns to a fresh session', () => {
    store().setContext('p1');
    store().play(T0);
    const fx = store().reset(T0 + (MIN_RECORD_SECONDS + 30) * 1000);
    expect(fx.records).toHaveLength(1);
    expect(fx.records[0].completed).toBe(false);
    expect(isFreshSession(store())).toBe(true);
    expect(store().active_project_id).toBe('p1');
  });

  it('settings changes mid-session do not corrupt the running plan', () => {
    store().play(T0);
    store().tick(T0 + 25 * MIN); // now idle on phase 2 of 8
    store().setSettings({ ...DEFAULT_SETTINGS, phases_per_session: 1, focus_minutes: 50 });
    expect(store().total_phases).toBe(8);
    expect(store().phase_number).toBe(2);
    // Advancing still works (used to throw a TypeError).
    expect(() => store().skip(T0 + 26 * MIN)).not.toThrow();
    expect(store().phase_number).toBe(3);
    expect(store().phase_duration_seconds).toBe(25 * 60);
  });

  it('settings changes apply immediately when nothing has started', () => {
    store().setSettings({ ...DEFAULT_SETTINGS, focus_minutes: 50, phases_per_session: 4 });
    expect(store().remaining_seconds).toBe(50 * 60);
    expect(store().total_phases).toBe(4);
  });

  it('warns once when crossing the warning threshold', () => {
    store().play(T0);
    expect(store().tick(T0 + 23 * MIN).warn).toBe(false);
    expect(store().tick(T0 + 24 * MIN + 1000).warn).toBe(true);
    expect(store().tick(T0 + 24 * MIN + 2000).warn).toBe(false);
  });

  it('a different account starts with a fresh timer', () => {
    store().setContext('p1');
    store().play(T0);
    store().resetForUser('u2');
    expect(store().owner_uid).toBe('u2');
    expect(store().status).toBe('idle');
    expect(store().active_project_id).toBeUndefined();
  });
});

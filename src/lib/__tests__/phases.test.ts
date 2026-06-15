import { describe, it, expect } from 'vitest';
import { buildPhaseSequence, getPhaseAtIndex } from '../phases';
import type { TimerSettings } from '@/types';

const DEFAULT_SETTINGS: TimerSettings = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  phases_per_session: 8,
  long_break_after_n: 4,
  auto_start: false,
  sound_enabled: true,
  notifications_enabled: false,
  timer_style: 'digital',
  accent_color: '#E8521A',
  ambient_sound: 'off',
  ambient_volume: 0.3,
  weekly_goal_hours: 20,
  warn_before_seconds: 60,
};

describe('buildPhaseSequence', () => {
  it('builds standard 8-phase sequence with long break after 4', () => {
    const phases = buildPhaseSequence(DEFAULT_SETTINGS);
    expect(phases).toHaveLength(8);
    expect(phases.map((p) => p.type)).toEqual([
      'focus',
      'short_break',
      'focus',
      'short_break',
      'focus',
      'short_break',
      'focus',
      'long_break',
    ]);
    expect(phases.map((p) => p.duration_minutes)).toEqual([25, 5, 25, 5, 25, 5, 25, 15]);
  });

  it('builds 4-phase sequence with long break after 2', () => {
    const settings: TimerSettings = {
      ...DEFAULT_SETTINGS,
      phases_per_session: 4,
      long_break_after_n: 2,
    };
    const phases = buildPhaseSequence(settings);
    expect(phases).toHaveLength(4);
    expect(phases.map((p) => p.type)).toEqual(['focus', 'short_break', 'focus', 'long_break']);
  });

  it('respects odd phase counts by truncating at limit', () => {
    const settings: TimerSettings = {
      ...DEFAULT_SETTINGS,
      phases_per_session: 3,
      long_break_after_n: 4,
    };
    const phases = buildPhaseSequence(settings);
    expect(phases).toHaveLength(3);
    expect(phases.map((p) => p.type)).toEqual(['focus', 'short_break', 'focus']);
  });
});

describe('getPhaseAtIndex', () => {
  it('returns correct phase by index', () => {
    expect(getPhaseAtIndex(DEFAULT_SETTINGS, 0).type).toBe('focus');
    expect(getPhaseAtIndex(DEFAULT_SETTINGS, 1).type).toBe('short_break');
    expect(getPhaseAtIndex(DEFAULT_SETTINGS, 7).type).toBe('long_break');
  });

  it('returns focus fallback for out of bounds', () => {
    expect(getPhaseAtIndex(DEFAULT_SETTINGS, -1).type).toBe('focus');
    expect(getPhaseAtIndex(DEFAULT_SETTINGS, 99).type).toBe('focus');
  });
});

import type { TimerSettings } from '@/types';

export const DEFAULT_SETTINGS: TimerSettings = {
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

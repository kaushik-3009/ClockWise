import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect } from 'react';
import { db } from '@/db/schema';
import type { TimerSettings } from '@/types';
import { useTimerStore } from '@/stores/timerStore';

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

export function useSettings() {
  const stored = useLiveQuery(() => db.settings.get(1), []);

  const settings = stored ?? DEFAULT_SETTINGS;

  // Sync loaded settings into timer store and apply accent color
  useEffect(() => {
    if (stored) {
      useTimerStore.getState().setSettings(stored);
      if (/^#[0-9a-fA-F]{6}$/.test(stored.accent_color)) {
        document.documentElement.style.setProperty('--color-brand', stored.accent_color);
      }
    }
  }, [stored]);

  const saveSettings = useCallback(
    async (partial: Partial<TimerSettings>) => {
      const next = { ...settings, ...partial };
      await db.settings.put({ ...next, id: 1 });
      useTimerStore.getState().setSettings(partial);
    },
    [settings]
  );

  return {
    settings,
    saveSettings,
  };
}

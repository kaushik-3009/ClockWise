import { describe, it, expect } from 'vitest';
import { importData } from '../exportImport';
import type { ExportData } from '@/types';

const TEST_USER_ID = 'test-user-1';

describe('importData validation', () => {
  it('rejects data with invalid version', async () => {
    const data = {
      version: 99,
      exported_at: new Date().toISOString(),
      projects: [],
      tasks: [],
      sessions: [],
      streaks: [],
      settings: null,
    };

    await expect(importData(TEST_USER_ID, data as unknown as ExportData)).rejects.toThrow(
      'Unsupported export version'
    );
  });

  it('rejects data with invalid project color', async () => {
    const data: ExportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      projects: [
        {
          id: 'proj-1',
          user_id: TEST_USER_ID,
          name: 'Bad',
          color: 'rainbow' as unknown as 'blue',
          status: 'active',
          created_at: Date.now(),
        },
      ],
      tasks: [],
      sessions: [],
      streaks: [],
      settings: null,
    };

    await expect(importData(TEST_USER_ID, data)).rejects.toThrow('Invalid project.color');
  });

  it('rejects data with invalid accent_color format', async () => {
    const data: ExportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      projects: [],
      tasks: [],
      sessions: [],
      streaks: [],
      settings: {
        focus_minutes: 25,
        short_break_minutes: 5,
        long_break_minutes: 15,
        phases_per_session: 8,
        long_break_after_n: 4,
        auto_start: false,
        sound_enabled: true,
        notifications_enabled: false,
        timer_style: 'digital',
        accent_color: 'not-a-color',
        ambient_sound: 'off',
        ambient_volume: 0.3,
        weekly_goal_hours: 20,
        warn_before_seconds: 60,
      },
    };

    await expect(importData(TEST_USER_ID, data)).rejects.toThrow('Invalid settings.accent_color');
  });

  it('rejects session with negative duration', async () => {
    const data: ExportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      projects: [],
      tasks: [],
      sessions: [
        {
          id: 'sess-1',
          user_id: TEST_USER_ID,
          type: 'focus',
          started_at: Date.now(),
          duration_seconds: -100,
          phase_number: 1,
          completed: false,
        },
      ],
      streaks: [],
      settings: null,
    };

    await expect(importData(TEST_USER_ID, data)).rejects.toThrow(
      'Invalid session.duration_seconds'
    );
  });
});

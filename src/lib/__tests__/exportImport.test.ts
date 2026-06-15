import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/schema';
import { exportData, importData } from '../exportImport';
import type { ExportData } from '@/types';

describe('exportImport', () => {
  beforeEach(async () => {
    await db.projects.clear();
    await db.tasks.clear();
    await db.sessions.clear();
    await db.streaks.clear();
    await db.settings.clear();
  });

  describe('exportData', () => {
    it('exports empty data when tables are empty', async () => {
      const data = await exportData();
      expect(data.version).toBe(1);
      expect(data.exported_at).toBeDefined();
      expect(data.projects).toEqual([]);
      expect(data.tasks).toEqual([]);
      expect(data.sessions).toEqual([]);
      expect(data.streaks).toEqual([]);
    });

    it('exports all entities', async () => {
      await db.projects.add({
        id: 'proj-1',
        name: 'Test',
        color: 'blue',
        status: 'active',
        created_at: Date.now(),
      });
      await db.tasks.add({
        id: 'task-1',
        project_id: 'proj-1',
        name: 'Task',
        is_completed: false,
        created_at: Date.now(),
      });
      await db.sessions.add({
        id: 'sess-1',
        project_id: 'proj-1',
        task_id: 'task-1',
        type: 'focus',
        started_at: Date.now(),
        duration_seconds: 1500,
        phase_number: 1,
        completed: true,
      });

      const data = await exportData();
      expect(data.projects).toHaveLength(1);
      expect(data.tasks).toHaveLength(1);
      expect(data.sessions).toHaveLength(1);
    });
  });

  describe('importData', () => {
    it('imports valid data', async () => {
      const now = Date.now();
      const data: ExportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        projects: [
          { id: 'proj-1', name: 'Imported', color: 'green', status: 'active', created_at: now },
        ],
        tasks: [
          {
            id: 'task-1',
            project_id: 'proj-1',
            name: 'Imported Task',
            is_completed: false,
            created_at: now,
          },
        ],
        sessions: [
          {
            id: 'sess-1',
            project_id: 'proj-1',
            task_id: 'task-1',
            type: 'focus',
            started_at: now,
            duration_seconds: 1500,
            phase_number: 1,
            completed: true,
          },
        ],
        streaks: [
          {
            date: '2024-01-01',
            focus_seconds: 1500,
            sessions_started: 1,
            sessions_completed: 1,
            goal_met: true,
          },
        ],
        settings: null,
      };

      await importData(data);

      const projects = await db.projects.toArray();
      const tasks = await db.tasks.toArray();
      const sessions = await db.sessions.toArray();
      const streaks = await db.streaks.toArray();

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Imported');
      expect(tasks).toHaveLength(1);
      expect(sessions).toHaveLength(1);
      expect(streaks).toHaveLength(1);
    });

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

      await expect(importData(data as unknown as ExportData)).rejects.toThrow(
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

      await expect(importData(data)).rejects.toThrow('Invalid project.color');
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

      await expect(importData(data)).rejects.toThrow('Invalid settings.accent_color');
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

      await expect(importData(data)).rejects.toThrow('Invalid session.duration_seconds');
    });
  });
});

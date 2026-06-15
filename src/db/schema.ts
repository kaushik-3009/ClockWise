import Dexie, { type Table } from 'dexie';
import type {
  Project,
  Task,
  Session,
  DailyStreak,
  TimerSettings,
  TimerTemplate,
  BackupRecord,
} from '../types';

export class FocusDB extends Dexie {
  projects!: Table<Project, string>;
  tasks!: Table<Task, string>;
  sessions!: Table<Session, string>;
  streaks!: Table<DailyStreak, string>;
  settings!: Table<TimerSettings & { id: 1 }, number>;
  templates!: Table<TimerTemplate, string>;
  backups!: Table<BackupRecord, string>;

  constructor() {
    super('ClockWise');
    this.version(1).stores({
      projects: 'id, status, created_at',
      tasks: 'id, project_id, is_completed, created_at',
      sessions: 'id, project_id, task_id, started_at, type, completed',
      streaks: 'date',
      settings: 'id',
    });
    // v2 adds templates table. Settings fields (timer_style, accent_color, etc.)
    // are auto-merged by Dexie because settings is an object store — new keys
    // are added when the object is next written via put/update.
    this.version(2).stores({
      templates: 'id, name, created_at',
    });
    // v3 adds backups table for local auto-backups (avoids localStorage quota).
    this.version(3).stores({
      backups: 'id, created_at',
    });
  }
}

export const db = new FocusDB();

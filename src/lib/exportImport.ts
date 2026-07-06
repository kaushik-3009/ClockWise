import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { getAutoBackup, saveAutoBackup } from '@/db/queries/backups';
import { DEFAULT_SETTINGS } from '@/db/queries/settings';
import type {
  ExportData,
  Project,
  Task,
  Session,
  DailyStreak,
  TimerSettings,
  ProjectColor,
  PhaseType,
} from '@/types';

const PROJECT_COLORS: ProjectColor[] = [
  'blue',
  'teal',
  'green',
  'purple',
  'orange',
  'red',
  'yellow',
  'slate',
];
const PHASE_TYPES: PhaseType[] = ['focus', 'short_break', 'long_break'];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || isNumber(value);
}

function isProjectColor(value: unknown): value is ProjectColor {
  return isString(value) && PROJECT_COLORS.includes(value as ProjectColor);
}

function isPhaseType(value: unknown): value is PhaseType {
  return isString(value) && PHASE_TYPES.includes(value as PhaseType);
}

function validateProject(value: unknown): Project {
  if (!isPlainObject(value)) throw new Error('Invalid project: expected object');
  const { id, user_id, name, description, color, status, created_at } = value;
  if (!isString(id)) throw new Error('Invalid project.id');
  if (!isString(user_id)) throw new Error('Invalid project.user_id');
  if (!isString(name)) throw new Error('Invalid project.name');
  if (!isOptionalString(description)) throw new Error('Invalid project.description');
  if (!isProjectColor(color)) throw new Error('Invalid project.color');
  if (status !== 'active' && status !== 'archived') throw new Error('Invalid project.status');
  if (!isNumber(created_at)) throw new Error('Invalid project.created_at');
  return { id, user_id, name, description, color, status, created_at };
}

function validateTask(value: unknown): Task {
  if (!isPlainObject(value)) throw new Error('Invalid task: expected object');
  const {
    id,
    user_id,
    project_id,
    name,
    is_completed,
    created_at,
    priority,
    note,
    estimated_pomodoros,
  } = value;
  if (!isString(id)) throw new Error('Invalid task.id');
  if (!isString(user_id)) throw new Error('Invalid task.user_id');
  if (!isOptionalString(project_id)) throw new Error('Invalid task.project_id');
  if (!isString(name)) throw new Error('Invalid task.name');
  if (!isBoolean(is_completed)) throw new Error('Invalid task.is_completed');
  if (!isNumber(created_at)) throw new Error('Invalid task.created_at');
  if (
    priority !== undefined &&
    priority !== 'low' &&
    priority !== 'medium' &&
    priority !== 'high'
  ) {
    throw new Error('Invalid task.priority');
  }
  if (!isOptionalString(note)) throw new Error('Invalid task.note');
  if (!isOptionalNumber(estimated_pomodoros)) throw new Error('Invalid task.estimated_pomodoros');
  return {
    id,
    user_id,
    project_id,
    name,
    is_completed,
    created_at,
    priority,
    note,
    estimated_pomodoros,
  };
}

function validateSession(value: unknown): Session {
  if (!isPlainObject(value)) throw new Error('Invalid session: expected object');
  const {
    id,
    user_id,
    project_id,
    task_id,
    type,
    started_at,
    ended_at,
    duration_seconds,
    phase_number,
    completed,
    note,
  } = value;
  if (!isString(id)) throw new Error('Invalid session.id');
  if (!isString(user_id)) throw new Error('Invalid session.user_id');
  if (!isOptionalString(project_id)) throw new Error('Invalid session.project_id');
  if (!isOptionalString(task_id)) throw new Error('Invalid session.task_id');
  if (!isPhaseType(type)) throw new Error('Invalid session.type');
  if (!isNumber(started_at)) throw new Error('Invalid session.started_at');
  if (!isOptionalNumber(ended_at)) throw new Error('Invalid session.ended_at');
  if (!isNumber(duration_seconds) || duration_seconds < 0)
    throw new Error('Invalid session.duration_seconds');
  if (!isNumber(phase_number) || phase_number < 1) throw new Error('Invalid session.phase_number');
  if (!isBoolean(completed)) throw new Error('Invalid session.completed');
  if (!isOptionalString(note)) throw new Error('Invalid session.note');
  return {
    id,
    user_id,
    project_id,
    task_id,
    type,
    started_at,
    ended_at,
    duration_seconds,
    phase_number,
    completed,
    note,
  };
}

function validateDailyStreak(value: unknown): DailyStreak {
  if (!isPlainObject(value)) throw new Error('Invalid streak: expected object');
  const { user_id, date, focus_seconds, sessions_started, sessions_completed, goal_met } = value;
  if (!isString(user_id)) throw new Error('Invalid streak.user_id');
  if (!isString(date)) throw new Error('Invalid streak.date');
  if (!isNumber(focus_seconds) || focus_seconds < 0)
    throw new Error('Invalid streak.focus_seconds');
  if (!isNumber(sessions_started) || sessions_started < 0)
    throw new Error('Invalid streak.sessions_started');
  if (!isNumber(sessions_completed) || sessions_completed < 0)
    throw new Error('Invalid streak.sessions_completed');
  if (!isBoolean(goal_met)) throw new Error('Invalid streak.goal_met');
  return { user_id, date, focus_seconds, sessions_started, sessions_completed, goal_met };
}

function validateTimerSettings(value: unknown): TimerSettings & { id?: 1 } {
  if (!isPlainObject(value)) throw new Error('Invalid settings: expected object');
  const {
    focus_minutes,
    short_break_minutes,
    long_break_minutes,
    phases_per_session,
    long_break_after_n,
    auto_start,
    sound_enabled,
    notifications_enabled,
    timer_style,
    accent_color,
    ambient_sound,
    ambient_volume,
    weekly_goal_hours,
    warn_before_seconds,
  } = value;

  const validTimerStyle = (v: unknown): v is 'digital' | 'clock_numeric' | 'analog' =>
    v === 'digital' || v === 'clock_numeric' || v === 'analog';
  const validAmbient = (v: unknown): v is 'off' | 'rain' | 'white' | 'brown' | 'cafe' =>
    v === 'off' || v === 'rain' || v === 'white' || v === 'brown' || v === 'cafe';

  if (!isNumber(focus_minutes) || focus_minutes < 1)
    throw new Error('Invalid settings.focus_minutes');
  if (!isNumber(short_break_minutes) || short_break_minutes < 1)
    throw new Error('Invalid settings.short_break_minutes');
  if (!isNumber(long_break_minutes) || long_break_minutes < 1)
    throw new Error('Invalid settings.long_break_minutes');
  if (!isNumber(phases_per_session) || phases_per_session < 1)
    throw new Error('Invalid settings.phases_per_session');
  if (!isNumber(long_break_after_n) || long_break_after_n < 1)
    throw new Error('Invalid settings.long_break_after_n');
  if (!isBoolean(auto_start)) throw new Error('Invalid settings.auto_start');
  if (!isBoolean(sound_enabled)) throw new Error('Invalid settings.sound_enabled');
  if (!isBoolean(notifications_enabled)) throw new Error('Invalid settings.notifications_enabled');
  if (!validTimerStyle(timer_style)) throw new Error('Invalid settings.timer_style');
  if (!isString(accent_color) || !/^#[0-9a-fA-F]{6}$/.test(accent_color))
    throw new Error('Invalid settings.accent_color: must be a 6-digit hex color');
  if (!validAmbient(ambient_sound)) throw new Error('Invalid settings.ambient_sound');
  if (!isNumber(ambient_volume) || ambient_volume < 0 || ambient_volume > 1)
    throw new Error('Invalid settings.ambient_volume');
  if (!isNumber(weekly_goal_hours) || weekly_goal_hours < 0)
    throw new Error('Invalid settings.weekly_goal_hours');
  if (!isNumber(warn_before_seconds) || warn_before_seconds < 0)
    throw new Error('Invalid settings.warn_before_seconds');

  return {
    focus_minutes,
    short_break_minutes,
    long_break_minutes,
    phases_per_session,
    long_break_after_n,
    auto_start,
    sound_enabled,
    notifications_enabled,
    timer_style,
    accent_color,
    ambient_sound,
    ambient_volume,
    weekly_goal_hours,
    warn_before_seconds,
  };
}

function validateExportData(value: unknown): ExportData {
  if (!isPlainObject(value)) throw new Error('Invalid export: expected object');
  if (value.version !== 1) throw new Error(`Unsupported export version: ${value.version}`);
  if (!isString(value.exported_at)) throw new Error('Invalid export.exported_at');

  const { projects, tasks, sessions, streaks, settings } = value;
  if (!Array.isArray(projects)) throw new Error('Invalid export.projects');
  if (!Array.isArray(tasks)) throw new Error('Invalid export.tasks');
  if (!Array.isArray(sessions)) throw new Error('Invalid export.sessions');
  if (!Array.isArray(streaks)) throw new Error('Invalid export.streaks');
  if (settings !== null && !isPlainObject(settings)) throw new Error('Invalid export.settings');

  return {
    version: 1,
    exported_at: value.exported_at,
    projects: projects.map(validateProject),
    tasks: tasks.map(validateTask),
    sessions: sessions.map(validateSession),
    streaks: streaks.map(validateDailyStreak),
    settings: settings === null ? null : validateTimerSettings(settings),
  };
}

export async function exportData(userId: string): Promise<ExportData> {
  const db = getFirebaseFirestore();
  const [projectsSnap, tasksSnap, sessionsSnap, streaksSnap, settingsSnap] = await Promise.all([
    getDocs(collection(db, 'users', userId, 'projects')),
    getDocs(collection(db, 'users', userId, 'tasks')),
    getDocs(collection(db, 'users', userId, 'sessions')),
    getDocs(collection(db, 'users', userId, 'streaks')),
    getDocs(collection(db, 'users', userId, 'settings')),
  ]);

  const projects = projectsSnap.docs.map((d) => ({ ...(d.data() as Project), id: d.id }));
  const tasks = tasksSnap.docs.map((d) => ({ ...(d.data() as Task), id: d.id }));
  const sessions = sessionsSnap.docs.map((d) => ({ ...(d.data() as Session), id: d.id }));
  const streaks = streaksSnap.docs.map((d) => ({ ...(d.data() as DailyStreak), date: d.id }));
  const settingsDoc = settingsSnap.docs[0];
  const settings = settingsDoc ? (settingsDoc.data() as TimerSettings) : DEFAULT_SETTINGS;

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    projects,
    tasks,
    sessions,
    streaks,
    settings,
  };
}

export function downloadExport(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clockwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildSessionsCSV(sessions: Session[]): string {
  const rows = [
    [
      'ID',
      'User ID',
      'Project ID',
      'Task ID',
      'Type',
      'Started At',
      'Ended At',
      'Duration (seconds)',
      'Phase Number',
      'Completed',
    ],
  ];
  for (const s of sessions) {
    rows.push([
      escapeCSV(s.id),
      escapeCSV(s.user_id),
      escapeCSV(s.project_id),
      escapeCSV(s.task_id),
      escapeCSV(s.type),
      escapeCSV(s.started_at ? new Date(s.started_at).toISOString() : ''),
      escapeCSV(s.ended_at ? new Date(s.ended_at).toISOString() : ''),
      escapeCSV(s.duration_seconds),
      escapeCSV(s.phase_number),
      escapeCSV(s.completed),
    ]);
  }
  return rows.map((r) => r.join(',')).join('\n');
}

export function downloadCSVExport(data: ExportData): void {
  const csv = buildSessionsCSV(data.sessions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clockwise-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { getAutoBackup };

export async function autoBackup(): Promise<void> {
  // Auto-backup is redundant with Firestore persistence.
}

export async function importData(userId: string, data: ExportData): Promise<void> {
  const validated = validateExportData(data);
  const db = getFirebaseFirestore();

  // Normalize user_id to the current user so imports from other accounts still
  // belong to the signed-in user.
  const withUser = <T extends { user_id: string }>(item: T): T => ({ ...item, user_id: userId });

  const projectCol = collection(db, 'users', userId, 'projects');
  const taskCol = collection(db, 'users', userId, 'tasks');
  const sessionCol = collection(db, 'users', userId, 'sessions');
  const streakCol = collection(db, 'users', userId, 'streaks');

  // Build all operations, then commit in batches of 500 (Firestore limit)
  const ops: Array<{ ref: ReturnType<typeof doc>; data: unknown }> = [];
  validated.projects.forEach((p) => ops.push({ ref: doc(projectCol, p.id), data: withUser(p) }));
  validated.tasks.forEach((t) => ops.push({ ref: doc(taskCol, t.id), data: withUser(t) }));
  validated.sessions.forEach((s) => ops.push({ ref: doc(sessionCol, s.id), data: withUser(s) }));
  validated.streaks.forEach((st) => ops.push({ ref: doc(streakCol, st.date), data: withUser(st) }));

  const BATCH_LIMIT = 500;
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const chunk = ops.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((op) => batch.set(op.ref, op.data));
    await batch.commit();
  }

  if (validated.settings) {
    await setDoc(doc(db, 'users', userId, 'settings', 'default'), validated.settings);
  }

  await saveAutoBackup(validated);
}

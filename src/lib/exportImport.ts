import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { stripUndefined } from '@/db/clean';
import {
  isValidId,
  normalizeSettings,
  parseProject,
  parseSession,
  parseTask,
  parseTemplate,
} from '@/db/parse';
import type { ExportData, Project, Session, Task, TimerTemplate } from '@/types';

/** Imports larger than this are almost certainly not a ClockWise export. */
export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

export interface ImportSummary {
  projects: number;
  tasks: number;
  sessions: number;
  templates: number;
  skipped: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseList<T>(
  value: unknown,
  label: string,
  parse: (id: string, data: unknown) => T | null,
  counter: { skipped: number }
): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`Invalid export: "${label}" must be a list`);
  const out: T[] = [];
  for (const item of value) {
    const id = isPlainObject(item) ? item.id : undefined;
    const parsed = isValidId(id) ? parse(id, item) : null;
    if (parsed) out.push(parsed);
    else counter.skipped++;
  }
  return out;
}

/** Validate an untrusted export file. Invalid records are skipped, not fatal. */
export function validateExportData(value: unknown): { data: ExportData; skipped: number } {
  if (!isPlainObject(value)) throw new Error('Invalid export: expected a JSON object');
  if (value.version !== 1) throw new Error(`Unsupported export version: ${String(value.version)}`);

  const counter = { skipped: 0 };
  const data: ExportData = {
    version: 1,
    exported_at: typeof value.exported_at === 'string' ? value.exported_at : '',
    projects: parseList(value.projects, 'projects', parseProject, counter),
    tasks: parseList(value.tasks, 'tasks', parseTask, counter),
    sessions: parseList(value.sessions, 'sessions', parseSession, counter),
    templates: parseList(value.templates, 'templates', parseTemplate, counter),
    settings: isPlainObject(value.settings) ? normalizeSettings(value.settings) : null,
  };
  return { data, skipped: counter.skipped };
}

export async function exportData(userId: string): Promise<ExportData> {
  const db = getFirebaseFirestore();
  const col = (name: string) => getDocs(collection(db, 'users', userId, name));
  const [projectsSnap, tasksSnap, sessionsSnap, templatesSnap, settingsSnap] = await Promise.all([
    col('projects'),
    col('tasks'),
    col('sessions'),
    col('templates'),
    col('settings'),
  ]);

  const settingsDoc = settingsSnap.docs.find((d) => d.id === 'default') ?? settingsSnap.docs[0];
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    projects: projectsSnap.docs.flatMap((d) => parseProject(d.id, d.data()) ?? []),
    tasks: tasksSnap.docs.flatMap((d) => parseTask(d.id, d.data()) ?? []),
    sessions: sessionsSnap.docs.flatMap((d) => parseSession(d.id, d.data()) ?? []),
    templates: templatesSnap.docs.flatMap((d) => parseTemplate(d.id, d.data()) ?? []),
    settings: normalizeSettings(settingsDoc?.data()),
  };
}

function download(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

export function downloadExport(data: ExportData): void {
  download(JSON.stringify(data, null, 2), 'application/json', `clockwise-backup-${today()}.json`);
}

/**
 * Quote a CSV cell. Cells starting with = + - @ (or tab/CR) are prefixed with a
 * quote so spreadsheet apps treat them as text, not formulas (CSV injection).
 */
export function escapeCSV(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '';
  let str = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const PHASE_LABEL: Record<Session['type'], string> = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
};

export function buildSessionsCSV(sessions: Session[], projects: Project[], tasks: Task[]): string {
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const taskName = new Map(tasks.map((t) => [t.id, t.name]));
  const header = [
    'Started At',
    'Ended At',
    'Type',
    'Project',
    'Task',
    'Duration (minutes)',
    'Completed',
    'Note',
    'Session ID',
  ];
  const rows = [...sessions]
    .sort((a, b) => a.started_at - b.started_at)
    .map((s) =>
      [
        new Date(s.started_at).toISOString(),
        s.ended_at ? new Date(s.ended_at).toISOString() : '',
        PHASE_LABEL[s.type],
        s.project_id ? (projectName.get(s.project_id) ?? 'Deleted project') : '',
        s.task_id ? (taskName.get(s.task_id) ?? 'Deleted task') : '',
        Math.round((s.duration_seconds / 60) * 10) / 10,
        s.completed ? 'yes' : 'no',
        s.note ?? '',
        s.id,
      ]
        .map(escapeCSV)
        .join(',')
    );
  return [header.join(','), ...rows].join('\n');
}

export function downloadCSVExport(data: ExportData): void {
  download(
    buildSessionsCSV(data.sessions, data.projects, data.tasks),
    'text/csv;charset=utf-8;',
    `clockwise-sessions-${today()}.csv`
  );
}

/**
 * Write a validated export into the user's account. Documents keep their ids,
 * so re-running an import (e.g. after a network failure part-way) is idempotent.
 */
export async function importData(userId: string, raw: unknown): Promise<ImportSummary> {
  const { data, skipped } = validateExportData(raw);
  const db = getFirebaseFirestore();
  const col = (name: string) => collection(db, 'users', userId, name);
  const withUser = <T extends { user_id: string }>(item: T): T =>
    stripUndefined({ ...item, user_id: userId });

  const ops: Array<{ ref: ReturnType<typeof doc>; data: object }> = [];
  data.projects.forEach((p) => ops.push({ ref: doc(col('projects'), p.id), data: withUser(p) }));
  data.tasks.forEach((t) => ops.push({ ref: doc(col('tasks'), t.id), data: withUser(t) }));
  data.sessions.forEach((s) => ops.push({ ref: doc(col('sessions'), s.id), data: withUser(s) }));
  (data.templates ?? []).forEach((t: TimerTemplate) =>
    ops.push({ ref: doc(col('templates'), t.id), data: withUser(t) })
  );

  const BATCH_LIMIT = 450;
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_LIMIT).forEach((op) => batch.set(op.ref, op.data));
    await batch.commit();
  }

  if (data.settings) {
    await setDoc(doc(db, 'users', userId, 'settings', 'default'), data.settings);
  }

  return {
    projects: data.projects.length,
    tasks: data.tasks.length,
    sessions: data.sessions.length,
    templates: data.templates?.length ?? 0,
    skipped,
  };
}

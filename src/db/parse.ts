// Runtime parsing for anything that comes out of Firestore or an import file.
// Documents are user-writable, so never trust their shape: malformed fields are
// dropped or defaulted instead of crashing a page.
import { DEFAULT_SETTINGS } from '@/db/queries/settings';
import type {
  PhaseType,
  Project,
  ProjectColor,
  Session,
  Task,
  TimerSettings,
  TimerTemplate,
} from '@/types';

type Raw = Record<string, unknown>;

export const PROJECT_COLOR_KEYS: ProjectColor[] = [
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

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = num(v);
  return n === undefined ? fallback : clamp(Math.round(n), min, max);
}

/** IDs become Firestore path segments, so they must be non-empty and slash-free. */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= 128 && !id.includes('/');
}

export function parseProject(id: string, data: unknown): Project | null {
  if (!isObj(data)) return null;
  const name = str(data.name);
  if (!name) return null;
  const color = str(data.color) as ProjectColor | undefined;
  return {
    id,
    user_id: str(data.user_id) ?? '',
    name: name.slice(0, 120),
    description: str(data.description)?.slice(0, 250) || undefined,
    color: color && PROJECT_COLOR_KEYS.includes(color) ? color : 'blue',
    status: data.status === 'archived' ? 'archived' : 'active',
    created_at: num(data.created_at) ?? 0,
  };
}

export function parseTask(id: string, data: unknown): Task | null {
  if (!isObj(data)) return null;
  const name = str(data.name);
  if (!name) return null;
  const priority = data.priority;
  const estimate = num(data.estimated_pomodoros);
  return {
    id,
    user_id: str(data.user_id) ?? '',
    project_id: str(data.project_id) || undefined,
    name: name.slice(0, 120),
    is_completed: bool(data.is_completed) ?? false,
    created_at: num(data.created_at) ?? 0,
    priority:
      priority === 'low' || priority === 'medium' || priority === 'high' ? priority : undefined,
    note: str(data.note)?.slice(0, 500) || undefined,
    estimated_pomodoros: estimate && estimate > 0 ? Math.min(99, Math.round(estimate)) : undefined,
  };
}

export function parseSession(id: string, data: unknown): Session | null {
  if (!isObj(data)) return null;
  const type = str(data.type) as PhaseType | undefined;
  const started_at = num(data.started_at);
  if (!type || !PHASE_TYPES.includes(type) || started_at === undefined) return null;
  const ended_at = num(data.ended_at);
  return {
    id,
    user_id: str(data.user_id) ?? '',
    project_id: str(data.project_id) || undefined,
    task_id: str(data.task_id) || undefined,
    type,
    started_at,
    ended_at: ended_at !== undefined && ended_at >= started_at ? ended_at : undefined,
    duration_seconds: clamp(Math.round(num(data.duration_seconds) ?? 0), 0, 86_400),
    phase_number: clamp(Math.round(num(data.phase_number) ?? 1), 1, 100),
    completed: bool(data.completed) ?? false,
    note: str(data.note)?.slice(0, 500) || undefined,
  };
}

export function parseTemplate(id: string, data: unknown): TimerTemplate | null {
  if (!isObj(data)) return null;
  const name = str(data.name);
  if (!name) return null;
  const d = DEFAULT_SETTINGS;
  return {
    id,
    user_id: str(data.user_id) ?? '',
    name,
    focus_minutes: clampInt(data.focus_minutes, 1, 180, d.focus_minutes),
    short_break_minutes: clampInt(data.short_break_minutes, 1, 60, d.short_break_minutes),
    long_break_minutes: clampInt(data.long_break_minutes, 1, 120, d.long_break_minutes),
    phases_per_session: clampInt(data.phases_per_session, 1, 24, d.phases_per_session),
    long_break_after_n: clampInt(data.long_break_after_n, 1, 12, d.long_break_after_n),
    created_at: num(data.created_at) ?? 0,
  };
}

const TIMER_STYLES = ['digital', 'clock_numeric', 'analog'] as const;
const AMBIENT = ['off', 'rain', 'white', 'brown', 'cafe'] as const;

/**
 * Merge a (possibly partial or older) settings document over the defaults and
 * clamp every value into a sane range. Used on read, on save and on import, so
 * a bad value can never reach the timer.
 */
export function normalizeSettings(data: unknown): TimerSettings {
  const d = DEFAULT_SETTINGS;
  const s: Raw = isObj(data) ? data : {};
  const timerStyle = s.timer_style as (typeof TIMER_STYLES)[number];
  const ambient = s.ambient_sound as (typeof AMBIENT)[number];
  const accent = str(s.accent_color);
  return {
    focus_minutes: clampInt(s.focus_minutes, 1, 180, d.focus_minutes),
    short_break_minutes: clampInt(s.short_break_minutes, 1, 60, d.short_break_minutes),
    long_break_minutes: clampInt(s.long_break_minutes, 1, 120, d.long_break_minutes),
    phases_per_session: clampInt(s.phases_per_session, 1, 24, d.phases_per_session),
    long_break_after_n: clampInt(s.long_break_after_n, 1, 12, d.long_break_after_n),
    auto_start: bool(s.auto_start) ?? d.auto_start,
    sound_enabled: bool(s.sound_enabled) ?? d.sound_enabled,
    notifications_enabled: bool(s.notifications_enabled) ?? d.notifications_enabled,
    keep_screen_awake: bool(s.keep_screen_awake) ?? d.keep_screen_awake,
    keyboard_shortcuts: bool(s.keyboard_shortcuts) ?? d.keyboard_shortcuts,
    timer_style: TIMER_STYLES.includes(timerStyle) ? timerStyle : d.timer_style,
    accent_color: accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : d.accent_color,
    ambient_sound: AMBIENT.includes(ambient) ? ambient : d.ambient_sound,
    ambient_volume: clamp(num(s.ambient_volume) ?? d.ambient_volume, 0, 1),
    weekly_goal_hours: clamp(num(s.weekly_goal_hours) ?? d.weekly_goal_hours, 0, 168),
    warn_before_seconds: clampInt(s.warn_before_seconds, 0, 600, d.warn_before_seconds),
  };
}

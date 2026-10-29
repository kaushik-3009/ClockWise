import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PhaseType, TimerSettings, TimerStatus } from '@/types';
import { buildPhaseSequence, type Phase } from '@/lib/phases';
import { DEFAULT_SETTINGS } from '@/db/queries/settings';

/**
 * The timer is driven by wall-clock timestamps, never by counting ticks.
 *
 * While running we store `running_since` (epoch ms) plus `accumulated_ms` from
 * earlier runs of the same phase; elapsed time is always recomputed from
 * Date.now(). iOS freezes JavaScript when a PWA is backgrounded or the phone
 * locks — when it resumes, the next tick() catches up, completing (and, with
 * auto-start, chaining) every phase that ended in the meantime at the exact time
 * it ended.
 *
 * Actions take `now` explicitly and return the side effects they produced
 * (finished phases to record, sounds to play) instead of performing them, so the
 * store stays pure and testable. lib/timerController.ts applies the effects.
 */

/** A phase that ended and should be written to the user's history. */
export interface PhaseRecord {
  type: PhaseType;
  phase_number: number;
  started_at: number;
  ended_at: number;
  duration_seconds: number;
  completed: boolean;
  project_id?: string;
  task_id?: string;
}

export interface TimerEffects {
  records: PhaseRecord[];
  /** Phases that ran to the end (not skipped/reset) — these chime and notify. */
  finished: PhaseType[];
  /** When the most recent of `finished` ended (to skip stale chimes after a long absence). */
  lastFinishedAt: number | null;
  sessionComplete: boolean;
  warn: boolean;
}

/** Partial phases shorter than this aren't worth a history entry. */
export const MIN_RECORD_SECONDS = 60;

export interface TimerData {
  status: TimerStatus;
  /** Phase sequence, fixed when the session starts so settings edits can't corrupt it. */
  plan: Phase[];
  phase_number: number;
  phase_type: PhaseType;
  total_phases: number;
  phase_duration_seconds: number;
  accumulated_ms: number;
  running_since: number | null;
  phase_started_at: number | null;
  remaining_seconds: number;
  elapsed_seconds: number;
  session_focus_seconds: number;
  /** Phases passed in this session (finished, skipped or reset). */
  session_phases_completed: number;
  /** Phases that ran to the end in this session. */
  session_phases_finished: number;
  /** What the user has selected in the "I'm focusing on" picker. */
  active_project_id?: string;
  active_task_id?: string;
  /**
   * What the current stretch of this phase is being recorded against. Captured
   * when the phase starts (or adopted if nothing was selected yet), so switching
   * project mid-phase can't move time that was already spent on another one.
   */
  rec_project_id?: string;
  rec_task_id?: string;
  /** Elapsed ms of this phase already written out by a mid-phase project switch. */
  segment_offset_ms: number;
  /** When the phase was paused (its real end if it's then skipped or reset). */
  paused_at: number | null;
  /** The account this timer belongs to; a different sign-in starts fresh. */
  owner_uid: string | null;
  warned: boolean;
  clock_now: number;
  settings: TimerSettings;
}

interface TimerActions {
  play: (now: number) => TimerEffects;
  pause: (now: number) => TimerEffects;
  tick: (now: number) => TimerEffects;
  skip: (now: number) => TimerEffects;
  reset: (now: number) => TimerEffects;
  setContext: (
    projectId: string | undefined,
    taskId: string | undefined,
    now: number
  ) => TimerEffects;
  setSettings: (settings: TimerSettings) => void;
  resetForUser: (uid: string | null) => void;
}

export type TimerStore = TimerData & TimerActions;

const noEffects = (): TimerEffects => ({
  records: [],
  finished: [],
  lastFinishedAt: null,
  sessionComplete: false,
  warn: false,
});

function phaseFields(plan: Phase[], index: number, startAt: number | null) {
  const phase = plan[index] ?? plan[0];
  const duration = phase.duration_minutes * 60;
  return {
    phase_number: index + 1,
    phase_type: phase.type,
    total_phases: plan.length,
    phase_duration_seconds: duration,
    accumulated_ms: 0,
    running_since: startAt,
    phase_started_at: startAt,
    segment_offset_ms: 0,
    paused_at: null,
    remaining_seconds: duration,
    elapsed_seconds: 0,
    warned: false,
  };
}

function freshSession(settings: TimerSettings, startAt: number | null) {
  const plan = buildPhaseSequence(settings);
  return {
    status: (startAt === null ? 'idle' : 'running') as TimerStatus,
    plan,
    session_focus_seconds: 0,
    session_phases_completed: 0,
    session_phases_finished: 0,
    ...phaseFields(plan, 0, startAt),
  };
}

export function elapsedMs(s: TimerData, now: number): number {
  const live = s.running_since === null ? 0 : Math.max(0, now - s.running_since);
  return s.accumulated_ms + live;
}

/** True when nothing has happened in the current session yet. */
export function isFreshSession(s: TimerData): boolean {
  return (
    s.status === 'idle' &&
    s.phase_number === 1 &&
    s.accumulated_ms === 0 &&
    s.running_since === null &&
    s.session_phases_completed === 0
  );
}

function derived(s: TimerData, now: number) {
  if (s.status === 'session_complete') {
    return { elapsed_seconds: s.phase_duration_seconds, remaining_seconds: 0, clock_now: now };
  }
  const el = Math.min(elapsedMs(s, now), s.phase_duration_seconds * 1000);
  return {
    elapsed_seconds: Math.floor(el / 1000),
    remaining_seconds: Math.max(0, Math.ceil((s.phase_duration_seconds * 1000 - el) / 1000)),
    clock_now: now,
  };
}

function makeRecord(s: TimerData, endedAt: number, seconds: number, completed: boolean) {
  const focus = s.phase_type === 'focus';
  return {
    type: s.phase_type,
    phase_number: s.phase_number,
    started_at: s.phase_started_at ?? endedAt - seconds * 1000,
    ended_at: endedAt,
    duration_seconds: seconds,
    completed,
    // Breaks aren't work on a project.
    project_id: focus ? s.rec_project_id : undefined,
    task_id: focus ? s.rec_task_id : undefined,
  } satisfies PhaseRecord;
}

/** Seconds of the current phase not yet written out (after any mid-phase split). */
function unrecordedSeconds(s: TimerData, now: number): number {
  return Math.floor(Math.max(0, elapsedMs(s, now) - s.segment_offset_ms) / 1000);
}

/** Record context for a phase that's starting now. */
function startContext(s: TimerData) {
  return { rec_project_id: s.active_project_id, rec_task_id: s.active_task_id };
}

/** Close the current phase at `at` and move to the next one (or finish the session). */
function advance(s: TimerData, at: number, focusSeconds: number, finished: boolean): TimerData {
  const session_focus_seconds =
    s.session_focus_seconds + (s.phase_type === 'focus' ? focusSeconds : 0);
  const session_phases_completed = s.session_phases_completed + 1;
  const session_phases_finished = s.session_phases_finished + (finished ? 1 : 0);
  const nextIndex = s.phase_number; // phase_number is 1-based

  if (nextIndex >= s.plan.length) {
    return {
      ...s,
      status: 'session_complete',
      session_focus_seconds,
      session_phases_completed,
      session_phases_finished,
      running_since: null,
      accumulated_ms: 0,
      remaining_seconds: 0,
      elapsed_seconds: 0,
    };
  }

  const autoStart = s.settings.auto_start;
  return {
    ...s,
    session_focus_seconds,
    session_phases_completed,
    session_phases_finished,
    status: autoStart ? 'running' : 'idle',
    ...phaseFields(s.plan, nextIndex, autoStart ? at : null),
    ...(autoStart ? startContext(s) : {}),
  };
}

const STATUSES: TimerStatus[] = ['idle', 'running', 'paused', 'session_complete'];
const isCount = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isTime = (v: unknown) => v === null || isCount(v);

/** A saved timer from localStorage is only restored if its core fields make sense. */
function looksValid(p: Partial<TimerData>): boolean {
  return (
    Array.isArray(p.plan) &&
    p.plan.length > 0 &&
    p.plan.every(
      (ph) =>
        ph &&
        (ph.type === 'focus' || ph.type === 'short_break' || ph.type === 'long_break') &&
        isCount(ph.duration_minutes) &&
        ph.duration_minutes > 0
    ) &&
    STATUSES.includes(p.status as TimerStatus) &&
    Number.isInteger(p.phase_number) &&
    p.phase_number! >= 1 &&
    p.phase_number! <= p.plan.length &&
    isCount(p.phase_duration_seconds) &&
    isCount(p.accumulated_ms) &&
    isTime(p.running_since) &&
    isTime(p.phase_started_at) &&
    isCount(p.session_focus_seconds) &&
    isCount(p.session_phases_completed)
  );
}

export const initialTimerData = (settings: TimerSettings = DEFAULT_SETTINGS): TimerData => ({
  ...freshSession(settings, null),
  active_project_id: undefined,
  active_task_id: undefined,
  rec_project_id: undefined,
  rec_task_id: undefined,
  owner_uid: null,
  clock_now: Date.now(),
  settings,
});

const OPTIONAL_IDS = [
  'active_project_id',
  'active_task_id',
  'rec_project_id',
  'rec_task_id',
] as const;

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      ...initialTimerData(),

      play: (now) => {
        const s = get();
        if (s.status === 'running') return noEffects();
        if (s.status === 'session_complete') {
          // "Start new session" — always begins with a focus phase.
          set({ ...freshSession(s.settings, now), ...startContext(s), clock_now: now });
          return noEffects();
        }
        const starting = s.phase_started_at === null;
        set({
          status: 'running',
          running_since: now,
          phase_started_at: s.phase_started_at ?? now,
          paused_at: null,
          ...(starting ? startContext(s) : {}),
          clock_now: now,
        });
        return noEffects();
      },

      pause: (now) => {
        const s = get();
        if (s.status !== 'running' || s.running_since === null) return noEffects();
        // Catch up first, in case the phase already ended while we were frozen.
        const fx = get().tick(now);
        const after = get();
        if (after.status !== 'running' || after.running_since === null) return fx;
        set({
          status: 'paused',
          paused_at: now,
          accumulated_ms: elapsedMs(after, now),
          running_since: null,
          ...derived({ ...after, accumulated_ms: elapsedMs(after, now), running_since: null }, now),
        });
        return fx;
      },

      tick: (now) => {
        let s: TimerData = get();
        const fx = noEffects();
        // Complete every phase that has ended since the last tick. Bounded so a
        // corrupted clock can never spin forever.
        for (
          let guard = 0;
          guard < 100 && s.status === 'running' && s.running_since !== null;
          guard++
        ) {
          const durationMs = s.phase_duration_seconds * 1000;
          if (elapsedMs(s, now) < durationMs) break;
          const endedAt = s.running_since + (durationMs - s.accumulated_ms);
          const seconds = s.phase_duration_seconds - Math.floor(s.segment_offset_ms / 1000);
          fx.records.push(makeRecord(s, endedAt, seconds, true));
          fx.finished.push(s.phase_type);
          fx.lastFinishedAt = endedAt;
          s = advance(s, endedAt, s.phase_duration_seconds, true);
          if (s.status === 'session_complete') fx.sessionComplete = true;
        }

        const next = { ...s, ...derived(s, now) };
        const warnAt = next.settings.warn_before_seconds;
        if (
          next.status === 'running' &&
          !next.warned &&
          warnAt > 0 &&
          next.phase_duration_seconds > warnAt &&
          next.remaining_seconds > 0 &&
          next.remaining_seconds <= warnAt
        ) {
          next.warned = true;
          fx.warn = true;
        }
        set(next);
        return fx;
      },

      skip: (now) => {
        const fx = get().tick(now);
        const s = get();
        if (s.status === 'session_complete') return fx;
        if (s.status === 'idle' && s.phase_number === 1 && s.accumulated_ms === 0) return fx;

        // A paused phase really ended when it was paused, not now.
        const endedAt = s.status === 'paused' && s.paused_at !== null ? s.paused_at : now;
        const seconds = unrecordedSeconds(s, now);
        const kept = seconds >= MIN_RECORD_SECONDS;
        if (kept) fx.records.push(makeRecord(s, endedAt, seconds, false));
        const focusSoFar = Math.floor(s.segment_offset_ms / 1000) + (kept ? seconds : 0);
        const next = advance(s, now, focusSoFar, false);
        if (next.status === 'session_complete') fx.sessionComplete = true;
        set({ ...next, ...derived(next, now) });
        return fx;
      },

      reset: (now) => {
        const fx = get().tick(now);
        const s = get();
        if (s.status === 'running' || s.status === 'paused') {
          const endedAt = s.status === 'paused' && s.paused_at !== null ? s.paused_at : now;
          const seconds = unrecordedSeconds(s, now);
          // Keep partial focus time — abandoning a phase shouldn't erase real work.
          if (seconds >= MIN_RECORD_SECONDS)
            fx.records.push(makeRecord(s, endedAt, seconds, false));
        }
        set({ ...freshSession(s.settings, null), clock_now: now });
        return fx;
      },

      setContext: (projectId, taskId, now) => {
        const fx = get().tick(now);
        const s = get();
        const update: Partial<TimerData> = { active_project_id: projectId, active_task_id: taskId };
        const inPhase =
          (s.status === 'running' || s.status === 'paused') && s.phase_started_at !== null;
        const changed = s.rec_project_id !== projectId || s.rec_task_id !== taskId;
        if (inPhase && changed) {
          if (s.rec_project_id === undefined && s.rec_task_id === undefined) {
            // Started without choosing anything: the whole phase counts for the choice.
            update.rec_project_id = projectId;
            update.rec_task_id = taskId;
          } else {
            // Switching mid-phase: write the time so far to the previous choice.
            const seconds = unrecordedSeconds(s, now);
            if (s.phase_type === 'focus' && seconds >= MIN_RECORD_SECONDS) {
              const endedAt = s.status === 'paused' && s.paused_at !== null ? s.paused_at : now;
              fx.records.push(makeRecord(s, endedAt, seconds, false));
              update.segment_offset_ms = elapsedMs(s, now);
              update.phase_started_at = s.status === 'paused' ? null : now;
              // session_focus_seconds is added when the phase ends (it includes the offset).
            }
            update.rec_project_id = projectId;
            update.rec_task_id = taskId;
          }
        }
        set(update);
        return fx;
      },

      setSettings: (settings) => {
        const s = get();
        if (isFreshSession(s)) {
          set({ settings, ...freshSession(settings, null) });
        } else {
          // Mid-session: the current plan stays as it was; changes apply to the next session.
          set({ settings });
        }
      },

      resetForUser: (uid) => {
        if (get().owner_uid === uid) return;
        set({ ...initialTimerData(get().settings), owner_uid: uid });
      },
    }),
    {
      name: 'clockwise-timer-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // Derived, per-second values aren't saved: they're recomputed from the
        // timestamps, and leaving them out means storage only changes on real
        // state changes (which is what other open tabs sync on).
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { settings, clock_now, remaining_seconds, elapsed_seconds, ...rest } = s;
        const out = Object.fromEntries(
          Object.entries(rest).filter(([, v]) => typeof v !== 'function')
        ) as Record<string, unknown>;
        // JSON drops undefined, and a missing key would keep the other tab's old
        // value on merge — store "nothing selected" explicitly as null.
        for (const k of OPTIONAL_IDS) out[k] = s[k] ?? null;
        return out as Partial<TimerData>;
      },
      // Drop anything that doesn't look like a valid saved timer.
      merge: (persisted, current) => {
        const p = persisted as Partial<TimerData> | undefined;
        if (!p || !looksValid(p)) return current;
        const merged = { ...current, ...p, settings: current.settings } as TimerStore;
        for (const k of OPTIONAL_IDS) merged[k] = merged[k] ?? undefined;
        merged.segment_offset_ms ??= 0;
        merged.paused_at ??= null;
        merged.total_phases = merged.plan.length;
        merged.session_phases_finished ??= merged.session_phases_completed ?? 0;
        return { ...merged, ...derived(merged, Date.now()) };
      },
    }
  )
);

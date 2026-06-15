import { create } from 'zustand';
import type { TimerState, TimerSettings } from '@/types';
import { buildPhaseSequence } from '@/lib/phases';

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

interface TimerActions {
  play: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  advancePhase: () => void;
  setContext: (projectId?: string, taskId?: string) => void;
  setSettings: (s: Partial<TimerSettings>) => void;
  setActiveSessionId: (id?: string) => void;
}

function getInitialState(settings: TimerSettings): Omit<TimerState, 'settings'> {
  return {
    status: 'idle',
    phase_type: 'focus',
    phase_number: 1,
    total_phases: settings.phases_per_session,
    remaining_seconds: settings.focus_minutes * 60,
    elapsed_seconds: 0,
    active_project_id: undefined,
    active_task_id: undefined,
    active_session_id: undefined,
  };
}

export const useTimerStore = create<TimerState & TimerActions>((set, get) => ({
  ...getInitialState(DEFAULT_SETTINGS),
  settings: DEFAULT_SETTINGS,

  play: () => {
    const { status } = get();
    if (status === 'running') return;
    if (status === 'phase_complete' || status === 'session_complete') {
      // If session finished, reset first then play
      if (status === 'session_complete') {
        get().reset();
      }
      get().advancePhase();
      // advancePhase handles auto_start; if it set idle, we force running here
      if (get().status === 'idle') {
        set({ status: 'running' });
      }
      return;
    }
    set({ status: 'running' });
  },

  pause: () => {
    const { status } = get();
    if (status !== 'running') return;
    set({ status: 'paused' });
  },

  reset: () => {
    const { settings, active_project_id, active_task_id } = get();
    set({
      ...getInitialState(settings),
      settings,
      active_project_id,
      active_task_id,
    });
  },

  setActiveSessionId: (id) => {
    set({ active_session_id: id });
  },

  skip: () => {
    const { status } = get();
    if (status === 'idle' || status === 'session_complete') return;
    get().advancePhase();
  },

  tick: () => {
    const { remaining_seconds, status } = get();
    if (status !== 'running') return;
    if (remaining_seconds <= 1) {
      set((s) => ({
        remaining_seconds: 0,
        elapsed_seconds: s.elapsed_seconds + 1,
        status: 'phase_complete',
      }));
    } else {
      set((s) => ({
        remaining_seconds: s.remaining_seconds - 1,
        elapsed_seconds: s.elapsed_seconds + 1,
      }));
    }
  },

  advancePhase: () => {
    const { phase_number, total_phases, settings } = get();
    const nextPhaseNumber = phase_number + 1;

    if (nextPhaseNumber > total_phases) {
      set({ status: 'session_complete', phase_number: nextPhaseNumber });
      return;
    }

    const sequence = buildPhaseSequence(settings);
    const nextPhase = sequence[nextPhaseNumber - 1];
    const newStatus = settings.auto_start ? 'running' : 'idle';

    set({
      status: newStatus,
      phase_type: nextPhase.type,
      phase_number: nextPhaseNumber,
      remaining_seconds: nextPhase.duration_minutes * 60,
      elapsed_seconds: 0,
    });
  },

  setContext: (projectId, taskId) => {
    set({ active_project_id: projectId, active_task_id: taskId });
  },

  setSettings: (partial) => {
    const current = get().settings;
    const next = { ...current, ...partial };
    set({ settings: next });
    // If idle, also update the current phase duration to match new settings
    const { status } = get();
    if (status === 'idle') {
      set({
        total_phases: next.phases_per_session,
        remaining_seconds: next.focus_minutes * 60,
      });
    }
  },
}));

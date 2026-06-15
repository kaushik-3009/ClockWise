import { useEffect, useRef, useCallback } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { createSession, updateSession, deleteSession } from '@/db/queries/sessions';
import {
  playClickSound,
  playSkipSound,
  playResetSound,
  playTimerCompleteSound,
  playWarningSound,
} from '@/lib/sounds';
import { notifyPhaseComplete, notifySessionComplete } from '@/lib/notifications';
import { autoBackup } from '@/lib/exportImport';
import { playAmbient, stopAmbient } from '@/lib/ambient';
import type { TimerState } from '@/types';

type TimerStoreState = TimerState & {
  play: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  advancePhase: () => void;
  setContext: (projectId?: string, taskId?: string) => void;
  setActiveSessionId: (id?: string) => void;
};

export function useTimer() {
  const {
    status,
    phase_type,
    phase_number,
    total_phases,
    remaining_seconds,
    elapsed_seconds,
    active_project_id,
    active_task_id,
    active_session_id,
    settings,
    play: playAction,
    pause: pauseAction,
    reset: resetAction,
    skip: skipAction,
    tick,
    setContext: setContextAction,
  } = useTimerStore() as TimerStoreState;
  const workerRef = useRef<Worker | null>(null);

  // Create worker once
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/timer.worker.ts', import.meta.url));
    workerRef.current.onmessage = (e: MessageEvent) => {
      if (e.data === 'tick') {
        tick();
      }
    };
    workerRef.current.onerror = (err) => {
      console.error('Timer worker error:', err);
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [tick]);

  // Sync worker with store status
  useEffect(() => {
    if (status === 'running') {
      workerRef.current?.postMessage('start');
    } else {
      workerRef.current?.postMessage('stop');
    }
  }, [status]);

  // Create session when entering running without one
  useEffect(() => {
    if (status !== 'running' || active_session_id) return;

    const state = useTimerStore.getState();
    createSession({
      project_id: state.active_project_id,
      task_id: state.active_task_id,
      type: state.phase_type,
      started_at: Date.now(),
      duration_seconds: 0,
      phase_number: state.phase_number,
      completed: false,
    })
      .then((session) => {
        useTimerStore.getState().setActiveSessionId(session.id);
      })
      .catch((err) => {
        console.error('[useTimer] Failed to create session:', err);
      });
  }, [status, active_session_id]);

  // Complete session on phase_complete and advance
  useEffect(() => {
    if (status !== 'phase_complete') return;

    const completeAndAdvance = async () => {
      const state = useTimerStore.getState();
      const soundEnabled = state.settings.sound_enabled;
      const notificationsEnabled = state.settings.notifications_enabled;

      if (state.active_session_id) {
        try {
          await updateSession(state.active_session_id, {
            completed: true,
            ended_at: Date.now(),
            duration_seconds: state.elapsed_seconds,
          });
        } catch (err) {
          console.error('[useTimer] Failed to complete session:', err);
        }
        useTimerStore.getState().setActiveSessionId(undefined);
      }

      playTimerCompleteSound(soundEnabled);

      if (notificationsEnabled) {
        notifyPhaseComplete(state.phase_type);
      }

      // Auto-backup on session completion
      autoBackup().catch(() => {});

      useTimerStore.getState().advancePhase();
    };

    completeAndAdvance();
  }, [status]);

  // Auto-start next phase if enabled
  useEffect(() => {
    if (status !== 'idle') return;
    const state = useTimerStore.getState();
    if (!state.settings.auto_start) return;
    if (state.phase_number === 1 && state.remaining_seconds === state.settings.focus_minutes * 60) {
      // Fresh idle state, not an auto-start scenario
      return;
    }

    // Small delay so user sees the transition
    const timeout = setTimeout(() => {
      const current = useTimerStore.getState();
      if (current.status === 'idle' && current.settings.auto_start) {
        current.play();
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [status, phase_number]);

  // Notify on session complete
  useEffect(() => {
    if (status !== 'session_complete') return;
    const state = useTimerStore.getState();
    if (state.settings.notifications_enabled) {
      notifySessionComplete();
    }
  }, [status]);

  const play = useCallback(() => {
    playClickSound(settings.sound_enabled);
    playAction();
  }, [playAction, settings.sound_enabled]);

  const pause = useCallback(() => {
    playClickSound(settings.sound_enabled);
    pauseAction();
  }, [pauseAction, settings.sound_enabled]);

  const reset = useCallback(async () => {
    playResetSound(settings.sound_enabled);
    const state = useTimerStore.getState();
    if (state.active_session_id) {
      try {
        await deleteSession(state.active_session_id);
      } catch (err) {
        console.error('[useTimer] Failed to delete session on reset:', err);
      }
      useTimerStore.getState().setActiveSessionId(undefined);
    }
    resetAction();
  }, [resetAction, settings.sound_enabled]);

  const skip = useCallback(async () => {
    playSkipSound(settings.sound_enabled);
    const state = useTimerStore.getState();
    if (state.active_session_id) {
      const isFocus = state.phase_type === 'focus';
      try {
        await updateSession(state.active_session_id, {
          completed: isFocus,
          ended_at: Date.now(),
          duration_seconds: state.elapsed_seconds,
        });
      } catch (err) {
        console.error('[useTimer] Failed to update session on skip:', err);
      }
      useTimerStore.getState().setActiveSessionId(undefined);
    }
    skipAction();
  }, [skipAction, settings.sound_enabled]);

  const setContext = useCallback(
    (projectId?: string, taskId?: string) => {
      setContextAction(projectId, taskId);
    },
    [setContextAction]
  );

  // Warning sound before timer ends
  const warnedRef = useRef(false);
  useEffect(() => {
    if (
      status === 'running' &&
      settings.warn_before_seconds > 0 &&
      remaining_seconds === settings.warn_before_seconds
    ) {
      if (!warnedRef.current) {
        playWarningSound(settings.sound_enabled);
        warnedRef.current = true;
      }
    }
    if (status === 'idle' || status === 'phase_complete' || status === 'session_complete') {
      warnedRef.current = false;
    }
  }, [remaining_seconds, status, settings.warn_before_seconds, settings.sound_enabled]);

  // Tab title countdown
  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      const mm = String(Math.floor(remaining_seconds / 60)).padStart(2, '0');
      const ss = String(remaining_seconds % 60).padStart(2, '0');
      const phase =
        phase_type === 'focus'
          ? 'Focus'
          : phase_type === 'short_break'
            ? 'Short Break'
            : 'Long Break';
      document.title = `${mm}:${ss} — ${phase}`;
    } else if (status === 'session_complete') {
      document.title = 'Session Complete! — ClockWise';
    } else {
      document.title = 'ClockWise';
    }
  }, [remaining_seconds, status, phase_type]);

  // Ambient sound
  useEffect(() => {
    const { ambient_sound, ambient_volume } = settings;
    if (ambient_sound !== 'off') {
      if (status === 'running' || status === 'paused') {
        playAmbient(ambient_sound, ambient_volume);
      } else if (status === 'idle' || status === 'session_complete') {
        stopAmbient();
      }
    } else {
      stopAmbient();
    }
  }, [status, settings, settings.ambient_sound, settings.ambient_volume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (status === 'running') {
            pause();
          } else {
            play();
          }
          break;
        case 'r':
        case 'R':
          reset();
          break;
        case 's':
        case 'S':
          skip();
          break;
        case 'Escape':
          if (status === 'running') {
            pause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, play, pause, reset, skip]);

  return {
    status,
    phase_type,
    phase_number,
    total_phases,
    remaining_seconds,
    elapsed_seconds,
    active_project_id,
    active_task_id,
    settings,
    play,
    pause,
    reset,
    skip,
    setContext,
  };
}

import { useEffect } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useAuth } from '@/lib/useAuth';
import { useUiStore } from '@/stores/uiStore';
import { timerTick } from '@/lib/timerController';
import { playAmbient, stopAmbient, installAudioUnlock } from '@/lib/ambient';
import { formatMMSS } from '@/lib/time';

const PHASE_TITLE = { focus: 'Focus', short_break: 'Short break', long_break: 'Long break' };

/**
 * Drives the timer for the whole signed-in app. It lives in the app shell, so
 * navigating between pages never stops the countdown, and it re-syncs with the
 * wall clock whenever the app returns to the foreground.
 */
export function TimerEngine() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const pageTitle = useUiStore((s) => s.pageTitle);
  const status = useTimerStore((s) => s.status);
  const remaining = useTimerStore((s) => s.remaining_seconds);
  const phaseType = useTimerStore((s) => s.phase_type);
  const ambient = useTimerStore((s) => s.settings.ambient_sound);
  const ambientVolume = useTimerStore((s) => s.settings.ambient_volume);
  const keepAwake = useTimerStore((s) => s.settings.keep_screen_awake);

  // A timer saved by a different account on this device is discarded.
  useEffect(() => {
    if (uid) useTimerStore.getState().resetForUser(uid);
  }, [uid]);

  // Heartbeat. A worker interval isn't throttled in background desktop tabs, so
  // chimes stay on time there; on iOS everything is frozen in the background and
  // the visibility handlers below catch up on return.
  useEffect(() => {
    timerTick();
    let worker: Worker | null = null;
    let interval: number | null = null;
    try {
      worker = new Worker(new URL('../../workers/timer.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = () => timerTick();
      worker.onerror = () => {
        worker?.terminate();
        worker = null;
        interval ??= window.setInterval(timerTick, 1000);
      };
      worker.postMessage('start');
    } catch {
      interval = window.setInterval(timerTick, 1000);
    }

    const resync = () => timerTick();
    // Keep several open tabs in step: when another tab changes the timer, reload it here.
    const onStorage = (e: StorageEvent) => {
      if (e.key === useTimerStore.persist.getOptions().name) {
        void Promise.resolve(useTimerStore.persist.rehydrate()).then(() => timerTick());
      }
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);
    window.addEventListener('pageshow', resync);
    const removeUnlock = installAudioUnlock();

    return () => {
      worker?.terminate();
      if (interval !== null) window.clearInterval(interval);
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', resync);
      window.removeEventListener('pageshow', resync);
      removeUnlock();
    };
  }, []);

  // Tab title countdown.
  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      const paused = status === 'paused' ? ' (paused)' : '';
      document.title = `${formatMMSS(remaining)} · ${PHASE_TITLE[phaseType]}${paused} — ClockWise`;
    } else if (status === 'session_complete') {
      document.title = 'Session complete — ClockWise';
    } else {
      document.title = pageTitle ? `${pageTitle} — ClockWise` : 'ClockWise';
    }
  }, [status, remaining, phaseType, pageTitle]);

  // Ambient soundscape plays while a phase is running.
  useEffect(() => {
    if (status === 'running' && ambient !== 'off') playAmbient(ambient, ambientVolume);
    else stopAmbient();
  }, [status, ambient, ambientVolume]);

  useEffect(() => () => stopAmbient(), []);

  // Keep the screen awake while running, so auto-lock doesn't suspend the app
  // mid-focus. The lock is dropped by the OS whenever the page is hidden, so
  // re-acquire it on return.
  useEffect(() => {
    if (status !== 'running' || !keepAwake || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null;
        });
      } catch {
        // Denied (low battery mode, unsupported) — nothing to do.
      }
    };
    void acquire();
    const onVisible = () => void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
    };
  }, [status, keepAwake]);

  return null;
}

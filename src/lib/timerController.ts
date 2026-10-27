// Imperative timer API used by the UI, keyboard shortcuts and the background
// engine. Each call runs a pure store action with the current time and then
// applies its side effects: writing finished phases to history, sounds and
// notifications. Nothing here awaits the network, so the timer can never get
// stuck waiting for Firestore (writes queue locally while offline).
import { useTimerStore, type TimerEffects } from '@/stores/timerStore';
import { createSession } from '@/db/queries/sessions';
import { reportFailure } from '@/components/ui/Toast';
import {
  playClickSound,
  playResetSound,
  playSkipSound,
  playTimerCompleteSound,
  playWarningSound,
} from '@/lib/sounds';
import { notifyPhaseComplete, notifySessionComplete } from '@/lib/notifications';

function apply(fx: TimerEffects): void {
  const { owner_uid, settings } = useTimerStore.getState();

  if (owner_uid) {
    for (const record of fx.records) {
      // Same phase → same id, so two open tabs (or devices) finishing the same
      // phase write one session instead of two.
      const id = `t-${record.started_at}-${record.phase_number}-${record.type}`;
      const { written } = createSession(owner_uid, record, id);
      reportFailure(written, "Couldn't save a finished session to your history");
    }
  }

  if (fx.finished.length > 0) {
    playTimerCompleteSound(settings.sound_enabled);
    // In-app feedback covers the visible case; notify when the app is hidden.
    if (settings.notifications_enabled && document.visibilityState === 'hidden') {
      if (fx.sessionComplete) notifySessionComplete();
      else notifyPhaseComplete(fx.finished[fx.finished.length - 1]);
    }
  } else if (fx.warn) {
    playWarningSound(settings.sound_enabled);
  }
}

const sound = () => useTimerStore.getState().settings.sound_enabled;

export function timerTick(): void {
  apply(useTimerStore.getState().tick(Date.now()));
}

export function timerPlay(): void {
  playClickSound(sound());
  apply(useTimerStore.getState().play(Date.now()));
}

export function timerPause(): void {
  playClickSound(sound());
  apply(useTimerStore.getState().pause(Date.now()));
}

export function timerToggle(): void {
  if (useTimerStore.getState().status === 'running') timerPause();
  else timerPlay();
}

export function timerSkip(): void {
  playSkipSound(sound());
  apply(useTimerStore.getState().skip(Date.now()));
}

export function timerReset(): void {
  playResetSound(sound());
  apply(useTimerStore.getState().reset(Date.now()));
}

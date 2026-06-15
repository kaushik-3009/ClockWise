import type { TimerSettings, PhaseType } from '@/types';

export type Phase = { type: PhaseType; duration_minutes: number };

export function buildPhaseSequence(settings: TimerSettings): Phase[] {
  const phases: Phase[] = [];
  let focusCount = 0;

  while (phases.length < settings.phases_per_session) {
    // Focus phase
    phases.push({ type: 'focus', duration_minutes: settings.focus_minutes });
    focusCount++;

    if (phases.length >= settings.phases_per_session) break;

    // Break phase
    if (focusCount % settings.long_break_after_n === 0) {
      phases.push({ type: 'long_break', duration_minutes: settings.long_break_minutes });
    } else {
      phases.push({ type: 'short_break', duration_minutes: settings.short_break_minutes });
    }
  }

  return phases;
}

export function getPhaseAtIndex(settings: TimerSettings, index: number): Phase {
  const sequence = buildPhaseSequence(settings);
  if (index < 0 || index >= sequence.length) {
    return { type: 'focus', duration_minutes: settings.focus_minutes };
  }
  return sequence[index];
}

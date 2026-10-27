import { useState, useMemo, useEffect } from 'react';
import { useTimerStore, elapsedMs, MIN_RECORD_SECONDS } from '@/stores/timerStore';
import { timerPause, timerPlay, timerReset, timerSkip, timerToggle } from '@/lib/timerController';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTimerShortcuts } from '@/hooks/useTimerShortcuts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ModeHeader } from '@/components/timer/ModeHeader';
import { PhaseBadge } from '@/components/timer/PhaseBadge';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControls } from '@/components/timer/TimerControls';
import { FocusingOnBar } from '@/components/timer/FocusingOnBar';
import { TemplateSelector } from '@/components/timer/TemplateSelector';
import { SessionCompleteOverlay } from '@/components/timer/SessionCompleteOverlay';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MusicPlayer } from '@/components/timer/MusicPlayer';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatDuration } from '@/lib/time';

const STATUS_ANNOUNCEMENT: Record<string, string> = {
  running: 'Timer running',
  paused: 'Timer paused',
  idle: 'Timer ready',
  session_complete: 'Session complete',
};

const PHASE_NAME = { focus: 'Focus', short_break: 'Short break', long_break: 'Long break' };

export function TimerPage() {
  usePageTitle('Timer');
  const status = useTimerStore((s) => s.status);
  const phaseType = useTimerStore((s) => s.phase_type);
  const phaseNumber = useTimerStore((s) => s.phase_number);
  const totalPhases = useTimerStore((s) => s.total_phases);
  const plan = useTimerStore((s) => s.plan);
  const remaining = useTimerStore((s) => s.remaining_seconds);
  const duration = useTimerStore((s) => s.phase_duration_seconds);
  const clockNow = useTimerStore((s) => s.clock_now);
  const timerStyle = useTimerStore((s) => s.settings.timer_style);
  const shortcutsEnabled = useTimerStore((s) => s.settings.keyboard_shortcuts);
  const activeProjectId = useTimerStore((s) => s.active_project_id);
  const activeTaskId = useTimerStore((s) => s.active_task_id);
  const setContext = useTimerStore((s) => s.setContext);
  const sessionFocusSeconds = useTimerStore((s) => s.session_focus_seconds);
  const sessionPhases = useTimerStore((s) => s.session_phases_completed);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  useEffect(() => {
    if (status !== 'session_complete') setOverlayDismissed(false);
  }, [status]);

  const { projects } = useProjects();
  const { allTasks } = useTasks();
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  );
  const activeTask = useMemo(
    () => allTasks.find((t) => t.id === activeTaskId),
    [allTasks, activeTaskId]
  );

  const displayName = activeTask
    ? `${activeProject?.name ?? 'No project'} · ${activeTask.name}`
    : activeProject?.name;
  const displayColor = activeProject ? PROJECT_COLORS[activeProject.color] : undefined;

  // Resetting throws away the phase in progress; ask first when there's real work in it.
  const requestReset = () => {
    const s = useTimerStore.getState();
    const seconds = elapsedMs(s, Date.now()) / 1000;
    if ((s.status === 'running' || s.status === 'paused') && seconds >= MIN_RECORD_SECONDS) {
      setConfirmReset(true);
    } else {
      timerReset();
    }
  };

  useTimerShortcuts({
    enabled: shortcutsEnabled,
    onToggle: timerToggle,
    onReset: requestReset,
    onSkip: timerSkip,
    onPause: () => {
      if (useTimerStore.getState().status === 'running') timerPause();
    },
    onHelp: () => setShowShortcuts((v) => !v),
  });

  const nextPhase = status === 'session_complete' ? undefined : plan[phaseNumber];

  return (
    <div className="flex flex-1 flex-col text-center">
      <h1 className="sr-only">Timer</h1>
      {/* Short landscape screens (phones on their side) lay the two groups side by side. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6 sm:gap-5 lg:gap-6 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-10 [@media(max-height:500px)]:py-3">
        <div className="flex flex-col items-center gap-4 sm:gap-5 lg:gap-6 [@media(max-height:500px)]:gap-3">
          <ModeHeader phaseType={phaseType} />

          <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
            <FocusingOnBar
              projectName={displayName}
              projectColor={displayColor}
              onSelectProject={setContext}
              selectedProjectId={activeProjectId}
              selectedTaskId={activeTaskId}
            />
            <TemplateSelector />
          </div>

          <PhaseBadge
            current={Math.min(phaseNumber, totalPhases)}
            total={totalPhases}
            next={nextPhase?.type}
          />
        </div>

        <div className="flex flex-col items-center gap-4 sm:gap-5 lg:gap-6 [@media(max-height:500px)]:gap-3">
          <div
            role="timer"
            aria-label={`${PHASE_NAME[phaseType]}: ${formatDuration(remaining)} remaining`}
            className="flex items-center justify-center py-1"
          >
            <TimerDisplay
              remainingSeconds={remaining}
              totalSeconds={duration}
              timerStyle={timerStyle}
              clockNow={clockNow}
            />
          </div>

          {/* Announce state changes only — never the per-second countdown. */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {`${STATUS_ANNOUNCEMENT[status]}. ${PHASE_NAME[phaseType]}, phase ${Math.min(phaseNumber, totalPhases)} of ${totalPhases}.`}
          </div>

          <TimerControls
            status={status}
            onPlay={timerPlay}
            onPause={timerPause}
            onReset={requestReset}
            onSkip={timerSkip}
            canSkip={!(status === 'idle' && phaseNumber === 1 && sessionPhases === 0)}
          />

          {shortcutsEnabled && (
            <div className="hidden flex-wrap items-center justify-center gap-4 text-xs text-text-muted lg:flex">
              {[
                ['Space', 'Play/Pause'],
                ['R', 'Reset'],
                ['S', 'Skip'],
                ['?', 'Shortcuts'],
              ].map(([key, label]) => (
                <span key={key} className="flex items-center gap-1">
                  <kbd className="rounded border border-border-base bg-bg-tertiary px-1.5 py-0.5 font-mono text-2xs">
                    {key}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center px-4 pb-3 pt-2">
        <MusicPlayer />
      </div>

      <SessionCompleteOverlay
        open={status === 'session_complete' && !overlayDismissed}
        focusSeconds={sessionFocusSeconds}
        phasesCompleted={sessionPhases}
        totalPhases={totalPhases}
        projectName={activeProject?.name}
        onStartNew={() => timerPlay()}
        onClose={() => {
          setOverlayDismissed(true);
        }}
      />

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={timerReset}
        title="Reset the timer?"
        description="The time you've spent in this phase so far will be saved to your history as an unfinished session, and the session will start over."
        confirmLabel="Reset"
      />
    </div>
  );
}

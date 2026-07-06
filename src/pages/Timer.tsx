import { useState, useMemo, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { ModeHeader } from '@/components/timer/ModeHeader';
import { PhaseBadge } from '@/components/timer/PhaseBadge';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControls } from '@/components/timer/TimerControls';
import { FocusingOnBar } from '@/components/timer/FocusingOnBar';
import { TemplateSelector } from '@/components/timer/TemplateSelector';
import { SessionCompleteOverlay } from '@/components/timer/SessionCompleteOverlay';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { PROJECT_COLORS } from '@/lib/constants';

export function TimerPage() {
  const {
    status,
    phase_type,
    phase_number,
    total_phases,
    remaining_seconds,
    elapsed_seconds,
    play,
    pause,
    reset,
    skip,
    active_project_id,
    active_task_id,
    setContext,
    settings,
  } = useTimer();

  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { projects } = useProjects();
  const { allTasks } = useTasks();
  const activeProject = useMemo(
    () => projects.find((p) => p.id === active_project_id),
    [projects, active_project_id]
  );
  const activeTask = useMemo(
    () => allTasks.find((t) => t.id === active_task_id),
    [allTasks, active_task_id]
  );

  const displayName = activeTask
    ? `${activeProject?.name ?? 'Untitled'} · ${activeTask.name}`
    : (activeProject?.name ?? undefined);
  const displayColor = activeProject ? PROJECT_COLORS[activeProject.color] : undefined;

  // Show session complete overlay when status becomes session_complete
  useEffect(() => {
    if (status === 'session_complete') {
      setShowSessionComplete(true);
    }
  }, [status]);

  // Keyboard shortcut for '?' to open shortcuts modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '?' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-64px)] lg:min-h-0 gap-8 sm:gap-10 lg:gap-12 xl:gap-14 3xl:gap-16 px-4 py-8 animate-[page-enter_200ms_ease]">
      <div className="flex flex-col items-center gap-8 sm:gap-10 lg:gap-12 xl:gap-14 3xl:gap-16">
        <ModeHeader phaseType={phase_type} />

        <FocusingOnBar
          projectName={displayName}
          projectColor={displayColor}
          onSelectProject={setContext}
          selectedProjectId={active_project_id}
          selectedTaskId={active_task_id}
        />

        <div className="flex flex-col items-center gap-4">
          <TemplateSelector />
          <PhaseBadge current={phase_number} total={total_phases} />
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {status === 'running' &&
              `${Math.floor(remaining_seconds / 60)} minutes ${remaining_seconds % 60} seconds remaining`}
            {status === 'paused' && 'Timer paused'}
            {status === 'phase_complete' && 'Phase complete'}
            {status === 'session_complete' && 'Session complete'}
          </div>
          <TimerDisplay
            remainingSeconds={remaining_seconds}
            totalSeconds={
              phase_type === 'focus'
                ? settings.focus_minutes * 60
                : phase_type === 'short_break'
                  ? settings.short_break_minutes * 60
                  : settings.long_break_minutes * 60
            }
            timerStyle={settings.timer_style}
          />
        </div>

        <TimerControls
          status={status}
          onPlay={play}
          onPause={pause}
          onReset={reset}
          onSkip={skip}
        />

        {/* Keyboard hint */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary border border-border-base font-mono text-[10px]">
              Space
            </kbd>
            Play/Pause
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary border border-border-base font-mono text-[10px]">
              R
            </kbd>
            Reset
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary border border-border-base font-mono text-[10px]">
              S
            </kbd>
            Skip
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary border border-border-base font-mono text-[10px]">
              Esc
            </kbd>
            Pause
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-bg-tertiary border border-border-base font-mono text-[10px]">
              ?
            </kbd>
            Shortcuts
          </span>
        </div>
      </div>

      <SessionCompleteOverlay
        open={showSessionComplete}
        onClose={() => {
          setShowSessionComplete(false);
          reset();
        }}
        timerState={{ elapsed_seconds, phase_number, total_phases, active_project_id }}
      />

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

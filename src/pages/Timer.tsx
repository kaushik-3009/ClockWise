import { useState, useMemo, useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';
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
import { MusicPlayer } from '@/components/timer/MusicPlayer';
import { PROJECT_COLORS } from '@/lib/constants';

export function TimerPage() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const {
    status,
    phase_type,
    phase_number,
    total_phases,
    remaining_seconds,
    elapsed_seconds,
    clock_now,
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
    <div className="relative min-h-[560px] w-full flex-1 text-center lg:min-h-[680px]">
      <div
        className={`fixed inset-x-0 top-0 bottom-16 z-10 grid -translate-y-[clamp(30px,4.5vh,64px)] grid-rows-[1fr_auto_1fr] px-4 sm:px-6 lg:bottom-0 lg:px-8 ${
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-60'
        }`}
      >
        <div className="flex min-h-0 flex-col items-center justify-end gap-4 pb-8 sm:gap-5 sm:pb-10 lg:gap-6 lg:pb-12">
          <ModeHeader
            phaseType={phase_type}
            className="-translate-y-6 sm:-translate-y-8 lg:-translate-y-10"
          />
          <FocusingOnBar
            projectName={displayName}
            projectColor={displayColor}
            onSelectProject={setContext}
            selectedProjectId={active_project_id}
            selectedTaskId={active_task_id}
          />
          <TemplateSelector />
          <PhaseBadge current={phase_number} total={total_phases} />
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {status === 'running' &&
              `${Math.floor(remaining_seconds / 60)} minutes ${remaining_seconds % 60} seconds remaining`}
            {status === 'paused' && 'Timer paused'}
            {status === 'phase_complete' && 'Phase complete'}
            {status === 'session_complete' && 'Session complete'}
          </div>
        </div>

        <div className="flex -translate-y-[clamp(6px,1vh,14px)] items-center justify-center">
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
            clockNow={clock_now}
          />
        </div>

        <div className="flex min-h-0 flex-col items-center justify-start gap-5 pt-8 sm:gap-6 sm:pt-10 lg:gap-8 lg:pt-12">
          <TimerControls
            status={status}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onSkip={skip}
          />

          <div className="hidden items-center gap-4 text-[11px] text-text-muted lg:flex">
            {[
              ['Space', 'Play/Pause'],
              ['R', 'Reset'],
              ['S', 'Skip'],
              ['Esc', 'Pause'],
              ['?', 'Shortcuts'],
            ].map(([key, label]) => (
              <span key={key} className="flex items-center gap-1">
                <kbd className="rounded border border-border-base bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px]">
                  {key}
                </kbd>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-[4.5rem] z-30 flex justify-center px-4 sm:bottom-5 ${
          sidebarCollapsed ? 'lg:left-16' : 'lg:left-60'
        }`}
      >
        <MusicPlayer />
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

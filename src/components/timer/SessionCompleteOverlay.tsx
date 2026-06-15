import { useMemo } from 'react';
import { Trophy, X } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { formatDuration } from '@/lib/time';
import type { TimerState } from '@/types';

interface SessionCompleteOverlayProps {
  open: boolean;
  onClose: () => void;
  timerState: Pick<
    TimerState,
    'elapsed_seconds' | 'phase_number' | 'total_phases' | 'active_project_id'
  >;
}

export function SessionCompleteOverlay({ open, onClose, timerState }: SessionCompleteOverlayProps) {
  const { projects } = useProjects();
  const project = useMemo(
    () => projects.find((p) => p.id === timerState.active_project_id),
    [projects, timerState.active_project_id]
  );

  if (!open) return null;

  const phasesCompleted = Math.max(0, timerState.phase_number - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card rounded-xl p-8 w-full max-w-[420px] text-center animate-[slideUp_300ms_cubic-bezier(0.34,1.56,0.64,1)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-base transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[--color-brand]/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-[--color-brand]" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-text-base mb-1">Session Complete!</h2>
        <p className="text-sm text-text-sub mb-6">
          {project ? `Project: ${project.name}` : 'Great focus session'}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-bg-secondary rounded-lg p-4">
            <p className="text-2xl font-display font-bold text-text-base">
              {formatDuration(timerState.elapsed_seconds)}
            </p>
            <p className="text-xs text-text-sub mt-1">Total Focus Time</p>
          </div>
          <div className="bg-bg-secondary rounded-lg p-4">
            <p className="text-2xl font-display font-bold text-text-base">
              {phasesCompleted}/{timerState.total_phases}
            </p>
            <p className="text-xs text-text-sub mt-1">Phases Completed</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-semibold text-sm rounded-md transition-colors"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}

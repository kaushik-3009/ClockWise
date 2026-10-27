import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TimerStatus } from '@/types';

interface TimerControlsProps {
  status: TimerStatus;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  canSkip?: boolean;
  className?: string;
}

const secondary =
  'flex h-12 w-12 items-center justify-center rounded-full text-text-sub transition-colors duration-fast hover:bg-bg-secondary hover:text-text-base disabled:opacity-40 disabled:hover:bg-transparent';

export function TimerControls({
  status,
  onPlay,
  onPause,
  onReset,
  onSkip,
  canSkip = true,
  className,
}: TimerControlsProps) {
  const isRunning = status === 'running';
  const playLabel =
    status === 'session_complete' ? 'Start new session' : status === 'paused' ? 'Resume' : 'Start';

  return (
    <div className={cn('flex items-center gap-6 3xl:gap-10', className)}>
      <button type="button" onClick={onReset} className={secondary} aria-label="Reset timer">
        <RotateCcw className="h-5 w-5 3xl:h-6 3xl:w-6" />
      </button>

      <button
        type="button"
        onClick={isRunning ? onPause : onPlay}
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full 3xl:h-20 3xl:w-20',
          'bg-brand-solid text-white shadow-[0_6px_24px_var(--color-brand-alpha)]',
          'transition-transform duration-fast hover:scale-105 active:scale-95'
        )}
        aria-label={isRunning ? 'Pause' : playLabel}
      >
        {isRunning ? (
          <Pause className="h-6 w-6 fill-current 3xl:h-7 3xl:w-7" />
        ) : (
          <Play className="ml-0.5 h-6 w-6 fill-current 3xl:h-7 3xl:w-7" />
        )}
      </button>

      <button
        type="button"
        onClick={onSkip}
        disabled={!canSkip || status === 'session_complete'}
        className={secondary}
        aria-label="Skip to next phase"
      >
        <SkipForward className="h-5 w-5 3xl:h-6 3xl:w-6" />
      </button>
    </div>
  );
}

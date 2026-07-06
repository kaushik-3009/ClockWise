import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TimerStatus } from '@/types';

interface TimerControlsProps {
  status: TimerStatus;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  className?: string;
}

export function TimerControls({
  status,
  onPlay,
  onPause,
  onReset,
  onSkip,
  className,
}: TimerControlsProps) {
  const isRunning = status === 'running';

  return (
    <div className={cn('flex items-center gap-8 3xl:gap-10', className)}>
      <button
        onClick={onReset}
        className="p-2 3xl:p-3 text-text-sub hover:text-text-base transition-colors duration-fast"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-5 h-5 3xl:w-6 3xl:h-6" />
      </button>

      <button
        onClick={isRunning ? onPause : onPlay}
        className={cn(
          'w-14 h-14 3xl:w-16 3xl:h-16 flex items-center justify-center rounded-full',
          'bg-[--text-primary] text-[--text-inverse]',
          'transition-transform duration-fast',
          'hover:scale-105 active:scale-95',
          'shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
        )}
        aria-label={isRunning ? 'Pause' : 'Play'}
      >
        {isRunning ? (
          <Pause className="w-[22px] h-[22px] 3xl:w-6 3xl:h-6 fill-current" />
        ) : (
          <Play className="w-[22px] h-[22px] 3xl:w-6 3xl:h-6 fill-current ml-0.5" />
        )}
      </button>

      <button
        onClick={onSkip}
        className="p-2 3xl:p-3 text-text-sub hover:text-text-base transition-colors duration-fast"
        aria-label="Skip phase"
      >
        <SkipForward className="w-5 h-5 3xl:w-6 3xl:h-6" />
      </button>
    </div>
  );
}

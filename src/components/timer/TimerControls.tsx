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
    <div className={cn('flex items-center gap-8', className)}>
      <button
        onClick={onReset}
        className="p-2 text-text-sub hover:text-text-base transition-colors duration-fast"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      <button
        onClick={isRunning ? onPause : onPlay}
        className={cn(
          'w-14 h-14 lg:w-14 lg:h-14 flex items-center justify-center rounded-full',
          'bg-[--text-primary] text-[--text-inverse]',
          'transition-transform duration-fast',
          'hover:scale-105 active:scale-95',
          'shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
        )}
        aria-label={isRunning ? 'Pause' : 'Play'}
      >
        {isRunning ? (
          <Pause className="w-[22px] h-[22px] fill-current" />
        ) : (
          <Play className="w-[22px] h-[22px] fill-current ml-0.5" />
        )}
      </button>

      <button
        onClick={onSkip}
        className="p-2 text-text-sub hover:text-text-base transition-colors duration-fast"
        aria-label="Skip phase"
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
}

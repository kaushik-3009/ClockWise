import { useMemo } from 'react';
import { buildPhaseSequence } from '@/lib/phases';
import { useTimerStore } from '@/stores/timerStore';

interface PhaseBadgeProps {
  current: number;
  total: number;
  className?: string;
}

export function PhaseBadge({ current, total, className }: PhaseBadgeProps) {
  const settings = useTimerStore((s) => s.settings);

  const nextPhaseLabel = useMemo(() => {
    if (current >= total) return null;
    const sequence = buildPhaseSequence(settings);
    const next = sequence[current]; // current is 1-based, so index is current
    if (!next) return null;
    if (next.type === 'long_break') return 'Long break next';
    if (next.type === 'short_break') return 'Short break next';
    return null;
  }, [current, total, settings]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={
          'inline-flex items-center justify-center h-9 3xl:h-10 px-5 3xl:px-6 rounded-full ' +
          'bg-brand text-white text-sm 3xl:text-base font-bold ' +
          'animate-[badge-pop_400ms_cubic-bezier(0.34,1.56,0.64,1)] ' +
          className
        }
      >
        Phase {current}/{total}
      </div>
      {nextPhaseLabel && (
        <span className="text-xs 3xl:text-sm font-medium text-text-sub tracking-wide uppercase">
          {nextPhaseLabel}
        </span>
      )}
    </div>
  );
}

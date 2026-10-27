import type { PhaseType } from '@/types';

interface PhaseBadgeProps {
  current: number;
  total: number;
  /** Type of the phase after this one, if any. */
  next?: PhaseType;
}

const NEXT_LABEL: Partial<Record<PhaseType, string>> = {
  short_break: 'Short break next',
  long_break: 'Long break next',
  focus: 'Focus next',
};

export function PhaseBadge({ current, total, next }: PhaseBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="inline-flex h-9 items-center justify-center rounded-full bg-brand-solid px-5 text-sm font-bold text-white 3xl:h-10 3xl:px-6 3xl:text-base">
        Phase {current} of {total}
      </div>
      {/* Reserve the line even when empty so the layout doesn't jump between phases. */}
      <span className="h-4 text-xs font-medium uppercase tracking-wide text-text-sub 3xl:text-sm">
        {next ? NEXT_LABEL[next] : ''}
      </span>
    </div>
  );
}

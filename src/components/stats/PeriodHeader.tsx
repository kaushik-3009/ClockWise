import { ChevronLeft, ChevronRight } from 'lucide-react';
import { rovingKeyDown } from '@/lib/roving';
import { cn } from '@/lib/cn';
import type { Granularity } from '@/lib/period';

interface PeriodHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  /** Hide "Today" when the current period is already shown. */
  isCurrent?: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  className?: string;
}

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const TODAY_LABEL: Record<Granularity, string> = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
};

export function PeriodHeader({
  label,
  onPrev,
  onNext,
  onToday,
  isCurrent,
  granularity,
  onGranularityChange,
  className,
}: PeriodHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-11 w-11 items-center justify-center rounded-md text-text-sub transition-colors hover:bg-bg-secondary hover:text-text-base"
          aria-label={`Previous ${granularity}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span
          className="min-w-[9.5rem] text-center text-sm font-semibold text-text-base"
          aria-live="polite"
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={isCurrent}
          className="flex h-11 w-11 items-center justify-center rounded-md text-text-sub transition-colors hover:bg-bg-secondary hover:text-text-base disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label={`Next ${granularity}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        {onToday && !isCurrent && (
          <button
            type="button"
            onClick={onToday}
            className="min-h-11 rounded-md px-2 text-sm font-medium text-brand-text transition-colors hover:bg-brand-alpha"
          >
            {TODAY_LABEL[granularity]}
          </button>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Period"
        className="flex overflow-hidden rounded-md border border-border-input"
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={granularity === opt.value}
            tabIndex={granularity === opt.value ? 0 : -1}
            onKeyDown={rovingKeyDown}
            onClick={() => onGranularityChange(opt.value)}
            className={cn(
              'min-h-11 px-4 text-sm font-medium transition-colors',
              granularity === opt.value
                ? 'bg-brand-solid text-white'
                : 'text-text-sub hover:bg-bg-secondary hover:text-text-base'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

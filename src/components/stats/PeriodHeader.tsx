import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Granularity = 'day' | 'week' | 'month';

interface PeriodHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  className?: string;
}

export function PeriodHeader({
  label,
  onPrev,
  onNext,
  onToday,
  granularity,
  onGranularityChange,
  className,
}: PeriodHeaderProps) {
  const options: { value: Granularity; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="p-1.5 rounded-md text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors"
          aria-label="Previous period"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-text-base min-w-[140px] text-center">
          {label}
        </span>
        {onToday && (
          <button
            onClick={onToday}
            className="px-2 py-1 rounded-md text-xs font-medium text-brand hover:bg-brand-alpha transition-colors"
          >
            Today
          </button>
        )}
        <button
          onClick={onNext}
          className="p-1.5 rounded-md text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors"
          aria-label="Next period"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Segmented control */}
      <div className="flex rounded-md border border-border-base overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onGranularityChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors',
              granularity === opt.value
                ? 'bg-brand text-white'
                : 'text-text-sub hover:text-text-base hover:bg-bg-secondary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

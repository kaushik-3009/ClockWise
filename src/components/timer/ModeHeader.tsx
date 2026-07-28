import type { PhaseType } from '@/types';

interface ModeHeaderProps {
  phaseType: PhaseType;
  className?: string;
}

const MODE_LABELS: Record<PhaseType, { title: string; subtitle?: string }> = {
  focus: { title: 'FOCUS TIME' },
  short_break: { title: 'SHORT BREAK', subtitle: 'RELAX' },
  long_break: { title: 'LONG BREAK', subtitle: 'DEEP REST' },
};

export function ModeHeader({ phaseType, className }: ModeHeaderProps) {
  const mode = MODE_LABELS[phaseType];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-4 text-text-base">
        <span className="h-px w-10 bg-border-strong sm:w-14" aria-hidden="true" />
        <span
          className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_0_5px_var(--color-brand-alpha)]"
          aria-hidden="true"
        />
        <span className="text-xl 3xl:text-2xl font-bold tracking-[0.18em] uppercase">
          {mode.title}
        </span>
        <span className="h-px w-10 bg-border-strong sm:w-14" aria-hidden="true" />
      </div>
      {mode.subtitle && (
        <span className="text-xs 3xl:text-sm font-medium tracking-[0.14em] uppercase text-text-sub">
          {mode.subtitle}
        </span>
      )}
    </div>
  );
}

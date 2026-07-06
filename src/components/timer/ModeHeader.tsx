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
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-sm 3xl:text-base font-bold tracking-[0.15em] uppercase text-text-base">
        {mode.title}
      </span>
      {mode.subtitle && (
        <span className="text-[11px] 3xl:text-xs font-medium tracking-[0.12em] uppercase text-text-sub">
          {mode.subtitle}
        </span>
      )}
    </div>
  );
}

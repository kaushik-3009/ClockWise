import type { PhaseType } from '@/types';

interface ModeHeaderProps {
  phaseType: PhaseType;
  className?: string;
}

const MODE_LABELS: Record<PhaseType, { title: string; subtitle: string }> = {
  focus: { title: 'Focus time', subtitle: 'Stay with it' },
  short_break: { title: 'Short break', subtitle: 'Relax' },
  long_break: { title: 'Long break', subtitle: 'Deep rest' },
};

export function ModeHeader({ phaseType, className = '' }: ModeHeaderProps) {
  const mode = MODE_LABELS[phaseType];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center gap-4 text-text-base">
        <span className="h-px w-8 bg-border-strong sm:w-14" aria-hidden="true" />
        <span
          className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_0_5px_var(--color-brand-alpha)]"
          aria-hidden="true"
        />
        <span className="text-lg font-bold uppercase tracking-[0.18em] sm:text-xl 3xl:text-2xl">
          {mode.title}
        </span>
        <span className="h-px w-8 bg-border-strong sm:w-14" aria-hidden="true" />
      </div>
      {/* Always rendered so switching phases doesn't shift the layout. */}
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-text-sub 3xl:text-sm">
        {mode.subtitle}
      </span>
    </div>
  );
}

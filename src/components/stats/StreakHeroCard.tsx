import { cn } from '@/lib/cn';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface StreakHeroCardProps {
  streak: number;
  activeDays?: string[]; // e.g. ['Monday','Tuesday',...]
  label?: string;
  copy?: string;
  className?: string;
}

export function StreakHeroCard({
  streak,
  activeDays = [],
  label = 'Live streak',
  copy = 'A single headline metric gives the page emotional weight. It tells the user what this screen is about before they read the grid.',
  className,
}: StreakHeroCardProps) {
  const padded = String(streak).padStart(2, '0');

  return (
    <div className={cn('p-5 rounded-2xl bg-brand-light border border-brand-alpha', className)}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="px-2.5 py-1.5 rounded-full bg-brand-alpha text-brand text-xs font-extrabold uppercase tracking-wide">
          {label}
        </span>
        <span className="px-2.5 py-1.5 rounded-full bg-bg-card text-text-sub text-xs font-extrabold uppercase tracking-wide border border-border-base">
          Weekdays
        </span>
      </div>

      <div className="text-[56px] leading-[0.9] font-display font-black tracking-[-0.05em] text-text-base">
        {padded}
      </div>
      <div className="text-base font-bold text-text-base mt-1 mb-2">Days in a row</div>
      <p className="text-sm text-text-sub leading-relaxed mb-4">{copy}</p>

      <div className="flex gap-2 flex-wrap">
        {DAY_LABELS.map((label, i) => {
          const isActive = activeDays.includes(DAY_FULL[i]);
          return (
            <span
              key={i}
              className={cn(
                'min-w-[34px] text-center px-2.5 py-2 rounded-xl text-xs font-extrabold transition-colors',
                isActive
                  ? 'bg-brand text-white shadow-[0_4px_12px_var(--color-brand-alpha)]'
                  : 'bg-bg-tertiary text-text-muted'
              )}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

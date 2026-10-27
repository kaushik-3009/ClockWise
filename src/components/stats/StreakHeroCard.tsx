import { Flame } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StreakHeroCardProps {
  streak: number;
  longest: number;
  /** Last 7 days, oldest first. */
  lastWeek: { label: string; date: string; active: boolean; isToday: boolean }[];
  className?: string;
}

export function StreakHeroCard({ streak, longest, lastWeek, className }: StreakHeroCardProps) {
  const todayDone = lastWeek[lastWeek.length - 1]?.active;
  const message =
    streak === 0
      ? 'Focus for a minute or more today to start a streak.'
      : !todayDone
        ? 'Focus today to keep your streak going.'
        : streak >= longest
          ? 'This is your longest streak yet. Keep it going!'
          : `${longest - streak + 1} more ${longest - streak + 1 === 1 ? 'day' : 'days'} to beat your record of ${longest}.`;

  return (
    <section
      aria-label="Current streak"
      className={cn('rounded-2xl border border-brand-alpha bg-brand-light p-5', className)}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-text">
        <Flame className="h-4 w-4" aria-hidden="true" />
        Current streak
      </div>
      <div className="font-display text-6xl font-black leading-none text-text-base">{streak}</div>
      <div className="mb-2 mt-1 text-base font-bold text-text-base">
        {streak === 1 ? 'day in a row' : 'days in a row'}
      </div>
      <p className="mb-4 text-sm leading-relaxed text-text-sub">{message}</p>

      <ol className="grid grid-cols-7 gap-1.5" aria-label="Last 7 days">
        {lastWeek.map((d) => (
          <li
            key={d.date}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold',
              d.active ? 'bg-brand-solid text-white' : 'bg-bg-tertiary text-text-sub',
              d.isToday && 'ring-2 ring-text-base ring-offset-1 ring-offset-brand-light'
            )}
          >
            <span aria-hidden="true">{d.label}</span>
            <span className="sr-only">
              {d.date}: {d.active ? 'focused' : 'no focus'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

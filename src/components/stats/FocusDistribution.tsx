import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/time';
import { PROJECT_COLORS } from '@/lib/constants';

interface FocusItem {
  name: string;
  color: string;
  seconds: number;
  pct: number;
}

interface FocusDistributionProps {
  items: FocusItem[];
  topNShare?: number;
  weeklyTargetPct?: number;
  className?: string;
}

export function FocusDistribution({
  items,
  topNShare,
  weeklyTargetPct,
  className,
}: FocusDistributionProps) {
  if (items.length === 0) {
    return (
      <div className={cn('bg-bg-card border border-border-base rounded-lg p-5', className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-text-base">Focus distribution</h2>
            <p className="text-sm text-text-sub mt-0.5">Ranked by time</p>
          </div>
        </div>
        <p className="text-sm text-text-muted text-center py-4">
          No project focus data for this period
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-bg-card border border-border-base rounded-lg p-5', className)}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[15px] font-semibold text-text-base">Focus distribution</h2>
          <p className="text-sm text-text-sub mt-0.5">Ranked by time</p>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {items.map((item, idx) => {
          const color = PROJECT_COLORS[item.color as keyof typeof PROJECT_COLORS];
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-text-base">{item.name}</span>
                <span className="text-sm font-bold text-text-sub tabular-nums">
                  {formatDuration(item.seconds)} ·{' '}
                  <span className="text-text-muted">{item.pct}%</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="h-2.5 w-full rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-slow"
                    style={{ width: `${item.pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-sm font-bold text-text-sub tabular-nums w-6 text-right">
                  #{idx + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {(topNShare !== undefined || weeklyTargetPct !== undefined) && (
        <div className="grid grid-cols-2 gap-3 mt-5">
          {topNShare !== undefined && (
            <div className="p-4 rounded-2xl bg-bg-secondary border border-border-base">
              <div className="text-sm font-bold text-text-sub uppercase tracking-wide mb-2">
                Top 2 share
              </div>
              <div className="text-2xl font-display font-bold text-text-base leading-none">
                {topNShare}%
              </div>
            </div>
          )}
          {weeklyTargetPct !== undefined && (
            <div className="p-4 rounded-2xl bg-bg-secondary border border-border-base">
              <div className="text-sm font-bold text-text-sub uppercase tracking-wide mb-2">
                Weekly target
              </div>
              <div className="text-2xl font-display font-bold text-text-base leading-none">
                {weeklyTargetPct}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

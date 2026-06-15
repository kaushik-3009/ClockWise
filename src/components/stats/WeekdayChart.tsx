import { cn } from '@/lib/cn';

interface WeekdayData {
  name: string;
  seconds: number;
}

interface WeekdayChartProps {
  data: WeekdayData[];
  insight?: string;
  className?: string;
}

export function WeekdayChart({ data, insight, className }: WeekdayChartProps) {
  const max = Math.max(...data.map((d) => d.seconds), 1);
  const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const bestDay = data.reduce(
    (best, d, i) => (d.seconds > best.seconds ? { name: shortNames[i], seconds: d.seconds } : best),
    { name: '', seconds: 0 }
  );

  return (
    <div
      className={cn('bg-bg-card border border-border-base rounded-lg p-5 flex flex-col', className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-text-base">Productivity by weekday</h2>
          <p className="text-sm text-text-sub mt-0.5">Focus hours across the week</p>
        </div>
      </div>

      {data.every((d) => d.seconds === 0) ? (
        <p className="text-sm text-text-muted text-center py-4">No focus data for this period</p>
      ) : (
        <>
          <div className="flex items-end gap-2 sm:gap-3 flex-1 min-h-[180px] pt-2">
            {data.map((day, i) => {
              const pct = (day.seconds / max) * 100;
              const hours = (day.seconds / 3600).toFixed(1);
              const isZero = day.seconds === 0;
              return (
                <div
                  key={day.name}
                  className="flex flex-col items-center gap-2 h-full flex-1 justify-end"
                >
                  <span className="text-xs font-bold text-text-sub tabular-nums">{hours}h</span>
                  <div className="w-full flex-1 flex items-end rounded-2xl bg-[linear-gradient(180deg,var(--bg-secondary)_0%,var(--bg-tertiary)_100%)] border border-border-base p-1.5 min-h-[120px]">
                    <div
                      className={cn(
                        'w-full rounded-xl transition-all duration-slow min-h-[4px]',
                        isZero
                          ? 'bg-[repeating-linear-gradient(135deg,var(--bg-tertiary)_0_4px,var(--bg-secondary)_4px_8px)]'
                          : ''
                      )}
                      style={{
                        height: isZero ? '4px' : `${Math.max(pct, 4)}%`,
                        ...(isZero
                          ? {}
                          : {
                              background:
                                'linear-gradient(180deg, color-mix(in srgb, var(--color-brand) 50%, white), var(--color-brand))',
                            }),
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      shortNames[i] === bestDay.name && day.seconds > 0
                        ? 'text-text-base'
                        : 'text-text-sub'
                    )}
                  >
                    {shortNames[i]}
                  </span>
                </div>
              );
            })}
          </div>

          {insight && (
            <div className="mt-4 p-3 rounded-xl bg-bg-secondary text-text-secondary text-sm font-medium leading-relaxed">
              {insight}
            </div>
          )}
        </>
      )}
    </div>
  );
}

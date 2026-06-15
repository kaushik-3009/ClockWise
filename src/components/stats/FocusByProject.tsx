import { cn } from '@/lib/cn';
import { PROJECT_COLORS } from '@/lib/constants';
import { formatDuration } from '@/lib/time';

interface FocusByProjectProps {
  data: { projectId: string; projectName: string; projectColor: string; focusSeconds: number }[];
  className?: string;
}

export function FocusByProject({ data, className }: FocusByProjectProps) {
  const maxSeconds = Math.max(...data.map((d) => d.focusSeconds), 1);

  return (
    <div className={cn('bg-bg-card border border-border-base rounded-md p-5 px-6', className)}>
      <h3 className="text-[15px] font-semibold text-text-base">Focus by Project</h3>
      <p className="text-xs text-text-sub mt-0.5 mb-4">Total focus time per project</p>
      <div className="flex flex-col gap-3">
        {data.length === 0 || data.every((d) => d.focusSeconds === 0) ? (
          <p className="text-sm text-text-muted">No focus data for this period</p>
        ) : (
          data.map((item) => {
            const pct = (item.focusSeconds / maxSeconds) * 100;
            const color =
              PROJECT_COLORS[item.projectColor as keyof typeof PROJECT_COLORS] ?? item.projectColor;
            return (
              <div key={item.projectId} className="flex flex-col gap-1.5 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-base font-medium">{item.projectName}</span>
                  <span className="text-xs text-text-sub tabular-nums">
                    {formatDuration(item.focusSeconds)}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-slow"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

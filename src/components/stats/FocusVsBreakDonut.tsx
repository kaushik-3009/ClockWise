import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';

interface FocusVsBreakDonutProps {
  focusSeconds: number;
  breakSeconds: number;
  className?: string;
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="px-3 py-2 rounded-lg bg-bg-card border border-border-base shadow-modal text-xs min-w-[120px]">
      {payload.map((entry, i) => {
        const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-base font-medium">{entry.name}:</span>
            <span className="text-text-sub ml-auto tabular-nums">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function FocusVsBreakDonut({
  focusSeconds,
  breakSeconds,
  className,
}: FocusVsBreakDonutProps) {
  const { theme } = useUiStore();
  const data = [
    { name: 'Focus', value: focusSeconds },
    { name: 'Break', value: breakSeconds },
  ];

  const total = focusSeconds + breakSeconds;
  const focusPct = total > 0 ? Math.round((focusSeconds / total) * 100) : 0;

  const isDark = theme === 'dark';
  const breakFill = isDark
    ? 'color-mix(in srgb, var(--color-brand) 50%, transparent)'
    : 'color-mix(in srgb, var(--color-brand) 30%, transparent)';

  return (
    <div className={cn('bg-bg-card border border-border-base rounded-md p-5 px-6', className)}>
      <h3 className="text-[15px] font-semibold text-text-base">Focus vs Break</h3>
      <p className="text-xs text-text-sub mt-0.5 mb-4">Time distribution</p>
      {total === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-text-muted">
          No time data for this period
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationDuration={500}
                  minAngle={5}
                >
                  <Cell fill="var(--color-brand)" />
                  <Cell fill={breakFill} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-display font-bold text-text-base">{focusPct}%</span>
              <span className="text-[10px] text-text-sub">Focus</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand" />
              <span className="text-sm text-text-base font-medium">Focus</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: breakFill }} />
              <span className="text-sm text-text-base font-medium">Break</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

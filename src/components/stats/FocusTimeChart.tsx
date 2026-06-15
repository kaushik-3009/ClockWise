import { useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/cn';

interface FocusTimeChartProps {
  data: { day: string; focusSeconds: number }[];
  highlightDay?: string;
  className?: string;
}

export function FocusTimeChart({ data, highlightDay, className }: FocusTimeChartProps) {
  const gradientId = `${useId()}-focusGradient`;

  const tickColor = 'var(--text-muted)';
  const gridColor = 'var(--border-color)';

  const formatY = (v: number) => {
    if (v === 0) return '0';
    const h = Math.floor(v / 3600);
    const m = Math.floor((v % 3600) / 60);
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  return (
    <div className={cn('bg-bg-card border border-border-base rounded-md p-5 px-6', className)}>
      <h3 className="text-[15px] font-semibold text-text-base">Focus Time</h3>
      <p className="text-xs text-text-sub mt-0.5 mb-4">Total focused minutes per day</p>
      {data.length === 0 || data.every((d) => d.focusSeconds === 0) ? (
        <div className="flex items-center justify-center h-[220px] text-sm text-text-muted">
          No focus data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickFormatter={formatY}
              domain={[0, 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value as number;
                const h = Math.floor(v / 3600);
                const m = Math.floor((v % 3600) / 60);
                return (
                  <div className="px-3 py-2 rounded-lg bg-bg-card border border-border-base shadow-modal text-xs min-w-[140px]">
                    <p className="font-medium text-text-base mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-brand shrink-0" />
                      <span className="text-text-base font-medium">Focus time:</span>
                      <span className="text-text-sub ml-auto tabular-nums">
                        {h}h {m}m
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="focusSeconds"
              stroke="var(--color-brand)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={500}
            />
            {highlightDay && (
              <ReferenceLine
                x={highlightDay}
                stroke={tickColor}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

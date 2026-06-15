import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';

interface SessionsChartProps {
  data: { day: string; started: number; completed: number }[];
  highlightDay?: string;
  className?: string;
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg bg-bg-card border border-border-base shadow-modal text-xs min-w-[140px]">
      <p className="font-medium text-text-base mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-base font-medium">{entry.name}:</span>
          <span className="text-text-sub ml-auto tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SessionsChart({ data, highlightDay, className }: SessionsChartProps) {
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const tickColor = 'var(--text-muted)';
  const gridColor = 'var(--border-color)';
  const secondaryBar = isDark ? 'var(--text-sub)' : 'var(--border-strong)';

  return (
    <div
      className={cn(
        'bg-bg-card border border-border-base rounded-md p-5 px-6 flex flex-col',
        className
      )}
    >
      <h3 className="text-[15px] font-semibold text-text-base">Sessions</h3>
      <p className="text-xs text-text-sub mt-0.5 mb-4">Started vs completed per day</p>
      {data.length === 0 || data.every((d) => d.started === 0 && d.completed === 0) ? (
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
          No session data for this period
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="started" fill={secondaryBar} radius={[4, 4, 0, 0]} name="Started" />
                <Bar
                  dataKey="completed"
                  fill="var(--color-brand)"
                  radius={[4, 4, 0, 0]}
                  name="Completed"
                />
                {highlightDay && (
                  <ReferenceLine
                    x={highlightDay}
                    stroke={tickColor}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: secondaryBar }} />
              <span className="text-sm text-text-base font-medium">Started</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-brand" />
              <span className="text-sm text-text-base font-medium">Completed</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { cn } from '@/lib/cn';

interface StatRow {
  label: string;
  value: string;
}

interface StatsListProps {
  rows: StatRow[];
  className?: string;
}

export function StatsList({ rows, className }: StatsListProps) {
  return (
    <div
      className={cn('bg-bg-card border border-border-base rounded-lg overflow-hidden', className)}
    >
      <div className="flex flex-col">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              'flex items-center justify-between gap-3 px-4 py-3.5',
              i !== rows.length - 1 && 'border-b border-border-base'
            )}
          >
            <span className="text-[13px] font-bold text-text-sub">{row.label}</span>
            <span className="text-[15px] font-bold text-text-base tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { cn } from '@/lib/cn';

interface KpiCardProps {
  label: string;
  value: string;
  /** Small caption under the value (e.g. a comparison). */
  footnote?: React.ReactNode;
  className?: string;
}

export function KpiCard({ label, value, footnote, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border-base bg-bg-card p-4 sm:p-5',
        className
      )}
    >
      <div className="text-sm font-semibold text-text-sub">{label}</div>
      <div className="font-display text-3xl font-extrabold leading-none text-text-base sm:text-[34px]">
        {value}
      </div>
      {footnote && <div className="text-xs font-semibold leading-snug">{footnote}</div>}
    </div>
  );
}

/**
 * Change vs the comparison period. Uses neutral wording/colour for a decrease —
 * a lighter week isn't a failure state — and "new" when there's no baseline.
 */
export function DeltaBadge({ delta, comparedTo }: { delta: number | null; comparedTo: string }) {
  if (delta === null) {
    return <span className="text-text-sub">Nothing to compare with yet</span>;
  }
  if (delta === 0) return <span className="text-text-sub">Same as {comparedTo}</span>;
  const up = delta > 0;
  return (
    <span className={up ? 'text-success-text' : 'text-text-sub'}>
      {up ? '▲' : '▼'} {Math.abs(delta)}% vs {comparedTo}
    </span>
  );
}

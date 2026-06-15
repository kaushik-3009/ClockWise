import { memo } from 'react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: number;
  className?: string;
}

export const StatCard = memo(function StatCard({
  label,
  value,
  subtitle,
  delta,
  className,
}: StatCardProps) {
  const deltaPositive = delta !== undefined && delta >= 0;

  return (
    <div
      className={cn(
        'relative flex-1 bg-bg-card border border-border-base rounded-md p-5 px-6',
        className
      )}
    >
      {delta !== undefined && (
        <span
          className={cn(
            'absolute top-4 right-4 px-2 py-0.5 rounded-pill text-[11px] font-semibold',
            deltaPositive ? 'bg-success-light text-success' : 'bg-error-light text-error'
          )}
        >
          {delta > 0 ? '+' : ''}
          {delta}%
        </span>
      )}
      <p className="text-xs text-text-sub mb-2 tracking-wide">{label}</p>
      <p className="font-display text-[40px] lg:text-[40px] text-text-base leading-none font-bold">
        {value}
      </p>
      {subtitle && <p className="text-xs text-text-muted mt-1.5">{subtitle}</p>}
    </div>
  );
});

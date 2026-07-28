import type { LucideIcon } from 'lucide-react';

// A small, non-blocking banner shown above stats/insights content when there's
// no data yet — the real (zero-valued) cards/charts underneath still render,
// so the page reads as "your dashboard, waiting for data" rather than blank.
export function EmptyStateNotice({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-bg-card border border-border-base rounded-lg px-4 py-3 mb-6">
      <div className="w-9 h-9 rounded-full bg-brand-alpha flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-base">{title}</p>
        <p className="text-xs text-text-sub">{subtitle}</p>
      </div>
    </div>
  );
}

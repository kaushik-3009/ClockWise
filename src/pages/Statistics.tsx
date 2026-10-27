import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Target } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import { useSettings } from '@/hooks/useSettings';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePeriod, type Granularity } from '@/lib/period';
import { PeriodHeader } from '@/components/stats/PeriodHeader';
import { KpiCard, DeltaBadge } from '@/components/stats/StatCard';
import { FocusTimeChart } from '@/components/stats/FocusTimeChart';
import { SessionsChart } from '@/components/stats/SessionsChart';
import { FocusVsBreakDonut } from '@/components/stats/FocusVsBreakDonut';
import { FocusDistribution } from '@/components/stats/FocusDistribution';
import { TrendChart } from '@/components/stats/TrendChart';
import { ChartSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import {
  computePeriodStats,
  computeCurrentWeekFocusSeconds,
  dailyFocusSeries,
  deltaPercent,
  isFocus,
  projectDistribution,
} from '@/lib/stats';
import { formatDateKey, formatDuration } from '@/lib/time';
import type { Session } from '@/types';

const COMPARED_TO: Record<Granularity, [string, string]> = {
  day: ['yesterday at this time', 'the day before'],
  week: ['this point last week', 'the previous week'],
  month: ['this point last month', 'the previous month'],
};

interface Bucket {
  day: string;
  focusSeconds: number | null;
  started: number | null;
  completed: number | null;
  /** Start of the bucket; buckets in the future are blanked out. */
  at: number;
}

/** Chart buckets: hours for a day, days for a week or month. */
function buildBuckets(sessions: Session[], g: Granularity, start: Date, end: Date): Bucket[] {
  const inRange = sessions.filter(
    (s) => isFocus(s) && s.started_at >= start.getTime() && s.started_at <= end.getTime()
  );
  if (g === 'day') {
    const buckets: Bucket[] = Array.from({ length: 24 }, (_, h) => ({
      day: new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: 'numeric' }),
      focusSeconds: 0,
      started: 0,
      completed: 0,
      at: new Date(start.getFullYear(), start.getMonth(), start.getDate(), h).getTime(),
    }));
    for (const s of inRange) {
      const b = buckets[new Date(s.started_at).getHours()];
      b.focusSeconds! += s.duration_seconds;
      b.started!++;
      if (s.completed) b.completed!++;
    }
    return blankFuture(buckets);
  }
  const buckets = new Map<string, Bucket>();
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    buckets.set(formatDateKey(d), {
      day:
        g === 'week' ? d.toLocaleDateString(undefined, { weekday: 'short' }) : String(d.getDate()),
      focusSeconds: 0,
      started: 0,
      completed: 0,
      at: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
    });
  }
  for (const s of inRange) {
    const b = buckets.get(formatDateKey(new Date(s.started_at)));
    if (!b) continue;
    b.focusSeconds! += s.duration_seconds;
    b.started!++;
    if (s.completed) b.completed!++;
  }
  return blankFuture([...buckets.values()]);
}

/** Days/hours that haven't happened yet have no value (a gap), not zero. */
function blankFuture(buckets: Bucket[]): Bucket[] {
  const now = Date.now();
  return buckets.map((b) =>
    b.at > now ? { ...b, focusSeconds: null, started: null, completed: null } : b
  );
}

export function StatisticsPage() {
  usePageTitle('Statistics');
  const nav = usePeriod('week');
  const { granularity, period, previous, isCurrent } = nav;

  const { sessions, loading } = useSessions();
  const { projects } = useProjects();
  const { settings } = useSettings();

  const stats = useMemo(
    () => computePeriodStats(sessions, period.start, period.end),
    [sessions, period]
  );
  const prevStats = useMemo(
    () => computePeriodStats(sessions, previous.start, previous.end),
    [sessions, previous]
  );
  const comparedTo = COMPARED_TO[granularity][isCurrent ? 0 : 1];

  const buckets = useMemo(
    () => buildBuckets(sessions, granularity, period.start, period.end),
    [sessions, granularity, period]
  );
  const highlight = useMemo(() => {
    if (!isCurrent) return undefined;
    const now = new Date();
    if (granularity === 'day') return now.toLocaleTimeString(undefined, { hour: 'numeric' });
    if (granularity === 'week') return now.toLocaleDateString(undefined, { weekday: 'short' });
    return String(now.getDate());
  }, [isCurrent, granularity]);

  const distribution = useMemo(
    () => projectDistribution(sessions, projects, period.start, period.end),
    [sessions, projects, period]
  );
  const top2Share = distribution.items.slice(0, 2).reduce((sum, i) => sum + i.pct, 0);

  const weekFocus = useMemo(() => computeCurrentWeekFocusSeconds(sessions), [sessions]);
  const goalHours = settings.weekly_goal_hours;
  const goalPct =
    goalHours > 0 ? Math.min(Math.round((weekFocus / 3600 / goalHours) * 100), 100) : 0;

  const trendData = useMemo(
    () =>
      dailyFocusSeries(sessions, 30).map((d) => ({
        day: d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        focusSeconds: d.focusSeconds,
      })),
    [sessions]
  );

  const completionRate =
    stats.sessions_started > 0
      ? Math.round((stats.sessions_completed / stats.sessions_started) * 100)
      : null;
  const avgSession =
    stats.sessions_started > 0 ? Math.round(stats.focus_seconds / stats.sessions_started) : 0;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:p-12">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <h1 className="sr-only">Statistics</h1>
        <BarChart3 className="mb-4 h-12 w-12 text-text-muted" aria-hidden="true" />
        <p className="mb-1 text-lg font-medium text-text-base">Your statistics will appear here</p>
        <p className="mb-5 text-sm text-text-sub">
          Finish a focus session and you’ll see where your time goes — by day, project and week.
        </p>
        <Link to="/timer" className="btn-primary">
          Start a focus session
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:p-12">
      <h1 className="mb-4 text-2xl font-semibold text-text-base">Statistics</h1>
      <PeriodHeader
        label={nav.label}
        onPrev={nav.prev}
        onNext={nav.next}
        onToday={nav.today}
        isCurrent={isCurrent}
        granularity={granularity}
        onGranularityChange={nav.setGranularity}
      />

      {goalHours > 0 && (
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-border-base bg-bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-alpha">
            <Target className="h-5 w-5 text-brand-text" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-text-base">This week’s goal</span>
              <span className="text-xs text-text-sub">
                {formatDuration(weekFocus)} of {goalHours}h · {goalPct}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-bg-tertiary"
              role="progressbar"
              aria-label="Weekly goal progress"
              aria-valuenow={goalPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-brand transition-all duration-slow"
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Focus time"
          value={formatDuration(stats.focus_seconds)}
          footnote={
            <DeltaBadge
              delta={deltaPercent(stats.focus_seconds, prevStats.focus_seconds)}
              comparedTo={comparedTo}
            />
          }
        />
        <KpiCard
          label="Focus sessions"
          value={String(stats.sessions_started)}
          footnote={
            <DeltaBadge
              delta={deltaPercent(stats.sessions_started, prevStats.sessions_started)}
              comparedTo={comparedTo}
            />
          }
        />
        <KpiCard
          label="Finished"
          value={completionRate === null ? '—' : `${completionRate}%`}
          footnote={
            <span className="text-text-sub">
              {stats.sessions_completed} of {stats.sessions_started} ran to the end
            </span>
          }
        />
        <KpiCard
          label="Average session"
          value={avgSession > 0 ? formatDuration(avgSession) : '—'}
          footnote={
            <span className="text-text-sub">{formatDuration(stats.break_seconds)} on breaks</span>
          }
        />
      </div>

      <div className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.85fr_1fr]">
        <FocusTimeChart
          data={buckets}
          highlightDay={highlight}
          subtitle={granularity === 'day' ? 'Focus time by hour started' : 'Focus time per day'}
        />
        <FocusVsBreakDonut focusSeconds={stats.focus_seconds} breakSeconds={stats.break_seconds} />
      </div>

      <div className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.85fr_1fr]">
        <SessionsChart
          data={buckets}
          highlightDay={highlight}
          subtitle={
            granularity === 'day' ? 'Started vs finished, by hour' : 'Started vs finished, per day'
          }
        />
        <FocusDistribution items={distribution.items} topNShare={top2Share} />
      </div>

      <TrendChart data={trendData} />
    </div>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, Lightbulb, Target } from 'lucide-react';
import { WeekdayChart } from '@/components/stats/WeekdayChart';
import { PeriodHeader } from '@/components/stats/PeriodHeader';
import { KpiCard, DeltaBadge } from '@/components/stats/StatCard';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePeriod } from '@/lib/period';
import { formatDuration } from '@/lib/time';
import {
  computeBestDay,
  computeBestMonth,
  computeConsistency,
  computePeriodStats,
  deltaPercent,
  isFocus,
  projectDistribution,
} from '@/lib/stats';

const DAYPARTS = [
  { id: 'morning', label: 'Morning', range: '5am–12pm', from: 5, to: 12 },
  { id: 'afternoon', label: 'Afternoon', range: '12–5pm', from: 12, to: 17 },
  { id: 'evening', label: 'Evening', range: '5–10pm', from: 17, to: 22 },
  { id: 'night', label: 'Night', range: '10pm–5am', from: 22, to: 29 },
] as const;

function daypartOf(hour: number) {
  const h = hour < 5 ? hour + 24 : hour;
  return DAYPARTS.find((d) => h >= d.from && h < d.to) ?? DAYPARTS[3];
}

function Recommendation({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Brain;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-base bg-bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-5 w-5 text-brand-text" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text-base">{title}</h3>
      </div>
      <p className="text-sm text-text-sub">{children}</p>
    </div>
  );
}

export function InsightsPage() {
  usePageTitle('Insights');
  const nav = usePeriod('month');
  const { period, previous, isCurrent, granularity } = nav;
  const { sessions, loading } = useSessions();
  const { projects } = useProjects();

  const periodFocus = useMemo(
    () =>
      sessions.filter(
        (s) =>
          isFocus(s) &&
          s.started_at >= period.start.getTime() &&
          s.started_at <= period.end.getTime()
      ),
    [sessions, period]
  );

  const stats = useMemo(
    () => computePeriodStats(sessions, period.start, period.end),
    [sessions, period]
  );
  const prevStats = useMemo(
    () => computePeriodStats(sessions, previous.start, previous.end),
    [sessions, previous]
  );
  const consistency = useMemo(
    () => computeConsistency(sessions, period.start, period.end),
    [sessions, period]
  );
  const bestDay = useMemo(
    () => computeBestDay(sessions, period.start, period.end),
    [sessions, period]
  );
  const bestMonth = useMemo(() => computeBestMonth(sessions), [sessions]);
  const topProject = useMemo(
    () => projectDistribution(sessions, projects, period.start, period.end).items[0],
    [sessions, projects, period]
  );

  const weekdayStats = useMemo(() => {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const totals = names.map(() => 0);
    for (const s of periodFocus) totals[new Date(s.started_at).getDay()] += s.duration_seconds;
    return names.map((name, i) => ({ name, seconds: totals[i] }));
  }, [periodFocus]);

  const dayparts = useMemo(() => {
    const totals = new Map<string, number>(DAYPARTS.map((d) => [d.id, 0]));
    for (const s of periodFocus) {
      const part = daypartOf(new Date(s.started_at).getHours());
      totals.set(part.id, (totals.get(part.id) ?? 0) + s.duration_seconds);
    }
    const max = Math.max(...totals.values(), 1);
    return DAYPARTS.map((d) => ({
      ...d,
      seconds: totals.get(d.id) ?? 0,
      pct: ((totals.get(d.id) ?? 0) / max) * 100,
    }));
  }, [periodFocus]);
  const bestDaypart = [...dayparts].sort((a, b) => b.seconds - a.seconds)[0];

  const longest = useMemo(
    () => periodFocus.reduce((max, s) => Math.max(max, s.duration_seconds), 0),
    [periodFocus]
  );

  const comparedTo = isCurrent ? `this point last ${granularity}` : `the previous ${granularity}`;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:p-12">
        <ChartSkeleton />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <h1 className="sr-only">Insights</h1>
        <Lightbulb className="mb-4 h-12 w-12 text-text-muted" aria-hidden="true" />
        <p className="mb-1 text-lg font-medium text-text-base">Insights need a little history</p>
        <p className="mb-5 text-sm text-text-sub">
          After a few focus sessions you’ll see when you focus best and how consistent you are.
        </p>
        <Link to="/timer" className="btn-primary">
          Start a focus session
        </Link>
      </div>
    );
  }

  const hasPeriodData = periodFocus.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:p-12">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-text-base">Insights</h1>
        <p className="text-sm text-text-sub">When and how you focus best.</p>
      </div>
      <PeriodHeader
        label={nav.label}
        onPrev={nav.prev}
        onNext={nav.next}
        onToday={nav.today}
        isCurrent={isCurrent}
        granularity={granularity}
        onGranularityChange={nav.setGranularity}
      />

      {!hasPeriodData ? (
        <p className="rounded-lg border border-dashed border-border-base p-8 text-center text-sm text-text-sub">
          No focus sessions in this period. Try another {granularity}.
        </p>
      ) : (
        <>
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
              label="Active days"
              value={`${consistency.activeDays}/${consistency.totalDays}`}
              footnote={<span className="text-text-sub">{consistency.pct}% of days so far</span>}
            />
            <KpiCard
              label="Strongest weekday"
              value={bestDay ? bestDay.name.slice(0, 3) : '—'}
              footnote={
                <span className="text-text-sub">
                  {bestDay ? `${formatDuration(bestDay.seconds)} focused` : 'No focus yet'}
                </span>
              }
            />
            <KpiCard
              label="Longest session"
              value={longest > 0 ? formatDuration(longest) : '—'}
              footnote={<span className="text-text-sub">Best month: {bestMonth.name}</span>}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.55fr_1fr]">
            <WeekdayChart data={weekdayStats} />
            <section className="rounded-lg border border-border-base bg-bg-card p-5">
              <h2 className="text-md font-semibold text-text-base">Time of day</h2>
              <p className="mb-4 mt-0.5 text-sm text-text-sub">When your focus sessions start</p>
              <ul className="flex flex-col gap-3">
                {dayparts.map((d) => (
                  <li key={d.id}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-text-base">
                        {d.label} <span className="font-normal text-text-muted">{d.range}</span>
                      </span>
                      <span className="tabular-nums text-text-sub">
                        {formatDuration(d.seconds)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-base">
            Suggestions
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Recommendation icon={Brain} title="Your best time">
              Most of your focus starts in the {bestDaypart.label.toLowerCase()} (
              {bestDaypart.range}). Protect that window for your hardest work.
            </Recommendation>
            {topProject && (
              <Recommendation icon={Calendar} title="Where your time went">
                {topProject.name} took {topProject.pct}% of your focus this {granularity}
                {topProject.pct >= 70 ? ' — make sure other priorities aren’t slipping.' : '.'}
              </Recommendation>
            )}
            <Recommendation icon={Target} title="Consistency">
              {consistency.pct >= 70
                ? `You focused on ${consistency.activeDays} of ${consistency.totalDays} days. That’s a strong habit.`
                : consistency.pct >= 40
                  ? `You focused on ${consistency.activeDays} of ${consistency.totalDays} days. A short session on the quiet days would build momentum.`
                  : `You focused on ${consistency.activeDays} of ${consistency.totalDays} days. Try one 25-minute session a day to build the habit.`}
            </Recommendation>
          </div>
        </>
      )}
    </div>
  );
}

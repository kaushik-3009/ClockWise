import { useMemo } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HeatmapCalendar } from '@/components/stats/HeatmapCalendar';
import { StreakHeroCard } from '@/components/stats/StreakHeroCard';
import { StatsList } from '@/components/stats/StatsList';
import { DeltaBadge } from '@/components/stats/StatCard';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { formatDuration } from '@/lib/time';
import {
  ACTIVE_DAY_MIN_SECONDS,
  computeActiveDaysThisMonth,
  computeBestDay,
  computeBestMonth,
  computePeriodStats,
  dailyFocusSeries,
  deltaPercent,
} from '@/lib/stats';
import { computeCurrentStreak, computeLongestStreak } from '@/lib/streaks';
import { periodFor, previousPeriod } from '@/lib/period';

export function StreaksPage() {
  usePageTitle('Streaks');
  const { sessions, loading } = useSessions();

  const currentStreak = useMemo(() => computeCurrentStreak(sessions), [sessions]);
  const longestStreak = useMemo(() => computeLongestStreak(sessions), [sessions]);
  const bestMonth = useMemo(() => computeBestMonth(sessions), [sessions]);
  const activeThisMonth = useMemo(() => computeActiveDaysThisMonth(sessions), [sessions]);

  const lastWeek = useMemo(
    () =>
      dailyFocusSeries(sessions, 7).map((d, i, arr) => ({
        label: d.date.toLocaleDateString(undefined, { weekday: 'narrow' }),
        date: d.date.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
        active: d.focusSeconds >= ACTIVE_DAY_MIN_SECONDS,
        isToday: i === arr.length - 1,
      })),
    [sessions]
  );

  const month = useMemo(() => {
    const current = periodFor('month', new Date());
    const previous = previousPeriod('month', current);
    const stats = computePeriodStats(sessions, current.start, current.end);
    const prev = computePeriodStats(sessions, previous.start, previous.end);
    return { stats, delta: deltaPercent(stats.focus_seconds, prev.focus_seconds) };
  }, [sessions]);

  const bestWeekday = useMemo(() => {
    const all = computeBestDay(sessions, new Date(0), new Date());
    return all?.name ?? '—';
  }, [sessions]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:p-12">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:p-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-base">Streaks</h1>
        <p className="text-sm text-text-sub">
          A day counts when you focus for at least a minute. Build the habit one day at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <section className="rounded-2xl border border-border-base bg-bg-card p-4 sm:p-6">
            <HeatmapCalendar />
          </section>
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <StreakHeroCard streak={currentStreak} longest={longestStreak} lastWeek={lastWeek} />
          <StatsList
            rows={[
              {
                label: 'Longest streak',
                value: `${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`,
              },
              {
                label: 'Active days this month',
                value: `${activeThisMonth.active} of ${activeThisMonth.total}`,
              },
              { label: 'Focus this month', value: formatDuration(month.stats.focus_seconds) },
              { label: 'Best month', value: bestMonth.name },
              { label: 'Strongest weekday (all time)', value: bestWeekday },
            ]}
          />
          <p className="px-1 text-xs font-semibold">
            <DeltaBadge delta={month.delta} comparedTo="this point last month" />
          </p>
        </div>
      </div>
    </div>
  );
}

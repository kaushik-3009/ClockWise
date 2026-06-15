import { useMemo, useState, useCallback } from 'react';
import { BarChart3, Target } from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addMonths,
  subMonths,
  format,
  eachDayOfInterval,
  getISOWeek,
} from 'date-fns';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { PeriodHeader, type Granularity } from '@/components/stats/PeriodHeader';
import { FocusTimeChart } from '@/components/stats/FocusTimeChart';
import { SessionsChart } from '@/components/stats/SessionsChart';
import { FocusVsBreakDonut } from '@/components/stats/FocusVsBreakDonut';
import { FocusDistribution } from '@/components/stats/FocusDistribution';
import { TrendChart } from '@/components/stats/TrendChart';
import {
  computePeriodStats,
  groupSessionsByDay,
  computeCurrentWeekFocusSeconds,
  deltaPercent,
} from '@/lib/stats';
import { formatDuration } from '@/lib/time';
import { useSettings } from '@/hooks/useSettings';

export function StatisticsPage() {
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { sessions } = useSessions();
  const { activeProjects } = useProjects();
  const { tasks } = useTasks();
  const { settings } = useSettings();

  const period = useMemo(() => {
    switch (granularity) {
      case 'day':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case 'week':
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
      case 'month':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  }, [granularity, currentDate]);

  // Charts show the week when day granularity is selected (so there's actual data to see)
  const chartPeriod = useMemo(() => {
    if (granularity !== 'day') return period;
    return {
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    };
  }, [granularity, period, currentDate]);

  const highlightDayLabel = format(new Date(), 'EEE');

  const periodLabel = useMemo(() => {
    switch (granularity) {
      case 'day':
        return format(currentDate, 'dd.MM.yyyy');
      case 'week':
        return `${format(period.start, 'dd.MM')} – ${format(period.end, 'dd.MM.yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  }, [granularity, currentDate, period]);

  const stats = useMemo(() => {
    return computePeriodStats(sessions, period.start, period.end);
  }, [sessions, period]);

  // Previous period for delta comparison
  const prevPeriod = useMemo(() => {
    switch (granularity) {
      case 'day':
        return {
          start: startOfDay(subDays(currentDate, 1)),
          end: endOfDay(subDays(currentDate, 1)),
        };
      case 'week': {
        const prevWeek = subWeeks(currentDate, 1);
        return {
          start: startOfWeek(prevWeek, { weekStartsOn: 1 }),
          end: endOfWeek(prevWeek, { weekStartsOn: 1 }),
        };
      }
      case 'month': {
        const prevMonth = subMonths(currentDate, 1);
        return {
          start: startOfMonth(prevMonth),
          end: endOfMonth(prevMonth),
        };
      }
    }
  }, [granularity, currentDate]);

  const prevStats = useMemo(() => {
    return computePeriodStats(sessions, prevPeriod.start, prevPeriod.end);
  }, [sessions, prevPeriod]);

  const focusDelta = useMemo(() => {
    return deltaPercent(stats.focus_seconds, prevStats.focus_seconds);
  }, [stats, prevStats]);

  const sessionsDelta = useMemo(() => {
    return deltaPercent(stats.sessions_completed, prevStats.sessions_completed);
  }, [stats, prevStats]);

  const handlePrev = useCallback(() => {
    switch (granularity) {
      case 'day':
        setCurrentDate((d) => subDays(d, 1));
        break;
      case 'week':
        setCurrentDate((d) => subWeeks(d, 1));
        break;
      case 'month':
        setCurrentDate((d) => subMonths(d, 1));
        break;
    }
  }, [granularity]);

  const handleNext = useCallback(() => {
    switch (granularity) {
      case 'day':
        setCurrentDate((d) => addDays(d, 1));
        break;
      case 'week':
        setCurrentDate((d) => addWeeks(d, 1));
        break;
      case 'month':
        setCurrentDate((d) => addMonths(d, 1));
        break;
    }
  }, [granularity]);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);

  // Chart data preparation
  const sessionsByDay = useMemo(() => groupSessionsByDay(sessions), [sessions]);

  const focusTimeData = useMemo(() => {
    if (granularity === 'month') {
      const weeks = new Map<number, number>();
      const days = eachDayOfInterval({ start: chartPeriod.start, end: chartPeriod.end });
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd');
        const daySessions = sessionsByDay.get(key) ?? [];
        const focusSeconds = daySessions
          .filter((s) => s.type === 'focus')
          .reduce((sum, s) => sum + s.duration_seconds, 0);
        const weekNum = getISOWeek(d);
        weeks.set(weekNum, (weeks.get(weekNum) ?? 0) + focusSeconds);
      }
      return Array.from(weeks.entries()).map(([week, focusSeconds]) => ({
        day: `W${week}`,
        focusSeconds,
      }));
    }

    const chartDays = eachDayOfInterval({ start: chartPeriod.start, end: chartPeriod.end }).map(
      (d) => ({
        label: format(d, 'EEE'),
        key: format(d, 'yyyy-MM-dd'),
      })
    );

    return chartDays.map((day) => {
      const daySessions = sessionsByDay.get(day.key) ?? [];
      const focusSeconds = daySessions
        .filter((s) => s.type === 'focus')
        .reduce((sum, s) => sum + s.duration_seconds, 0);
      return { day: day.label, focusSeconds };
    });
  }, [granularity, chartPeriod, sessionsByDay]);

  const sessionsData = useMemo(() => {
    if (granularity === 'month') {
      const weeks = new Map<number, { started: number; completed: number }>();
      const days = eachDayOfInterval({ start: chartPeriod.start, end: chartPeriod.end });
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd');
        const daySessions = sessionsByDay.get(key) ?? [];
        const weekNum = getISOWeek(d);
        const existing = weeks.get(weekNum) ?? { started: 0, completed: 0 };
        existing.started += daySessions.length;
        existing.completed += daySessions.filter((s) => s.completed).length;
        weeks.set(weekNum, existing);
      }
      return Array.from(weeks.entries()).map(([week, vals]) => ({
        day: `W${week}`,
        started: vals.started,
        completed: vals.completed,
      }));
    }

    const chartDays = eachDayOfInterval({ start: chartPeriod.start, end: chartPeriod.end }).map(
      (d) => ({
        label: format(d, 'EEE'),
        key: format(d, 'yyyy-MM-dd'),
      })
    );

    return chartDays.map((day) => {
      const daySessions = sessionsByDay.get(day.key) ?? [];
      return {
        day: day.label,
        started: daySessions.length,
        completed: daySessions.filter((s) => s.completed).length,
      };
    });
  }, [granularity, chartPeriod, sessionsByDay]);

  // Filtered to selected period
  const periodStartMs = period.start.getTime();
  const periodEndMs = period.end.getTime();

  const { focusSeconds, breakSeconds } = useMemo(() => {
    const inRange = sessions.filter(
      (s) => s.started_at >= periodStartMs && s.started_at <= periodEndMs
    );
    const focus = inRange
      .filter((s) => s.type === 'focus')
      .reduce((sum, s) => sum + s.duration_seconds, 0);
    const breaks = inRange
      .filter((s) => s.type !== 'focus' && s.completed)
      .reduce((sum, s) => sum + s.duration_seconds, 0);
    return { focusSeconds: focus, breakSeconds: breaks };
  }, [sessions, periodStartMs, periodEndMs]);

  // Tasks completed in period
  const completedTasksCount = useMemo(() => {
    return tasks.filter((t) => t.is_completed).length;
  }, [tasks]);

  // Focus distribution (Insights format)
  const focusDistribution = useMemo(() => {
    const map = new Map<string, { name: string; color: string; seconds: number }>();
    let total = 0;
    for (const s of sessions) {
      if (s.type !== 'focus' || !s.project_id) continue;
      if (s.started_at < periodStartMs || s.started_at > periodEndMs) continue;
      const p = activeProjects.find((ap) => ap.id === s.project_id);
      if (!p) continue;
      total += s.duration_seconds;
      const existing = map.get(s.project_id);
      if (existing) {
        existing.seconds += s.duration_seconds;
      } else {
        map.set(s.project_id, { name: p.name, color: p.color, seconds: s.duration_seconds });
      }
    }
    const items = Array.from(map.values())
      .map((item) => ({ ...item, pct: total > 0 ? Math.round((item.seconds / total) * 100) : 0 }))
      .sort((a, b) => b.seconds - a.seconds);
    return { items, total };
  }, [sessions, activeProjects, periodStartMs, periodEndMs]);

  const top2Share = useMemo(() => {
    if (focusDistribution.items.length === 0) return 0;
    return focusDistribution.items.slice(0, 2).reduce((sum, item) => sum + item.pct, 0);
  }, [focusDistribution]);

  // 30-day trend data (always last 30 days regardless of selected period)
  const trendData = useMemo(() => {
    const byDay = groupSessionsByDay(sessions);
    const today = new Date();
    const result: { day: string; focusSeconds: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      const daySessions = byDay.get(key) ?? [];
      const focusSeconds = daySessions
        .filter((s) => s.type === 'focus')
        .reduce((sum, s) => sum + s.duration_seconds, 0);
      result.push({
        day: format(d, 'MMM d'),
        focusSeconds,
      });
    }
    return result;
  }, [sessions]);

  const hasData = sessions.length > 0;

  const deltaBadgeClass = (value: number) => {
    if (value > 0) return 'text-[var(--color-success)]';
    if (value < 0) return 'text-[var(--color-error)]';
    return 'text-text-sub';
  };

  const deltaBadgeBg = (value: number) => {
    if (value > 0) return 'color-mix(in srgb, var(--color-success) 10%, transparent)';
    if (value < 0) return 'color-mix(in srgb, var(--color-error) 10%, transparent)';
    return 'var(--bg-secondary)';
  };

  return (
    <div className="p-6 lg:p-12 w-full 2xl:max-w-[1600px] 2xl:mx-auto animate-[page-enter_200ms_ease]">
      <PeriodHeader
        label={periodLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        granularity={granularity}
        onGranularityChange={(g) => {
          setGranularity(g);
          setCurrentDate(new Date());
        }}
      />

      {settings.weekly_goal_hours > 0 && (
        <div className="bg-bg-card border border-border-base rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-alpha flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-text-base">Weekly Goal</span>
              <span className="text-xs text-text-sub">
                {formatDuration(computeCurrentWeekFocusSeconds(sessions))} /{' '}
                {settings.weekly_goal_hours}h
              </span>
            </div>
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-slow"
                style={{
                  width: `${Math.min(
                    (computeCurrentWeekFocusSeconds(sessions) / 3600 / settings.weekly_goal_hours) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <BarChart3 className="w-12 h-12 mb-4 opacity-80" />
          <p className="text-lg font-medium mb-2">No sessions yet</p>
          <p className="text-sm">Complete a focus session to see your statistics</p>
        </div>
      ) : (
        <>
          {/* KPI Cards — styled like Insights */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">Focus time</div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {formatDuration(stats.focus_seconds)}
              </div>
              <div
                className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full text-[13px] font-bold"
                style={{ backgroundColor: deltaBadgeBg(focusDelta) }}
              >
                <span className={deltaBadgeClass(focusDelta)}>
                  {focusDelta > 0 ? '+' : ''}
                  {focusDelta}% vs last {granularity}
                </span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">Total time</div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {formatDuration(stats.total_seconds)}
              </div>
              <div className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full bg-bg-secondary text-text-sub text-[13px] font-bold">
                Including breaks
              </div>
            </div>

            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">Procedures</div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {stats.sessions_started}
              </div>
              <div
                className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full text-[13px] font-bold"
                style={{ backgroundColor: deltaBadgeBg(sessionsDelta) }}
              >
                <span className={deltaBadgeClass(sessionsDelta)}>
                  {sessionsDelta > 0 ? '+' : ''}
                  {sessionsDelta}% completed vs last {granularity}
                </span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">
                Finished Flows
              </div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {stats.sessions_completed}
              </div>
              <div className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full bg-bg-secondary text-text-sub text-[13px] font-bold">
                Fully completed sessions
              </div>
            </div>

            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">Tasks Done</div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {completedTasksCount}
              </div>
              <div className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full bg-bg-secondary text-text-sub text-[13px] font-bold">
                Completed tasks
              </div>
            </div>
          </div>

          {/* Charts — aligned 2x2 grid, left charts ~65% */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-4 mb-4 items-stretch">
            <FocusTimeChart data={focusTimeData} highlightDay={highlightDayLabel} />
            <FocusVsBreakDonut focusSeconds={focusSeconds} breakSeconds={breakSeconds} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-4 mb-4 items-stretch">
            <SessionsChart data={sessionsData} highlightDay={highlightDayLabel} />
            <FocusDistribution
              items={focusDistribution.items}
              topNShare={top2Share}
              weeklyTargetPct={
                settings.weekly_goal_hours > 0
                  ? Math.min(
                      Math.round(
                        (computeCurrentWeekFocusSeconds(sessions) /
                          3600 /
                          settings.weekly_goal_hours) *
                          100
                      ),
                      100
                    )
                  : undefined
              }
            />
          </div>

          {/* 30-day trend */}
          <TrendChart data={trendData} />
        </>
      )}
    </div>
  );
}

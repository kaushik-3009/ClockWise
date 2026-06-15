import { useMemo, useState, useCallback } from 'react';
import { Brain, Calendar, Target } from 'lucide-react';
import { TrendChart } from '@/components/stats/TrendChart';
import { WeekdayChart } from '@/components/stats/WeekdayChart';
import { FocusDistribution } from '@/components/stats/FocusDistribution';
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
} from 'date-fns';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import { useSettings } from '@/hooks/useSettings';
import { PeriodHeader, type Granularity } from '@/components/stats/PeriodHeader';
import { formatDuration, formatDateKey } from '@/lib/time';
import { PROJECT_COLORS } from '@/lib/constants';
import {
  groupSessionsByDay,
  computeCurrentWeekFocusSeconds,
  computePeriodStats,
  computeBestDay,
  computeConsistency,
  computeTopNShare,
  computePeriodDelta,
} from '@/lib/stats';

export function InsightsPage() {
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { sessions } = useSessions();
  const { activeProjects } = useProjects();
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

  const periodStats = useMemo(() => {
    return computePeriodStats(sessions, period.start, period.end);
  }, [sessions, period]);

  const periodSessions = useMemo(() => {
    const startMs = period.start.getTime();
    const endMs = period.end.getTime();
    return sessions.filter((s) => s.started_at >= startMs && s.started_at <= endMs);
  }, [sessions, period]);

  const daytimeStats = useMemo(() => {
    const stats = { morning: 0, noon: 0, evening: 0 };
    const sessionsCount = { morning: 0, noon: 0, evening: 0 };

    for (const s of periodSessions) {
      if (s.type !== 'focus') continue;
      const hour = new Date(s.started_at).getHours();
      if (hour >= 4 && hour < 11) {
        stats.morning += s.duration_seconds;
        sessionsCount.morning++;
      } else if (hour >= 11 && hour < 17) {
        stats.noon += s.duration_seconds;
        sessionsCount.noon++;
      } else {
        stats.evening += s.duration_seconds;
        sessionsCount.evening++;
      }
    }

    return { stats, sessionsCount };
  }, [periodSessions]);

  const weekdayStats = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const stats = days.map(() => 0);
    for (const s of periodSessions) {
      if (s.type !== 'focus') continue;
      const day = new Date(s.started_at).getDay();
      stats[day] += s.duration_seconds;
    }
    return days.map((name, i) => ({ name, seconds: stats[i] }));
  }, [periodSessions]);

  const bestDay = useMemo(() => {
    return computeBestDay(sessions, period.start, period.end);
  }, [sessions, period]);

  const consistency = useMemo(() => {
    return computeConsistency(sessions, period.start, period.end);
  }, [sessions, period]);

  const delta = useMemo(() => {
    return computePeriodDelta(sessions, period.start, period.end);
  }, [sessions, period]);

  const topProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of periodSessions) {
      if (s.project_id && s.type === 'focus') {
        map.set(s.project_id, (map.get(s.project_id) ?? 0) + s.duration_seconds);
      }
    }
    let maxId = '';
    let maxSeconds = 0;
    for (const [id, seconds] of map) {
      if (seconds > maxSeconds) {
        maxSeconds = seconds;
        maxId = id;
      }
    }
    return activeProjects.find((p) => p.id === maxId);
  }, [periodSessions, activeProjects]);

  const consistencyScore = useMemo(() => {
    const byDay = groupSessionsByDay(periodSessions);
    if (byDay.size === 0) return 0;
    const totalDays = Math.max(byDay.size, 1);
    const activeDays = Array.from(byDay.values()).filter((daySessions) =>
      daySessions.some((s) => s.type === 'focus')
    ).length;
    return Math.round((activeDays / totalDays) * 100);
  }, [periodSessions]);

  const focusDistribution = useMemo(() => {
    const map = new Map<string, { name: string; color: string; seconds: number }>();
    let total = 0;
    for (const s of periodSessions) {
      if (s.type !== 'focus' || !s.project_id) continue;
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
  }, [periodSessions, activeProjects]);

  const top2Share = useMemo(() => {
    return computeTopNShare(focusDistribution.items, 2);
  }, [focusDistribution]);

  const weeklyTargetPct = useMemo(() => {
    if (settings.weekly_goal_hours <= 0) return undefined;
    const current = computeCurrentWeekFocusSeconds(sessions);
    return Math.min(Math.round((current / 3600 / settings.weekly_goal_hours) * 100), 100);
  }, [sessions, settings.weekly_goal_hours]);

  // 30-day trend (always last 30 days, not filtered by period)
  const trendData = useMemo(() => {
    const byDay = groupSessionsByDay(sessions);
    const today = new Date();
    const result: { day: string; focusSeconds: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDateKey(d);
      const daySessions = byDay.get(key) ?? [];
      const focusSeconds = daySessions
        .filter((s) => s.type === 'focus')
        .reduce((sum, s) => sum + s.duration_seconds, 0);
      result.push({
        day: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        focusSeconds,
      });
    }
    return result;
  }, [sessions]);

  // Insight text for weekday chart
  const weekdayInsight = useMemo(() => {
    if (weekdayStats.every((d) => d.seconds === 0)) return undefined;
    const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const best = weekdayStats.reduce(
      (m, d, i) => (d.seconds > m.seconds ? { idx: i, seconds: d.seconds } : m),
      { idx: 0, seconds: 0 }
    );
    const active = weekdayStats.filter((d) => d.seconds > 0).length;
    return `Most of your focus happens across ${active} days, with ${short[best.idx]} as the strongest day.`;
  }, [weekdayStats]);

  const hasData = sessions.length > 0;
  const hasPeriodData = periodSessions.length > 0;

  // KPI card data
  const longSessions = useMemo(() => {
    return periodSessions.filter((s) => s.type === 'focus' && s.duration_seconds > 50 * 60).length;
  }, [periodSessions]);

  const activeWeekdays = useMemo(() => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return weekdayStats.filter((d) => weekdays.includes(d.name) && d.seconds > 0).length;
  }, [weekdayStats]);

  const deltaBadgeClass = (value: number) => {
    if (value > 0) {
      return 'text-[var(--color-success)]';
    }
    if (value < 0) {
      return 'text-[var(--color-error)]';
    }
    return 'text-text-sub';
  };

  const deltaBadgeBg = (value: number) => {
    if (value > 0) {
      return 'color-mix(in srgb, var(--color-success) 10%, transparent)';
    }
    if (value < 0) {
      return 'color-mix(in srgb, var(--color-error) 10%, transparent)';
    }
    return 'var(--bg-secondary)';
  };

  return (
    <div className="p-6 lg:p-12 w-full 2xl:max-w-[1600px] 2xl:mx-auto animate-[page-enter_200ms_ease]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] lg:text-[32px] font-semibold text-text-base leading-[1.05] mb-1">
            Insights
          </h1>
          <p className="text-[15px] text-text-sub max-w-[60ch]">
            Deep analytics into your focus patterns and productivity trends.
          </p>
        </div>
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
          className="mb-0"
        />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Target className="w-12 h-12 mb-4 opacity-80" />
          <p className="text-lg font-medium mb-2">No data yet</p>
          <p className="text-sm">Complete some focus sessions to get insights</p>
        </div>
      ) : !hasPeriodData ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Target className="w-12 h-12 mb-4 opacity-80" />
          <p className="text-lg font-medium mb-2">No data for this period</p>
          <p className="text-sm">Try selecting a different time range</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">
                Total focus time
              </div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {formatDuration(periodStats.focus_seconds)}
              </div>
              <div
                className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full text-[13px] font-bold"
                style={{ backgroundColor: deltaBadgeBg(delta.focusSecondsDelta) }}
              >
                <span className={deltaBadgeClass(delta.focusSecondsDelta)}>
                  {delta.focusSecondsDelta > 0 ? '+' : ''}
                  {delta.focusSecondsDelta}% vs last {granularity}
                </span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">
                Completed sessions
              </div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {periodStats.sessions_completed}
              </div>
              <div
                className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full text-[13px] font-bold"
                style={{ backgroundColor: deltaBadgeBg(delta.sessionsDelta) }}
              >
                <span className={deltaBadgeClass(delta.sessionsDelta)}>
                  {longSessions} longer than 50 min
                </span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">Best day</div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {bestDay.seconds > 0 ? bestDay.name.slice(0, 3) : '-'}
              </div>
              <div className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full bg-bg-secondary text-text-sub text-[13px] font-bold">
                {bestDay.seconds > 0
                  ? `${(bestDay.seconds / 3600).toFixed(1)} hours focused`
                  : 'No focus yet'}
              </div>
            </div>

            <div className="bg-bg-card border border-border-base rounded-lg p-5 flex flex-col gap-3">
              <div className="text-[13px] text-text-sub font-bold tracking-wide">Consistency</div>
              <div className="text-[34px] font-display font-extrabold leading-none text-text-base">
                {consistency > 0 ? `${activeWeekdays}/7` : '-'}
              </div>
              <div className="inline-flex items-center gap-2 w-fit px-2.5 py-1.5 rounded-full bg-bg-secondary text-text-sub text-[13px] font-bold">
                Active weekdays
              </div>
            </div>
          </div>

          {/* Two-column grid: weekday chart + focus distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mb-6 items-stretch">
            <WeekdayChart data={weekdayStats} insight={weekdayInsight} />
            <FocusDistribution
              items={focusDistribution.items}
              topNShare={top2Share}
              weeklyTargetPct={weeklyTargetPct}
            />
          </div>

          {/* 30-day trend */}
          <div className="mb-6">
            <TrendChart data={trendData} />
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="text-sm font-semibold text-text-base uppercase tracking-wide mb-4">
              Personalized recommendations
            </h2>
            <div className="flex flex-col gap-4">
              <div className="bg-bg-card border border-border-base rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-brand" />
                  <span className="text-sm font-semibold text-text-base">Your productive time</span>
                </div>
                <p className="text-sm text-text-sub">
                  {daytimeStats.stats.morning >= daytimeStats.stats.noon &&
                  daytimeStats.stats.morning >= daytimeStats.stats.evening
                    ? "You're most productive in the morning. Schedule your most important tasks before noon."
                    : daytimeStats.stats.noon >= daytimeStats.stats.evening
                      ? "You're most productive around noon. Use this time for deep work."
                      : "You're most productive in the evening. Plan your heavy tasks for late hours."}
                </p>
              </div>

              {topProject && (
                <div className="bg-bg-card border border-border-base rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-brand" />
                    <span className="text-sm font-semibold text-text-base">Top project</span>
                  </div>
                  <p className="text-sm text-text-sub">
                    You've focused the most on{' '}
                    <span
                      className="font-medium"
                      style={{
                        color: PROJECT_COLORS[topProject.color],
                      }}
                    >
                      {topProject.name}
                    </span>
                    . Keep up the momentum!
                  </p>
                </div>
              )}

              <div className="bg-bg-card border border-border-base rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-brand" />
                  <span className="text-sm font-semibold text-text-base">Consistency tip</span>
                </div>
                <p className="text-sm text-text-sub">
                  {consistencyScore >= 70
                    ? 'Great consistency! You maintain a strong daily focus habit.'
                    : consistencyScore >= 40
                      ? 'Building momentum. Try to focus at least 4 days a week for better results.'
                      : "Let's build the habit. Start with just 1 focus session per day."}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

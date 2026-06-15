import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { HeatmapCalendar } from '@/components/stats/HeatmapCalendar';
import { StreakHeroCard } from '@/components/stats/StreakHeroCard';
import { StatsList } from '@/components/stats/StatsList';
import { formatDateKey } from '@/lib/time';
import {
  groupFocusSessionsByDay,
  computeBestMonth,
  computeActiveDaysThisMonth,
  computePeriodStats,
  deltaPercent,
} from '@/lib/stats';
import { computeCurrentStreak, computeLongestStreak } from '@/lib/streaks';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function StreaksPage() {
  const { sessions } = useSessions();

  const currentStreak = useMemo(() => computeCurrentStreak(sessions), [sessions]);

  const longestStreak = useMemo(() => computeLongestStreak(sessions), [sessions]);
  const bestMonth = useMemo(() => computeBestMonth(sessions), [sessions]);
  const activeDaysThisMonth = useMemo(() => computeActiveDaysThisMonth(sessions), [sessions]);

  const completionRate = useMemo(() => {
    const focus = sessions.filter((s) => s.type === 'focus');
    if (focus.length === 0) return 0;
    return Math.round((focus.filter((s) => s.completed).length / focus.length) * 100);
  }, [sessions]);

  const bestWeekday = useMemo(() => {
    const stats = DAY_FULL.map(() => 0);
    for (const s of sessions) {
      if (s.type !== 'focus') continue;
      stats[new Date(s.started_at).getDay()] += s.duration_seconds;
    }
    let maxIdx = 0;
    let maxVal = 0;
    for (let i = 0; i < 7; i++) {
      if (stats[i] > maxVal) {
        maxVal = stats[i];
        maxIdx = i;
      }
    }
    return maxVal > 0 ? DAY_FULL[maxIdx] : '-';
  }, [sessions]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return computePeriodStats(sessions, start, end);
  }, [sessions]);

  const prevMonthStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, 1));
    const end = endOfMonth(subMonths(now, 1));
    return computePeriodStats(sessions, start, end);
  }, [sessions]);

  const monthDelta = useMemo(() => {
    return deltaPercent(monthStats.focus_seconds, prevMonthStats.focus_seconds);
  }, [monthStats, prevMonthStats]);

  // Which weekdays are currently in the streak?
  const activeStreakDays = useMemo(() => {
    if (currentStreak === 0) return [];

    const byDay = groupFocusSessionsByDay(sessions);
    const today = formatDateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatDateKey(yesterdayDate);

    const sortedDays = Array.from(byDay.keys()).sort((a, b) => b.localeCompare(a));
    const mostRecentDay = sortedDays[0];
    if (!mostRecentDay || (mostRecentDay !== today && mostRecentDay !== yesterday)) {
      return [];
    }

    const [y, m, d] = mostRecentDay.split('-').map(Number);
    const mostRecentDate = new Date(y, m - 1, d);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(mostRecentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const key = formatDateKey(checkDate);
      const daySessions = byDay.get(key) ?? [];
      if (daySessions.length > 0) {
        days.push(DAY_FULL[checkDate.getDay()]);
      } else {
        break;
      }
    }
    return days;
  }, [sessions, currentStreak]);

  const now = new Date();
  const dateChip = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;

  const totalFocusHours = Math.round((monthStats.focus_seconds / 3600) * 10) / 10;
  const totalSessions = monthStats.sessions_completed;

  return (
    <div className="p-6 lg:p-12 w-full 2xl:max-w-[1600px] 2xl:mx-auto animate-[page-enter_200ms_ease]">
      {/* Hero header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-light border border-brand-alpha text-brand text-[12px] font-extrabold uppercase tracking-wide mb-3">
            <Flame className="w-3.5 h-3.5" />
            Focus history
          </div>
          <h1 className="text-[32px] lg:text-[40px] font-semibold text-text-base leading-[1] tracking-[-0.02em] mb-2">
            Streaks
          </h1>
          <p className="text-[15px] text-text-sub max-w-[62ch] leading-relaxed">
            Build your focus habit day by day. Track streaks, activity patterns, and monthly
            progress.
          </p>
        </div>
        <div className="inline-flex items-center gap-2.5 bg-bg-card border border-border-base rounded-full px-4 py-2.5 shadow-card text-text-sub text-sm font-bold whitespace-nowrap">
          {dateChip}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Left area — heatmap + stat boxes below */}
        <div className="flex flex-col gap-4">
          {/* Heatmap card */}
          <div className="bg-bg-card border border-border-base rounded-2xl overflow-hidden">
            <div className="p-5 lg:p-6">
              {/* Heatmap header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-[21px] font-extrabold text-text-base tracking-[-0.03em]">
                    Activity heatmap
                  </h2>
                  <p className="text-sm text-text-sub mt-1">
                    Each square reflects how many focus sessions you completed on that day.
                  </p>
                </div>
              </div>

              {/* KPIs above heatmap */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="p-4 rounded-2xl bg-bg-secondary border border-border-base">
                  <div className="text-[12px] text-text-sub font-bold uppercase tracking-[0.05em] mb-2">
                    Current streak
                  </div>
                  <div className="text-[30px] font-display font-extrabold leading-none tracking-[-0.04em] text-text-base mb-2">
                    {currentStreak} day{currentStreak === 1 ? '' : 's'}
                  </div>
                  <div className="text-[13px] text-text-sub leading-snug">
                    {currentStreak > 0
                      ? `You are currently active from ${activeStreakDays[activeStreakDays.length - 1]} through ${activeStreakDays[0]}.`
                      : 'No active streak right now.'}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-bg-secondary border border-border-base">
                  <div className="text-[12px] text-text-sub font-bold uppercase tracking-[0.05em] mb-2">
                    Best month
                  </div>
                  <div className="text-[30px] font-display font-extrabold leading-none tracking-[-0.04em] text-text-base mb-2">
                    {bestMonth.name}
                  </div>
                  <div className="text-[13px] text-text-sub leading-snug">
                    Most consistent run so far this year.
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-bg-secondary border border-border-base">
                  <div className="text-[12px] text-text-sub font-bold uppercase tracking-[0.05em] mb-2">
                    Completion rate
                  </div>
                  <div className="text-[30px] font-display font-extrabold leading-none tracking-[-0.04em] text-text-base mb-2">
                    {completionRate}%
                  </div>
                  <div className="text-[13px] text-text-sub leading-snug">
                    Share of planned focus days completed.
                  </div>
                </div>
              </div>

              {/* Streak banners */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="p-4 rounded-2xl bg-brand-light border border-brand-alpha">
                  <strong className="block text-base font-bold text-text-base mb-1.5 tracking-[-0.02em]">
                    Streak story
                  </strong>
                  <p className="text-sm text-text-sub leading-relaxed m-0">
                    {currentStreak >= 5
                      ? 'You are on a strong streak. The heatmap shows a consistent rhythm—keep it going.'
                      : currentStreak >= 2
                        ? 'Momentum is building. A few more days and you will hit a new personal best.'
                        : 'Every streak starts with one focused day. Tomorrow is your chance.'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-bg-secondary border border-border-base">
                  <strong className="block text-base font-bold text-text-base mb-1.5 tracking-[-0.02em]">
                    This month
                  </strong>
                  <p className="text-sm text-text-sub leading-relaxed m-0">
                    {totalFocusHours > 0
                      ? `You have logged ${totalFocusHours}h of focus time across ${totalSessions} completed sessions. ${monthDelta > 0 ? `That is ${monthDelta}% more focus than last month.` : monthDelta < 0 ? `That is ${Math.abs(monthDelta)}% less than last month.` : 'Same focus volume as last month.'}`
                      : 'No focus sessions recorded this month yet. Start today.'}
                  </p>
                </div>
              </div>

              {/* Heatmap */}
              <HeatmapCalendar />
            </div>
          </div>

          {/* Stat boxes below heatmap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-border-base bg-bg-card">
              <h3 className="text-base font-bold text-text-base mb-2.5 tracking-[-0.02em]">
                Monthly focus time
              </h3>
              <p className="text-sm text-text-sub leading-relaxed m-0">
                {totalFocusHours > 0
                  ? `You have focused for ${totalFocusHours} hours this month. ${bestMonth.focusSeconds > 0 ? `Your best month was ${bestMonth.name} with ${(bestMonth.focusSeconds / 3600).toFixed(1)} hours.` : ''}`
                  : 'Complete a session to start tracking your monthly focus time.'}
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-border-base bg-bg-card">
              <h3 className="text-base font-bold text-text-base mb-2.5 tracking-[-0.02em]">
                Session consistency
              </h3>
              <p className="text-sm text-text-sub leading-relaxed m-0">
                {totalSessions > 0
                  ? `You completed ${totalSessions} focus sessions this month. Aiming for at least one session per day builds the strongest habit.`
                  : 'Consistency compounds. Aim for one focused session every day.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right column — side stack */}
        <div className="flex flex-col gap-4">
          <StreakHeroCard
            streak={currentStreak}
            activeDays={activeStreakDays}
            copy={
              currentStreak > 0
                ? 'You are currently in an active streak. Each day of focus compounds into a stronger habit.'
                : 'Complete a session today to start your streak. Every focused day counts.'
            }
          />

          <StatsList
            rows={[
              {
                label: 'Longest streak',
                value: `${longestStreak} day${longestStreak === 1 ? '' : 's'}`,
              },
              {
                label: 'Active days this month',
                value: `${activeDaysThisMonth.active} / ${activeDaysThisMonth.total}`,
              },
              { label: 'Best day', value: bestWeekday },
              { label: 'Sessions this month', value: `${totalSessions}` },
            ]}
          />

          <div className="p-5 rounded-2xl border border-border-base bg-bg-card">
            <h3 className="text-base font-bold text-text-base mb-2.5 tracking-[-0.02em]">
              Monthly focus
            </h3>
            <p className="text-sm text-text-sub leading-relaxed m-0">
              {totalFocusHours > 0
                ? `Total focus this month: ${totalFocusHours}h. ${monthDelta > 0 ? `Up ${monthDelta}% from last month.` : monthDelta < 0 ? `Down ${Math.abs(monthDelta)}% from last month.` : 'Same as last month.'}`
                : 'Your monthly focus summary will appear here once you complete a session.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

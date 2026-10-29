import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToday } from '@/hooks/useToday';

export type Granularity = 'day' | 'week' | 'month';

export interface Period {
  start: Date;
  end: Date;
}

function startOf(g: Granularity, date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (g === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (g === 'month') d.setDate(1);
  return d;
}

function shift(g: Granularity, date: Date, n: number): Date {
  const d = new Date(date);
  if (g === 'day') d.setDate(d.getDate() + n);
  if (g === 'week') d.setDate(d.getDate() + 7 * n);
  if (g === 'month') d.setMonth(d.getMonth() + n, 1);
  return d;
}

export function periodFor(g: Granularity, date: Date): Period {
  const start = startOf(g, date);
  const end = new Date(shift(g, start, 1).getTime() - 1);
  return { start, end };
}

/**
 * The period to compare against. For a period still in progress, compare
 * against the same elapsed portion of the previous one ("this week so far" vs
 * "last week up to the same point"), so a Tuesday never looks like a -70% week.
 */
export function previousPeriod(g: Granularity, current: Period, now = new Date()): Period {
  const prev = periodFor(g, shift(g, current.start, -1));
  if (now >= current.start && now <= current.end) {
    // Same wall-clock moment in the previous period (calendar arithmetic, so a
    // DST change in between doesn't shift it by an hour). Months clamp to the
    // shorter month's last day.
    const same = new Date(now);
    if (g === 'day') same.setDate(same.getDate() - 1);
    if (g === 'week') same.setDate(same.getDate() - 7);
    if (g === 'month') {
      const day = same.getDate();
      same.setDate(1);
      same.setMonth(same.getMonth() - 1);
      const last = new Date(same.getFullYear(), same.getMonth() + 1, 0).getDate();
      same.setDate(Math.min(day, last));
    }
    return { start: prev.start, end: new Date(Math.min(same.getTime(), prev.end.getTime())) };
  }
  return prev;
}

export function periodLabel(g: Granularity, p: Period): string {
  const sameYear = p.start.getFullYear() === new Date().getFullYear();
  if (g === 'day') {
    return p.start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
    });
  }
  if (g === 'month') {
    return p.start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const end = p.end.toLocaleDateString(undefined, {
    ...opts,
    year: sameYear ? undefined : 'numeric',
  });
  return `${p.start.toLocaleDateString(undefined, opts)} – ${end}`;
}

/** Shared period navigation state for the stats pages. */
export function usePeriod(initial: Granularity = 'week') {
  const [granularity, setGranularityState] = useState<Granularity>(initial);
  const [anchor, setAnchor] = useState(() => new Date());

  // If the user is looking at the current period when the day rolls over, follow
  // the clock into the new day/week/month.
  const todayKey = useToday();
  const lastToday = useRef(todayKey);
  useEffect(() => {
    if (lastToday.current === todayKey) return;
    const wasCurrent = periodFor(granularity, new Date(Date.now() - 86_400_000));
    if (anchor >= wasCurrent.start && anchor <= wasCurrent.end) setAnchor(new Date());
    lastToday.current = todayKey;
  }, [todayKey, granularity, anchor]);

  const period = useMemo(() => periodFor(granularity, anchor), [granularity, anchor]);
  const previous = useMemo(() => previousPeriod(granularity, period), [granularity, period]);
  const isCurrent = useMemo(() => {
    const now = new Date();
    return now >= period.start && now <= period.end;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-evaluate when the day changes
  }, [period, todayKey]);

  const setGranularity = useCallback((g: Granularity) => {
    setGranularityState(g);
    setAnchor(new Date());
  }, []);
  const prev = useCallback(() => setAnchor((d) => shift(granularity, d, -1)), [granularity]);
  const next = useCallback(() => setAnchor((d) => shift(granularity, d, 1)), [granularity]);
  const today = useCallback(() => setAnchor(new Date()), []);

  return {
    granularity,
    setGranularity,
    period,
    previous,
    isCurrent,
    label: periodLabel(granularity, period),
    prev,
    next,
    today,
  };
}

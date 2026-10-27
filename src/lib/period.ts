import { useCallback, useMemo, useState } from 'react';

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
    const elapsed = now.getTime() - current.start.getTime();
    return {
      start: prev.start,
      end: new Date(Math.min(prev.start.getTime() + elapsed, prev.end.getTime())),
    };
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

  const period = useMemo(() => periodFor(granularity, anchor), [granularity, anchor]);
  const previous = useMemo(() => previousPeriod(granularity, period), [granularity, period]);
  const isCurrent = useMemo(() => {
    const now = new Date();
    return now >= period.start && now <= period.end;
  }, [period]);

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

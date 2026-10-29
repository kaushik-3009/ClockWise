import { useEffect, useState } from 'react';
import { formatDateKey } from '@/lib/time';

/**
 * Today's date key, updated at local midnight (and when the app returns to the
 * foreground), so "this week" and "today" don't go stale in a long-open app.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => formatDateKey(new Date()));
  useEffect(() => {
    const check = () => setToday(formatDateKey(new Date()));
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const timer = window.setTimeout(check, nextMidnight.getTime() - now.getTime());
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [today]);
  return today;
}

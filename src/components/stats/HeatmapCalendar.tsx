import { useMemo, useState } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { groupFocusSessionsByDay, getHeatmapIntensityLevel, HEATMAP_GREEN } from '@/lib/stats';
import { formatDateKey } from '@/lib/time';
import { cn } from '@/lib/cn';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Session } from '@/types';

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface DayCell {
  date: string;
  focusSeconds: number;
  active: boolean;
  isToday: boolean;
  month: number;
  isPadding: boolean;
  dayOfMonth?: number | null;
}

export function HeatmapCalendar() {
  const { sessions } = useSessions();
  const navigate = useNavigate();
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    seconds: number;
    x: number;
    y: number;
  } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: currentYear - 2023 + 1 }, (_, i) => 2023 + i).reverse();

  const prevMonth = () => {
    setCurrentMonth((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };
  const nextMonth = () => {
    setCurrentMonth((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      if (next > now) return d;
      return next;
    });
  };
  const setYear = (year: number) => {
    setCurrentMonth(new Date(year, 0, 1));
  };

  const monthLabel = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const isCurrentMonth =
    currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();

  const hasActivity = (byDay: Map<string, Session[]>, key: string) => {
    const daySessions = byDay.get(key) ?? [];
    return daySessions.some((s) => s.type === 'focus');
  };

  // ── MONTH VIEW ─────────────────────────────
  const monthGrid = useMemo(() => {
    const byDay = groupFocusSessionsByDay(sessions);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const padStart = startDayOfWeek;
    const totalCells = padStart + daysInMonth;
    const remainingCells = 42 - totalCells;

    const cells: DayCell[] = [];

    for (let i = 0; i < padStart; i++) {
      cells.push({
        date: '',
        focusSeconds: 0,
        active: false,
        isToday: false,
        month: -1,
        isPadding: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = formatDateKey(d);
      const daySessions = byDay.get(key) ?? [];
      const focusSeconds = daySessions.reduce((sum, s) => sum + s.duration_seconds, 0);
      cells.push({
        date: key,
        focusSeconds,
        active: hasActivity(byDay, key),
        isToday: key === formatDateKey(new Date()),
        month: d.getMonth(),
        isPadding: false,
        dayOfMonth: day,
      });
    }

    for (let i = 0; i < remainingCells; i++) {
      cells.push({
        date: '',
        focusSeconds: 0,
        active: false,
        isToday: false,
        month: -1,
        isPadding: true,
      });
    }

    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [sessions, currentMonth]);

  // ── YEAR VIEW ──────────────────────────────
  const yearData = useMemo(() => {
    if (viewMode !== 'year') return null;

    const byDay = groupFocusSessionsByDay(sessions);
    const year = currentMonth.getFullYear();

    const jan1 = new Date(year, 0, 1);
    const startDay = jan1.getDay(); // 0=Sun
    const dec31 = new Date(year, 11, 31);
    const daysInYear = Math.ceil((dec31.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const startPad = startDay;
    const totalCells = startPad + daysInYear;
    const cols = Math.ceil(totalCells / 7);

    // Build columns (weeks): each column = [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    const columns: DayCell[][] = [];
    for (let ci = 0; ci < cols; ci++) {
      const col: DayCell[] = [];
      for (let ri = 0; ri < 7; ri++) {
        const idx = ci * 7 + ri;
        if (idx < startPad || idx >= startPad + daysInYear) {
          col.push({
            date: '',
            focusSeconds: 0,
            active: false,
            isToday: false,
            month: -1,
            isPadding: true,
          });
        } else {
          const dayIndex = idx - startPad;
          const d = new Date(jan1);
          d.setDate(d.getDate() + dayIndex);
          const key = formatDateKey(d);
          const daySessions = byDay.get(key) ?? [];
          const focusSeconds = daySessions.reduce((sum, s) => sum + s.duration_seconds, 0);
          col.push({
            date: key,
            focusSeconds,
            active: hasActivity(byDay, key),
            isToday: key === formatDateKey(new Date()),
            month: d.getMonth(),
            isPadding: false,
          });
        }
      }
      columns.push(col);
    }

    // Month labels: which column does each month start in?
    const monthLabels: (string | null)[] = new Array(cols).fill(null);
    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1);
      const dayOfYear = Math.floor((firstDay.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24));
      const colIndex = Math.floor((dayOfYear + startPad) / 7);
      monthLabels[colIndex] = MONTH_SHORT[m];
    }

    // Transpose to row-major for flat grid rendering
    // rows[0] = all Sundays, rows[1] = all Mondays, etc.
    const rows: DayCell[][] = [];
    for (let ri = 0; ri < 7; ri++) {
      const row: DayCell[] = [];
      for (let ci = 0; ci < cols; ci++) {
        row.push(columns[ci][ri]);
      }
      rows.push(row);
    }

    return { rows, monthLabels, cols, year };
  }, [sessions, currentMonth, viewMode]);

  const dayNamesShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleCellEnter = (day: { date: string; focusSeconds: number }, e: React.MouseEvent) => {
    if (!day.date) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredCell({
      date: day.date,
      seconds: day.focusSeconds,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleCellLeave = () => setHoveredCell(null);

  const handleCellClick = (day: { date: string; isPadding?: boolean }) => {
    if (!day.date || day.isPadding) return;
    navigate(`/history?date=${day.date}`);
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-text-base">Activity Heatmap</h3>
          <p className="text-xs text-text-sub">Focus sessions only</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border-base overflow-hidden mr-2">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium transition-colors',
                viewMode === 'month'
                  ? 'bg-brand text-white'
                  : 'text-text-sub hover:text-text-base hover:bg-bg-secondary'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium transition-colors',
                viewMode === 'year'
                  ? 'bg-brand text-white'
                  : 'text-text-sub hover:text-text-base hover:bg-bg-secondary'
              )}
            >
              Year
            </button>
          </div>

          <select
            value={currentMonth.getFullYear()}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-7 px-1.5 rounded-md border border-border-base bg-bg-secondary text-xs text-text-base outline-none focus:border-brand"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {viewMode === 'month' && (
            <>
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-md text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-text-base min-w-[140px] text-center">
                {monthLabel}
              </span>
              <button
                onClick={nextMonth}
                disabled={isCurrentMonth}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  isCurrentMonth
                    ? 'text-text-muted cursor-not-allowed'
                    : 'text-text-sub hover:text-text-base hover:bg-bg-secondary'
                )}
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-text-muted">No activity data yet</p>
      ) : viewMode === 'month' ? (
        /* ── MONTHLY VIEW ─────────────────────── */
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-7 gap-1.5 mb-2 w-full max-w-[500px] lg:max-w-[600px] xl:max-w-[700px]">
            {dayNamesShort.map((d, i) => (
              <div
                key={i}
                className="text-center text-[11px] lg:text-xs text-text-muted font-medium"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 w-full max-w-[500px] lg:max-w-[600px] xl:max-w-[700px]">
            {monthGrid.flat().map((day, idx) => (
              <button
                key={idx}
                onMouseEnter={(e) => handleCellEnter(day, e)}
                onMouseLeave={handleCellLeave}
                onClick={() => handleCellClick(day)}
                className={cn(
                  'aspect-square rounded-md transition-all duration-fast flex items-center justify-center text-[10px] font-medium',
                  day.isPadding && 'invisible',
                  !day.isPadding && 'cursor-pointer hover:scale-105'
                )}
                style={
                  !day.isPadding
                    ? {
                        backgroundColor: HEATMAP_GREEN[getHeatmapIntensityLevel(day.focusSeconds)],
                      }
                    : undefined
                }
              >
                {!day.isPadding && <span className="text-text-secondary">{day.dayOfMonth}</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── YEARLY VIEW ──────────────────────── */
        yearData && (
          <div className="w-full">
            {/* Month labels — matching N-column grid */}
            <div
              className="grid gap-[3px] mb-1"
              style={{ gridTemplateColumns: `repeat(${yearData.cols}, 1fr)` }}
            >
              {yearData.monthLabels.map((label, ci) => (
                <div key={ci} className="text-center h-4 flex items-end justify-center">
                  {label && (
                    <span
                      className={cn(
                        'text-[10px] leading-none',
                        label === MONTH_SHORT[now.getMonth()] && yearData.year === now.getFullYear()
                          ? 'text-brand font-semibold'
                          : 'text-text-muted'
                      )}
                    >
                      {label}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Flat heatmap grid — 7 rows × N cols, all cells are siblings */}
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${yearData.cols}, 1fr)` }}
            >
              {yearData.rows.flat().map((day, idx) => {
                const level = day.isPadding ? 0 : getHeatmapIntensityLevel(day.focusSeconds);
                return (
                  <button
                    key={idx}
                    onMouseEnter={(e) => handleCellEnter(day, e)}
                    onMouseLeave={handleCellLeave}
                    onClick={() => handleCellClick(day)}
                    className={cn(
                      'aspect-square rounded-sm transition-all duration-fast',
                      day.isPadding
                        ? 'bg-transparent cursor-default'
                        : 'cursor-pointer hover:scale-125',
                      day.isToday && !day.isPadding && 'ring-1 ring-text-base'
                    )}
                    style={!day.isPadding ? { backgroundColor: HEATMAP_GREEN[level] } : undefined}
                    title={day.isPadding ? undefined : day.date}
                  />
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
        <span className="text-[10px] text-text-muted font-medium">Less focus</span>
        <div className="flex items-center gap-1.5">
          {HEATMAP_GREEN.map((color, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="text-[10px] text-text-muted font-medium">More focus</span>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-md bg-bg-card border border-border-base shadow-modal text-xs pointer-events-none"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y - 44,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-medium text-text-base">{hoveredCell.date}</p>
          <p className="text-text-sub">{(hoveredCell.seconds / 3600).toFixed(1)}h focused</p>
        </div>
      )}
    </div>
  );
}

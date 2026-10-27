import { useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Timer,
  BarChart3,
  FolderKanban,
  History,
  Flame,
  Lightbulb,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { cn } from '@/lib/cn';
import { useUiStore, resolveTheme } from '@/stores/uiStore';
import { useSettings } from '@/hooks/useSettings';
import { useSessions } from '@/hooks/useSessions';
import { computeCurrentWeekFocusSeconds } from '@/lib/stats';
import { formatDuration } from '@/lib/time';
import { SidebarFocusIndicator } from '@/components/layout/SidebarFocusIndicator';
import { Logo } from '@/components/brand/Logo';

const NAV_ITEMS = [
  { path: '/timer', label: 'Timer', icon: Timer },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/statistics', label: 'Statistics', icon: BarChart3 },
  { path: '/history', label: 'History', icon: History },
  { path: '/streaks', label: 'Streaks', icon: Flame },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/templates', label: 'Templates', icon: Layers },
];

const itemClass = (collapsed: boolean, active = false) =>
  cn(
    'flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-fast',
    active
      ? 'bg-brand-light font-semibold text-brand-text'
      : 'text-text-sub hover:bg-bg-secondary hover:text-text-base',
    collapsed && 'justify-center'
  );

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar, theme, setTheme } = useUiStore();
  const { settings } = useSettings();
  const { sessions } = useSessions();
  const { logOut } = useAuth();
  const onTimerPage = useLocation().pathname === '/timer';

  const weekFocusSeconds = useMemo(() => computeCurrentWeekFocusSeconds(sessions), [sessions]);
  const goalHours = settings.weekly_goal_hours;
  const goalPct = goalHours > 0 ? Math.min((weekFocusSeconds / 3600 / goalHours) * 100, 100) : 0;
  const isDark = resolveTheme(theme) === 'dark';

  // When collapsed, labels are hidden visually — keep them for assistive tech and tooltips.
  const label = (text: string) =>
    collapsed ? (
      <span className="sr-only">{text}</span>
    ) : (
      <span className="whitespace-nowrap">{text}</span>
    );

  return (
    <div className="flex h-full flex-col py-4">
      <Link
        to="/timer"
        aria-label="ClockWise — go to the timer"
        className={cn(
          'mb-4 flex shrink-0 items-center px-4 transition-opacity hover:opacity-80',
          collapsed && 'justify-center px-0'
        )}
      >
        <Logo size="md" withWordmark={!collapsed} />
      </Link>

      {!collapsed && !onTimerPage && (
        <div className="px-4 pb-4">
          <SidebarFocusIndicator className="w-full justify-start" />
        </div>
      )}

      {!collapsed && goalHours > 0 && (
        <div className="px-4 pb-4">
          <div className="rounded-md bg-bg-secondary p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-text-sub">Weekly goal</span>
              <span className="text-xs text-text-sub">
                {formatDuration(weekFocusSeconds)} / {goalHours}h
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary"
              role="progressbar"
              aria-label="Weekly goal progress"
              aria-valuenow={Math.round(goalPct)}
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

      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => itemClass(collapsed, isActive)}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {label(item.label)}
          </NavLink>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-0.5 px-2">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) => itemClass(collapsed, isActive)}
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
          {label('Settings')}
        </NavLink>
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={collapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
          className={itemClass(collapsed)}
        >
          {isDark ? (
            <Sun className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          {label(isDark ? 'Light mode' : 'Dark mode')}
        </button>
        <button
          type="button"
          onClick={() => void logOut()}
          title={collapsed ? 'Log out' : undefined}
          className={itemClass(collapsed)}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          {label('Log out')}
        </button>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : undefined}
          className={itemClass(collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          {label(collapsed ? 'Expand sidebar' : 'Collapse')}
        </button>
      </div>
    </div>
  );
}

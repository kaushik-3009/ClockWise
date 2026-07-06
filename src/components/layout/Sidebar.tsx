import { NavLink, Link } from 'react-router-dom';
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
import { useUiStore } from '@/stores/uiStore';
import { useSettings } from '@/hooks/useSettings';
import { useSessions } from '@/hooks/useSessions';
import { computeCurrentWeekFocusSeconds } from '@/lib/stats';
import { formatDuration } from '@/lib/time';
import { SidebarFocusIndicator } from '@/components/layout/SidebarFocusIndicator';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { useState, useMemo } from 'react';

const navItems = [
  { path: '/timer', label: 'Timer', icon: Timer },
  { path: '/statistics', label: 'Statistics', icon: BarChart3 },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/templates', label: 'Templates', icon: Layers },
  { path: '/history', label: 'History', icon: History },
  { path: '/streaks', label: 'Streaks', icon: Flame },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUiStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings } = useSettings();
  const { sessions } = useSessions();
  const { logOut } = useAuth();

  const weekFocusSeconds = useMemo(() => computeCurrentWeekFocusSeconds(sessions), [sessions]);
  const weekFocusHours = weekFocusSeconds / 3600;
  const goalHours = settings.weekly_goal_hours || 1;
  const goalPct = Math.min((weekFocusHours / goalHours) * 100, 100);

  return (
    <div className="flex flex-col h-full py-4">
      {/* Logo row */}
      <Link
        to="/"
        className="flex items-center gap-3 px-4 pb-4 shrink-0 hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-[10px] bg-brand flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-base text-text-base whitespace-nowrap transition-opacity duration-fast">
            ClockWise
          </span>
        )}
      </Link>

      {/* Focus indicator */}
      {!sidebarCollapsed && (
        <div className="px-4 pb-4">
          <SidebarFocusIndicator className="w-full justify-start" />
        </div>
      )}

      {/* Weekly goal */}
      {!sidebarCollapsed && settings.weekly_goal_hours > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-bg-secondary rounded-md p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-text-sub">Weekly Goal</span>
              <span className="text-[11px] text-text-muted">
                {formatDuration(weekFocusSeconds)} / {goalHours}h
              </span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-slow"
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-fast',
                isActive
                  ? 'bg-brand-light text-brand font-semibold'
                  : 'text-text-sub hover:text-text-base hover:bg-bg-secondary',
                sidebarCollapsed && 'justify-center'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="whitespace-nowrap transition-opacity duration-fast">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-0.5 px-2 shrink-0">
        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors duration-fast',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="whitespace-nowrap">Settings</span>}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors duration-fast',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 shrink-0" />
          ) : (
            <Sun className="w-5 h-5 shrink-0" />
          )}
          {!sidebarCollapsed && (
            <span className="whitespace-nowrap">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
          )}
        </button>

        {/* Log out */}
        <button
          onClick={() => logOut()}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors duration-fast',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="whitespace-nowrap">Log out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-sub hover:text-text-base hover:bg-bg-secondary transition-colors duration-fast',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">Collapse</span>
            </>
          )}
        </button>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

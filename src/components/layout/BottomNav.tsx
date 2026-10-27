import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Timer,
  BarChart3,
  FolderKanban,
  History,
  Flame,
  Lightbulb,
  Layers,
  LogOut,
  MoreHorizontal,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/useAuth';
import { useUiStore, resolveTheme } from '@/stores/uiStore';
import { Modal } from '@/components/ui/Modal';
import { useTimerStore } from '@/stores/timerStore';
import { formatMMSS } from '@/lib/time';

const PHASE = { focus: 'Focus', short_break: 'Short break', long_break: 'Long break' };

/** Slim "now running" bar shown above the tabs on every page except the timer. */
function MiniTimer() {
  const status = useTimerStore((s) => s.status);
  const remaining = useTimerStore((s) => s.remaining_seconds);
  const phase = useTimerStore((s) => s.phase_type);
  const location = useLocation();
  if ((status !== 'running' && status !== 'paused') || location.pathname === '/timer') return null;
  return (
    <NavLink
      to="/timer"
      className="absolute inset-x-3 bottom-full mb-2 flex h-11 items-center justify-between rounded-full bg-text-base px-4 text-sm font-semibold text-bg-primary shadow-elevated"
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            status === 'running' ? 'animate-pulse bg-brand' : 'bg-text-muted'
          )}
        />
        {PHASE[phase]}
        {status === 'paused' && ' · paused'}
      </span>
      <span className="font-mono tabular-nums">{formatMMSS(remaining)}</span>
    </NavLink>
  );
}

const tabs = [
  { path: '/timer', label: 'Timer', icon: Timer },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/statistics', label: 'Stats', icon: BarChart3 },
  { path: '/history', label: 'History', icon: History },
];

const moreItems = [
  { path: '/streaks', label: 'Streaks', icon: Flame },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/templates', label: 'Templates', icon: Layers },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const tabClass = (active: boolean) =>
  cn(
    'flex h-16 w-full flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-fast',
    active ? 'font-semibold text-brand-text' : 'text-text-sub'
  );

export function BottomNav() {
  const { logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useUiStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const isDark = resolveTheme(theme) === 'dark';
  const moreActive = moreItems.some((i) => location.pathname.startsWith(i.path));

  return (
    // Height grows by the home-indicator inset instead of squeezing the tabs.
    <nav
      aria-label="Main"
      className="safe-bottom relative z-40 flex shrink-0 items-stretch justify-around border-t border-border-base bg-bg-sidebar lg:hidden"
    >
      <MiniTimer />
      {tabs.map((item) => (
        <NavLink key={item.path} to={item.path} className={({ isActive }) => tabClass(isActive)}>
          <item.icon className="h-5 w-5" aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={() => setMoreOpen(true)}
        className={tabClass(moreActive)}
        aria-haspopup="dialog"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        <span>More</span>
      </button>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-1">
          {moreItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 items-center gap-3 rounded-md px-3 text-base',
                  isActive
                    ? 'bg-brand-light font-semibold text-brand-text'
                    : 'text-text-base hover:bg-bg-secondary'
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex min-h-12 items-center gap-3 rounded-md px-3 text-base text-text-base hover:bg-bg-secondary"
          >
            {isDark ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            type="button"
            onClick={async () => {
              setMoreOpen(false);
              await logOut();
              navigate('/', { replace: true });
            }}
            className="flex min-h-12 items-center gap-3 rounded-md px-3 text-base text-error-text hover:bg-error-light"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Log out
          </button>
        </div>
      </Modal>
    </nav>
  );
}

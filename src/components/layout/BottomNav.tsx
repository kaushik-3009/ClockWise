import { NavLink, useNavigate } from 'react-router-dom';
import {
  Timer,
  BarChart3,
  FolderKanban,
  Layers,
  History,
  Flame,
  Lightbulb,
  LogOut,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/useAuth';

const navItems = [
  { path: '/timer', label: 'Timer', icon: Timer },
  { path: '/statistics', label: 'Stats', icon: BarChart3 },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
];

const moreItems = [
  { path: '/templates', label: 'Templates', icon: Layers },
  { path: '/history', label: 'History', icon: History },
  { path: '/streaks', label: 'Streaks', icon: Flame },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
];

export function BottomNav() {
  const { logOut } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <nav className="relative z-40 flex h-16 shrink-0 items-center justify-around border-t border-border-base bg-bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden">
      {moreOpen && (
        <div className="absolute bottom-full right-3 mb-2 w-48 rounded-md border border-border-base bg-bg-card p-2 shadow-card">
          <div className="mb-1 flex items-center justify-between px-2 pt-1">
            <span className="text-xs font-semibold text-text-base">More</span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-bg-secondary hover:text-text-base"
              aria-label="Close more navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {moreItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-sm px-2 py-2 text-sm',
                  isActive ? 'bg-brand-light font-semibold text-brand' : 'text-text-sub'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm text-text-sub hover:bg-bg-secondary hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-0.5 w-full h-full text-[11px] transition-colors duration-fast',
              isActive ? 'text-brand font-semibold' : 'text-text-muted'
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={() => setMoreOpen((open) => !open)}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-fast',
          moreOpen ? 'font-semibold text-brand' : 'text-text-muted'
        )}
        aria-expanded={moreOpen}
        aria-label="More navigation"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>More</span>
      </button>
    </nav>
  );
}

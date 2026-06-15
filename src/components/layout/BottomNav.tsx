import { NavLink } from 'react-router-dom';
import { Timer, BarChart3, FolderKanban, Layers, History, Flame, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { path: '/timer', label: 'Timer', icon: Timer },
  { path: '/statistics', label: 'Stats', icon: BarChart3 },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/templates', label: 'Templates', icon: Layers },
  { path: '/history', label: 'History', icon: History },
  { path: '/streaks', label: 'Streaks', icon: Flame },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
];

export function BottomNav() {
  return (
    <nav className="flex lg:hidden items-center justify-around h-16 pb-[env(safe-area-inset-bottom)] bg-bg-sidebar border-t border-border-base shrink-0 z-40">
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
    </nav>
  );
}

import { useEffect, type CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { ToastContainer } from '@/components/ui/Toast';

export function AppShell() {
  const location = useLocation();
  const { sidebarCollapsed, theme } = useUiStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-bg-primary"
      style={{ '--sidebar-width': sidebarCollapsed ? '4rem' : '15rem' } as CSSProperties}
    >
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-full bg-bg-sidebar border-r border-border-base transition-[width] duration-base ease overflow-hidden shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="relative flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden">
        <OfflineBanner />
        <div className="relative flex-1 min-h-0">
          <div className="page h-full" key={location.pathname}>
            <Outlet />
          </div>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </main>

      <ToastContainer />
    </div>
  );
}

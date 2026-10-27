import { useEffect, useRef, type CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { ToastContainer } from '@/components/ui/Toast';
import { TimerEngine } from '@/components/timer/TimerEngine';

export function AppShell() {
  const location = useLocation();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const scrollRef = useRef<HTMLElement>(null);

  // <main> is the scroll container, so reset *its* scroll on navigation.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div
      className="flex h-[100dvh] w-full overflow-hidden bg-bg-primary"
      style={{ '--sidebar-width': sidebarCollapsed ? '4rem' : '15rem' } as CSSProperties}
    >
      <TimerEngine />
      <a
        href="#main"
        className="sr-only z-[80] rounded-md bg-bg-card px-4 py-2 text-sm font-semibold text-text-base shadow-elevated focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'safe-top hidden h-full shrink-0 flex-col overflow-hidden border-r border-border-base bg-bg-sidebar transition-[width] duration-base ease lg:flex',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        <Sidebar />
      </aside>

      <div className="safe-top safe-x flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <main
          id="main"
          ref={scrollRef}
          tabIndex={-1}
          className="app-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain outline-none"
        >
          <div className="page min-h-full" key={location.pathname}>
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>

      <ToastContainer />
    </div>
  );
}

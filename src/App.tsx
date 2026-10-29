import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
  useRouteError,
  Link,
} from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import {
  ErrorBoundary,
  isChunkLoadError,
  reloadForNewVersion,
} from '@/components/ui/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FullPageSpinner, PageSpinner } from '@/components/ui/Skeleton';
import { DataProvider } from '@/lib/data';
import { useAuth } from '@/lib/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TimerPage } from '@/pages/Timer';
import { LandingPage } from '@/pages/Landing';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';

// The vite:preloadError handler in main.tsx swallows a failed chunk load, which
// leaves the module undefined; turn that back into a chunk error so the error
// boundaries offer the reload instead of crashing on `undefined[name]`.
const page = <T extends string>(load: () => Promise<Record<T, React.ComponentType>>, name: T) =>
  lazy(() =>
    load().then((m) => {
      if (!m) throw new Error('ChunkLoadError: failed to load page module');
      return { default: m[name] };
    })
  );

const StatisticsPage = page(() => import('@/pages/Statistics'), 'StatisticsPage');
const ProjectsPage = page(() => import('@/pages/Projects'), 'ProjectsPage');
const ProjectDetailPage = page(() => import('@/pages/ProjectDetail'), 'ProjectDetailPage');
const HistoryPage = page(() => import('@/pages/History'), 'HistoryPage');
const StreaksPage = page(() => import('@/pages/Streaks'), 'StreaksPage');
const InsightsPage = page(() => import('@/pages/Insights'), 'InsightsPage');
const TemplatesPage = page(() => import('@/pages/Templates'), 'TemplatesPage');
const SettingsPage = page(() => import('@/pages/Settings'), 'SettingsPage');

function RouteError() {
  const error = useRouteError();
  if (isChunkLoadError(error) && reloadForNewVersion()) return <PageSpinner />;
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-2 text-lg font-semibold text-text-base">Something went wrong</h1>
      <p className="mb-4 text-sm text-text-sub">
        This page hit an error. Reloading usually fixes it — your data is safe.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="h-11 rounded-md bg-brand-solid px-5 text-sm font-medium text-white hover:opacity-90"
      >
        Reload
      </button>
    </div>
  );
}

function NotFound() {
  usePageTitle('Page not found');
  const { user } = useAuth();
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg-primary p-8 text-center">
      <p className="font-display text-6xl font-black italic text-brand-text">404</p>
      <h1 className="mt-2 text-xl font-semibold text-text-base">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-sm text-text-sub">The link may be old or mistyped.</p>
      <Link
        to={user ? '/timer' : '/'}
        className="mt-6 inline-flex h-11 items-center rounded-md bg-brand-solid px-5 text-sm font-semibold text-white hover:opacity-90"
      >
        {user ? 'Back to the timer' : 'Go to the home page'}
      </Link>
    </main>
  );
}

function RouteWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundary fallback={<RouteError />} resetKey={location.pathname}>
      <Suspense fallback={<PageSpinner />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function AuthAwareLanding() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/timer" replace />;
  return <LandingPage />;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <DataProvider>
        <AppShell />
      </DataProvider>
    </ProtectedRoute>
  );
}

function AuthLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith('/') ? from : '/timer'} replace />;
  }
  return <Outlet />;
}

const wrap = (el: React.ReactNode) => <RouteWrapper>{el}</RouteWrapper>;

const router = createBrowserRouter([
  { path: '/', element: <AuthAwareLanding />, errorElement: <RouteError /> },
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    errorElement: <RouteError />,
    children: [
      { path: 'timer', element: wrap(<TimerPage />) },
      { path: 'statistics', element: wrap(<StatisticsPage />) },
      { path: 'projects', element: wrap(<ProjectsPage />) },
      { path: 'projects/:id', element: wrap(<ProjectDetailPage />) },
      // The old standalone task list lives inside Projects now.
      { path: 'tasks', element: <Navigate to="/projects" replace /> },
      { path: 'history', element: wrap(<HistoryPage />) },
      { path: 'streaks', element: wrap(<StreaksPage />) },
      { path: 'insights', element: wrap(<InsightsPage />) },
      { path: 'templates', element: wrap(<TemplatesPage />) },
      { path: 'settings', element: wrap(<SettingsPage />) },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}

import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/useAuth';
import { TimerPage } from '@/pages/Timer';
import { LandingPage } from '@/pages/Landing';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';

const StatisticsPage = lazy(() =>
  import('@/pages/Statistics').then((m) => ({ default: m.StatisticsPage }))
);
const ProjectsPage = lazy(() =>
  import('@/pages/Projects').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import('@/pages/ProjectDetail').then((m) => ({ default: m.ProjectDetailPage }))
);
const TasksPage = lazy(() => import('@/pages/Tasks').then((m) => ({ default: m.TasksPage })));
const HistoryPage = lazy(() => import('@/pages/History').then((m) => ({ default: m.HistoryPage })));
const StreaksPage = lazy(() => import('@/pages/Streaks').then((m) => ({ default: m.StreaksPage })));
const InsightsPage = lazy(() =>
  import('@/pages/Insights').then((m) => ({ default: m.InsightsPage }))
);
const TemplatesPage = lazy(() =>
  import('@/pages/Templates').then((m) => ({ default: m.TemplatesPage }))
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RouteError() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-lg font-semibold text-text-base mb-2">Something went wrong</h2>
      <p className="text-sm text-text-sub mb-4">This page encountered an error.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover transition-colors"
      >
        Refresh page
      </button>
    </div>
  );
}

function RouteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<RouteError />}>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function AuthAwareLanding() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/timer" replace />;
  const hasVisited = localStorage.getItem('clockwise-ui');
  if (hasVisited) return <Navigate to="/login" replace />;
  return <LandingPage />;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/timer" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthAwareLanding />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: 'timer', element: <TimerPage /> },
      {
        path: 'statistics',
        element: (
          <RouteWrapper>
            <StatisticsPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'projects',
        element: (
          <RouteWrapper>
            <ProjectsPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <RouteWrapper>
            <ProjectDetailPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'tasks',
        element: (
          <RouteWrapper>
            <TasksPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'history',
        element: (
          <RouteWrapper>
            <HistoryPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'streaks',
        element: (
          <RouteWrapper>
            <StreaksPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'insights',
        element: (
          <RouteWrapper>
            <InsightsPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'templates',
        element: (
          <RouteWrapper>
            <TemplatesPage />
          </RouteWrapper>
        ),
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

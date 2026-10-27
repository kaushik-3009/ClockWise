import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';
import { FullPageSpinner } from '@/components/ui/Skeleton';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    // Remember where the user was going so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

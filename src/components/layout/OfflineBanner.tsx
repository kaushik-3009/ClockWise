import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="flex min-h-9 shrink-0 items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-center text-xs font-medium text-warning-text"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      You&apos;re offline. The timer keeps running and changes sync when you reconnect.
    </div>
  );
}

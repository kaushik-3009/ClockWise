import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-2 h-9 shrink-0 bg-warning/15 text-warning text-xs font-medium px-4">
      <WifiOff className="w-3.5 h-3.5" />
      You&apos;re offline — changes will sync once you&apos;re back online.
    </div>
  );
}

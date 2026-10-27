export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Must be called from a user gesture (iOS requires it, and only for installed PWAs). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/**
 * Show a system notification. Mobile browsers (Android Chrome, iOS PWAs) only
 * allow notifications through the service worker registration — `new
 * Notification()` throws there — so prefer that and fall back for desktop.
 */
export async function sendNotification(title: string, body: string): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const options: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'clockwise-timer',
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch {
    // Notifications are best-effort.
  }
}

export function notifyPhaseComplete(phaseType: 'focus' | 'short_break' | 'long_break'): void {
  if (phaseType === 'focus') {
    void sendNotification('Focus complete', 'Time for a break. Nice work!');
  } else {
    void sendNotification('Break over', 'Ready to focus again?');
  }
}

export function notifySessionComplete(): void {
  void sendNotification('Session complete', 'Every phase is done. Great focus!');
}

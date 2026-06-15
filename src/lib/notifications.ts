export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'clockwise-timer',
      requireInteraction: false,
    });
  } catch {
    // Silently fail if notifications can't be sent
  }
}

export function notifyPhaseComplete(phaseType: 'focus' | 'short_break' | 'long_break'): void {
  if (phaseType === 'focus') {
    sendNotification('Focus complete!', 'Time for a break. Great work!');
  } else {
    sendNotification('Break over', 'Ready to focus again?');
  }
}

export function notifySessionComplete(): void {
  sendNotification('Session complete!', 'All phases finished. Amazing focus!');
}

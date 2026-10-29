// Browser notification service. Progressive enhancement only — Blink works fully without it.
// Note: a normal website can only show notifications while the browser is running and
// permission has been granted. Scheduled background push would need a push service and
// service worker infrastructure, which this demo does not include.

export type NotifyPermission = 'unsupported' | 'default' | 'granted' | 'denied';

export function notificationPermission(): NotifyPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotifyPermission;
}

export async function requestNotificationPermission(): Promise<NotifyPermission> {
  if (!('Notification' in window)) return 'unsupported';
  try { return (await Notification.requestPermission()) as NotifyPermission; } catch { return notificationPermission(); }
}

export function showBrowserNotification(title: string, body: string) {
  if (notificationPermission() !== 'granted') return false;
  try {
    const n = new Notification(title, { body, icon: '/icon.svg', tag: 'blink-reminder', silent: true });
    n.onclick = () => { window.focus(); n.close(); };
    return true;
  } catch { return false; }
}

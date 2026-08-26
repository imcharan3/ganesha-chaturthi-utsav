// Devotional Push & In-App Notification Manager for Vijaya Colony Ganesha Diaries
import { playTempleBell } from './audio';

// Request notification permission from user
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('ganesh_notifications_enabled', permission === 'granted' ? 'true' : 'false');
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
};

// Check if notifications are permitted
export const hasNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
};

// Send Devotional Notification Alert
export const showDevotionalNotification = ({
  title = 'గణేష్ ఉత్సవ సమాచారం (Ganesha Utsav Alert)',
  body = '',
  icon = '/colony_logo.png',
  tag = 'ganesh-alert',
  tab = null,
  playSound = true,
  actionData = null
}) => {
  // 1. Play Devotional Temple Bell Chime
  if (playSound) {
    playTempleBell();
  }

  // 2. Trigger In-App Floating Toast Event (Works 100% everywhere including offline and background tabs)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('devotional-toast-alert', {
      detail: {
        id: 'toast-' + Date.now(),
        title,
        body,
        icon,
        tab,
        actionData,
        timestamp: new Date().toISOString()
      }
    }));
  }

  // 3. Trigger Native Device / Browser Push Notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/colony_logo.png',
        badge: '/icon-192.png',
        tag: tag || 'ganesh-alert-' + Date.now(),
        vibrate: [200, 100, 200],
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (tab && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('switch-active-tab', { detail: { tab } }));
        }
      };
    } catch (e) {
      console.warn('Native notification trigger error:', e);
    }
  }
};

import type { AppNotification } from '../api/notification'

/**
 * Check if the browser / device supports Web Notifications
 */
export const isPhoneNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Get current notification permission state
 */
export const getPhoneNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isPhoneNotificationSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Request notification permission from the user on smartphone / device
 */
export const requestPhoneNotificationPermission = async (): Promise<boolean> => {
  if (!isPhoneNotificationSupported()) return false

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

/**
 * Show a native system notification on the smartphone / browser
 */
export const triggerPhoneNotification = async (title: string, options?: NotificationOptions) => {
  if (!isPhoneNotificationSupported() || Notification.permission !== 'granted') {
    return
  }

  const defaultOptions: any = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'ddt-reminder',
    renotify: true,
    ...options,
  }

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, defaultOptions)
    } else {
      new Notification(title, defaultOptions)
    }
  } catch (error) {
    console.error('Failed to trigger phone notification:', error)
    try {
      new Notification(title, defaultOptions)
    } catch (e) {
      // Fallback ignore
    }
  }
}

/**
 * Sync notifications array from server and trigger native HP notifications for new reminders
 */
export const syncAndTriggerPhoneReminders = async (notifications: AppNotification[]) => {
  if (!isPhoneNotificationSupported() || Notification.permission !== 'granted') {
    return
  }

  const todayKey = new Date().toISOString().split('T')[0]
  const storageKey = `sent_phone_notifs_${todayKey}`

  let sentIds: string[] = []
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) sentIds = JSON.parse(stored)
  } catch (e) {
    sentIds = []
  }

  for (const notif of notifications) {
    if (!sentIds.includes(notif.id)) {
      await triggerPhoneNotification(notif.title, {
        body: notif.body,
        tag: notif.id,
        data: { url: notif.action_url },
      })
      sentIds.push(notif.id)
    }
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(sentIds))
  } catch (e) {
    // Ignore storage quota
  }
}

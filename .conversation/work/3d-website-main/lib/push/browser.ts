'use client'

export function supportsPush() {
  return typeof window !== 'undefined' && window.isSecureContext &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function pushRegistration() {
  const existing = await navigator.serviceWorker.getRegistration('/')
  const script = existing?.active?.scriptURL ?? existing?.waiting?.scriptURL ?? existing?.installing?.scriptURL
  if (script && new URL(script).pathname !== '/sw.js') {
    throw new Error('एक अन्य service worker मिला। Push worker को उसी में integrate करना होगा।')
  }
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  if (registration.active) return registration
  // Do not leave the settings button spinning forever when worker install fails.
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Service worker तैयार नहीं हुआ। पेज refresh करें।')), 10000)),
  ])
}

export function vapidBytes(key: string): Uint8Array<ArrayBuffer> {
  const value = atob(key.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(key.length / 4) * 4, '='))
  return Uint8Array.from(value, (char) => char.charCodeAt(0))
}

/** Browser unsubscription still runs if the server is offline during logout. */
export async function unsubscribeBrowserDevice() {
  if (!supportsPush()) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) await subscription.unsubscribe()
  const notifications = await registration?.getNotifications()
  notifications?.forEach((notification) => notification.close())
}

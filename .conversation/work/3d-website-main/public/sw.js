/* Native push only. No fetch handler and no caching of admin pages or API data. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

function targetFor(data) {
  if (data?.test === true && data.url === '/admin/settings') return '/admin/settings'
  if (!UUID.test(data?.bookingId ?? '')) return null
  // Ignore arbitrary URLs in payloads; derive the existing route from a UUID.
  return `/admin/bookings?ref=${data.bookingId}`
}

function openDedupDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mahadev-push-events', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('seen')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Storage blocked'))
  })
}

async function wasShown(id) {
  const db = await openDedupDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('seen', 'readonly').objectStore('seen').get(id)
      request.onsuccess = () => resolve(Boolean(request.result))
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

async function rememberShown(id) {
  const db = await openDedupDatabase()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('seen', 'readwrite')
      const store = tx.objectStore('seen')
      store.put(Date.now(), id)
      // Store only opaque event IDs/timestamps; prune old dedup records.
      const cursor = store.openCursor()
      cursor.onsuccess = () => {
        const row = cursor.result
        if (!row) return
        if (row.value < Date.now() - 7 * 86400000) row.delete()
        row.continue()
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}

// Serialize duplicate pushes within this worker, including simultaneous retries.
let pushWork = Promise.resolve()
self.addEventListener('push', (event) => {
  pushWork = pushWork.catch(() => {}).then(async () => {
    let payload
    try { payload = event.data?.json() } catch { return }
    const url = targetFor(payload)
    if (!url || !UUID.test(payload?.eventId ?? '') || typeof payload.title !== 'string' || typeof payload.body !== 'string') return
    try { if (await wasShown(payload.eventId)) return } catch { /* Tag fallback when storage is unavailable. */ }
    const tag = `mahadev:${payload.eventId}`
    const visible = await self.registration.getNotifications({ tag })
    if (visible.length) return
    await self.registration.showNotification(payload.title.slice(0, 100), {
      body: payload.body.slice(0, 300), icon: '/push-icon-192.png',
      tag, renotify: false,
      data: { bookingId: payload.bookingId, eventId: payload.eventId, test: payload.test === true, url },
    })
    // Mark only after display succeeds. A failed show must remain retryable.
    try { await rememberShown(payload.eventId) } catch { /* Notification already displayed. */ }
  })
  event.waitUntil(pushWork)
})

let clickWork = Promise.resolve()
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = targetFor(event.notification.data)
  if (!path) return
  clickWork = clickWork.catch(() => {}).then(async () => {
    const target = new URL(path, self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const relevant = windows.filter((client) => {
      const url = new URL(client.url)
      return url.origin === self.location.origin && (url.pathname === '/admin' || url.pathname.startsWith('/admin/'))
    }).sort((a, b) => Number(b.url === target) - Number(a.url === target))
    for (const client of relevant) {
      try {
        // Navigate even an exact-match tab to reopen a previously closed modal.
        const navigated = await client.navigate(target)
        if (navigated) { await navigated.focus(); return }
      } catch { /* Closed tab or navigation race: try another window. */ }
    }
    await self.clients.openWindow(target)
  })
  event.waitUntil(clickWork)
})

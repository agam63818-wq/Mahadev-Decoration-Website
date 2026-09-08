import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { bookingPayload, classifyPushFailure, endpointSchema, subscriptionSchema } from '../lib/push/payload'
import { safeAdminRedirect } from '../lib/auth/roles'

const bookingId = 'f0a93a9e-91ab-435b-ac8a-73e17d918a1b'
const eventId = '66de7b5d-c664-4a17-bba6-62c45fd99c61'
const payload = bookingPayload({ bookingId, customer: 'Rahul Kumar', event: 'Wedding', date: '2026-10-20', location: 'Ranchi', package: 'Premium' }, eventId)

test('payload uses canonical booking route and mobile-sized trusted snapshots', () => {
  assert.equal(payload.url, `/admin/bookings?ref=${bookingId}`)
  for (const text of ['Rahul Kumar', 'Wedding', '20 Oct 2026', 'Ranchi', 'Premium']) assert.ok(payload.body.includes(text))
  assert.ok(Buffer.byteLength(JSON.stringify(payload)) < 4096)
  const large = bookingPayload({ bookingId, customer: 'क'.repeat(1000), event: 'क'.repeat(1000), date: null, location: 'क'.repeat(1000), package: 'क'.repeat(1000) }, eventId)
  assert.ok(Buffer.byteLength(JSON.stringify(large)) < 3000)
  assert.throws(() => bookingPayload({ bookingId: '../login' }, eventId))
})

test('provider allowlist rejects SSRF, credentials, nonstandard ports and suffix attacks', () => {
  for (const endpoint of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/abc', 'https://web.push.apple.com/abc']) assert.ok(endpointSchema.safeParse(endpoint).success)
  for (const endpoint of ['http://fcm.googleapis.com/a', 'https://127.0.0.1/push', 'https://169.254.169.254/metadata', 'https://evil.test/push', 'https://fcm.googleapis.com.evil.test/a', 'https://user:password@fcm.googleapis.com/a', 'https://fcm.googleapis.com:444/a', 'https://fcm.googleapis.com/a#x', 'not-a-url']) assert.equal(endpointSchema.safeParse(endpoint).success, false, endpoint)
  assert.equal(subscriptionSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/push', keys: { auth: 'bad', p256dh: 'bad' } }).success, false)
})

test('failures disable only expired endpoints and preserve transient/config failures', () => {
  for (const statusCode of [404, 410]) assert.equal(classifyPushFailure({ statusCode }).result, 'invalid')
  for (const statusCode of [401, 403, 429, 500, 503]) assert.equal(classifyPushFailure({ statusCode }).result, 'retry')
  assert.equal(classifyPushFailure(new Error('timeout')).result, 'retry')
  assert.equal(classifyPushFailure({ statusCode: 413 }).result, 'failed')
  assert.equal(classifyPushFailure({ statusCode: 429, headers: { 'retry-after': '120' } }).retrySeconds, 120)
})

test('login keeps exact ref but cannot redirect outside admin', () => {
  assert.equal(safeAdminRedirect(payload.url), payload.url)
  for (const target of ['https://evil.test', '//evil.test/admin', '/administrator', '/admin/login?redirectTo=/admin/login', '/admin/../../evil', '/admin\\evil', 'javascript:alert(1)']) assert.equal(safeAdminRedirect(target), '/admin')
})

type NotificationData = { bookingId?: string; eventId?: string; test?: boolean; url?: string }
function workerHarness() {
  const handlers: Record<string, (event: unknown) => void> = {}
  const shown: Array<{ title: string; options: { tag: string; data: NotificationData } }> = []
  const opened: string[] = []
  const navigated: string[] = []
  let windows: Array<{ url: string; navigate: (target: string) => Promise<{ focus: () => Promise<void> }> }> = []
  const context = vm.createContext({ URL, Date, Promise,
    // Storage-denied fallback is exercised here; persistent dedup tested separately below.
    indexedDB: { open: () => { throw new Error('Denied') } },
    self: { location: { origin: 'https://mahadev.test' }, skipWaiting: async () => {},
      addEventListener: (name: string, handler: (event: unknown) => void) => { handlers[name] = handler },
      registration: {
        getNotifications: async ({ tag }: { tag: string }) => shown.filter((item) => item.options.tag === tag),
        showNotification: async (title: string, options: { tag: string; data: NotificationData }) => { shown.push({ title, options }) },
      },
      clients: { claim: async () => {}, matchAll: async () => windows, openWindow: async (url: string) => { opened.push(url) } },
    },
  })
  vm.runInContext(readFileSync('public/sw.js', 'utf8'), context)
  async function fire(name: string, fields: object) {
    let completion: Promise<unknown> = Promise.resolve()
    handlers[name]({ ...fields, waitUntil: (promise: Promise<unknown>) => { completion = promise } })
    await completion
  }
  return { shown, opened, navigated, context,
    push: (data: unknown) => fire('push', { data: { json: () => data } }),
    click: (data: NotificationData) => fire('notificationclick', { notification: { data, close() {} } }),
    existing: (url: string) => { windows = [{ url, navigate: async (target: string) => { navigated.push(target); return { focus: async () => {} } } }] },
  }
}

test('service worker shows foreground/background payload once on concurrent retries', async () => {
  const worker = workerHarness()
  await Promise.all([worker.push(payload), worker.push(payload)])
  assert.equal(worker.shown.length, 1)
  assert.equal(worker.shown[0].options.data.bookingId, bookingId)
  assert.equal(worker.shown[0].options.data.url, payload.url)
})

test('service worker rejects malformed payload and arbitrary external targets', async () => {
  const worker = workerHarness()
  await worker.push(null)
  await worker.push({ title: 'Bad', body: 'Bad', eventId, bookingId: 'bad', url: 'https://evil.test' })
  await worker.click({ url: 'https://evil.test' })
  assert.equal(worker.shown.length, 0)
  assert.equal(worker.opened.length, 0)
})

test('click focuses/navigates existing admin tab to exact detail, never homepage', async () => {
  const worker = workerHarness()
  worker.existing('https://mahadev.test/admin/calendar')
  await worker.click({ ...payload, url: 'https://evil.test' })
  assert.deepEqual(worker.navigated, [`https://mahadev.test${payload.url}`])
  assert.equal(worker.opened.length, 0)
})

test('click without admin window opens exact booking and test opens settings only', async () => {
  const worker = workerHarness()
  worker.existing('https://mahadev.test/booking')
  await worker.click(payload)
  await worker.click({ test: true, url: '/admin/settings' })
  assert.deepEqual(worker.opened, [`https://mahadev.test${payload.url}`, 'https://mahadev.test/admin/settings'])
})

test('persistent dedup suppresses a previously dismissed notification', async () => {
  const worker = workerHarness()
  vm.runInContext('wasShown = async () => true', worker.context)
  await worker.push(payload)
  assert.equal(worker.shown.length, 0)
})

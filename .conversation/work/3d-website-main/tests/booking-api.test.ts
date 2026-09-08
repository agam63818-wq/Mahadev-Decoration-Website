import { test } from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '../app/api/booking-requests/route'

const input = {
  name: 'Rahul Kumar', phone: '9876543210', eventType: 'Wedding', eventDate: '2026-10-20',
  city: 'Ranchi', area: 'Main Road', address: '123 Main Road Ranchi', style: ['floral'],
  guestCount: 100, venueType: 'Hall', setting: 'Indoor', requirements: '',
}
const key = 'ee17012c-725b-47ea-8edb-0fdb34b92c0e'

test('existing booking API: concurrent retry, payload mismatch and notification outage', async (t) => {
  const originalFetch = globalThis.fetch
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://database.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-test-value-not-a-real-key'
  const records = new Map<string, Record<string, unknown>>()
  let notificationAttempts = 0
  // PostgREST protocol fixture: database uniqueness is independently tested by
  // push-database.test.ts using the real migration in PostgreSQL/PGlite.
  globalThis.fetch = async (url, init) => {
    const requestUrl = new URL(String(url))
    const table = requestUrl.pathname.split('/').pop()
    if (table === 'booking_requests' && init?.method === 'POST') {
      const data = JSON.parse(String(init.body)) as Record<string, unknown>
      const idempotency = String(data.submission_key ?? crypto.randomUUID())
      if (records.has(idempotency)) return Response.json({ code: '23505' }, { status: 409 })
      const row = { ...data, id: crypto.randomUUID() }
      records.set(idempotency, row)
      return Response.json([row], { status: 201 })
    }
    if (table === 'booking_requests') {
      const idempotency = requestUrl.searchParams.get('submission_key')?.replace('eq.', '')
      return Response.json(idempotency && records.has(idempotency) ? [records.get(idempotency)] : [])
    }
    if (table === 'customers') return Response.json([{ id: crypto.randomUUID() }])
    if (table === 'profiles') return Response.json([{ id: crypto.randomUUID() }])
    if (table === 'notifications') { notificationAttempts += 1; return Response.json({ error: 'simulated outage' }, { status: 503 }) }
    throw new Error(`Unexpected request: ${table}`)
  }
  const submit = (body: object = input, idempotency: string | null = key) => POST(new Request('https://mahadev.test/api/booking-requests', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(idempotency ? { 'Idempotency-Key': idempotency } : {}) }, body: JSON.stringify(body),
  }))
  try {
    await t.test('concurrent identical POSTs return one canonical booking reference', async () => {
      const responses = await Promise.all([submit(), submit(), submit()])
      assert.ok(responses.every((response) => response.status === 200))
      const bodies = await Promise.all(responses.map((response) => response.json()))
      assert.equal(new Set(bodies.map((body) => body.reference)).size, 1)
      assert.equal(records.size, 1)
      assert.equal(notificationAttempts, 1)
      const row = [...records.values()][0]
      assert.equal(row.contact_name, 'Rahul Kumar')
      assert.equal(row.status, 'pending_review')
      assert.equal(row.event_date, '2026-10-20')
      assert.equal(row.city, 'Ranchi')
    })
    await t.test('replaying after success does not insert or notify again', async () => {
      assert.equal((await submit()).status, 200)
      assert.equal(records.size, 1)
      assert.equal(notificationAttempts, 1)
    })
    await t.test('changed payload with same key fails without changing existing booking', async () => {
      assert.equal((await submit({ ...input, name: 'Someone Else' })).status, 409)
      assert.equal([...records.values()][0].contact_name, 'Rahul Kumar')
    })
    await t.test('malformed idempotency key and invalid form fail before inserting', async () => {
      assert.equal((await submit(input, 'not-a-uuid')).status, 400)
      assert.equal((await submit({ name: 'x' })).status, 400)
      assert.equal(records.size, 1)
    })
    await t.test('legacy clients remain compatible without a submission key', async () => {
      assert.equal((await submit(input, null)).status, 200)
      assert.equal(records.size, 2)
    })
  } finally {
    globalThis.fetch = originalFetch
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  }
})

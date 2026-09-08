import { z } from 'zod'

export const bookingIdSchema = z.string().uuid()
export function bookingDetailUrl(id: string) {
  return `/admin/bookings?ref=${bookingIdSchema.parse(id)}`
}

// Restrict destinations before any privileged HTTPS request (SSRF prevention).
// Add providers deliberately, never accept arbitrary HTTPS URLs from a browser.
export const endpointSchema = z.string().max(2048).url().refine((value) => {
  let url: URL
  try { url = new URL(value) } catch { return false }
  if (value !== value.trim() || /[\r\n\t]/.test(value)) return false
  return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash && (
    url.hostname === 'fcm.googleapis.com' ||
    url.hostname === 'updates.push.services.mozilla.com' ||
    /^[a-z0-9-]+\.push\.services\.mozilla\.com$/.test(url.hostname) ||
    url.hostname === 'web.push.apple.com'
  )
}, 'Unsupported push service')

export const subscriptionSchema = z.object({
  endpoint: endpointSchema,
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
  }),
})

const eventSchema = z.object({
  bookingId: bookingIdSchema,
  customer: z.string(), event: z.string().nullable(), date: z.string().nullable(),
  location: z.string().nullable(), package: z.string().nullable(),
})
const short = (value: string | null, length: number) =>
  Array.from((value ?? '').replace(/[\r\n\t]/g, ' ').trim()).slice(0, length).join('')

export function bookingPayload(raw: unknown, eventId: string) {
  const data = eventSchema.parse(raw)
  const date = data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
    ? new Date(`${data.date}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : ''
  const body = [
    [short(data.customer, 45), short(data.event, 30)].filter(Boolean).join(' • '),
    [date, short(data.location, 40)].filter(Boolean).join(' • '),
    data.package ? `Package: ${short(data.package, 45)}` : '',
  ].filter(Boolean).join('\n')
  return { title: 'New Booking Received', body, bookingId: data.bookingId,
    eventId: bookingIdSchema.parse(eventId), url: bookingDetailUrl(data.bookingId) }
}

export type PushPayload = ReturnType<typeof bookingPayload> | {
  title: string; body: string; eventId: string; url: '/admin/settings'; test: true
}

export function classifyPushFailure(error: unknown): {
  result: 'retry' | 'invalid' | 'failed'; code: string; retrySeconds?: number
} {
  const failure = error as { statusCode?: number; headers?: Record<string, string> } | null
  const status = failure?.statusCode
  if (status === 404 || status === 410) return { result: 'invalid', code: `http_${status}` }
  if (status === 400 || status === 413) return { result: 'failed', code: `http_${status}` }
  // 401/403 may mean VAPID misconfiguration, not a dead device: retain it.
  const retryAfter = failure?.headers?.['retry-after']
  const seconds = retryAfter ? (/^\d+$/.test(retryAfter) ? Number(retryAfter) : Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000)) : NaN
  return { result: 'retry', code: status ? `http_${status}` : 'transport_error',
    ...(Number.isFinite(seconds) ? { retrySeconds: Math.min(21600, Math.max(30, seconds)) } : {}) }
}

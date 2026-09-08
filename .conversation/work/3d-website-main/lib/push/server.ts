import 'server-only'
import webPush from 'web-push'
import { createHash, ECDH } from 'node:crypto'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { bookingPayload, classifyPushFailure, subscriptionSchema, type PushPayload } from './payload'

export function pushConfiguration() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) throw new Error('Push is not configured')
  webPush.setVapidDetails(subject, publicKey, privateKey)
  return { publicKey }
}

export function validateSubscription(input: unknown) {
  const subscription = subscriptionSchema.parse(input)
  // Reject syntactically correct but invalid P-256 points before persistence.
  ECDH.convertKey(Buffer.from(subscription.keys.p256dh, 'base64url'), 'prime256v1')
  return subscription
}

export async function sendPush(input: unknown, payload: PushPayload) {
  pushConfiguration()
  const subscription = validateSubscription(input)
  await webPush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 86400, urgency: 'high', timeout: 5000,
    topic: createHash('sha256').update(payload.eventId).digest('base64url').slice(0, 32),
  })
}

export async function dispatchBookingPush() {
  pushConfiguration() // Fail before leasing if configuration is broken.
  const db = getSupabaseAdminClient()
  if (!db) throw new Error('Database is not configured')
  const prepared = await db.rpc('prepare_booking_push', {})
  if (prepared.error) throw new Error('Queue preparation failed')
  const claimed = await db.rpc('claim_booking_push', {})
  if (claimed.error) throw new Error('Queue claim failed')
  let accepted = 0
  let failed = 0
  let acknowledgementFailed = false
  // Bounded batch/concurrency and 5s transport timeout fit a 60s Vercel function.
  // If the function dies, the 5-minute lease expires and the scheduler retries.
  const deliveries = claimed.data ?? []
  for (let offset = 0; offset < deliveries.length; offset += 5) {
    await Promise.all(deliveries.slice(offset, offset + 5).map(async (delivery) => {
      let result: 'sent' | 'retry' | 'invalid' | 'failed' = 'sent'
      let code: string | undefined
      let retrySeconds: number | undefined
      try {
        const subscription = { endpoint: delivery.endpoint, keys: { p256dh: delivery.p256dh, auth: delivery.auth } }
        // Bad legacy/corrupt credentials are permanent failures, not repeated SSRF attempts.
        try { validateSubscription(subscription) } catch { result = 'invalid'; code = 'invalid_subscription' }
        if (result === 'sent') {
          let payload: PushPayload | undefined
          try { payload = bookingPayload(delivery.payload, delivery.event_id) }
          catch { result = 'failed'; code = 'invalid_payload' }
          if (payload) await sendPush(subscription, payload)
        }
      } catch (error) {
        const failure = classifyPushFailure(error)
        result = failure.result; code = failure.code; retrySeconds = failure.retrySeconds
      }
      const ack = await db.rpc('finish_booking_push', {
        p_delivery_id: delivery.delivery_id, p_lease_token: delivery.lease_token,
        p_result: result, ...(code ? { p_error: code } : {}),
        ...(retrySeconds ? { p_retry_seconds: retrySeconds } : {}),
      })
      if (ack.error || !ack.data) acknowledgementFailed = true
      if (result === 'sent') accepted += 1
      else {
        failed += 1
        // Never log customer data, subscription endpoints/keys or provider bodies.
        console.warn('[booking-push] delivery failed', { deliveryId: delivery.delivery_id, code })
      }
    }))
  }
  if (acknowledgementFailed) throw new Error('Delivery acknowledgement failed; leases will recover')
  return { claimed: deliveries.length, accepted, failed }
}

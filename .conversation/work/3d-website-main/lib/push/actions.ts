'use server'

import { headers } from 'next/headers'
import { getAdminUser } from '@/lib/auth/session'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { classifyPushFailure, endpointSchema } from './payload'
import { pushConfiguration, sendPush, validateSubscription } from './server'

export async function getPushDevice(endpoint?: string) {
  if (!await getAdminUser()) return { ok: false, enabled: false, error: 'एडमिन लॉगिन आवश्यक है।' }
  try {
    pushConfiguration()
    const user = await getAdminUser()
    const db = getSupabaseAdminClient()
    if (!db || !user) throw new Error('Unavailable')
    if (!endpoint) return { ok: true, enabled: false }
    const parsed = endpointSchema.safeParse(endpoint)
    if (!parsed.success) return { ok: false, enabled: false, error: 'यह push provider समर्थित नहीं है।' }
    const { data, error } = await db.from('admin_push_subscriptions').select('enabled')
      .eq('profile_id', user.id).eq('endpoint', parsed.data).maybeSingle()
    if (error) throw error
    return { ok: true, enabled: data?.enabled ?? false }
  } catch { return { ok: false, enabled: false, error: 'Push setup उपलब्ध नहीं है। Server keys और migration जाँचें।' } }
}

export async function registerPushDevice(input: unknown) {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'एडमिन लॉगिन आवश्यक है।' }
  try {
    pushConfiguration()
    const subscription = validateSubscription(input)
    const db = getSupabaseAdminClient()
    if (!db) throw new Error('Unavailable')
    const { error } = await db.rpc('register_admin_push', {
      p_profile_id: user.id, p_endpoint: subscription.endpoint,
      p_p256dh: subscription.keys.p256dh, p_auth: subscription.keys.auth,
      p_user_agent: (headers().get('user-agent') ?? '').slice(0, 300),
    })
    if (error) return { ok: false, error: 'डिवाइस सेव नहीं हुआ। यदि दूसरे खाते से जुड़ा है, उस खाते से पहले Disable करें।' }
    return { ok: true }
  } catch { return { ok: false, error: 'डिवाइस रजिस्टर नहीं हुआ। Push configuration या subscription जाँचें।' } }
}

export async function disablePushDevice(endpoint: string) {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'एडमिन लॉगिन आवश्यक है।' }
  const parsed = endpointSchema.safeParse(endpoint)
  if (!parsed.success) return { ok: false, error: 'Invalid subscription' }
  const db = getSupabaseAdminClient()
  if (!db) return { ok: false, error: 'Database उपलब्ध नहीं है।' }
  const { error } = await db.from('admin_push_subscriptions')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id).eq('endpoint', parsed.data)
  return error ? { ok: false, error: 'डिवाइस disable नहीं हुआ। दोबारा कोशिश करें।' } : { ok: true }
}

export async function testPushDevice(endpoint: string) {
  const user = await getAdminUser()
  if (!user) return { ok: false, error: 'एडमिन लॉगिन आवश्यक है।' }
  if (!endpointSchema.safeParse(endpoint).success) return { ok: false, error: 'Invalid subscription' }
  try {
    pushConfiguration()
    const db = getSupabaseAdminClient()
    if (!db) throw new Error('Unavailable')
    // Atomic per-device throttle; cannot spam another admin/device or create bookings.
    const { data, error } = await db.from('admin_push_subscriptions')
      .update({ last_test_at: new Date().toISOString() })
      .eq('profile_id', user.id).eq('endpoint', endpoint).eq('enabled', true)
      .or(`last_test_at.is.null,last_test_at.lt.${new Date(Date.now() - 60000).toISOString()}`)
      .select('id,endpoint,p256dh,auth').maybeSingle()
    if (error) throw error
    if (!data) return { ok: false, error: 'डिवाइस Enable करें; टेस्ट के बीच 60 सेकंड रुकें।' }
    try {
      await sendPush({ endpoint: data.endpoint, keys: { p256dh: data.p256dh, auth: data.auth } }, {
        title: 'Test Notification', body: 'महादेव डेकोरेशन: इस डिवाइस पर push तैयार है।',
        eventId: crypto.randomUUID(), url: '/admin/settings', test: true,
      })
      await db.from('admin_push_subscriptions').update({ last_success_at: new Date().toISOString() }).eq('id', data.id)
    } catch (failure) {
      const result = classifyPushFailure(failure)
      await db.from('admin_push_subscriptions').update({ last_failure_at: new Date().toISOString(),
        ...(result.result === 'invalid' ? { enabled: false } : {}) }).eq('id', data.id)
      return { ok: false, error: 'टेस्ट push नहीं भेजा गया। डिवाइस/network और server configuration जाँचें।' }
    }
    return { ok: true }
  } catch { return { ok: false, error: 'टेस्ट अभी उपलब्ध नहीं है। Server configuration जाँचें।' } }
}

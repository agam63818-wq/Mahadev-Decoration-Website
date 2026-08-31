'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseWriteClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth/session'

// ─── Business settings actions ────────────────────────────────────────────────
// business_settings is a singleton row read by the navbar, footer, contact page,
// floating buttons and the mobile action bar — so one save here updates the
// whole public site at once. Only columns that actually exist in the live
// database are written (phone, whatsapp, email, address, business_hours,
// social_links) — writing a missing column makes PostgREST reject the request.

export interface SettingsResult {
  ok: boolean
  error?: string
}

/** "HH:MM" 24-hour time, or empty when the shop is closed that day. */
const timeField = z
  .string()
  .trim()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'समय HH:MM फ़ॉर्मैट में डालें (जैसे 09:00)')

const businessHoursSchema = z.object({
  day: z.string().trim().max(40),
  dayHindi: z.string().trim().max(40),
  open: timeField,
  close: timeField,
  isClosed: z.boolean(),
})

const settingsSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === '' || /^\+?[\d\s-]{7,18}$/.test(v), 'सही फ़ोन नंबर डालें')
    .optional(),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === '' || /^\+?[\d\s-]{7,18}$/.test(v), 'सही WhatsApp नंबर डालें')
    .optional(),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'सही ईमेल पता डालें')
    .optional(),
  address: z.string().trim().max(400).optional(),
  /** Day-by-day open/close editor, stored as jsonb. */
  businessHours: z.array(businessHoursSchema).max(7).optional(),
  /**
   * Open platform -> url map, so the admin can add YouTube/X/etc. later without
   * a code change. Keys are normalised to lowercase slugs.
   */
  socialLinks: z.record(z.string().trim().max(500)).optional(),
})

/** Digits only, so tel:/wa.me links can never be malformed. */
function normalisePhone(value?: string): string {
  if (!value) return ''
  return value.replace(/[^\d+]/g, '').replace(/^\+/, '')
}

export async function saveBusinessSettings(input: unknown): Promise<SettingsResult> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'अनुमति नहीं है। कृपया दोबारा लॉगिन करें।' }

  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }

  const supabase = getSupabaseWriteClient()
  if (!supabase) return { ok: false, error: 'Supabase कॉन्फ़िगर नहीं है।' }

  const v = parsed.data

  // Drop blank entries so social_links never accumulates empty keys.
  const socialLinks = Object.fromEntries(
    Object.entries(v.socialLinks ?? {})
      .map(([k, url]) => [k.trim().toLowerCase(), url.trim()] as const)
      .filter(([k, url]) => k.length > 0 && url.length > 0),
  )

  // A closed day stores empty open/close strings so the UI renders "बंद".
  const businessHours = (v.businessHours ?? []).map((h) => ({
    day: h.day,
    dayHindi: h.dayHindi,
    open: h.isClosed ? '' : h.open,
    close: h.isClosed ? '' : h.close,
    isClosed: h.isClosed,
  }))

  const row = {
    phone: normalisePhone(v.phone),
    whatsapp: normalisePhone(v.whatsapp),
    email: v.email ?? '',
    address: v.address ?? '',
    business_hours: businessHours,
    social_links: socialLinks,
    updated_at: new Date().toISOString(),
  }

  // Singleton row: update the existing one, insert only if the table is empty.
  const { data: existing } = await supabase
    .from('business_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  const existingId = (existing as { id: string } | null)?.id

  const { error } = existingId
    ? await supabase.from('business_settings').update(row).eq('id', existingId)
    : await supabase.from('business_settings').insert(row)

  if (error) return { ok: false, error: error.message }

  // Every surface that shows contact info must pick this up immediately.
  revalidatePath('/', 'layout')
  revalidatePath('/contact')
  revalidatePath('/admin/settings')

  return { ok: true }
}

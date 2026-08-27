'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseWriteClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth/session'

// ─── Business settings actions ────────────────────────────────────────────────
// business_settings is a singleton row read by the navbar, footer, contact page,
// floating buttons and the mobile action bar — so one save here updates the
// whole public site at once.

export interface SettingsResult {
  ok: boolean
  error?: string
}

const settingsSchema = z.object({
  phone: z.string().trim().max(20).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  email: z.string().trim().max(160).optional(),
  address: z.string().trim().max(400).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  pincode: z.string().trim().max(12).optional(),
  mapEmbedUrl: z.string().trim().max(1000).optional(),
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

  const row = {
    phone: normalisePhone(v.phone),
    whatsapp: normalisePhone(v.whatsapp),
    email: v.email ?? '',
    address: v.address ?? '',
    city: v.city ?? '',
    state: v.state ?? '',
    pincode: v.pincode ?? '',
    map_embed_url: v.mapEmbedUrl ?? '',
    social_links: socialLinks,
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

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseWriteClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth/session'
import { CARD_IMAGES_BUCKET } from '@/lib/supabase/config'
import {
  buildCardImagePath,
  isManagedBucketPath,
  validateImageFile,
} from '@/lib/admin/media'
import type { ServiceRow } from '@/lib/supabase/database.types'

// ─── Services admin actions (PART 2 §10) ──────────────────────────────────────
//
// Mirrors the auth + revalidate shape of packages/actions.ts on purpose — the
// two files should look the same so a change in the security pattern is easy to
// apply everywhere.
//
// Auth chain: middleware guards navigation, `getAdminUser()` guards the action
// (Server Actions are independently callable endpoints, so page-level guards
// are not enough), and RLS is the final authority in the database.

export interface ActionResult {
  ok: boolean
  error?: string
  id?: string
}

type ServiceUpdate = Partial<Omit<ServiceRow, 'id' | 'created_at' | 'updated_at'>>

function revalidatePublicServices(slug?: string) {
  revalidatePath('/')
  revalidatePath('/services')
  if (slug) revalidatePath(`/services/${slug}`)
  revalidatePath('/admin/services')
}

async function requireAdminClient() {
  const admin = await getAdminUser()
  if (!admin) return { error: 'अनुमति नहीं है। कृपया दोबारा लॉगिन करें।' as string, supabase: null }

  const supabase = getSupabaseWriteClient()
  if (!supabase) return { error: 'Supabase कॉन्फ़िगर नहीं है।' as string, supabase: null }

  return { error: null, supabase }
}

function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  // Hindi names reduce to '' — fall back to a stable unique id rather than
  // writing an empty slug that would break /services/[slug].
  return ascii.length > 0 ? ascii : `service-${Date.now().toString(36)}`
}

// ─── Save (insert + update) ───────────────────────────────────────────────────

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'सर्विस का नाम ज़रूरी है').max(120, 'नाम बहुत लंबा है'),
  nameEn: z.string().trim().max(120, 'English नाम बहुत लंबा है').optional().default(''),
  description: z.string().trim().max(2000, 'विवरण बहुत लंबा है').optional().default(''),
  descriptionEn: z.string().trim().max(2000, 'English विवरण बहुत लंबा है').optional().default(''),
  eventType: z.string().trim().min(1, 'इवेंट टाइप चुनें').max(60),
  // starting_price is NOT NULL in migration 0005, so this one is required and
  // may not be null — unlike packages.starting_price.
  startingPrice: z
    .number({ invalid_type_error: 'कीमत अंकों में डालें' })
    .int('कीमत पूरे अंकों में होनी चाहिए')
    .min(0, 'कीमत 0 से कम नहीं हो सकती')
    .max(10000000, 'कीमत बहुत ज़्यादा है'),
  imageAlt: z.string().trim().max(200).optional().default(''),
  icon: z.string().trim().max(60).optional().default(''),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function saveService(input: unknown): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data

  // Typed as the table's Update shape rather than Record<string, unknown>, so a
  // mistyped column name fails at compile time instead of being dropped by
  // PostgREST at runtime.
  const patch: ServiceUpdate = {
    name: v.name,
    name_en: v.nameEn || v.name,
    description: v.description,
    description_en: v.descriptionEn || null,
    event_type: v.eventType,
    starting_price: v.startingPrice,
    image_alt: v.imageAlt || v.name,
    icon: v.icon || 'Sparkles',
  }
  if (v.isFeatured !== undefined) patch.is_featured = v.isFeatured
  if (v.isActive !== undefined) patch.is_active = v.isActive

  if (v.id) {
    const { data, error } = await supabase
      .from('services')
      .update(patch)
      .eq('id', v.id)
      .select('id, slug')
      .maybeSingle()

    if (error) return { ok: false, error: error.message }
    revalidatePublicServices((data as { slug?: string } | null)?.slug)
    return { ok: true, id: v.id }
  }

  // New row: put it at the end of the grid so the existing order is untouched.
  const { data: lastRow } = await supabase
    .from('services')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = ((lastRow as { sort_order?: number } | null)?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('services')
    .insert({
      ...patch,
      slug: slugify(v.nameEn || v.name),
      // image_url stays null: the card falls back to the icon until the owner
      // uploads a photo. Inserting a placeholder path would render as broken.
      image_url: null,
      is_featured: v.isFeatured ?? false,
      is_active: v.isActive ?? true,
      sort_order: nextSort,
    })
    .select('id, slug')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }

  const created = data as { id: string; slug: string } | null
  revalidatePublicServices(created?.slug)
  return { ok: true, id: created?.id }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteService(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'कौन सी सर्विस? id नहीं मिली।' }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  // Read the image first: after the row is gone we can no longer find out
  // which object belonged to it, and it would be orphaned in storage forever.
  const { data: existing } = await supabase
    .from('services')
    .select('image_url, slug')
    .eq('id', id)
    .maybeSingle()

  const row = existing as { image_url: string | null; slug: string } | null

  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Storage cleanup is best-effort and deliberately AFTER the row delete: a
  // failed cleanup leaves a harmless orphan object, whereas deleting the object
  // first and then failing the row delete would leave a visibly broken card.
  if (row?.image_url && isManagedBucketPath(row.image_url)) {
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([row.image_url])
  }

  revalidatePublicServices(row?.slug)
  return { ok: true, id }
}

// ─── Toggles ──────────────────────────────────────────────────────────────────

const toggleSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

/**
 * Flips only the requested flag(s). Kept separate from `saveService` so a
 * toggle can never accidentally rewrite the text fields with whatever the card
 * happened to be holding in memory.
 */
export async function setServiceFlags(input: unknown): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'अमान्य जानकारी' }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const patch: ServiceUpdate = {}
  if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive
  if (parsed.data.isFeatured !== undefined) patch.is_featured = parsed.data.isFeatured
  if (Object.keys(patch).length === 0) return { ok: true, id: parsed.data.id }

  const { error } = await supabase.from('services').update(patch).eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidatePublicServices()
  return { ok: true, id: parsed.data.id }
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderServices(orderedIds: string[]): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: 'क्रम की जानकारी नहीं मिली' }
  }

  // The whole list is written every time, so the result is the caller's exact
  // order regardless of what the previous sort_order values were.
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from('services')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }

  revalidatePublicServices()
  return { ok: true }
}

// ─── Image upload (§3) ────────────────────────────────────────────────────────

/**
 * Replace a service card photo.
 *
 * The ordering below is the whole point of this function:
 *   1. validate MIME + size (again — the browser check was only UI)
 *   2. generate the object path server-side; the client filename is ignored
 *   3. upload with `upsert: false`
 *   4. read the PREVIOUS image_url
 *   5. update the row
 *   6. if the row update fails → delete the JUST-UPLOADED object and bail,
 *      leaving the old image still referenced and still present
 *   7. only once the row is committed, delete the previous object — and only
 *      if it is one of ours (`isManagedBucketPath`), never an arbitrary URL
 */
export async function uploadServiceImage(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const file = formData.get('file')

  if (!id) return { ok: false, error: 'कौन सी सर्विस? id नहीं मिली।' }

  const check = validateImageFile(file)
  if (!check.ok) return { ok: false, error: check.error }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  let objectPath: string
  try {
    objectPath = buildCardImagePath('services', id, check.ext)
  } catch {
    return { ok: false, error: 'अमान्य id' }
  }

  const upload = await supabase.storage
    .from(CARD_IMAGES_BUCKET)
    .upload(objectPath, file as File, { contentType: check.mime, upsert: false })

  if (upload.error) {
    // Nothing was written to the row, so the old image is still live.
    return { ok: false, error: 'इमेज अपलोड नहीं हो सकी।' }
  }

  const { data: prev } = await supabase
    .from('services')
    .select('image_url, slug')
    .eq('id', id)
    .maybeSingle()
  const prevRow = prev as { image_url: string | null; slug: string } | null

  const { error: updateError } = await supabase
    .from('services')
    .update({ image_url: objectPath })
    .eq('id', id)

  if (updateError) {
    // Roll the storage side back so a failed save leaves no orphan object.
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([objectPath])
    return { ok: false, error: 'फोटो सेव नहीं हो सकी। फिर कोशिश करें।' }
  }

  if (prevRow?.image_url && isManagedBucketPath(prevRow.image_url)) {
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([prevRow.image_url])
  }

  revalidatePublicServices(prevRow?.slug)
  return { ok: true, id }
}

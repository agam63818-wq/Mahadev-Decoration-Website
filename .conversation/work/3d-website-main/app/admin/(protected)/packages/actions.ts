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
import type { Database } from '@/lib/supabase/database.types'

type PackageUpdate = Database['public']['Tables']['packages']['Update']

// ─── Packages admin actions ───────────────────────────────────────────────────
// Every action re-checks the caller's admin role on the server. The middleware
// guard protects page *navigation*; Server Actions are separately callable
// endpoints, so they must authorise independently.
//
// Live-schema notes (verified against the live PostgREST spec):
// - packages HAS slug (auto-generated here on insert) but NO name_en and NO
//   event_type columns.
// - package_items holds the bullet inclusions (label + sort_order) and is
//   cascade-deleted with its package.

export interface ActionResult {
  ok: boolean
  error?: string
  id?: string
}

/** Paths whose cached output must be dropped so public edits show immediately. */
function revalidatePublicPackages(slug?: string) {
  revalidatePath('/')
  revalidatePath('/packages')
  if (slug) revalidatePath(`/packages/${slug}`)
  revalidatePath('/admin/packages')
}

async function requireAdminClient() {
  const admin = await getAdminUser()
  if (!admin) return { error: 'अनुमति नहीं है। कृपया दोबारा लॉगिन करें।' as string, supabase: null }

  // Prefer the service-role client so admin writes aren't blocked by RLS when
  // the policy set is still being rolled out; fall back to the user's client.
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
  // Hindi names slugify to an empty string, so fall back to a stable unique id.
  return ascii.length > 0 ? ascii : `pkg-${Date.now().toString(36)}`
}

// ─── Package CRUD ─────────────────────────────────────────────────────────────

const priceField = z
  .number({ invalid_type_error: 'कीमत अंकों में डालें' })
  .int('कीमत पूरे अंकों में होनी चाहिए')
  .min(0, 'कीमत 0 से कम नहीं हो सकती')
  .max(10000000, 'कीमत बहुत ज़्यादा है')
  .nullable()
  .optional()

const packageSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, 'पैकेज का नाम ज़रूरी है'),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]*$/, 'स्लग में सिर्फ़ छोटे अंग्रेज़ी अक्षर, अंक और डैश चलेंगे')
      .optional(),
    description: z.string().trim().optional(),
    startingPrice: priceField,
    priceMax: priceField,
    setupTimeMinutes: z
      .number({ invalid_type_error: 'समय मिनटों में डालें' })
      .int()
      .min(0, 'समय 0 से कम नहीं हो सकता')
      .max(60 * 24 * 30, 'समय बहुत ज़्यादा है')
      .nullable()
      .optional(),
    decorationArea: z.string().trim().optional(),
    customizable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.startingPrice == null ||
      v.priceMax == null ||
      v.priceMax >= v.startingPrice,
    { message: 'अधिकतम कीमत शुरुआती कीमत से कम नहीं हो सकती', path: ['priceMax'] },
  )

export async function savePackage(input: unknown): Promise<ActionResult> {
  const parsed = packageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data
  // Only live columns — no name_en/event_type (don't exist in the live table).
  const row = {
    name: v.name,
    description: v.description ?? '',
    starting_price: v.startingPrice ?? null,
    price_max: v.priceMax ?? null,
    setup_time_minutes: v.setupTimeMinutes ?? null,
    decoration_area: v.decorationArea ?? '',
    customizable: v.customizable ?? true,
    is_featured: v.isFeatured ?? false,
    is_active: v.isActive ?? true,
    updated_at: new Date().toISOString(),
  }

  if (v.id) {
    // Keep the existing slug on update unless a new one was explicitly given.
    const updateRow = v.slug ? { ...row, slug: v.slug } : row
    const { data, error } = await supabase
      .from('packages')
      .update(updateRow)
      .eq('id', v.id)
      .select('slug')
      .single()
    if (error) return { ok: false, error: error.message }
    revalidatePublicPackages((data as { slug: string }).slug)
    return { ok: true, id: v.id }
  }

  // New package — ensure the slug is unique.
  let slug = v.slug || slugify(v.name)
  const { data: existing } = await supabase
    .from('packages')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  // New packages go to the END of the grid (migration 0010 added sort_order),
  // so creating one never reshuffles the cards the owner already arranged.
  const { data: lastRow } = await supabase
    .from('packages')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextSort = ((lastRow as { sort_order?: number } | null)?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('packages')
    .insert({ ...row, slug, sort_order: nextSort })
    .select('id, slug')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePublicPackages((data as { slug: string }).slug)
  return { ok: true, id: (data as { id: string }).id }
}

export async function deletePackage(id: string): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  // Read the artwork path BEFORE the row disappears — afterwards there is no
  // way to discover which storage object belonged to it.
  const { data: existingRow } = await supabase
    .from('packages')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()

  // package_items has a FK to packages; delete bullets first in case the FK
  // isn't ON DELETE CASCADE in the live database.
  await supabase.from('package_items').delete().eq('package_id', id)

  const { error } = await supabase.from('packages').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Best-effort, and deliberately AFTER the row delete: a failed cleanup only
  // leaves a harmless orphan object, whereas removing the object first and
  // then failing the row delete would leave a visibly broken card.
  const prevImage = (existingRow as { image_url: string | null } | null)?.image_url
  if (prevImage && isManagedBucketPath(prevImage)) {
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([prevImage])
  }

  revalidatePublicPackages()
  return { ok: true }
}

// ─── Package inclusions (package_items) ───────────────────────────────────────

const packageItemSchema = z.object({
  id: z.string().uuid().optional(),
  packageId: z.string().uuid('पैकेज पहचान अमान्य है'),
  label: z.string().trim().min(1, 'सेवा का नाम ज़रूरी है'),
})

export async function savePackageItem(input: unknown): Promise<ActionResult> {
  const parsed = packageItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data

  if (v.id) {
    const { error } = await supabase
      .from('package_items')
      .update({ label: v.label })
      .eq('id', v.id)
    if (error) return { ok: false, error: error.message }
    revalidatePublicPackages()
    return { ok: true, id: v.id }
  }

  // New bullet goes to the end of the list.
  const { data: last } = await supabase
    .from('package_items')
    .select('sort_order')
    .eq('package_id', v.packageId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('package_items')
    .insert({ package_id: v.packageId, label: v.label, sort_order: nextSort })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePublicPackages()
  return { ok: true, id: (data as { id: string }).id }
}

export async function deletePackageItem(id: string): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const { error } = await supabase.from('package_items').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePublicPackages()
  return { ok: true }
}

/** Persist a full reordered inclusion list in one shot (drag-to-reorder). */
export async function reorderPackageItems(orderedIds: string[]): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('package_items')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }

  revalidatePublicPackages()
  return { ok: true }
}

// ─── Flags, ordering and artwork (PART 2 §12) ─────────────────────────────────

const packageFlagsSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

/**
 * Flip only `is_active` / `is_featured`.
 *
 * Kept separate from `savePackage` on purpose: routing a toggle through the
 * full save would rewrite name, description and every price with whatever the
 * card happened to be holding in memory, so a stale card could silently revert
 * a text edit made in another tab.
 */
export async function setPackageFlags(input: unknown): Promise<ActionResult> {
  const parsed = packageFlagsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'अमान्य जानकारी' }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  // Typed as the table's Update shape, not Record<string, unknown>: PostgREST
  // silently ignores unknown keys, so an untyped patch would let a typo become
  // a save that "succeeds" while changing nothing.
  const patch: PackageUpdate = { updated_at: new Date().toISOString() }
  if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive
  if (parsed.data.isFeatured !== undefined) patch.is_featured = parsed.data.isFeatured

  const { error } = await supabase.from('packages').update(patch).eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidatePublicPackages()
  return { ok: true, id: parsed.data.id }
}

/** Persist the whole package order (↑ ↓ controls) — migration 0010 column. */
export async function reorderPackages(orderedIds: string[]): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: 'क्रम की जानकारी नहीं मिली' }
  }

  // The complete list is rewritten each time, so the stored order is exactly
  // the caller's array regardless of the previous sort_order values (which may
  // have gaps after deletes).
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from('packages')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }

  revalidatePublicPackages()
  return { ok: true }
}

/**
 * Replace a package card photo — identical safety ordering to
 * `uploadServiceImage`:
 *   validate → server-generated path → upload(upsert:false) → read previous
 *   → update row → on row failure delete the NEW object → only then delete the
 *   previous object, and only when it is one of ours.
 */
export async function uploadPackageImage(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id') ?? '')
  const file = formData.get('file')

  if (!id) return { ok: false, error: 'कौन सा पैकेज? id नहीं मिली।' }

  // Re-run the same validation the browser ran. The browser check is UI only.
  const check = validateImageFile(file)
  if (!check.ok) return { ok: false, error: check.error }

  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  let objectPath: string
  try {
    objectPath = buildCardImagePath('packages', id, check.ext)
  } catch {
    return { ok: false, error: 'अमान्य id' }
  }

  const upload = await supabase.storage
    .from(CARD_IMAGES_BUCKET)
    .upload(objectPath, file as File, { contentType: check.mime, upsert: false })

  if (upload.error) {
    // The row was never touched, so the old photo is still live and correct.
    return { ok: false, error: 'इमेज अपलोड नहीं हो सकी।' }
  }

  const { data: prev } = await supabase
    .from('packages')
    .select('image_url, slug')
    .eq('id', id)
    .maybeSingle()
  const prevRow = prev as { image_url: string | null; slug: string } | null

  const { error: updateError } = await supabase
    .from('packages')
    .update({ image_url: objectPath, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    // Roll the storage side back so a failed save leaves no orphan object.
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([objectPath])
    return { ok: false, error: 'फोटो सेव नहीं हो सकी। फिर कोशिश करें।' }
  }

  if (prevRow?.image_url && isManagedBucketPath(prevRow.image_url)) {
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([prevRow.image_url])
  }

  revalidatePublicPackages(prevRow?.slug)
  return { ok: true, id }
}

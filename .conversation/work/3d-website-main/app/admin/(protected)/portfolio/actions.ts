'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseWriteClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { getAdminUser } from '@/lib/auth/session'

// ─── Portfolio admin actions ──────────────────────────────────────────────────
// Every action re-checks the caller's admin role on the server. The middleware
// guard protects page *navigation*; Server Actions are separately callable
// endpoints, so they must authorise independently — a guard on the page alone
// would leave these writable by anyone who can POST.
//
// Live-schema notes (verified against the live PostgREST spec):
// - portfolio_items has NO slug/tags columns — the row `id` is the URL id.
// - portfolio_media has NO is_cover column — the cover is the image with the
//   lowest sort_order, so "set cover" = move that image to the front.

export interface ActionResult {
  ok: boolean
  error?: string
  id?: string
}

const PORTFOLIO_BUCKET = 'portfolio'

type PortfolioMediaUpdate = Database['public']['Tables']['portfolio_media']['Update']

/** Paths whose cached output must be dropped so public edits show immediately. */
function revalidatePublicPortfolio(itemId?: string) {
  revalidatePath('/')
  revalidatePath('/gallery')
  if (itemId) revalidatePath(`/gallery/${itemId}`)
  revalidatePath('/admin/portfolio')
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

// ─── Portfolio categories (public gallery filter pills) ─────────────────────

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'कैटेगरी का नाम ज़रूरी है'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, 'स्लग में सिर्फ़ छोटे अंग्रेज़ी अक्षर, अंक और डैश चलेंगे')
    .optional(),
  sortOrder: z.number().int().optional(),
})

function slugify(input: string): string {
  const ascii = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  // Hindi names slugify to an empty string, so fall back to a stable unique id.
  return ascii.length > 0 ? ascii : `cat-${Date.now().toString(36)}`
}

export async function savePortfolioCategory(input: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data

  if (v.id) {
    const { error } = await supabase
      .from('portfolio_categories')
      .update({ name: v.name })
      .eq('id', v.id)
    if (error) return { ok: false, error: error.message }
    revalidatePublicPortfolio()
    return { ok: true, id: v.id }
  }

  // New category goes to the end of the list unless a sort order was given.
  const { data: last } = await supabase
    .from('portfolio_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = v.sortOrder ?? (((last as { sort_order: number } | null)?.sort_order ?? -1) + 1)

  const { data, error } = await supabase
    .from('portfolio_categories')
    .insert({ name: v.name, slug: v.slug || slugify(v.name), sort_order: nextSort })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePublicPortfolio()
  return { ok: true, id: (data as { id: string }).id }
}

export async function deletePortfolioCategory(id: string): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  // Unlink items first so they don't keep a dangling category_id.
  await supabase.from('portfolio_items').update({ category_id: null }).eq('category_id', id)

  const { error } = await supabase.from('portfolio_categories').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePublicPortfolio()
  return { ok: true }
}

/** Persist a full reordered category list in one shot (drag-to-reorder). */
export async function reorderPortfolioCategories(orderedIds: string[]): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('portfolio_categories')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }

  revalidatePublicPortfolio()
  return { ok: true }
}

// ─── Portfolio item ───────────────────────────────────────────────────────────

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'शीर्षक ज़रूरी है'),
  eventType: z.string().trim().min(1, 'इवेंट टाइप चुनें'),
  categoryId: z.string().uuid().nullable().optional(),
  location: z.string().trim().optional(),
  priceRange: z.string().trim().optional(),
  description: z.string().trim().optional(),
  servicesIncluded: z.array(z.string().trim().min(1)).optional(),
  isFeatured: z.boolean().optional(),
  isPublic: z.boolean().optional(),
})

export async function savePortfolioItem(input: unknown): Promise<ActionResult> {
  const parsed = itemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data
  // Only live columns — no slug/tags (the id is the URL identifier).
  const row = {
    title: v.title,
    event_type: v.eventType,
    category_id: v.categoryId ?? null,
    location: v.location ?? '',
    price_range: v.priceRange ?? '',
    description: v.description ?? '',
    services_included: v.servicesIncluded ?? [],
    is_featured: v.isFeatured ?? false,
    is_public: v.isPublic ?? true,
  }

  if (v.id) {
    const { error } = await supabase.from('portfolio_items').update(row).eq('id', v.id)
    if (error) return { ok: false, error: error.message }
    revalidatePublicPortfolio(v.id)
    return { ok: true, id: v.id }
  }

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(row)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePublicPortfolio((data as { id: string }).id)
  return { ok: true, id: (data as { id: string }).id }
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  // Remove the stored files too, so deleting a design doesn't orphan images
  // in the bucket forever.
  const { data: media } = await supabase
    .from('portfolio_media')
    .select('url')
    .eq('portfolio_item_id', id)

  const storagePaths = ((media ?? []) as Array<{ url: string }>)
    .map((m) => m.url)
    .filter((u) => u && !u.startsWith('http') && !u.startsWith('/'))

  if (storagePaths.length > 0) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove(storagePaths)
  }

  const { error } = await supabase.from('portfolio_items').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePublicPortfolio()
  return { ok: true }
}

// ─── Individual image (a "look") ──────────────────────────────────────────────

const mediaSchema = z.object({
  id: z.string().uuid(),
  variantLabel: z.string().trim().max(120).nullable().optional(),
  // Empty input means "no price" (reference photo), not zero.
  price: z.number().nonnegative().nullable().optional(),
  isBookable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function updatePortfolioMedia(input: unknown): Promise<ActionResult> {
  const parsed = mediaSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data
  // Typed as the table's Update shape (not Record<string, unknown>) so a typo
  // in a column name is a compile error rather than a silently-ignored write.
  const patch: PortfolioMediaUpdate = {}
  if (v.variantLabel !== undefined) patch.variant_label = v.variantLabel || null
  if (v.price !== undefined) patch.price = v.price
  if (v.isBookable !== undefined) patch.is_bookable = v.isBookable
  if (v.sortOrder !== undefined) patch.sort_order = v.sortOrder

  if (Object.keys(patch).length === 0) return { ok: true, id: v.id }

  const { error } = await supabase.from('portfolio_media').update(patch).eq('id', v.id)
  if (error) return { ok: false, error: error.message }

  revalidatePublicPortfolio()
  return { ok: true, id: v.id }
}

/** Persist a full reordered image list in one shot (drag-to-reorder). */
export async function reorderPortfolioMedia(orderedIds: string[]): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('portfolio_media')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }

  revalidatePublicPortfolio()
  return { ok: true }
}

/**
 * Promote one image to cover. The cover is derived (lowest sort_order), so
 * this simply moves the chosen image to the front of the sort order.
 */
export async function setPortfolioCover(
  itemId: string,
  mediaId: string,
): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const { data: rows } = await supabase
    .from('portfolio_media')
    .select('id')
    .eq('portfolio_item_id', itemId)
    .order('sort_order', { ascending: true })

  const ids = ((rows ?? []) as Array<{ id: string }>).map((r) => r.id)
  if (!ids.includes(mediaId)) return { ok: false, error: 'इमेज नहीं मिली' }

  // Move the chosen image to the front, keep the rest in their current order.
  const reordered = [mediaId, ...ids.filter((id) => id !== mediaId)]
  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase
      .from('portfolio_media')
      .update({ sort_order: i })
      .eq('id', reordered[i])
    if (error) return { ok: false, error: error.message }
  }

  revalidatePublicPortfolio(itemId)
  return { ok: true, id: mediaId }
}

export async function deletePortfolioMedia(mediaId: string): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const { data: row } = await supabase
    .from('portfolio_media')
    .select('url, portfolio_item_id')
    .eq('id', mediaId)
    .maybeSingle()

  const media = row as { url: string; portfolio_item_id: string } | null

  const { error } = await supabase.from('portfolio_media').delete().eq('id', mediaId)
  if (error) return { ok: false, error: error.message }

  if (media?.url && !media.url.startsWith('http') && !media.url.startsWith('/')) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([media.url])
  }

  // No cover-promotion needed: the cover is derived (lowest sort_order), so the
  // next image in order automatically becomes the new cover.

  revalidatePublicPortfolio(media?.portfolio_item_id)
  return { ok: true }
}

/**
 * Upload one image to the public `portfolio` bucket and register it as a look.
 * Called once per file so a single bad file doesn't fail the whole batch.
 */
export async function uploadPortfolioImage(formData: FormData): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const itemId = String(formData.get('itemId') ?? '')
  const file = formData.get('file')

  if (!itemId) return { ok: false, error: 'डिज़ाइन चुनें' }
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'फ़ाइल नहीं मिली' }
  if (!file.type.startsWith('image/')) return { ok: false, error: 'सिर्फ़ इमेज फ़ाइल चलेंगी' }
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'इमेज 10MB से छोटी होनी चाहिए' }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const objectPath = `${itemId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: false })

  if (uploadError) return { ok: false, error: `अपलोड नहीं हुआ: ${uploadError.message}` }

  // Append after the existing looks.
  const { data: last } = await supabase
    .from('portfolio_media')
    .select('sort_order')
    .eq('portfolio_item_id', itemId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('portfolio_media')
    .insert({
      portfolio_item_id: itemId,
      url: objectPath,
      media_type: 'image',
      alt_text: String(formData.get('altText') ?? '') || file.name,
      sort_order: nextSort,
      is_bookable: true,
      price: null,
      variant_label: null,
    })
    .select('id')
    .single()

  if (error) {
    // Don't leave an orphan object behind if the DB row failed.
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([objectPath])
    return { ok: false, error: error.message }
  }

  revalidatePublicPortfolio(itemId)
  return { ok: true, id: (data as { id: string }).id }
}

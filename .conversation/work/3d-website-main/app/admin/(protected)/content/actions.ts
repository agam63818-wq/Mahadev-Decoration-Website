'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSupabaseWriteClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth/session'
import {
  packages as seedPackages,
  portfolioItems as seedPortfolio,
  occasions as seedOccasions,
} from '@/lib/data'

// Same public bucket the portfolio uploads use; occasion photos go under occasions/.
const PORTFOLIO_BUCKET = 'portfolio'

// ─── Website content admin actions ────────────────────────────────────────────
// Two jobs:
//   1. "Import" — copy whatever the live site is currently showing from static
//      seed data (packages, portfolio designs + photos, occasion cards) into
//      Supabase, so the admin can edit / replace / delete every one of them.
//      Once a table has rows the site reads ONLY from the database.
//   2. Occasions CRUD — the six "अपने अवसर को चुनें" cards on the home page.
//
// Every action re-checks the caller's admin role on the server, exactly like
// the packages / portfolio actions.

export interface ActionResult {
  ok: boolean
  error?: string
  id?: string
  /** Human-readable summary for import runs. */
  summary?: string
}

function revalidateSite() {
  revalidatePath('/')
  revalidatePath('/gallery')
  revalidatePath('/packages')
  revalidatePath('/services')
  revalidatePath('/admin/content')
  revalidatePath('/admin/packages')
  revalidatePath('/admin/portfolio')
}

async function requireAdminClient() {
  const admin = await getAdminUser()
  if (!admin) return { error: 'अनुमति नहीं है। कृपया दोबारा लॉगिन करें।' as string, supabase: null }
  const supabase = getSupabaseWriteClient()
  if (!supabase) return { error: 'Supabase कॉन्फ़िगर नहीं है।' as string, supabase: null }
  return { error: null, supabase }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'वेडिंग',
  birthday: 'बर्थडे',
  anniversary: 'एनिवर्सरी',
  haldi: 'हल्दी',
  mehendi: 'मेहंदी',
  car: 'कार',
  stage: 'स्टेज',
  mandap: 'मंडप',
  home: 'होम',
  flower: 'फूल',
  lighting: 'लाइटिंग',
  custom: 'अन्य',
}

/** "₹25,000 – ₹40,000" → { min: 25000, max: 40000 } */
function parsePriceRange(range: string | undefined): { min: number | null; max: number | null } {
  if (!range) return { min: null, max: null }
  const nums = range
    .replace(/,/g, '')
    .match(/\d+/g)
    ?.map((n) => Number(n))
    .filter((n) => Number.isFinite(n)) ?? []
  return { min: nums[0] ?? null, max: nums[1] ?? null }
}

/** "2–3 घंटे" → 180 minutes (uses the upper bound). */
function parseSetupMinutes(text: string | undefined): number | null {
  if (!text) return null
  const nums = text.match(/\d+/g)?.map(Number) ?? []
  if (nums.length === 0) return null
  const hours = Math.max(...nums)
  return text.includes('मिनट') ? hours : hours * 60
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportOptions {
  packages?: boolean
  portfolio?: boolean
  occasions?: boolean
}

/**
 * Copies the static seed content into Supabase. Safe to re-run: existing rows
 * are matched by slug (packages / occasions) or title (portfolio) and skipped,
 * so nothing the admin has already edited is overwritten.
 */
export async function importSeedContent(options: ImportOptions): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const notes: string[] = []

  // ── Packages ──────────────────────────────────────────────────────────────
  if (options.packages) {
    const { data: existing, error } = await supabase.from('packages').select('slug')
    if (error) return { ok: false, error: `पैकेज पढ़ने में गड़बड़ी: ${error.message}` }
    const have = new Set(((existing ?? []) as Array<{ slug: string }>).map((r) => r.slug))

    let added = 0
    for (const pkg of seedPackages) {
      if (have.has(pkg.slug)) continue
      const range = parsePriceRange(pkg.priceRange)
      const { data, error: insErr } = await supabase
        .from('packages')
        .insert({
          slug: pkg.slug,
          name: pkg.name,
          description: pkg.nameEn ? `${pkg.nameEn} — ${EVENT_TYPE_LABELS[pkg.eventType] ?? ''}`.trim() : '',
          starting_price: pkg.startingPrice,
          price_max: range.max && range.max > pkg.startingPrice ? range.max : null,
          setup_time_minutes: parseSetupMinutes(pkg.estimatedSetupTime),
          decoration_area: pkg.decorationArea,
          customizable: pkg.customizationAvailable,
          is_featured: pkg.featured,
          is_active: true,
        })
        .select('id')
        .single()
      if (insErr) return { ok: false, error: `पैकेज "${pkg.name}": ${insErr.message}` }

      const id = (data as { id: string }).id
      if (pkg.inclusions.length > 0) {
        const { error: itemsErr } = await supabase.from('package_items').insert(
          pkg.inclusions.map((label, i) => ({ package_id: id, label, sort_order: i })),
        )
        if (itemsErr) return { ok: false, error: `पैकेज "${pkg.name}" की सेवाएँ: ${itemsErr.message}` }
      }
      added++
    }
    notes.push(`पैकेज: ${added} जोड़े, ${seedPackages.length - added} पहले से थे`)
  }

  // ── Portfolio (categories + designs + photos) ─────────────────────────────
  if (options.portfolio) {
    // Categories: one per event type used by the seed designs.
    const { data: existingCats, error: catErr } = await supabase
      .from('portfolio_categories')
      .select('id, slug, sort_order')
    if (catErr) return { ok: false, error: `कैटेगरी पढ़ने में गड़बड़ी: ${catErr.message}` }

    const catBySlug = new Map<string, string>()
    let maxSort = -1
    for (const c of (existingCats ?? []) as Array<{ id: string; slug: string; sort_order: number }>) {
      catBySlug.set(c.slug, c.id)
      maxSort = Math.max(maxSort, c.sort_order ?? 0)
    }

    const neededTypes = Array.from(new Set(seedPortfolio.map((p) => p.eventType)))
    let catsAdded = 0
    for (const type of neededTypes) {
      if (catBySlug.has(type)) continue
      maxSort++
      const { data, error } = await supabase
        .from('portfolio_categories')
        .insert({ slug: type, name: EVENT_TYPE_LABELS[type] ?? type, sort_order: maxSort })
        .select('id')
        .single()
      if (error) return { ok: false, error: `कैटेगरी "${type}": ${error.message}` }
      catBySlug.set(type, (data as { id: string }).id)
      catsAdded++
    }

    const { data: existingItems, error: itemErr } = await supabase
      .from('portfolio_items')
      .select('title')
    if (itemErr) return { ok: false, error: `डिज़ाइन पढ़ने में गड़बड़ी: ${itemErr.message}` }
    const haveTitles = new Set(((existingItems ?? []) as Array<{ title: string }>).map((r) => r.title))

    let itemsAdded = 0
    let photosAdded = 0
    for (const item of seedPortfolio) {
      if (haveTitles.has(item.title)) continue
      const { data, error } = await supabase
        .from('portfolio_items')
        .insert({
          title: item.title,
          category_id: catBySlug.get(item.eventType) ?? null,
          event_type: item.eventType,
          location: item.location,
          price_range: item.priceRange,
          description: item.description,
          services_included: item.servicesIncluded,
          is_featured: item.featured,
          is_public: true,
        })
        .select('id')
        .single()
      if (error) return { ok: false, error: `डिज़ाइन "${item.title}": ${error.message}` }
      const id = (data as { id: string }).id

      if (item.images.length > 0) {
        // Seed photos live in /public/assets — stored as site-relative URLs,
        // which portfolioPublicUrl() passes through untouched. The admin can
        // delete these looks and upload real photos at any time.
        const { error: mediaErr } = await supabase.from('portfolio_media').insert(
          item.images.map((img, i) => ({
            portfolio_item_id: id,
            url: img.url,
            media_type: 'image',
            alt_text: img.alt,
            sort_order: img.isPrimary ? 0 : i + 1,
            is_bookable: img.isBookable ?? true,
            price: img.price ?? null,
            variant_label: img.variantLabel ?? null,
          })),
        )
        if (mediaErr) return { ok: false, error: `"${item.title}" की तस्वीरें: ${mediaErr.message}` }
        photosAdded += item.images.length
      }
      itemsAdded++
    }
    notes.push(
      `गैलरी: ${itemsAdded} डिज़ाइन + ${photosAdded} तस्वीरें जोड़ी, ${catsAdded} कैटेगरी बनी`,
    )
  }

  // ── Occasions ─────────────────────────────────────────────────────────────
  if (options.occasions) {
    const { data: existing, error } = await supabase.from('occasions').select('slug')
    if (error) {
      return {
        ok: false,
        error:
          error.message.includes('occasions')
            ? 'occasions टेबल नहीं मिली — पहले Supabase में migration 0004 चलाएँ।'
            : `अवसर पढ़ने में गड़बड़ी: ${error.message}`,
      }
    }
    const have = new Set(((existing ?? []) as Array<{ slug: string }>).map((r) => r.slug))

    let added = 0
    for (const [i, occ] of seedOccasions.entries()) {
      if (have.has(occ.slug)) continue
      const { error: insErr } = await supabase.from('occasions').insert({
        slug: occ.slug,
        name: occ.name,
        name_en: occ.nameEn,
        description: occ.description,
        event_type: occ.eventType,
        starting_price: occ.startingPrice,
        image_url: occ.imageUrl,
        image_alt: occ.imageAlt,
        icon: occ.icon,
        sort_order: i,
        is_active: true,
      })
      if (insErr) return { ok: false, error: `अवसर "${occ.name}": ${insErr.message}` }
      added++
    }
    notes.push(`अवसर: ${added} जोड़े, ${seedOccasions.length - added} पहले से थे`)
  }

  revalidateSite()
  return { ok: true, summary: notes.join(' · ') || 'कुछ नहीं चुना गया' }
}

// ─── Occasions CRUD ───────────────────────────────────────────────────────────

const occasionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'अवसर का नाम ज़रूरी है').max(80),
  nameEn: z.string().trim().max(80).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, 'स्लग में सिर्फ़ छोटे अंग्रेज़ी अक्षर, अंक और डैश चलेंगे')
    .optional(),
  description: z.string().trim().max(200).optional(),
  eventType: z.string().trim().min(1),
  startingPrice: z
    .number({ invalid_type_error: 'कीमत अंकों में डालें' })
    .int()
    .min(0)
    .max(10000000),
  imageUrl: z.string().trim().max(500).optional(),
  imageAlt: z.string().trim().max(200).optional(),
  icon: z.string().trim().max(60).optional(),
  isActive: z.boolean().optional(),
})

export async function saveOccasion(input: unknown): Promise<ActionResult> {
  const parsed = occasionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }
  }
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const v = parsed.data
  const row = {
    name: v.name,
    name_en: v.nameEn ?? '',
    slug: v.slug && v.slug.length > 0 ? v.slug : `${v.eventType}-${Date.now().toString(36)}`,
    description: v.description ?? '',
    event_type: v.eventType,
    starting_price: v.startingPrice,
    image_url: v.imageUrl ?? '',
    image_alt: v.imageAlt ?? v.name,
    icon: v.icon && v.icon.length > 0 ? v.icon : 'Sparkles',
    is_active: v.isActive ?? true,
    updated_at: new Date().toISOString(),
  }

  if (v.id) {
    const { error } = await supabase.from('occasions').update(row).eq('id', v.id)
    if (error) return { ok: false, error: error.message }
    revalidateSite()
    return { ok: true, id: v.id }
  }

  const { data: last } = await supabase
    .from('occasions')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextSort = ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('occasions')
    .insert({ ...row, sort_order: nextSort })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidateSite()
  return { ok: true, id: (data as { id: string }).id }
}

export async function deleteOccasion(id: string): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  // Remove an uploaded photo too (site-relative /assets URLs are left alone).
  const { data: row } = await supabase.from('occasions').select('image_url').eq('id', id).maybeSingle()
  const url = (row as { image_url: string } | null)?.image_url ?? ''
  if (url && !url.startsWith('http') && !url.startsWith('/')) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([url])
  }

  const { error } = await supabase.from('occasions').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateSite()
  return { ok: true }
}

export async function reorderOccasions(orderedIds: string[]): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  for (const [i, id] of orderedIds.entries()) {
    const { error } = await supabase.from('occasions').update({ sort_order: i }).eq('id', id)
    if (error) return { ok: false, error: error.message }
  }
  revalidateSite()
  return { ok: true }
}

/** Upload a new card photo for an occasion into the public portfolio bucket. */
export async function uploadOccasionImage(formData: FormData): Promise<ActionResult> {
  const { error: authError, supabase } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const id = String(formData.get('id') ?? '')
  const file = formData.get('file')
  if (!id) return { ok: false, error: 'अवसर चुनें' }
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'फ़ाइल नहीं मिली' }
  if (!file.type.startsWith('image/')) return { ok: false, error: 'सिर्फ़ इमेज फ़ाइल चलेंगी' }
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'इमेज 10MB से छोटी होनी चाहिए' }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const objectPath = `occasions/${id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: false })
  if (uploadError) return { ok: false, error: `अपलोड नहीं हुआ: ${uploadError.message}` }

  // Drop the previous uploaded photo (if it was in our bucket).
  const { data: prev } = await supabase.from('occasions').select('image_url').eq('id', id).maybeSingle()
  const prevUrl = (prev as { image_url: string } | null)?.image_url ?? ''

  const { error } = await supabase
    .from('occasions')
    .update({ image_url: objectPath, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([objectPath])
    return { ok: false, error: error.message }
  }
  if (prevUrl && !prevUrl.startsWith('http') && !prevUrl.startsWith('/')) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([prevUrl])
  }

  revalidateSite()
  return { ok: true, id }
}

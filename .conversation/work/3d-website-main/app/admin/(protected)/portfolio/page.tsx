import { getSupabaseReadClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, portfolioPublicUrl } from '@/lib/supabase/config'
import {
  PortfolioManager,
  type AdminPortfolioCategory,
  type AdminPortfolioItem,
} from './PortfolioManager'

export const dynamic = 'force-dynamic'

/**
 * /admin/portfolio — full control over the public gallery.
 *
 * Reads straight from Supabase on every request (force-dynamic) so the admin
 * always sees the true current state, including private drafts that the public
 * gallery hides. Live-schema notes: portfolio_items has no slug column (the id
 * doubles as the URL identifier) and portfolio_media has no is_cover column
 * (the cover is the image with the lowest sort_order).
 */
export default async function AdminPortfolioPage() {
  const [items, categories] = await Promise.all([loadItems(), loadCategories()])

  return (
    <PortfolioManager
      initialItems={items.items}
      initialCategories={categories.categories}
      loadFailed={items.failed || categories.failed}
      supabaseReady={isSupabaseConfigured()}
    />
  )
}

/*
 * §17: an empty list and a failed request are NOT the same thing. Returning []
 * for both would show the owner "अभी कोई डिज़ाइन नहीं जोड़ा गया" after a network
 * blip — implying his gallery had been wiped. `failed` lets the UI show an
 * explicit error with a Retry button instead.
 */
async function loadCategories(): Promise<{
  categories: AdminPortfolioCategory[]
  failed: boolean
}> {
  const supabase = getSupabaseReadClient()
  // Not configured is a configuration problem, not an empty gallery.
  if (!supabase) return { categories: [], failed: true }

  const { data, error } = await supabase
    .from('portfolio_categories')
    .select('id, slug, name, sort_order')
    .order('sort_order', { ascending: true })

  if (error || !data) {
    if (error) console.error('[admin/portfolio] categories load failed:', error.message)
    return { categories: [], failed: true }
  }

  const categories = (data as unknown as Array<{
    id: string
    slug: string
    name: string
    sort_order: number
  }>).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    sortOrder: row.sort_order,
  }))

  return { categories, failed: false }
}

async function loadItems(): Promise<{ items: AdminPortfolioItem[]; failed: boolean }> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return { items: [], failed: true }

  const { data, error } = await supabase
    .from('portfolio_items')
    .select(
      `id, title, category_id, event_type, location, price_range, description,
       services_included, is_featured, is_public, created_at,
       portfolio_media (
         id, url, alt_text, variant_label, price, is_bookable, sort_order
       )`,
    )
    .order('created_at', { ascending: false })

  if (error || !data) {
    if (error) console.error('[admin/portfolio] load failed:', error.message)
    return { items: [], failed: true }
  }

  type Row = {
    id: string
    title: string
    category_id: string | null
    event_type: string | null
    location: string | null
    price_range: string | null
    description: string | null
    services_included: string[] | null
    is_featured: boolean
    is_public: boolean
    portfolio_media:
      | Array<{
          id: string
          url: string
          alt_text: string | null
          variant_label: string | null
          price: number | string | null
          is_bookable: boolean
          sort_order: number
        }>
      | null
  }

  const items = (data as unknown as Row[]).map((row) => {
    const media = (row.portfolio_media ?? [])
      .map((m) => ({
        id: m.id,
        url: portfolioPublicUrl(m.url),
        altText: m.alt_text ?? '',
        variantLabel: m.variant_label ?? '',
        price: m.price === null || m.price === undefined ? null : Number(m.price),
        isBookable: m.is_bookable !== false,
        // The cover is derived — the image with the lowest sort_order.
        isCover: false,
        sortOrder: m.sort_order ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)

    if (media.length > 0) media[0].isCover = true

    return {
      id: row.id,
      // The live table has no slug column — the id IS the URL identifier.
      slug: row.id,
      title: row.title,
      categoryId: row.category_id,
      eventType: row.event_type ?? '',
      location: row.location ?? '',
      priceRange: row.price_range ?? '',
      description: row.description ?? '',
      servicesIncluded: Array.isArray(row.services_included) ? row.services_included : [],
      isFeatured: row.is_featured,
      isPublic: row.is_public,
      media,
    }
  })

  return { items, failed: false }
}

import { getSupabaseReadClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, portfolioPublicUrl } from '@/lib/supabase/config'
import { PortfolioManager, type AdminPortfolioItem } from './PortfolioManager'

export const dynamic = 'force-dynamic'

/**
 * /admin/portfolio — full control over the public gallery.
 *
 * Reads straight from Supabase on every request (force-dynamic) so the admin
 * always sees the true current state, including private drafts that the public
 * gallery hides.
 */
export default async function AdminPortfolioPage() {
  const items = await loadItems()

  return (
    <PortfolioManager
      initialItems={items}
      supabaseReady={isSupabaseConfigured()}
    />
  )
}

async function loadItems(): Promise<AdminPortfolioItem[]> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('portfolio_items')
    .select(
      `id, slug, title, event_type, location, price_range, description,
       services_included, is_featured, is_public, created_at,
       portfolio_media (
         id, url, alt_text, variant_label, price, is_bookable, is_cover, sort_order
       )`,
    )
    .order('created_at', { ascending: false })

  if (error || !data) {
    if (error) console.error('[admin/portfolio] load failed:', error.message)
    return []
  }

  type Row = {
    id: string
    slug: string
    title: string
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
          is_cover: boolean
          sort_order: number
        }>
      | null
  }

  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    eventType: row.event_type ?? '',
    location: row.location ?? '',
    priceRange: row.price_range ?? '',
    description: row.description ?? '',
    servicesIncluded: row.services_included ?? [],
    isFeatured: row.is_featured,
    isPublic: row.is_public,
    media: (row.portfolio_media ?? [])
      .map((m) => ({
        id: m.id,
        url: portfolioPublicUrl(m.url),
        altText: m.alt_text ?? '',
        variantLabel: m.variant_label ?? '',
        price: m.price === null || m.price === undefined ? null : Number(m.price),
        isBookable: m.is_bookable !== false,
        isCover: Boolean(m.is_cover),
        sortOrder: m.sort_order ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }))
}

import type { EventType, PortfolioItem, PortfolioImage } from '@/types'
import { portfolioItems as seedPortfolioItems } from '@/lib/data'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import type { PortfolioItemRow, PortfolioMediaRow } from '@/lib/supabase/database.types'

// ─── Portfolio Service ─────────────────────────────────────────────────────────
// Reads live data from Supabase (portfolio_items + portfolio_media) so that an
// admin edit shows up on the public gallery immediately, with no redeploy.
//
// Live-schema notes (verified against the live PostgREST spec):
// - portfolio_items has NO slug/tags columns — the row `id` is the URL
//   identifier, mapped onto PortfolioItem.slug so existing components and
//   /gallery/[id] links keep working unchanged.
// - portfolio_media has NO is_cover column — the cover is the image with the
//   lowest sort_order. It also has no width/height columns, so sensible
//   defaults are used for layout.
//
// If Supabase isn't configured, or a query fails, every function falls back to
// the static seed data in lib/data/ so the site still renders. Components keep
// calling these functions and never touch Supabase directly.

// Pages that use these must not be cached indefinitely, otherwise "changes
// appear immediately" would not hold. Callers set `revalidate`; this is the
// shared value.
export const PORTFOLIO_REVALIDATE_SECONDS = 0

const ITEM_COLUMNS =
  'id, title, category_id, event_type, location, price_range, description, services_included, is_featured, is_public, created_at'

const MEDIA_COLUMNS =
  'id, portfolio_item_id, url, alt_text, variant_label, price, is_bookable, sort_order'

/** Rows come back with the nested media array from the implicit FK join. */
type ItemWithMedia = Pick<
  PortfolioItemRow,
  | 'id'
  | 'title'
  | 'category_id'
  | 'event_type'
  | 'location'
  | 'price_range'
  | 'description'
  | 'services_included'
  | 'is_featured'
  | 'is_public'
> & {
  portfolio_media: Array<
    Pick<
      PortfolioMediaRow,
      | 'id'
      | 'portfolio_item_id'
      | 'url'
      | 'alt_text'
      | 'variant_label'
      | 'price'
      | 'is_bookable'
      | 'sort_order'
    >
  > | null
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapMedia(row: NonNullable<ItemWithMedia['portfolio_media']>[number]): PortfolioImage {
  const price =
    row.price === null || row.price === undefined ? null : Number(row.price)

  return {
    id: row.id,
    url: portfolioPublicUrl(row.url),
    alt: row.alt_text ?? '',
    // Live table has no width/height columns — layout uses these defaults.
    width: 800,
    height: 600,
    isPrimary: false, // resolved after sorting: first image is the cover
    variantLabel: row.variant_label,
    // Guard against a price stored as 0 or NaN being treated as a real price.
    price: price != null && Number.isFinite(price) && price > 0 ? price : null,
    isBookable: row.is_bookable !== false,
    sortOrder: row.sort_order ?? 0,
  }
}

function mapItem(row: ItemWithMedia): PortfolioItem {
  const images = (row.portfolio_media ?? [])
    .map(mapMedia)
    // Admin-defined display order — lowest sort_order is the cover.
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  if (images.length > 0) images[0].isPrimary = true

  return {
    id: row.id,
    // The live table has no slug column — the id IS the URL identifier.
    slug: row.id,
    title: row.title,
    categoryId: row.category_id,
    eventType: (row.event_type ?? 'custom') as EventType,
    location: row.location ?? '',
    priceRange: row.price_range ?? '',
    description: row.description ?? '',
    servicesIncluded: Array.isArray(row.services_included) ? row.services_included : [],
    images,
    featured: Boolean(row.is_featured),
    tags: [],
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function fetchItems(options: {
  id?: string
  categoryId?: string
  eventType?: EventType
  featuredOnly?: boolean
}): Promise<PortfolioItem[] | null> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return null

  let query = supabase
    .from('portfolio_items')
    .select(`${ITEM_COLUMNS}, portfolio_media(${MEDIA_COLUMNS})`)
    // Private items are drafts — never expose them publicly.
    .eq('is_public', true)

  if (options.id) query = query.eq('id', options.id)
  if (options.categoryId) query = query.eq('category_id', options.categoryId)
  if (options.eventType) query = query.eq('event_type', options.eventType)
  if (options.featuredOnly) query = query.eq('is_featured', true)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error || !data) {
    if (error) console.error('[portfolio] query failed, using seed data:', error.message)
    return null
  }

  return (data as unknown as ItemWithMedia[]).map(mapItem)
}

export async function getAllPortfolioItems(): Promise<PortfolioItem[]> {
  const live = await fetchItems({})
  // An empty live table is a legitimate state (admin hasn't added anything yet),
  // but showing an empty gallery is worse than showing the seed examples.
  if (live && live.length > 0) return live
  return seedPortfolioItems
}

export async function getFeaturedPortfolioItems(): Promise<PortfolioItem[]> {
  const live = await fetchItems({ featuredOnly: true })
  if (live && live.length > 0) return live
  return seedPortfolioItems.filter((item) => item.featured)
}

export async function getPortfolioItemsByEventType(
  eventType: EventType,
): Promise<PortfolioItem[]> {
  const live = await fetchItems({ eventType })
  if (live && live.length > 0) return live
  return seedPortfolioItems.filter((item) => item.eventType === eventType)
}

/**
 * Look up one item by its identifier. The live table has no slug column, so
 * the route param is the row `id`; this accepts either a raw id or a legacy
 * seed slug (for the static fallback data).
 */
export async function getPortfolioItemById(idOrSlug: string): Promise<PortfolioItem | null> {
  // Only query the DB when the value looks like a UUID, otherwise PostgREST
  // would reject the id filter before we even get a chance to fall back.
  const looksLikeId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  if (looksLikeId) {
    const live = await fetchItems({ id: idOrSlug })
    if (live && live.length > 0) return live[0]
  }
  return (
    seedPortfolioItems.find(
      (item) => item.slug === idOrSlug || item.id === idOrSlug,
    ) ?? null
  )
}

// ─── Portfolio categories (public gallery filter pills) ──────────────────────

export interface PortfolioCategory {
  id: string
  slug: string
  name: string
  sortOrder: number
}

/**
 * Live categories from portfolio_categories — the public gallery filter pills
 * are built from these, so the admin can add Anniversary/Mandap/Home/Lighting
 * etc. from /admin/portfolio without any code change.
 */
export async function getPortfolioCategories(): Promise<PortfolioCategory[]> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('portfolio_categories')
    .select('id, slug, name, sort_order')
    .order('sort_order', { ascending: true })

  if (error || !data) {
    if (error) console.error('[portfolio] categories query failed:', error.message)
    return []
  }

  return (data as unknown as Array<{
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
}

/**
 * Look up a single priced look plus its parent item — used by the admin
 * bookings panel to show exactly which design a customer picked.
 */
export async function getPortfolioMediaById(mediaId: string): Promise<{
  media: PortfolioImage
  itemId: string
  itemTitle: string
  itemSlug: string
} | null> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('portfolio_media')
    .select(`${MEDIA_COLUMNS}, portfolio_items(id, title)`)
    .eq('id', mediaId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as NonNullable<ItemWithMedia['portfolio_media']>[number] & {
    portfolio_items: { id: string; title: string } | null
  }

  return {
    media: mapMedia(row),
    itemId: row.portfolio_items?.id ?? row.portfolio_item_id,
    itemTitle: row.portfolio_items?.title ?? '',
    // The id doubles as the slug (live table has no slug column).
    itemSlug: row.portfolio_items?.id ?? row.portfolio_item_id,
  }
}

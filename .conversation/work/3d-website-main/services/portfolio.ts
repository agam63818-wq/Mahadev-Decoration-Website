import type { EventType, PortfolioItem, PortfolioImage } from '@/types'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import type { PortfolioItemRow, PortfolioMediaRow } from '@/lib/supabase/database.types'
import {
  dataError,
  dataOk,
  logQueryFailure,
  SUPABASE_UNCONFIGURED,
  type DataResult,
} from './result'

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
// NO STATIC RUNTIME FALLBACK (§2). The previous version returned the
// `seedPortfolioItems` array whenever the query failed or the table was empty,
// so a broken gallery was indistinguishable from a working one and an admin who
// unpublished everything still saw stock examples on the public site. Failures
// are now returned explicitly and the gallery renders an error state.
// Components keep calling these functions and never touch Supabase directly.

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
}): Promise<DataResult<PortfolioItem[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('portfolio', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

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

  if (error) {
    logQueryFailure('portfolio', error.message)
    return dataError(error.message)
  }

  // Zero rows is a legitimate result and is reported as SUCCESS — the gallery
  // then shows its empty state rather than stock examples.
  return dataOk((data as unknown as ItemWithMedia[] | null)?.map(mapItem) ?? [])
}

/** Every public gallery item, newest first. */
export async function getAllPortfolioItems(): Promise<DataResult<PortfolioItem[]>> {
  return fetchItems({})
}

/** Public + featured gallery items — the home page featured strip. */
export async function getFeaturedPortfolioItems(): Promise<DataResult<PortfolioItem[]>> {
  return fetchItems({ featuredOnly: true })
}

/** Public gallery items for one event type. */
export async function getPortfolioItemsByEventType(
  eventType: EventType,
): Promise<DataResult<PortfolioItem[]>> {
  return fetchItems({ eventType })
}

/**
 * Look up one item by its identifier. The live table has no slug column, so
 * the route param IS the row `id`.
 *
 * `data: null` means genuinely not found (the caller should 404) and is now
 * distinguishable from a query failure, which returns `ok: false`.
 */
export async function getPortfolioItemById(
  idOrSlug: string,
): Promise<DataResult<PortfolioItem | null>> {
  // Only query when the value looks like a UUID: PostgREST rejects a malformed
  // uuid filter with a 400, which would surface as a misleading error state.
  const looksLikeId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  if (!looksLikeId) return dataOk(null)

  const result = await fetchItems({ id: idOrSlug })
  if (!result.ok) return result
  return dataOk(result.data[0] ?? null)
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

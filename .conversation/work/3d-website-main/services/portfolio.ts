import type { EventType, PortfolioItem, PortfolioImage } from '@/types'
import { portfolioItems as seedPortfolioItems } from '@/lib/data'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import type { PortfolioItemRow, PortfolioMediaRow } from '@/lib/supabase/database.types'

// ─── Portfolio Service ─────────────────────────────────────────────────────────
// Reads live data from Supabase (portfolio_items + portfolio_media) so that an
// admin edit shows up on the public gallery immediately, with no redeploy.
//
// If Supabase isn't configured, or a query fails, every function falls back to
// the static seed data in lib/data/ so the site still renders. Components keep
// calling these functions and never touch Supabase directly.

// Pages that use these must not be cached indefinitely, otherwise "changes
// appear immediately" would not hold. Callers set `revalidate`; this is the
// shared value.
export const PORTFOLIO_REVALIDATE_SECONDS = 0

const ITEM_COLUMNS =
  'id, slug, title, event_type, location, price_range, description, services_included, tags, is_featured, is_public, created_at'

const MEDIA_COLUMNS =
  'id, portfolio_item_id, url, alt_text, width, height, variant_label, price, is_bookable, is_cover, sort_order'

/** Rows come back with the nested media array from the implicit FK join. */
type ItemWithMedia = Pick<
  PortfolioItemRow,
  | 'id'
  | 'slug'
  | 'title'
  | 'event_type'
  | 'location'
  | 'price_range'
  | 'description'
  | 'services_included'
  | 'tags'
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
      | 'width'
      | 'height'
      | 'variant_label'
      | 'price'
      | 'is_bookable'
      | 'is_cover'
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
    width: row.width ?? 800,
    height: row.height ?? 600,
    isPrimary: Boolean(row.is_cover),
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
    // Admin-defined display order.
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  // Guarantee a cover so gallery cards always have something to show.
  if (images.length > 0 && !images.some((img) => img.isPrimary)) {
    images[0].isPrimary = true
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    eventType: (row.event_type ?? 'custom') as EventType,
    location: row.location ?? '',
    priceRange: row.price_range ?? '',
    description: row.description ?? '',
    servicesIncluded: row.services_included ?? [],
    images,
    featured: Boolean(row.is_featured),
    tags: row.tags ?? [],
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function fetchItems(options: {
  slug?: string
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

  if (options.slug) query = query.eq('slug', options.slug)
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

export async function getPortfolioItemBySlug(slug: string): Promise<PortfolioItem | null> {
  const live = await fetchItems({ slug })
  if (live && live.length > 0) return live[0]
  return seedPortfolioItems.find((item) => item.slug === slug) ?? null
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
    .select(`${MEDIA_COLUMNS}, portfolio_items(id, slug, title)`)
    .eq('id', mediaId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as NonNullable<ItemWithMedia['portfolio_media']>[number] & {
    portfolio_items: { id: string; slug: string; title: string } | null
  }

  return {
    media: mapMedia(row),
    itemId: row.portfolio_items?.id ?? row.portfolio_item_id,
    itemTitle: row.portfolio_items?.title ?? '',
    itemSlug: row.portfolio_items?.slug ?? '',
  }
}

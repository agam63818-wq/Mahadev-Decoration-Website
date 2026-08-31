import type { Package, EventType } from '@/types'
import { packages as seedPackages } from '@/lib/data'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import type { PackageRow, PackageItemRow } from '@/lib/supabase/database.types'

// ─── Packages Service ─────────────────────────────────────────────────────────
// Reads live data from Supabase (packages + package_items) so that an admin
// edit from /admin/packages shows up on /packages and the homepage featured
// section immediately, with no redeploy.
//
// Live-schema notes (verified against the live PostgREST spec):
// - packages HAS slug/starting_price/price_max/setup_time_minutes/
//   decoration_area/customizable/is_featured/is_active — but NO name_en and
//   NO event_type columns.
// - package_items holds the bullet inclusions (label + sort_order) per package.
//
// The Package interface (types/index.ts) is richer than the live table, so the
// mapper derives the missing pieces:
// - nameEn        ← name (there is no separate English name column)
// - eventType     ← 'custom' (there is no event_type column)
// - priceRange    ← derived from starting_price / price_max
// - estimatedSetupTime ← setup_time_minutes formatted as "N घंटे" / "N दिन"
//
// If Supabase isn't configured, or a query fails, every function falls back to
// the static seed data in lib/data/ so the site still renders.

const PACKAGE_COLUMNS =
  'id, slug, name, description, starting_price, price_max, setup_time_minutes, decoration_area, customizable, is_featured, is_active, created_at'

const ITEM_COLUMNS = 'id, package_id, label, sort_order'

/** Rows come back with the nested inclusions array from the implicit FK join. */
type PackageWithItems = Pick<
  PackageRow,
  | 'id'
  | 'slug'
  | 'name'
  | 'description'
  | 'starting_price'
  | 'price_max'
  | 'setup_time_minutes'
  | 'decoration_area'
  | 'customizable'
  | 'is_featured'
  | 'is_active'
> & {
  package_items: Array<Pick<PackageItemRow, 'id' | 'package_id' | 'label' | 'sort_order'>> | null
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

/** Format minutes as a short human label the way the seed data does. */
function formatSetupTime(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return ''
  if (minutes >= 60 * 24) {
    const days = Math.round(minutes / (60 * 24))
    return `${days} दिन`
  }
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60)
    return `${hours} घंटे`
  }
  return `${minutes} मिनट`
}

/** Derive the display price range from starting/max prices. */
function formatPriceRange(starting: number | null, max: number | null): string {
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`
  const start = starting != null && Number.isFinite(starting) ? starting : null
  const top = max != null && Number.isFinite(max) && max > 0 ? max : null

  if (start != null && top != null && top > start) return `${fmt(start)} – ${fmt(top)}`
  if (start != null && top != null && top === start) return fmt(start)
  if (start != null) return `${fmt(start)}+`
  return ''
}

function mapPackage(row: PackageWithItems): Package {
  const inclusions = (row.package_items ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => item.label)
    .filter((label) => typeof label === 'string' && label.trim().length > 0)

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    // Live table has no separate English name column.
    nameEn: row.name,
    // Live table has no event_type column — 'custom' keeps booking URLs valid.
    eventType: 'custom' as EventType,
    startingPrice:
      row.starting_price != null && Number.isFinite(row.starting_price) ? row.starting_price : 0,
    priceRange: formatPriceRange(row.starting_price, row.price_max),
    inclusions,
    estimatedSetupTime: formatSetupTime(row.setup_time_minutes),
    decorationArea: row.decoration_area ?? '',
    customizationAvailable: Boolean(row.customizable),
    // No image column in the live schema — the detail page already renders a
    // gradient placeholder, and cards don't use an image.
    imageUrl: '',
    imageAlt: row.name,
    featured: Boolean(row.is_featured),
    popular: false,
    faq: [],
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function fetchPackages(options: {
  slug?: string
  featuredOnly?: boolean
  /** Admin lists want inactive rows too; public pages pass false. */
  activeOnly?: boolean
}): Promise<Package[] | null> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return null

  let query = supabase
    .from('packages')
    .select(`${PACKAGE_COLUMNS}, package_items(${ITEM_COLUMNS})`)

  if (options.activeOnly !== false) query = query.eq('is_active', true)
  if (options.slug) query = query.eq('slug', options.slug)
  if (options.featuredOnly) query = query.eq('is_featured', true)

  const { data, error } = await query.order('starting_price', { ascending: true })

  if (error || !data) {
    if (error) console.error('[packages] query failed, using seed data:', error.message)
    return null
  }

  return (data as unknown as PackageWithItems[]).map(mapPackage)
}

export async function getAllPackages(): Promise<Package[]> {
  const live = await fetchPackages({ activeOnly: true })
  // An empty live table is a legitimate state (admin hasn't added anything
  // yet), but showing an empty packages page is worse than showing examples.
  if (live && live.length > 0) return live
  return seedPackages
}

export async function getFeaturedPackages(): Promise<Package[]> {
  const live = await fetchPackages({ activeOnly: true, featuredOnly: true })
  if (live && live.length > 0) return live
  return seedPackages.filter((pkg) => pkg.featured)
}

export async function getPackagesByEventType(eventType: EventType): Promise<Package[]> {
  // The live table has no event_type column, so live packages can't be
  // filtered by event type — return the full active list instead. The seed
  // fallback can still honour the filter for its own static data.
  const live = await fetchPackages({ activeOnly: true })
  if (live && live.length > 0) return live
  return seedPackages.filter((pkg) => pkg.eventType === eventType)
}

/**
 * Look up one package by slug. The live packages table HAS a slug column, so
 * the signature and behaviour stay exactly the same as the static version.
 */
export async function getPackageBySlug(slug: string): Promise<Package | null> {
  const live = await fetchPackages({ slug, activeOnly: true })
  if (live && live.length > 0) return live[0]
  return seedPackages.find((pkg) => pkg.slug === slug) ?? null
}

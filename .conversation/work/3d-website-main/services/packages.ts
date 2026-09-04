import type { Package, EventType } from '@/types'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { cardImagePublicUrl } from '@/lib/supabase/config'
import type { PackageRow, PackageItemRow } from '@/lib/supabase/database.types'
import {
  dataError,
  dataOk,
  logQueryFailure,
  SUPABASE_UNCONFIGURED,
  type DataResult,
} from './result'

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
// NO STATIC RUNTIME FALLBACK (§2/§14). The previous version returned the
// `seedPackages` array from lib/data/ whenever the query failed OR the table
// came back empty, which meant:
//   * a broken database looked identical to a healthy one, and
//   * an admin who deliberately deactivated every package still saw six of
//     them on the public site, with prices they had not set.
// Packages are imported into the database from /admin/content, so a failure is
// now returned as an explicit error and the page renders an error state.

const PACKAGE_COLUMNS =
  'id, slug, name, description, starting_price, price_max, setup_time_minutes, decoration_area, customizable, is_featured, is_active, image_url, image_alt, sort_order, created_at'

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
  | 'image_url'
  | 'image_alt'
  | 'sort_order'
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
    // Migration 0010 added image_url/image_alt so the owner can put a real
    // photo on a package card from /admin/packages. Empty string still means
    // "no photo", and the existing gradient placeholder handles that case.
    imageUrl: cardImagePublicUrl(row.image_url ?? ''),
    imageAlt: row.image_alt || row.name,
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
}): Promise<DataResult<Package[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('packages', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  let query = supabase
    .from('packages')
    .select(`${PACKAGE_COLUMNS}, package_items(${ITEM_COLUMNS})`)

  if (options.activeOnly !== false) query = query.eq('is_active', true)
  if (options.slug) query = query.eq('slug', options.slug)
  if (options.featuredOnly) query = query.eq('is_featured', true)

  // sort_order (migration 0010) is the order the owner arranged in the admin.
  // starting_price is kept as the tie-breaker so packages that share a rung
  // still come out cheapest-first, which is what the page previously did.
  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('starting_price', { ascending: true })

  if (error) {
    logQueryFailure('packages', error.message)
    return dataError(error.message)
  }

  // Zero rows is a legitimate result and is reported as SUCCESS — the page
  // then shows its empty state rather than six packages nobody configured.
  return dataOk((data as unknown as PackageWithItems[] | null)?.map(mapPackage) ?? [])
}

/** All active packages in the order the owner arranged them. */
export async function getAllPackages(): Promise<DataResult<Package[]>> {
  return fetchPackages({ activeOnly: true })
}

/** Active + featured packages — the home page packages section. */
export async function getFeaturedPackages(): Promise<DataResult<Package[]>> {
  return fetchPackages({ activeOnly: true, featuredOnly: true })
}

/**
 * The live packages table has NO event_type column (verified against the live
 * PostgREST spec), so packages genuinely cannot be filtered by event type.
 * Returning the full active list is the honest behaviour; the caller labels it
 * as "all packages" rather than pretending the filter applied.
 */
export async function getPackagesByEventType(
  _eventType: EventType,
): Promise<DataResult<Package[]>> {
  return fetchPackages({ activeOnly: true })
}

/**
 * Look up one active package by slug. `data: null` means genuinely not found
 * (the caller should 404), which is now distinguishable from a query failure.
 */
export async function getPackageBySlug(slug: string): Promise<DataResult<Package | null>> {
  const result = await fetchPackages({ slug, activeOnly: true })
  if (!result.ok) return result
  return dataOk(result.data[0] ?? null)
}

/** Every package including inactive ones — admin screens only. */
export async function getPackagesForAdmin(): Promise<DataResult<Package[]>> {
  return fetchPackages({ activeOnly: false })
}

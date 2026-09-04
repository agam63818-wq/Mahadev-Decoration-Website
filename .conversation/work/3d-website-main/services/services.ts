import type { Service, Occasion, EventType } from '@/types'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { cardImagePublicUrl, portfolioPublicUrl } from '@/lib/supabase/config'
import type { OccasionRow, ServiceRow } from '@/lib/supabase/database.types'
import {
  dataError,
  dataOk,
  logQueryFailure,
  SUPABASE_UNCONFIGURED,
  type DataResult,
} from './result'

// ─── Services / Occasions Service ─────────────────────────────────────────────
// Both are now fully admin-managed database tables:
//   * public.services  — migration 0005 (seeded with the original 12 services)
//   * public.occasions — migration 0004
//
// NO STATIC RUNTIME FALLBACK. The seeds live in the migrations, so a failed
// query means something is genuinely broken and the page must say so (§2/§8).
// Every function returns DataResult so the caller can render loading / empty /
// error states instead of silently showing sample content.

const SERVICE_COLUMNS =
  'id, slug, name, name_en, description, description_en, icon, event_type, starting_price, image_url, image_alt, is_featured, is_active, sort_order, created_at, updated_at'

const OCCASION_COLUMNS =
  'id, slug, name, name_en, description, event_type, starting_price, image_url, image_alt, icon, sort_order, is_active, created_at, updated_at'

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    nameEn: row.name_en || row.name,
    description: row.description ?? '',
    descriptionEn: row.description_en ?? '',
    // Lucide icon name — used by the card ONLY when imageUrl is empty.
    icon: row.icon || 'Sparkles',
    eventType: (row.event_type || 'custom') as EventType,
    startingPrice:
      typeof row.starting_price === 'number' && Number.isFinite(row.starting_price)
        ? row.starting_price
        : 0,
    // Card artwork lives in the `card-images` bucket, but the seeded rows hold
    // `/assets/...` local paths — cardImagePublicUrl passes those through
    // untouched and only expands bare object paths.
    imageUrl: cardImagePublicUrl(row.image_url ?? ''),
    imageAlt: row.image_alt || row.name,
    featured: Boolean(row.is_featured),
    sortOrder:
      typeof row.sort_order === 'number' && Number.isFinite(row.sort_order) ? row.sort_order : 0,
  }
}

function mapOccasion(row: OccasionRow): Occasion {
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    nameEn: row.name_en || row.name,
    description: row.description ?? '',
    eventType: (row.event_type || 'custom') as EventType,
    startingPrice: Number.isFinite(row.starting_price) ? row.starting_price : 0,
    imageUrl: portfolioPublicUrl(row.image_url ?? ''),
    imageAlt: row.image_alt || row.name,
    icon: row.icon || 'Sparkles',
  }
}

// ─── Services queries ─────────────────────────────────────────────────────────

async function fetchServices(options: {
  slug?: string
  eventType?: EventType
  featuredOnly?: boolean
  /** Admin lists pass false to include inactive rows; public pages omit it. */
  activeOnly?: boolean
}): Promise<DataResult<Service[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('services', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  let query = supabase.from('services').select(SERVICE_COLUMNS)

  if (options.activeOnly !== false) query = query.eq('is_active', true)
  if (options.slug) query = query.eq('slug', options.slug)
  if (options.eventType) query = query.eq('event_type', options.eventType)
  if (options.featuredOnly) query = query.eq('is_featured', true)

  const { data, error } = await query.order('sort_order', { ascending: true })

  if (error) {
    logQueryFailure('services', error.message)
    return dataError(error.message)
  }

  // An empty array is a LEGITIMATE result (admin deactivated everything) and is
  // reported as success — the page then renders its empty state, not seed data.
  return dataOk((data as unknown as ServiceRow[] | null)?.map(mapService) ?? [])
}

/** All active services in display order. */
export async function getAllServices(): Promise<DataResult<Service[]>> {
  return fetchServices({ activeOnly: true })
}

/** Active + featured services (home page "Popular" strip). */
export async function getFeaturedServices(): Promise<DataResult<Service[]>> {
  return fetchServices({ activeOnly: true, featuredOnly: true })
}

/** One active service by slug. `data: null` = genuinely not found (→ 404). */
export async function getServiceBySlug(slug: string): Promise<DataResult<Service | null>> {
  const result = await fetchServices({ slug, activeOnly: true })
  if (!result.ok) return result
  return dataOk(result.data[0] ?? null)
}

/** One active service by event type. `data: null` = genuinely not found. */
export async function getServiceByEventType(
  eventType: EventType,
): Promise<DataResult<Service | null>> {
  const result = await fetchServices({ eventType, activeOnly: true })
  if (!result.ok) return result
  return dataOk(result.data[0] ?? null)
}

/** Every service including inactive ones — admin screens only. */
export async function getServicesForAdmin(): Promise<DataResult<Service[]>> {
  return fetchServices({ activeOnly: false })
}

// ─── Occasions queries ────────────────────────────────────────────────────────

/**
 * Active occasions, ordered for the home page.
 *
 * Previously fell back to the static `seedOccasions` array on error OR on an
 * empty table, which meant a broken database looked identical to a healthy one.
 * Migration 0004 seeds the rows, so the fallback is gone.
 */
export async function getOccasions(): Promise<DataResult<Occasion[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('occasions', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const { data, error } = await supabase
    .from('occasions')
    .select(OCCASION_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    logQueryFailure('occasions', error.message)
    return dataError(error.message)
  }

  return dataOk((data as unknown as OccasionRow[] | null)?.map(mapOccasion) ?? [])
}

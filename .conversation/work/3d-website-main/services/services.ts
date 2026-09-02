import type { Service, Occasion, EventType } from '@/types'
import { services, occasions as seedOccasions } from '@/lib/data'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import type { OccasionRow } from '@/lib/supabase/database.types'

// ─── Services Service ─────────────────────────────────────────────────────────
// Services (the 12 service pages) remain static. Occasions (the six home-page
// cards) are admin-managed in public.occasions — see migration 0004.

export async function getAllServices(): Promise<Service[]> {
  return services.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getFeaturedServices(): Promise<Service[]> {
  return services.filter((s) => s.featured).sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return services.find((s) => s.slug === slug) ?? null
}

export async function getServiceByEventType(eventType: EventType): Promise<Service | null> {
  return services.find((s) => s.eventType === eventType) ?? null
}

// ─── Occasions ────────────────────────────────────────────────────────────────

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

/**
 * Active occasions, ordered for the home page. Falls back to the seed cards
 * only while the table is empty or unreachable — once the admin imports or
 * adds a single occasion, the site shows exactly what the admin manages.
 */
export async function getOccasions(): Promise<Occasion[]> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return seedOccasions

  const { data, error } = await supabase
    .from('occasions')
    .select(
      'id, slug, name, name_en, description, event_type, starting_price, image_url, image_alt, icon, sort_order, is_active, created_at, updated_at',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    if (error) {
      // Table absent until migration 0004 is applied — that's expected, not an error.
      const missing = /occasions/i.test(error.message) && /schema cache|does not exist/i.test(error.message)
      ;(missing ? console.warn : console.error)('[occasions] using seed data:', error.message)
    }
    return seedOccasions
  }

  const live = (data as unknown as OccasionRow[]).map(mapOccasion)
  return live.length > 0 ? live : seedOccasions
}

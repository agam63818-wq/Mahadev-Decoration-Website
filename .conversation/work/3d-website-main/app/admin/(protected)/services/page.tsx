import { getSupabaseReadClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, cardImagePublicUrl } from '@/lib/supabase/config'
import { ServicesManager, type AdminService } from './ServicesManager'
import type { ServiceRow } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'

/**
 * /admin/services — the twelve service cards that drive the public /services
 * page and the home page "popular" strip (migration 0005).
 *
 * force-dynamic because the admin must see the true current rows, including
 * inactive ones that the public query filters out.
 */
export default async function AdminServicesPage() {
  const { services, failed } = await loadServices()

  return (
    <ServicesManager
      initialServices={services}
      supabaseReady={isSupabaseConfigured()}
      loadFailed={failed}
    />
  )
}

const COLUMNS =
  'id, slug, name, name_en, description, description_en, icon, event_type, starting_price, image_url, image_alt, is_featured, is_active, sort_order'

async function loadServices(): Promise<{ services: AdminService[]; failed: boolean }> {
  const supabase = getSupabaseReadClient()
  // Unconfigured is reported as a load failure so the UI shows the error state
  // rather than pretending the table is empty (§17).
  if (!supabase) return { services: [], failed: true }

  const { data, error } = await supabase
    .from('services')
    .select(COLUMNS)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[admin/services] load failed:', error.message)
    return { services: [], failed: true }
  }

  // `data` of length 0 is a LEGITIMATE success — the owner deleted everything.
  const rows = (data as unknown as ServiceRow[] | null) ?? []

  return {
    services: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameEn: row.name_en ?? '',
      description: row.description ?? '',
      descriptionEn: row.description_en ?? '',
      eventType: row.event_type ?? 'custom',
      startingPrice:
        typeof row.starting_price === 'number' && Number.isFinite(row.starting_price)
          ? row.starting_price
          : 0,
      imageUrl: row.image_url,
      // Handles all three stored shapes: bucket path, /assets/... and absolute.
      imagePublicUrl: cardImagePublicUrl(row.image_url ?? ''),
      imageAlt: row.image_alt ?? '',
      icon: row.icon ?? 'Sparkles',
      isFeatured: Boolean(row.is_featured),
      isActive: Boolean(row.is_active),
      sortOrder:
        typeof row.sort_order === 'number' && Number.isFinite(row.sort_order) ? row.sort_order : 0,
    })),
    failed: false,
  }
}

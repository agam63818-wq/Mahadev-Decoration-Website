import { getSupabaseReadClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { PackagesManager, type AdminPackage } from './PackagesManager'

export const dynamic = 'force-dynamic'

/**
 * /admin/packages — full control over the public packages section.
 *
 * Reads straight from Supabase on every request (force-dynamic) so the admin
 * always sees the true current state, including inactive packages that the
 * public /packages page hides. Live-schema notes: packages HAS slug but no
 * name_en/event_type columns, and the bullet inclusions live in package_items.
 */
export default async function AdminPackagesPage() {
  const packages = await loadPackages()

  return <PackagesManager initialPackages={packages} supabaseReady={isSupabaseConfigured()} />
}

async function loadPackages(): Promise<AdminPackage[]> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('packages')
    .select(
      `id, slug, name, description, starting_price, price_max, setup_time_minutes,
       decoration_area, customizable, is_featured, is_active, created_at,
       package_items ( id, package_id, label, sort_order )`,
    )
    .order('created_at', { ascending: true })

  if (error || !data) {
    if (error) console.error('[admin/packages] load failed:', error.message)
    return []
  }

  type Row = {
    id: string
    slug: string
    name: string
    description: string | null
    starting_price: number | null
    price_max: number | null
    setup_time_minutes: number | null
    decoration_area: string | null
    customizable: boolean
    is_featured: boolean
    is_active: boolean
    package_items: Array<{
      id: string
      package_id: string
      label: string
      sort_order: number
    }> | null
  }

  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    startingPrice: row.starting_price,
    priceMax: row.price_max,
    setupTimeMinutes: row.setup_time_minutes,
    decorationArea: row.decoration_area ?? '',
    customizable: row.customizable,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    items: (row.package_items ?? [])
      .map((item) => ({
        id: item.id,
        label: item.label,
        sortOrder: item.sort_order ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }))
}

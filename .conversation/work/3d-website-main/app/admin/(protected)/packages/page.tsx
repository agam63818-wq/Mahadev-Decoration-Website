import { getSupabaseReadClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, cardImagePublicUrl } from '@/lib/supabase/config'
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
  const { packages, failed } = await loadPackages()

  return (
    <PackagesManager
      initialPackages={packages}
      supabaseReady={isSupabaseConfigured()}
      loadFailed={failed}
    />
  )
}

async function loadPackages(): Promise<{ packages: AdminPackage[]; failed: boolean }> {
  const supabase = getSupabaseReadClient()
  // Reported as a failure, not as "no packages": §17 requires an unreachable
  // database and a genuinely empty table to look different to the owner.
  if (!supabase) return { packages: [], failed: true }

  const { data, error } = await supabase
    .from('packages')
    .select(
      `id, slug, name, description, starting_price, price_max, setup_time_minutes,
       decoration_area, customizable, is_featured, is_active, image_url, image_alt,
       sort_order, created_at,
       package_items ( id, package_id, label, sort_order )`,
    )
    // sort_order is the owner-controlled order added by migration 0010;
    // created_at breaks ties so the list is deterministic.
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) {
    if (error) console.error('[admin/packages] load failed:', error.message)
    return { packages: [], failed: true }
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
    image_url: string | null
    image_alt: string | null
    sort_order: number | null
    package_items: Array<{
      id: string
      package_id: string
      label: string
      sort_order: number
    }> | null
  }

  return {
    packages: (data as unknown as Row[]).map((row) => ({
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
      imageUrl: row.image_url,
      imagePublicUrl: cardImagePublicUrl(row.image_url ?? ''),
      imageAlt: row.image_alt ?? '',
      sortOrder: row.sort_order ?? 0,
      items: (row.package_items ?? [])
        .map((item) => ({
          id: item.id,
          label: item.label,
          sortOrder: item.sort_order ?? 0,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })),
    failed: false,
  }
}

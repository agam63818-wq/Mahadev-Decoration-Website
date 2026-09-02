import { getSupabaseReadClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, portfolioPublicUrl } from '@/lib/supabase/config'
import {
  packages as seedPackages,
  portfolioItems as seedPortfolio,
  occasions as seedOccasions,
} from '@/lib/data'
import type { OccasionRow } from '@/lib/supabase/database.types'
import { ContentManager, type AdminOccasion, type ContentCounts } from './ContentManager'

export const dynamic = 'force-dynamic'

/**
 * /admin/content — "वेबसाइट कंटेंट".
 *
 * One place to (a) see whether the live site is still showing built-in sample
 * content or the admin's own Supabase rows, (b) import that sample content into
 * Supabase so every package / design / occasion card becomes editable and
 * deletable, and (c) manage the six home-page occasion cards.
 */
export default async function AdminContentPage() {
  const [counts, occasions] = await Promise.all([loadCounts(), loadOccasions()])

  return (
    <ContentManager
      counts={counts}
      initialOccasions={occasions}
      supabaseReady={isSupabaseConfigured()}
    />
  )
}

async function loadCounts(): Promise<ContentCounts> {
  const seed = {
    packages: seedPackages.length,
    portfolio: seedPortfolio.length,
    occasions: seedOccasions.length,
  }
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    return { live: { packages: 0, portfolio: 0, occasions: 0 }, seed, occasionsTableMissing: false }
  }

  const [pk, pf, oc] = await Promise.all([
    supabase.from('packages').select('id', { count: 'exact', head: true }),
    supabase.from('portfolio_items').select('id', { count: 'exact', head: true }),
    supabase.from('occasions').select('id', { count: 'exact', head: true }),
  ])

  return {
    live: {
      packages: pk.count ?? 0,
      portfolio: pf.count ?? 0,
      occasions: oc.count ?? 0,
    },
    seed,
    occasionsTableMissing: Boolean(oc.error),
  }
}

async function loadOccasions(): Promise<AdminOccasion[]> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('occasions')
    .select(
      'id, slug, name, name_en, description, event_type, starting_price, image_url, image_alt, icon, sort_order, is_active, created_at, updated_at',
    )
    .order('sort_order', { ascending: true })

  if (error || !data) {
    if (error && !error.message.includes('occasions')) {
      console.error('[admin/content] occasions load failed:', error.message)
    }
    return []
  }

  return (data as unknown as OccasionRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameEn: row.name_en,
    description: row.description,
    eventType: row.event_type,
    startingPrice: row.starting_price,
    imageUrl: row.image_url,
    imagePublicUrl: portfolioPublicUrl(row.image_url),
    imageAlt: row.image_alt,
    icon: row.icon,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }))
}

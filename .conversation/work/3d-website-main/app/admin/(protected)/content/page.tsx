import { getSupabaseReadClient } from '@/lib/supabase/server'
import {
  isSupabaseConfigured,
  portfolioPublicUrl,
  cardImagePublicUrl,
} from '@/lib/supabase/config'
import {
  packages as seedPackages,
  portfolioItems as seedPortfolio,
  occasions as seedOccasions,
} from '@/lib/data'
import type { OccasionRow, TeamMemberRow } from '@/lib/supabase/database.types'
import { ContentManager, type AdminOccasion, type ContentCounts } from './ContentManager'
import type { AdminTeamMember } from './TeamGrid'

export const dynamic = 'force-dynamic'

/**
 * /admin/content — "वेबसाइट कंटेंट".
 *
 * One place to (a) see whether the live site is still showing built-in sample
 * content or the admin's own Supabase rows, (b) import that sample content into
 * Supabase so every package / design / occasion card becomes editable and
 * deletable, (c) manage the six home-page occasion cards, and (d) PART 3 §14:
 * manage the /about "हमारी टीम" members.
 */
export default async function AdminContentPage() {
  const [counts, occasions, team] = await Promise.all([
    loadCounts(),
    loadOccasions(),
    loadTeam(),
  ])

  return (
    <ContentManager
      counts={counts}
      initialOccasions={occasions.occasions}
      occasionsLoadFailed={occasions.failed}
      initialTeam={team.members}
      teamLoadFailed={team.failed}
      supabaseReady={isSupabaseConfigured()}
    />
  )
}

/**
 * §14: reads public.team_members (migration 0006) — ALL rows, including the
 * inactive ones the public /about query filters out, because the admin must be
 * able to see and re-enable a hidden member.
 *
 * `phone` IS selected here (unlike services/business.ts, which deliberately
 * omits it for the public page) because this payload is only ever rendered
 * inside the admin shell.
 */
const TEAM_COLUMNS = 'id, name, role, photo_url, phone, is_active, sort_order'

async function loadTeam(): Promise<{ members: AdminTeamMember[]; failed: boolean }> {
  const supabase = getSupabaseReadClient()
  // Unconfigured is reported as a load FAILURE, not as an empty team (§24).
  if (!supabase) return { members: [], failed: true }

  const { data, error } = await supabase
    .from('team_members')
    .select(TEAM_COLUMNS)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[admin/content] team_members load failed:', error.message)
    return { members: [], failed: true }
  }

  // Zero rows is a LEGITIMATE success — the owner deleted everyone.
  const rows = (data as unknown as TeamMemberRow[] | null) ?? []

  return {
    members: rows.map((row) => ({
      id: row.id,
      name: row.name ?? '',
      role: row.role ?? '',
      photoUrl: row.photo_url,
      // Handles all three stored shapes: bucket path, /assets/... and absolute.
      photoPublicUrl: cardImagePublicUrl(row.photo_url ?? ''),
      phone: row.phone,
      isActive: Boolean(row.is_active),
      sortOrder:
        typeof row.sort_order === 'number' && Number.isFinite(row.sort_order) ? row.sort_order : 0,
    })),
    failed: false,
  }
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

async function loadOccasions(): Promise<{ occasions: AdminOccasion[]; failed: boolean }> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return { occasions: [], failed: true }

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
    /*
     * A missing `occasions` table is NOT a load failure — ContentManager
     * already shows a dedicated "run migration 0004" panel for that case via
     * counts.occasionsTableMissing. Flagging it as failed too would stack two
     * conflicting messages, so only real errors set `failed`.
     */
    const tableMissing = Boolean(error?.message.includes('occasions'))
    return { occasions: [], failed: !tableMissing }
  }

  const occasions = (data as unknown as OccasionRow[]).map((row) => ({
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

  return { occasions, failed: false }
}

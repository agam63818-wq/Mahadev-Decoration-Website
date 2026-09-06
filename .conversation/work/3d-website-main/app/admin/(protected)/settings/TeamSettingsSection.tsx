import { getSupabaseReadClient } from '@/lib/supabase/server'
import { cardImagePublicUrl, isSupabaseConfigured } from '@/lib/supabase/config'
import type { TeamMemberRow } from '@/lib/supabase/database.types'
import { TeamGrid, type AdminTeamMember } from '../content/TeamGrid'

export const dynamic = 'force-dynamic'

/**
 * Team management lives in Settings because these are business-owned profile
 * records, not catalog content. The same TeamGrid/actions remain the single
 * CRUD implementation, so /admin/content and /admin/settings cannot drift.
 */
export async function TeamSettingsSection() {
  const supabaseReady = isSupabaseConfigured()
  if (!supabaseReady) {
    return (
      <section className="max-w-5xl space-y-3">
        <h2 className="font-devanagari text-xl font-bold text-champagne">हमारी टीम</h2>
        <TeamGrid members={[]} loadFailed={true} supabaseReady={false} />
      </section>
    )
  }

  const supabase = getSupabaseReadClient()
  if (!supabase) {
    return (
      <section className="max-w-5xl space-y-3">
        <h2 className="font-devanagari text-xl font-bold text-champagne">हमारी टीम</h2>
        <TeamGrid members={[]} loadFailed={true} supabaseReady={false} />
      </section>
    )
  }

  const { data, error } = await supabase
    .from('team_members')
    .select('id, name, role, photo_url, phone, is_active, sort_order')
    .order('sort_order', { ascending: true })

  const members: AdminTeamMember[] = error
    ? []
    : ((data as unknown as TeamMemberRow[] | null) ?? []).map((row) => ({
        id: row.id,
        name: row.name ?? '',
        role: row.role ?? '',
        photoUrl: row.photo_url,
        photoPublicUrl: cardImagePublicUrl(row.photo_url ?? ''),
        phone: row.phone,
        isActive: Boolean(row.is_active),
        sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : 0,
      }))

  return (
    <section className="max-w-5xl space-y-3 border-t border-gold/10 pt-8">
      <div>
        <h2 className="font-devanagari text-xl font-bold text-champagne">हमारी टीम</h2>
        <p className="font-devanagari mt-1 text-sm text-text-muted">
          वेबसाइट के टीम कार्ड यहीं से जोड़ें, नाम/पद बदलें, फोटो लगाएँ, छिपाएँ या क्रम बदलें।
        </p>
      </div>
      <TeamGrid members={members} loadFailed={Boolean(error)} supabaseReady />
    </section>
  )
}

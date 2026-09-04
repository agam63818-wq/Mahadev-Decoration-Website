import type {
  BusinessSettings,
  BusinessHours,
  ServiceArea,
  SocialLinks,
  Stat,
  ProcessStep,
  WhyChooseFeature,
  TeamMember,
} from '@/types'
// Static imports below are BRAND CONSTANTS only (name, tagline, hero copy,
// process steps, "why choose us" bullets, service areas). They are marketing
// copy, not business records, so they are a legitimate default — unlike
// teamMembers, which is now a real database table and is no longer imported.
import {
  businessSettings,
  heroStats,
  statsBar,
  processSteps,
  whyChooseFeatures,
  serviceAreas,
} from '@/lib/data'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { cardImagePublicUrl } from '@/lib/supabase/config'
import type { BusinessSettingsRow, TeamMemberRow } from '@/lib/supabase/database.types'
import {
  dataError,
  dataOk,
  logQueryFailure,
  SUPABASE_UNCONFIGURED,
  type DataResult,
} from './result'

/** Exactly the team columns the public About card needs — `phone` excluded. */
type TeamMemberPublicRow = Pick<
  TeamMemberRow,
  'id' | 'name' | 'role' | 'photo_url' | 'is_active' | 'sort_order'
>

// ─── Business Settings Service ────────────────────────────────────────────────
// business_settings is a singleton row and the single source of truth for
// phone / WhatsApp / address / social links across the ENTIRE public site —
// navbar, footer, contact page, floating buttons and the mobile action bar all
// read from here, so one admin edit updates every surface at once.

/**
 * Live business settings, merged over the static brand defaults.
 *
 * Only non-empty DB values override the defaults, so partially-filled settings
 * never blank out the brand name or tagline. Contact fields (phone / whatsapp /
 * address) default to EMPTY rather than a plausible-looking placeholder — the
 * UI treats empty as "not configured yet" and hides the CTA instead of
 * advertising a number that doesn't work.
 */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return businessSettings

  const { data: row, error } = await supabase
    .from('business_settings')
    .select('phone, whatsapp, email, address, business_hours, social_links')
    .limit(1)
    .maybeSingle()

  if (error || !row) {
    if (error) console.error('[business] query failed, using defaults:', error.message)
    return businessSettings
  }

  const data = row as unknown as Pick<
    BusinessSettingsRow,
    'phone' | 'whatsapp' | 'email' | 'address' | 'business_hours' | 'social_links'
  >

  const text = (value: unknown, fallback: string): string => {
    if (typeof value !== 'string') return fallback
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }

  // social_links is jsonb, treated as an open platform -> url map.
  const socialLinks: SocialLinks =
    data.social_links && typeof data.social_links === 'object' && !Array.isArray(data.social_links)
      ? Object.fromEntries(
          Object.entries(data.social_links as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
            .map(([k, v]) => [k, (v as string).trim()]),
        )
      : {}

  const businessHours: BusinessHours[] = Array.isArray(data.business_hours)
    ? (data.business_hours as unknown as BusinessHours[])
    : businessSettings.businessHours

  const address = text(data.address, '')

  return {
    ...businessSettings,
    phone: text(data.phone, ''),
    whatsapp: text(data.whatsapp, ''),
    email: text(data.email, ''),
    address,
    businessHours,
    socialLinks,
  }
}

/**
 * True until the admin has filled in phone, WhatsApp *and* address.
 * Drives the admin-only "व्यवसाय की जानकारी जोड़ें" reminder banner, which
 * disappears once all three are present.
 */
export function isBusinessInfoIncomplete(settings: BusinessSettings): boolean {
  return !settings.phone?.trim() || !settings.whatsapp?.trim() || !settings.address?.trim()
}

export async function getHeroStats(): Promise<Stat[]> {
  return heroStats
}

export async function getStatsBar(): Promise<Stat[]> {
  return statsBar
}

export async function getProcessSteps(): Promise<ProcessStep[]> {
  return processSteps
}

export async function getWhyChooseFeatures(): Promise<WhyChooseFeature[]> {
  return whyChooseFeatures
}

export async function getServiceAreas(): Promise<ServiceArea[]> {
  return serviceAreas
}

// ─── Team members ─────────────────────────────────────────────────────────────
// Backed by public.team_members (migration 0006), seeded once with exactly the
// three members the About page already showed.
//
// NO STATIC RUNTIME FALLBACK (§12/§13): the old implementation returned the
// `teamMembers` array from lib/data/business.ts unconditionally, so the owner
// could not add a decorator and a database failure was invisible. Now a failed
// query returns an explicit error and /about renders a real error state.
//
// `phone` is deliberately NOT selected: team_members is publicly readable for
// active rows, and the owner's internal contact numbers should not be shipped
// in the page payload. It exists for the Part 2 admin list only.
const TEAM_COLUMNS = 'id, name, role, photo_url, is_active, sort_order'

function mapTeamMember(row: TeamMemberPublicRow): TeamMember {
  const photo = cardImagePublicUrl(row.photo_url ?? '')
  return {
    id: row.id,
    name: row.name ?? '',
    // The live table has ONE role column, holding the Hindi label the card
    // shows most prominently. There is no separate English role column, so
    // both fields read from it rather than inventing a translation.
    role: row.role ?? '',
    roleHindi: row.role ?? '',
    // No bio / yearsExperience columns exist in team_members (§10: do not
    // invent fields the project does not need). The About card already treats
    // these as optional text and omits the line when empty.
    bio: '',
    photoUrl: photo,
    photoAlt: photo ? `${row.name ?? ''} — महादेव डेकोरेशन` : '',
    yearsExperience: 0,
  }
}

/** Active team members in display order. */
export async function getTeamMembers(): Promise<DataResult<TeamMember[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('team_members', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const { data, error } = await supabase
    .from('team_members')
    .select(TEAM_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    logQueryFailure('team_members', error.message)
    return dataError(error.message)
  }

  // Zero rows is a legitimate state (owner deactivated everyone) — reported as
  // success so the About page hides the section instead of showing seed data.
  return dataOk((data as unknown as TeamMemberPublicRow[] | null)?.map(mapTeamMember) ?? [])
}

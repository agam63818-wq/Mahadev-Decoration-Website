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
import {
  businessSettings,
  heroStats,
  statsBar,
  processSteps,
  whyChooseFeatures,
  serviceAreas,
  teamMembers,
} from '@/lib/data'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import type { BusinessSettingsRow } from '@/lib/supabase/database.types'

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

export async function getTeamMembers(): Promise<TeamMember[]> {
  return teamMembers
}

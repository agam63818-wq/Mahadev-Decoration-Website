import type { BusinessSettings, ServiceArea, Stat, ProcessStep, WhyChooseFeature, TeamMember } from '@/types'
import {
  businessSettings,
  heroStats,
  statsBar,
  processSteps,
  whyChooseFeatures,
  serviceAreas,
  teamMembers,
} from '@/lib/data'

// ─── Business Settings Service ────────────────────────────────────────────────
// Part 2 will replace these with Supabase queries from business_settings table.

export async function getBusinessSettings(): Promise<BusinessSettings> {
  return businessSettings
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

import type { Package, EventType } from '@/types'
import { packages } from '@/lib/data'

// ─── Packages Service ─────────────────────────────────────────────────────────
// Part 2 will replace these with Supabase queries.

export async function getAllPackages(): Promise<Package[]> {
  return packages
}

export async function getFeaturedPackages(): Promise<Package[]> {
  return packages.filter((pkg) => pkg.featured)
}

export async function getPackagesByEventType(eventType: EventType): Promise<Package[]> {
  return packages.filter((pkg) => pkg.eventType === eventType)
}

export async function getPackageBySlug(slug: string): Promise<Package | null> {
  return packages.find((pkg) => pkg.slug === slug) ?? null
}

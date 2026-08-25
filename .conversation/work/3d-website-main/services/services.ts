import type { Service, Occasion, EventType } from '@/types'
import { services, occasions } from '@/lib/data'

// ─── Services Service ─────────────────────────────────────────────────────────
// Part 2 will replace these with Supabase queries.

export async function getAllServices(): Promise<Service[]> {
  return services.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getFeaturedServices(): Promise<Service[]> {
  return services.filter((s) => s.featured).sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return services.find((s) => s.slug === slug) ?? null
}

export async function getServiceByEventType(eventType: EventType): Promise<Service | null> {
  return services.find((s) => s.eventType === eventType) ?? null
}

export async function getOccasions(): Promise<Occasion[]> {
  return occasions
}

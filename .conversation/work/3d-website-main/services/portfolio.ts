import type { PortfolioItem, EventType } from '@/types'
import { portfolioItems } from '@/lib/data'

// ─── Portfolio Service ─────────────────────────────────────────────────────────
// Part 2 will replace these with Supabase queries.
// Components call these functions — not the raw data arrays.

export async function getAllPortfolioItems(): Promise<PortfolioItem[]> {
  return portfolioItems
}

export async function getFeaturedPortfolioItems(): Promise<PortfolioItem[]> {
  return portfolioItems.filter((item) => item.featured)
}

export async function getPortfolioItemsByEventType(eventType: EventType): Promise<PortfolioItem[]> {
  return portfolioItems.filter((item) => item.eventType === eventType)
}

export async function getPortfolioItemBySlug(slug: string): Promise<PortfolioItem | null> {
  return portfolioItems.find((item) => item.slug === slug) ?? null
}

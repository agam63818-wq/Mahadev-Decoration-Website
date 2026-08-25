import type { Review, EventType } from '@/types'
import { reviews } from '@/lib/data'

// ─── Reviews Service ──────────────────────────────────────────────────────────
// Part 2 will replace these with Supabase queries.
// Only approved reviews are returned — enforced here (and in Part 2 via RLS).

export async function getApprovedReviews(): Promise<Review[]> {
  return reviews.filter((r) => r.approved)
}

export async function getFeaturedReviews(): Promise<Review[]> {
  return reviews.filter((r) => r.approved && r.featured)
}

export async function getReviewsByEventType(eventType: EventType): Promise<Review[]> {
  return reviews.filter((r) => r.approved && r.eventType === eventType)
}

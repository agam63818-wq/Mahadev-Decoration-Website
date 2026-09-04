import type { Review, EventType } from '@/types'
import { getSupabaseReadClient } from '@/lib/supabase/server'
import { cardImagePublicUrl } from '@/lib/supabase/config'
import type { ReviewRow } from '@/lib/supabase/database.types'
import {
  dataError,
  dataOk,
  logQueryFailure,
  SUPABASE_UNCONFIGURED,
  type DataResult,
} from './result'

// ─── Reviews Service ──────────────────────────────────────────────────────────
// Backed by public.reviews (migration 0009), which is seeded with the eight
// genuine testimonials that previously lived in lib/data/reviews.ts.
//
// Only APPROVED reviews are returned to the public — enforced twice: by the
// `approved = true` filter here AND by the "reviews public read approved" RLS
// policy, so an anon key cannot read the pending moderation queue even if a
// query forgot the filter.
//
// NO STATIC RUNTIME FALLBACK (§2): a failed query returns an explicit error.

// Column names match the hand-maintained ReviewRow exactly: `date` (not
// event_date) and `featured` (not is_featured). PostgREST fails the WHOLE
// request on an unknown column, so this list is deliberately conservative and
// omits updated_at, which nothing on the public side renders.
const REVIEW_COLUMNS =
  'id, customer_name, customer_location, event_type, rating, review_text, event_photo_url, event_photo_alt, customer_photo_url, customer_photo_alt, date, featured, approved, created_at'

function mapReview(row: ReviewRow): Review {
  const rating =
    typeof row.rating === 'number' && Number.isFinite(row.rating)
      ? Math.min(5, Math.max(1, Math.round(row.rating)))
      : 5

  const eventPhoto = cardImagePublicUrl(row.event_photo_url ?? '')
  const customerPhoto = cardImagePublicUrl(row.customer_photo_url ?? '')

  return {
    id: row.id,
    customerName: row.customer_name ?? '',
    customerLocation: row.customer_location ?? '',
    eventType: (row.event_type || 'custom') as EventType,
    rating,
    reviewText: row.review_text ?? '',
    // Omit the key entirely when there is no photo, so the card's
    // `review.eventPhotoUrl && ...` guards keep working and no broken
    // <Image> is ever rendered.
    ...(eventPhoto ? { eventPhotoUrl: eventPhoto } : {}),
    ...(eventPhoto ? { eventPhotoAlt: row.event_photo_alt || row.customer_name || '' } : {}),
    ...(customerPhoto ? { customerPhotoUrl: customerPhoto } : {}),
    ...(customerPhoto ? { customerPhotoAlt: row.customer_photo_alt || row.customer_name || '' } : {}),
    // The Review type wants an ISO date string; `date` is a DATE column, and
    // falls back to created_at so a review always has something to sort/show.
    date: row.date ?? row.created_at ?? '',
    featured: Boolean(row.featured),
    approved: Boolean(row.approved),
  }
}

async function fetchReviews(options: {
  featuredOnly?: boolean
  eventType?: EventType
  /** Admin moderation queue passes false to also see unapproved rows. */
  approvedOnly?: boolean
}): Promise<DataResult<Review[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('reviews', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  let query = supabase.from('reviews').select(REVIEW_COLUMNS)

  if (options.approvedOnly !== false) query = query.eq('approved', true)
  if (options.featuredOnly) query = query.eq('featured', true)
  if (options.eventType) query = query.eq('event_type', options.eventType)

  const { data, error } = await query.order('date', {
    ascending: false,
    nullsFirst: false,
  })

  if (error) {
    logQueryFailure('reviews', error.message)
    return dataError(error.message)
  }

  return dataOk((data as unknown as ReviewRow[] | null)?.map(mapReview) ?? [])
}

/** Approved reviews, newest event first — the public /reviews page. */
export async function getApprovedReviews(): Promise<DataResult<Review[]>> {
  return fetchReviews({ approvedOnly: true })
}

/** Approved + featured reviews — the home page testimonial strip. */
export async function getFeaturedReviews(): Promise<DataResult<Review[]>> {
  return fetchReviews({ approvedOnly: true, featuredOnly: true })
}

/** Approved reviews for one event type — service/package detail pages. */
export async function getReviewsByEventType(
  eventType: EventType,
): Promise<DataResult<Review[]>> {
  return fetchReviews({ approvedOnly: true, eventType })
}

/**
 * Every review including the pending moderation queue — admin only.
 * Ordered newest-created first, because the admin's job is to triage new
 * submissions rather than browse by event date.
 */
export async function getReviewsForAdmin(): Promise<DataResult<Review[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('reviews', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    logQueryFailure('reviews', error.message)
    return dataError(error.message)
  }

  return dataOk((data as unknown as ReviewRow[] | null)?.map(mapReview) ?? [])
}

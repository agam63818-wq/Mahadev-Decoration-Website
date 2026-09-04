import { getReviewsForAdmin } from '@/services/reviews'
import { ReviewsClient } from './ReviewsClient'

export const dynamic = 'force-dynamic'

/**
 * §2 — Review moderation.
 *
 * Previously `sampleReviews`: eight invented testimonials (several containing
 * corrupted text — "Que hora excellent work", "बहुत सоживता से") attributed to
 * invented customers in invented towns. Moderating fake reviews is worse than
 * showing none, because the approve/reject buttons imply the rows are real.
 *
 * Now sourced from the `reviews` table created by migration 0009, which also
 * seeds the eight REAL testimonials that previously lived in lib/data/reviews.ts.
 */
export default async function AdminReviewsPage() {
  const result = await getReviewsForAdmin()

  return <ReviewsClient reviews={result.ok ? result.data : []} hasError={!result.ok} />
}

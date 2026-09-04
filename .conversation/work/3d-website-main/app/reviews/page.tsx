import type { Metadata } from 'next'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import { getApprovedReviews } from '@/services/reviews'
import { ReviewsPageClient } from '@/features/reviews/ReviewsPageClient'

export const metadata: Metadata = {
  title: 'समीक्षाएं — ग्राहकों की राय',
  description:
    'महादेव डेकोरेशन के ग्राहकों की असली समीक्षाएं — वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार डेकोरेशन। बेगूसराय, बिहार।',
  openGraph: {
    title: 'समीक्षाएं | महादेव डेकोरेशन',
    description: '1000+ खुश ग्राहकों की असली समीक्षाएं',
  },
}

// Reviews are moderated in the admin, so an approval must show up immediately.
export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const result = await getApprovedReviews()
  const reviews = result.ok ? result.data : []

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      <div className="bg-gradient-to-b from-bg-purple to-bg-void py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading
            title="ग्राहकों की राय"
            subtitle="हमारे खुश ग्राहकों की असली समीक्षाएं — बिना किसी बदलाव के"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Only approved rows from public.reviews — the old static array is
            gone, so an empty moderation queue shows an empty state rather
            than eight testimonials nobody submitted. */}
        {!result.ok ? (
          <RetryableErrorState />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="अभी कोई समीक्षा नहीं"
            description="जैसे ही ग्राहकों की समीक्षाएँ स्वीकरेंगी, वे यहाँ दिखाई देंगी।"
          />
        ) : (
          <ReviewsPageClient reviews={reviews} />
        )}
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import type { Review } from '@/types'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} में से 5 स्टार`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? 'text-gold fill-gold' : 'text-text-muted/30'}
        />
      ))}
    </div>
  )
}

interface ReviewCardProps {
  review: Review
  index: number
}

function ReviewCard({ review, index }: ReviewCardProps) {
  const eventTypeLabels: Record<string, string> = {
    wedding: 'वेडिंग',
    birthday: 'बर्थडे',
    haldi: 'हल्दी',
    mehendi: 'मेहंदी',
    stage: 'स्टेज',
    car: 'कार',
    anniversary: 'एनिवर्सरी',
    mandap: 'मंडप',
    home: 'होम',
    flower: 'फ्लावर',
    lighting: 'लाइटिंग',
    custom: 'कस्टम',
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: 'easeOut' }}
      className="relative group bg-gradient-to-br from-bg-purple to-bg-rich border border-gold/10 rounded-2xl p-6 hover:border-gold/20 hover:shadow-xl hover:shadow-gold/5 transition-all duration-300"
    >
      {/* Top gold accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar — circular with border */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-bg-burgundy border border-gold/20 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0 group-hover:border-gold/40 group-hover:shadow-md group-hover:shadow-gold/10 transition-all duration-300">
            {review.customerName.charAt(0)}
          </div>
          <div>
            <p className="text-champagne font-semibold text-sm font-devanagari group-hover:text-gold-bright transition-colors">
              {review.customerName}
            </p>
            <p className="text-text-muted text-xs">{review.customerLocation}</p>
          </div>
        </div>
        {/* Event type badge */}
        <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-gold/5 to-gold/10 border border-gold/20 text-gold font-devanagari flex-shrink-0">
          {eventTypeLabels[review.eventType] ?? review.eventType}
        </span>
      </div>

      {/* Star rating — gold */}
      <div className="mb-3">
        <StarRating rating={review.rating} />
      </div>

      {/* Review text — premium typography */}
      <p className="text-text-muted text-sm leading-relaxed mt-2 font-devanagari line-clamp-3">
        &ldquo;{review.reviewText}&rdquo;
      </p>

      {/* Date — subtle */}
      <p className="text-text-muted text-xs mt-3 font-devanagari">
        {new Date(review.date).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long' })}
      </p>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
    </motion.article>
  )
}

interface ReviewsSectionProps {
  reviews: Review[]
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const router = useRouter()

  return (
    <section className="relative py-16 md:py-24 bg-bg-purple/20 overflow-hidden" aria-labelledby="reviews-heading">
      {/* Background ornaments */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gold/3 blur-3xl pointer-events-none opacity-20" />
      <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-burgundy/5 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="reviews-heading"
          title="ग्राहकों की राय"
          subtitle="हमारे खुश ग्राहकों की असली समीक्षाएं — हर सलाह एक कहानी"
          className="mb-12"
          align="left"
        />

        {/* Reviews grid — premium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/reviews')}
            className="font-devanagari gap-1.5"
          >
            <span>सभी समीक्षाएं देखें</span>
            <span className="text-gold-dim">↓</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/reviews#submit')}
            className="font-devanagari gap-1.5"
          >
            अपना अनुभव साझा करें <span className="text-gold-dim">↑</span>
          </Button>
        </div>
      </div>
    </section>
  )
}

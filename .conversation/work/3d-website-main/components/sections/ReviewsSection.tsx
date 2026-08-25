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
          className={star <= rating ? 'text-gold fill-gold' : 'text-text-muted'}
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className="bg-bg-purple border border-gold/10 rounded-2xl p-6 hover:border-gold/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-bg-burgundy flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
            {review.customerName.charAt(0)}
          </div>
          <div>
            <p className="text-champagne font-semibold text-sm font-devanagari">{review.customerName}</p>
            <p className="text-text-muted text-xs">{review.customerLocation}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold font-devanagari">
          {eventTypeLabels[review.eventType] ?? review.eventType}
        </span>
      </div>

      <StarRating rating={review.rating} />

      <p className="text-text-muted text-sm leading-relaxed mt-3 font-devanagari">
        &ldquo;{review.reviewText}&rdquo;
      </p>

      <p className="text-text-muted text-xs mt-3">
        {new Date(review.date).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long' })}
      </p>
    </motion.article>
  )
}

interface ReviewsSectionProps {
  reviews: Review[]
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const router = useRouter()

  return (
    <section className="py-16 md:py-24 bg-bg-purple/20" aria-labelledby="reviews-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="reviews-heading"
          title="ग्राहकों की राय"
          subtitle="हमारे खुश ग्राहकों की असली समीक्षाएं"
          className="mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/reviews')}
            className="font-devanagari"
          >
            सभी समीक्षाएं देखें
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/reviews#submit')}
            className="font-devanagari"
          >
            अपना अनुभव साझा करें
          </Button>
        </div>
      </div>
    </section>
  )
}

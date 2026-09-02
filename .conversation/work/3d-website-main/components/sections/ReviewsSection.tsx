'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Magnetic, Reveal, Stagger, StaggerItem, TiltCard } from '@/components/motion'
import type { Review } from '@/types'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} में से 5 स्टार`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.span
          key={star}
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.3 + star * 0.07, type: 'spring', stiffness: 300, damping: 15 }}
          className="inline-flex"
        >
          <Star
            size={14}
            className={star <= rating ? 'text-gold fill-gold drop-shadow-[0_0_4px_rgba(201,168,76,0.5)]' : 'text-text-muted/30'}
          />
        </motion.span>
      ))}
    </div>
  )
}

interface ReviewCardProps {
  review: Review
  index: number
}

function ReviewCard({ review }: ReviewCardProps) {
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
    <StaggerItem className="group h-full">
    <TiltCard
      maxTilt={3}
      lift={5}
      className="h-full bg-gradient-to-br from-bg-purple to-bg-rich border border-gold/10 rounded-2xl p-6 hover:border-gold/35 shadow-card-lift hover:shadow-gold-glow-sm transition-[border-color,box-shadow] duration-300"
    >
    <article className="relative h-full flex flex-col">
      {/* Top gold accent */}
      <div className="absolute -top-6 -left-6 -right-6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      {/* Quote mark */}
      <span
        aria-hidden="true"
        className="absolute -top-2 right-0 text-6xl font-display leading-none text-gold/10 group-hover:text-gold/20 transition-colors duration-500 select-none"
      >
        ”
      </span>

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
      <p className="text-text-muted text-xs mt-auto pt-3 font-devanagari">
        {new Date(review.date).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long' })}
      </p>
    </article>
    </TiltCard>
    </StaggerItem>
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
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10" stagger={0.1}>
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </Stagger>

        {/* CTAs */}
        <Reveal className="flex flex-col sm:flex-row gap-3 justify-center" delay={0.1}>
          <Magnetic strength={0.2}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/reviews')}
              className="font-devanagari gap-1.5 w-full sm:w-auto"
            >
              <span>सभी समीक्षाएं देखें</span>
              <span>→</span>
            </Button>
          </Magnetic>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/reviews#submit')}
            className="font-devanagari gap-1.5"
          >
            अपना अनुभव साझा करें <span className="text-gold-dim">↑</span>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}

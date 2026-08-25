'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { Review, EventType } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

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

const filterOptions: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'सभी' },
  { value: 'wedding', label: 'वेडिंग' },
  { value: 'birthday', label: 'बर्थडे' },
  { value: 'haldi', label: 'हल्दी' },
  { value: 'mehendi', label: 'मेहंदी' },
  { value: 'stage', label: 'स्टेज' },
  { value: 'car', label: 'कार' },
  { value: 'anniversary', label: 'एनिवर्सरी' },
]

const ratingOptions = [
  { value: 0, label: 'सभी रेटिंग' },
  { value: 5, label: '⭐⭐⭐⭐⭐ 5 स्टार' },
  { value: 4, label: '⭐⭐⭐⭐ 4+ स्टार' },
]

interface ReviewsPageClientProps {
  reviews: Review[]
}

export function ReviewsPageClient({ reviews }: ReviewsPageClientProps) {
  const [activeType, setActiveType] = useState<EventType | 'all'>('all')
  const [minRating, setMinRating] = useState(0)
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const filtered = reviews.filter((r) => {
    const typeMatch = activeType === 'all' || r.eventType === activeType
    const ratingMatch = r.rating >= minRating
    return typeMatch && ratingMatch
  })

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'

  return (
    <>
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-bg-purple border border-gold/20 rounded-2xl">
        <div className="text-center">
          <div className="text-5xl font-bold text-gold tabular-nums">{avgRating}</div>
          <div className="flex gap-0.5 justify-center mt-1">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={16} className="text-gold fill-gold" />
            ))}
          </div>
          <p className="text-text-muted text-xs mt-1">{reviews.length} समीक्षाएं</p>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-champagne font-devanagari font-semibold text-lg">हमारे ग्राहक हमसे प्यार करते हैं</p>
          <p className="text-text-muted text-sm font-devanagari">100% वेरिफाइड समीक्षाएं — सिर्फ असली ग्राहकों की</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowSubmitForm(true)}
          className="font-devanagari"
        >
          अपना अनुभव साझा करें
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="इवेंट टाइप फिल्टर">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveType(f.value)}
              aria-pressed={activeType === f.value}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari ${
                activeType === f.value
                  ? 'bg-gold text-bg-void'
                  : 'border border-gold/30 text-text-muted hover:border-gold hover:text-champagne'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          aria-label="रेटिंग फिल्टर"
          className="px-3 py-1.5 rounded-full text-sm bg-bg-purple border border-gold/30 text-text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {ratingOptions.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Reviews grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="कोई समीक्षा नहीं मिली"
          description="इस फिल्टर के साथ कोई समीक्षा नहीं है।"
          action={
            <Button variant="secondary" size="sm" onClick={() => { setActiveType('all'); setMinRating(0) }} className="font-devanagari">
              सभी देखें
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((review, i) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (i % 6) * 0.06 }}
              className="bg-bg-purple border border-gold/10 rounded-2xl p-6 hover:border-gold/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
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

              <div className="flex gap-0.5 mb-3" aria-label={`${review.rating} में से 5 स्टार`}>
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={14} className={s <= review.rating ? 'text-gold fill-gold' : 'text-text-muted'} />
                ))}
              </div>

              <p className="text-text-muted text-sm leading-relaxed font-devanagari">
                &ldquo;{review.reviewText}&rdquo;
              </p>

              <p className="text-text-muted text-xs mt-3">
                {new Date(review.date).toLocaleDateString('hi-IN', { year: 'numeric', month: 'long' })}
              </p>
            </motion.article>
          ))}
        </div>
      )}

      {/* Submit review form placeholder */}
      {showSubmitForm && (
        <div id="submit" className="mt-12 p-8 bg-bg-purple border border-gold/20 rounded-2xl">
          <h2 className="text-2xl font-bold text-champagne font-devanagari mb-2">अपना अनुभव साझा करें</h2>
          <p className="text-text-muted font-devanagari mb-6">
            आपकी समीक्षा हमारे लिए बहुत महत्वपूर्ण है। यह फॉर्म Part 2 में Supabase से जुड़ेगा।
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-champagne text-sm font-devanagari mb-1">आपका नाम *</label>
              <input
                type="text"
                placeholder="जैसे: अमन कुमार"
                className="w-full px-4 py-3 rounded-xl bg-bg-void border border-gold/20 text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold font-devanagari"
              />
            </div>
            <div>
              <label className="block text-champagne text-sm font-devanagari mb-1">इवेंट टाइप *</label>
              <select className="w-full px-4 py-3 rounded-xl bg-bg-void border border-gold/20 text-text-primary focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold font-devanagari">
                <option value="">चुनें</option>
                {Object.entries(eventTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-champagne text-sm font-devanagari mb-1">आपकी समीक्षा *</label>
              <textarea
                rows={4}
                placeholder="अपना अनुभव लिखें..."
                className="w-full px-4 py-3 rounded-xl bg-bg-void border border-gold/20 text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold font-devanagari resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" size="md" className="font-devanagari" onClick={() => alert('Part 2 में Supabase से जुड़ेगा')}>
                समीक्षा भेजें
              </Button>
              <Button variant="ghost" size="md" onClick={() => setShowSubmitForm(false)} className="font-devanagari">
                रद्द करें
              </Button>
            </div>
            <p className="text-text-muted text-xs font-devanagari">
              * समीक्षाएं admin approval के बाद ही public होती हैं।
            </p>
          </div>
        </div>
      )}
    </>
  )
}

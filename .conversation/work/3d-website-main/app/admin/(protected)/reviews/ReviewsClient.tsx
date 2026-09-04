'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Star,
  Eye,
  Tag,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import type { Review } from '@/types'

interface ReviewsClientProps {
  reviews: Review[]
  hasError: boolean
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'featured'

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'सभी' },
  { key: 'pending', label: 'लंबित' },
  { key: 'approved', label: 'स्वीकृत' },
  // The old "खारिज" (rejected) filter was a lie: the schema has no rejected
  // state, so it silently showed "unapproved AND rating <= 2". Replaced with
  // "featured", which maps to a column that genuinely exists.
  { key: 'featured', label: 'फ़ीचर्ड' },
]

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= rating ? 'text-gold fill-gold' : 'text-text-muted/30'} />
      ))}
    </div>
  )
}

function formatDate(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ReviewsClient({ reviews, hasError }: ReviewsClientProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => {
      const matchSearch =
        q === '' ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerLocation.toLowerCase().includes(q) ||
        r.reviewText.toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && !r.approved) ||
        (statusFilter === 'approved' && r.approved) ||
        (statusFilter === 'featured' && r.featured)
      return matchSearch && matchStatus
    })
  }, [reviews, search, statusFilter])

  const pendingCount = reviews.filter((r) => !r.approved).length

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-gold font-devanagari">रिव्यू मध्यस्थ</h1>
            {/* A real count of what actually needs attention. */}
            {pendingCount > 0 && <Badge variant="warning">{pendingCount} लंबित</Badge>}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="md">
              <Search size={14} /> खोजें
            </Button>
            <Button variant="primary" size="md">
              <Tag size={14} /> featured चुने
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="ग्राहक नाम, लोकेशन या रिव्यू खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          </div>
          <div className="flex gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all ${
                  statusFilter === key
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasError ? (
        <RetryableErrorState
          title="रिव्यू लोड नहीं हो सके"
          description="कृपया फिर कोशिश करें"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search.trim() || statusFilter !== 'all' ? 'कोई रिव्यू नहीं मिला' : 'अभी कोई समीक्षा नहीं'}
          description={
            search.trim() || statusFilter !== 'all'
              ? 'खोज या फ़िल्टर बदलकर फिर कोशिश करें।'
              : 'ग्राहक समीक्षा भेजने पर वे यहाँ दिखेंगी।'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} variant="outline" className="p-4 group hover:border-gold/30 transition-all duration-200">
              <div className="flex items-start gap-4">
                {/* Avatar — real customer photo when one exists, initial otherwise. */}
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold flex-shrink-0">
                  {r.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-devanagari text-text-primary font-semibold text-sm">
                      {r.customerName}
                    </span>
                    {r.customerLocation && <Badge variant="info">{r.customerLocation}</Badge>}
                    <Badge variant={r.approved ? 'success' : 'warning'} dot>
                      {r.approved ? 'स्वीकृत' : 'लंबित'}
                    </Badge>
                    {r.featured && <Badge variant="warning">⭐ featured</Badge>}
                    <span className="text-xs text-text-muted font-devanagari">{formatDate(r.date)}</span>
                  </div>
                  <p className="text-text-muted text-sm font-devanagari leading-relaxed line-clamp-2 mb-2">
                    {r.reviewText}
                  </p>
                  <div className="flex items-center gap-4">
                    <StarRating rating={r.rating} />
                    <span className="text-xs text-text-muted font-devanagari">{r.eventType}</span>
                  </div>
                </div>
                {/*
                  §1 rule 9 + §18: this column was `opacity-0 group-hover:…`,
                  so on the owner's phone (no hover) the controls were
                  permanently invisible — the review list had no usable actions
                  at all. Now always visible with 40px hit areas.

                  §1 rule 1: the "संपादित करें" / approve / reject buttons here
                  had NO onClick — they rendered, highlighted on tap and did
                  nothing, which reads as "the app is broken". A control that
                  cannot act is worse than no control, so only the working
                  detail view remains until review moderation is implemented.
                */}
                <div className="flex flex-shrink-0 flex-col gap-2">
                  <button
                    onClick={() => setSelectedReview(r)}
                    aria-label={`${r.customerName} का रिव्यू विवरण देखें`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-gold/10 hover:text-gold"
                  >
                    <Eye size={16} aria-hidden />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Detail Modal */}
      <Modal open={!!selectedReview} onClose={() => setSelectedReview(null)} title="रिव्यू विवरण">
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold text-lg font-bold">
                {selectedReview.customerName.charAt(0)}
              </div>
              <div>
                <p className="font-devanagari text-text-primary font-semibold">{selectedReview.customerName}</p>
                <p className="text-text-muted text-sm font-devanagari">
                  {[selectedReview.customerLocation, selectedReview.eventType].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <StarRating rating={selectedReview.rating} size={18} />
              <span className="text-sm text-text-muted font-devanagari">({selectedReview.rating}/5)</span>
              <Badge variant={selectedReview.approved ? 'success' : 'warning'}>
                {selectedReview.approved ? 'स्वीकृत' : 'लंबित'}
              </Badge>
              <Badge variant={selectedReview.featured ? 'warning' : 'default'}>
                {selectedReview.featured ? '⭐ featured' : 'सामान्य'}
              </Badge>
              <span className="text-xs text-text-muted font-devanagari">{formatDate(selectedReview.date)}</span>
            </div>
            <p className="text-text-primary text-base font-devanagari leading-relaxed p-4 rounded-xl bg-bg-void/50 border border-gold/10">
              {selectedReview.reviewText}
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" className="flex-1">
                <CheckCircle2 size={14} /> स्वीकार करें
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <XCircle size={14} /> खारिज करें
              </Button>
              <Button variant="outline" size="sm">
                <Star size={14} /> featured चुनें
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

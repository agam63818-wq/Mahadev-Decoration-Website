'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Star,
  Edit,
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

interface Review {
  id: string
  customer_name: string
  customer_location: string
  event_type: string
  rating: number
  review_text: string
  date: string
  featured: boolean
  approved: boolean
}

const sampleReviews: Review[] = [
  { id: 'RV-001', customer_name: 'रमेश कुमार', customer_location: 'बेगूसराय', event_type: 'वेडिंग', rating: 5, review_text: 'बोहोत ही शानदार डेकोरेशन था! महादेव कुमार जी ने हमारी शादी को यादगार बना दिया। Highly recommend!', date: '2024-10-16', featured: true, approved: true },
  { id: 'RV-002', customer_name: 'सुनीता देवी', customer_location: 'पटना', event_type: 'बर्थडे', rating: 4, review_text: 'बर्थडे पार्टी के लिए बेहतरीन डेकोरेशन। बच्चों को बहुत पसंद आया।', date: '2024-10-21', featured: false, approved: true },
  { id: 'RV-003', customer_name: 'ज्योति सिंह', customer_location: 'मुजफ्फरपुर', event_type: 'हल्दी', rating: 5, review_text: 'हल्दी सेरेमनी का डेकोरेशन बहुत ही खूबसूरत था। धन्यवाद महादेव डेकोरेशन!', date: '2024-10-26', featured: true, approved: true },
  { id: 'RV-004', customer_name: 'आशा कुमारी', customer_location: 'दरभंगा', event_type: 'मेहंदी', rating: 4, review_text: 'मेहंदी पार्टी के लिए प्रिंटिंग और सजावट बेहतरीन थी।', date: '2024-10-29', featured: false, approved: true },
  { id: 'RV-005', customer_name: 'विकास यादव', customer_location: 'समस्तीपुर', event_type: 'कार', rating: 1, review_text: 'कार डेकोरेशन समय पर नहीं मिला। ग्राहक सेवा में सुधार चाहिए।', date: '2024-11-02', featured: false, approved: false },
  { id: 'RV-006', customer_name: 'प्रिया देवी', customer_location: 'भागलपुर', event_type: 'स्टेज', rating: 5, review_text: 'स्टेज डेकोरेशन अद्भुत था! LED और फूलों का संयोजन बहुत प्रभावशाली था। Que hora excellent work!', date: '2024-11-08', featured: false, approved: false },
  { id: 'RV-007', customer_name: 'रितु वर्मा', customer_location: 'लखीसराय', event_type: 'अनंति', rating: 4, review_text: 'ससुराल की अनंति के लिए डेकोरेशन करवाया। बहुत सоживता से काम किया。', date: '2024-11-14', featured: false, approved: true },
  { id: 'RV-008', customer_name: 'कविता सिंह', customer_location: 'खगड़िया', event_type: 'वेडिंग', rating: 5, review_text: 'दूसरी बार महादेव डेकोरेशन से वेडिंग करवा रही हूँ। हर बार बेहतरीन! 🙌', date: '2024-11-19', featured: false, approved: false },
]

export default function AdminReviewsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  const filtered = sampleReviews.filter((r) => {
    const matchSearch =
      search === '' ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_location.toLowerCase().includes(search.toLowerCase()) ||
      r.review_text.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !r.approved) ||
      (statusFilter === 'approved' && r.approved) ||
      (statusFilter === 'rejected' && !r.approved && r.rating <= 2)
    return matchSearch && matchStatus
  })

  const getStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= rating ? 'text-gold fill-gold' : 'text-text-muted/30'}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">रिव्यू मध्यस्थ</h1>
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
            {[
              { key: 'all', label: 'सभी' },
              { key: 'pending', label: 'लंबित' },
              { key: 'approved', label: 'स्वीकृत' },
              { key: 'rejected', label: 'खारिज' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as typeof statusFilter)}
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

      {/* Reviews List */}
      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} variant="outline" className="p-4 group hover:border-gold/30 transition-all duration-200">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold flex-shrink-0">
                {r.customer_name.charAt(0)}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-devanagari text-text-primary font-semibold text-sm">
                    {r.customer_name}
                  </span>
                  <Badge variant="info">{r.customer_location}</Badge>
                  <Badge variant={r.approved ? 'success' : 'warning'} dot>
                    {r.approved ? 'स्वीकृत' : 'लंबित'}
                  </Badge>
                  <span className="text-xs text-text-muted font-devanagari">{r.date}</span>
                </div>
                <p className="text-text-muted text-sm font-devanagari leading-relaxed line-clamp-2 mb-2">
                  {r.review_text}
                </p>
                <div className="flex items-center gap-4">
                  {getStarRating(r.rating)}
                  <span className="text-xs text-text-muted font-devanagari">{r.event_type}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedReview(r)}
                  className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                  title="विवरण देखें"
                >
                  <Eye size={16} className="text-text-muted hover:text-gold" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors" title="संपादित करें">
                  <Edit size={16} className="text-text-muted hover:text-gold" />
                </button>
                {r.approved ? (
                  <button className="p-1.5 rounded-lg hover:bg-rose-400/10 transition-colors" title="खारिज करें">
                    <XCircle size={16} className="text-text-muted hover:text-rose-400" />
                  </button>
                ) : (
                  <button className="p-1.5 rounded-lg hover:bg-emerald-400/10 transition-colors" title="स्वीकार करें">
                    <CheckCircle2 size={16} className="text-text-muted hover:text-emerald-400" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card variant="outline" className="p-8 text-center">
          <Star size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-gold font-devanagari font-medium">कोई रिव्यू नहीं मिला।</p>
          <p className="text-text-muted text-sm font-devanagari mt-1">ऐसा लगता है कि अभी तक कोई रिव्यू नहीं आया है।</p>
        </Card>
      )}

      {/* Review Detail Modal */}
      <Modal open={!!selectedReview} onClose={() => setSelectedReview(null)} title="रिव्यू विवरण">
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold text-lg font-bold">
                {selectedReview.customer_name.charAt(0)}
              </div>
              <div>
                <p className="font-devanagari text-text-primary font-semibold">{selectedReview.customer_name}</p>
                <p className="text-text-muted text-sm font-devanagari">{selectedReview.customer_location} • {selectedReview.event_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={18} className={i <= selectedReview.rating ? 'text-gold fill-gold' : 'text-text-muted/30'} />
                ))}
              </div>
              <span className="text-sm text-text-muted font-devanagari">({selectedReview.rating}/5)</span>
              <Badge variant={selectedReview.approved ? 'success' : 'warning'}>
                {selectedReview.approved ? 'स्वीकृत' : 'लंबित'}
              </Badge>
              <Badge variant={selectedReview.featured ? 'warning' : 'default'}>
                {selectedReview.featured ? '⭐ featured' : 'सामान्य'}
              </Badge>
            </div>
            <p className="text-text-primary text-base font-devanagari leading-relaxed p-4 rounded-xl bg-bg-void/50 border border-gold/10">
              {selectedReview.review_text}
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

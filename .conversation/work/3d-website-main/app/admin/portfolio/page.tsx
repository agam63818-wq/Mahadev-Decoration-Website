'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Camera,
  Heart,
  Tag,
  Globe,
  Lock,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface PortfolioItem {
  id: string
  title: string
  eventType: string
  location: string
  priceRange: string
  featured: boolean
  isPublic: boolean
  imageUrl: string
  createdAt: string
}

const samplePortfolio: PortfolioItem[] = [
  { id: 'PI-001', title: 'शाही वेडिंग मंडप', eventType: 'वेडिंग', location: 'बेगूसराय', priceRange: '₹20,000 – ₹45,000', featured: true, isPublic: true, imageUrl: '/assets/flower-arch-hero.png', createdAt: '2024-10-01' },
  { id: 'PI-002', title: 'बर्थडे शॉक र PORTFOLIO', eventType: 'बर्थडे', location: 'पटना', priceRange: '₹5,000 – ₹12,000', featured: true, isPublic: true, imageUrl: '/assets/birthday.png', createdAt: '2024-10-05' },
  { id: 'PI-003', title: 'हल्दी डेकोरेशन', eventType: 'हल्दी', location: 'मुजफ्फरपुर', priceRange: '₹4,000 – ₹8,000', featured: false, isPublic: true, imageUrl: '/assets/haldi.png', createdAt: '2024-10-10' },
  { id: 'PI-004', title: 'मेहंदी सजावट', eventType: 'मेहंदी', location: 'दरभंगा', priceRange: '₹3,000 – ₹6,000', featured: false, isPublic: true, imageUrl: '/assets/mehendi.png', createdAt: '2024-10-12' },
  { id: 'PI-005', title: 'कार डेकोरेशन — वेडिंग', eventType: 'कार', location: 'बेगूसराय', priceRange: '₹8,000 – ₹15,000', featured: true, isPublic: true, imageUrl: '/assets/car-decoration-hero.png', createdAt: '2024-10-15' },
  { id: 'PI-006', title: 'स्टेज डेकोरेशन', eventType: 'स्टेज', location: 'समस्तीपुर', priceRange: '₹10,000 – ₹25,000', featured: false, isPublic: true, imageUrl: '/assets/stage.png', createdAt: '2024-10-18' },
  { id: 'PI-007', title: 'अनंति डेकोरेशन', eventType: 'अनंति', location: 'भागलपुर', priceRange: '₹8,000 – ₹20,000', featured: false, isPublic: false, imageUrl: '/assets/anniversary.png', createdAt: '2024-10-20' },
  { id: 'PI-008', title: 'राखी थाली डेकोरेशन', eventType: 'राखी', location: 'लखीसराय', priceRange: '₹2,000 – ₹5,000', featured: false, isPublic: true, imageUrl: '/assets/rakhi-thali.jpg', createdAt: '2024-08-15' },
]

export default function AdminPortfolioPage() {
  const [search, setSearch] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [publicOnly, setPublicOnly] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const filtered = samplePortfolio.filter((item) => {
    const matchSearch =
      search === '' ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.eventType.toLowerCase().includes(search.toLowerCase())
    const matchFeatured = !featuredOnly || item.featured
    const matchPublic = !publicOnly || item.isPublic
    return matchSearch && matchFeatured && matchPublic
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">पोर्टफोलियो प्रबंधक</h1>
          <Button variant="primary" size="md" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> नया पोर्टफोलियो आइटम
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="शीर्षक, लोकेशन या इवेंट टाइप खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFeaturedOnly(!featuredOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all ${
                featuredOnly
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
              }`}
            >
              <Star size={14} /> featured ही दिखाएं
            </button>
            <button
              onClick={() => setPublicOnly(!publicOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all ${
                publicOnly
                  ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40'
                  : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
              }`}
            >
              <Globe size={14} /> public ही दिखाएं
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filtered.map((item, i) => (
          <Card key={item.id} variant="outline" className="overflow-hidden group hover:border-gold/40 transition-all duration-200">
            <div className="relative aspect-[4/3] bg-bg-void/80">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-void/80 via-transparent to-transparent" />
              {/* Badges overlay */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <Badge variant={item.featured ? 'warning' : 'default'} dot>
                  {item.featured ? '⭐ Featured' : 'सामान्य'}
                </Badge>
                <Badge variant={item.isPublic ? 'success' : 'info'} dot>
                  {item.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                </Badge>
              </div>
              {/* Hover actions */}
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-bg-void/80 rounded-b-2xl">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-gold/20 text-gold text-xs font-devanagari hover:bg-gold/30 transition-colors"
                  >
                    <Edit size={12} /> संपादित करें
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-400/20 text-rose-400 text-xs font-devanagari hover:bg-rose-400/30 transition-colors"
                  >
                    <Trash2 size={12} /> हटाएं
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2 text-center font-devanagari">
                  {item.eventType} — {item.location}
                </p>
                <p className="text-xs text-gold font-semibold mt-1">{item.priceRange}</p>
              </div>
            </div>
            <div className="p-3">
              <p className="font-devanagari text-text-primary font-semibold text-sm truncate">{item.title}</p>
              <p className="text-xs text-text-muted font-devanagari mt-1">
                {item.id} • {item.createdAt}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card variant="outline" className="p-8 text-center">
          <ImageIcon size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-gold font-devanagari font-medium">कोई पोर्टफोलियो आइटम नहीं मिला।</p>
          <p className="text-text-muted text-sm font-devanagari mt-1">नया आइटम अपलोड करने के लिए ऊपर वाला बटन दबाएं।</p>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="नया पोर्टफोलियो आइटम">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-devanagari text-text-muted mb-1 block">शीर्षक</label>
            <Input placeholder="जैसे — शाही वेडिंग मंडप" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-devanagari text-text-muted mb-1 block">इवेंट टाइप</label>
              <select className="w-full px-3 py-2.5 rounded-xl bg-bg-void/50 border border-gold/20 text-text-primary text-sm font-devanagari">
                <option>वेडिंग</option>
                <option>बर्थडे</option>
                <option>हल्दी</option>
                <option>मेहंदी</option>
                <option>कार</option>
                <option>स्टेज</option>
                <option>अनंति</option>
                <option>राखी</option>
                <option>घर</option>
                <option>फूल</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-devanagari text-text-muted mb-1 block">लोकेशन</label>
              <Input placeholder="बेगूसराय" />
            </div>
          </div>
          <div>
            <label className="text-sm font-devanagari text-text-muted mb-1 block">कीमत की सीमा</label>
            <Input placeholder="जैसे — ₹5,000 – ₹10,000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-devanagari text-text-muted mb-1 block">छवि अपलोड</label>
              <div className="border-2 border-dashed border-gold/30 rounded-xl p-6 text-center hover:border-gold/50 transition-colors cursor-pointer">
                <Camera size={24} className="mx-auto text-gold mb-2" />
                <p className="text-xs text-text-muted font-devanagari">छवि यहां खींचें या क्लिक करें</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/10 text-sm font-devanagari text-text-muted cursor-pointer hover:border-gold/30 transition-colors">
                <input type="checkbox" defaultChecked className="accent-gold" />
                <Star size={14} /> featured
              </label>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/10 text-sm font-devanagari text-text-muted cursor-pointer hover:border-gold/30 transition-colors">
                <input type="checkbox" defaultChecked className="accent-gold" />
                <Globe size={14} /> public
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowUploadModal(false)}>
              रद्द
            </Button>
            <Button variant="primary" size="md" className="flex-1">
              <Upload size={16} /> अपलोड करें
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteId(null) }}
        onConfirm={() => { setShowDeleteDialog(false); setDeleteId(null) }}
        title="पोर्टफोलियो आइटम हटाएं"
        description={`क्या आप वाकई पोर्टफोलियो आइटम ${deleteId} को हटाना चाहते हैं? यह सकylesheeपूर्ववत नहीं किया जा सकता।`}
        confirmLabel="हटाएं"
      />

      {/* Item Detail Modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="पोर्टफोलियो आइटम विवरण"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-bg-void/80">
              <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">शीर्षक</p>
                <p className="font-devanagari text-text-primary font-medium">{selectedItem.title}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">इवेंट टाइप</p>
                <p className="font-devanagari text-text-primary">{selectedItem.eventType}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">लोकेशन</p>
                <p className="font-devanagari text-text-primary">{selectedItem.location}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">कीमत की सीमा</p>
                <p className="text-gold font-devanagari font-medium">{selectedItem.priceRange}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10 col-span-2 flex items-center gap-2">
                <Badge variant={selectedItem.featured ? 'warning' : 'default'}>
                  {selectedItem.featured ? '⭐ Featured' : 'सामान्य'}
                </Badge>
                <Badge variant={selectedItem.isPublic ? 'success' : 'info'}>
                  {selectedItem.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" className="flex-1">
                <Star size={14} /> featured टॉगल करें
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit size={14} /> संपादित करें
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reusable Input import for inline usage */}
      <div style={{ display: 'none' }}>
        {Input}
      </div>
    </motion.div>
  )
}

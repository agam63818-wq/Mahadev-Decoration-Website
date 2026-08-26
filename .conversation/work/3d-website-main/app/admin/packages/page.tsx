'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Package,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Package {
  id: string
  name: string
  event_type: string
  starting_price: number
  featured: boolean
  is_active: boolean
  image: string
}

const samplePackages: Package[] = [
  { id: 'PKG-001', name: 'बेसिक वेडिंग पैकेज', event_type: 'वेडिंग', starting_price: 15000, featured: true, is_active: true, image: '/assets/flower-arch-hero.png' },
  { id: 'PKG-002', name: 'प्रीमियम बर्थडे', event_type: 'बर्थडे', starting_price: 8000, featured: true, is_active: true, image: '/assets/birthday.png' },
  { id: 'PKG-003', name: 'हल्दी डेकोरेशन पैक', event_type: 'हल्दी', starting_price: 5000, featured: false, is_active: true, image: '/assets/haldi.png' },
  { id: 'PKG-004', name: 'मेहंदी सजावट पैक', event_type: 'मेहंदी', starting_price: 4000, featured: false, is_active: true, image: '/assets/mehendi.png' },
  { id: 'PKG-005', name: 'कार डेकोरेशन प्रीमियम', event_type: 'कार', starting_price: 12000, featured: true, is_active: true, image: '/assets/car-decoration-hero.png' },
  { id: 'PKG-006', name: 'स्टेज डेकोरेशन पैक', event_type: 'स्टेज', starting_price: 10000, featured: false, is_active: true, image: '/assets/stage.png' },
  { id: 'PKG-007', name: 'अनंति डेकोर पैक', event_type: 'अनंति', starting_price: 8000, featured: false, is_active: false, image: '/assets/anniversary.png' },
]

export default function AdminPackagesPage() {
  const [search, setSearch] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [activeOnly, setActiveOnly] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const filtered = samplePackages.filter((pkg) => {
    const matchSearch =
      search === '' ||
      pkg.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.event_type.toLowerCase().includes(search.toLowerCase())
    const matchFeatured = !featuredOnly || pkg.featured
    const matchActive = !activeOnly || pkg.is_active
    return matchSearch && matchFeatured && matchActive
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">पैकेज प्रबंधक</h1>
          <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> नया पैकेज
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="पैकेज का नाम या इवेंट टाइप खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
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
              <Star size={14} /> featured
            </button>
            <button
              onClick={() => setActiveOnly(!activeOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all ${
                activeOnly
                  ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40'
                  : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
              }`}
            >
              <Eye size={14} /> active ही दिखाएं
            </button>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filtered.map((pkg) => (
          <Card key={pkg.id} variant="outline" className="overflow-hidden group hover:border-gold/40 transition-all duration-200">
            <div className="relative aspect-[4/3] bg-bg-void/80">
              <img
                src={pkg.image}
                alt={pkg.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-void/80 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <Badge variant={pkg.featured ? 'warning' : 'default'} dot>
                  {pkg.featured ? '⭐ featured' : 'सामान्य'}
                </Badge>
                <Badge variant={pkg.is_active ? 'success' : 'info'} dot>
                  {pkg.is_active ? <><Eye size={10} />active</> : <><EyeOff size={10} />inactive</>}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-devanagari text-text-primary font-semibold truncate">{pkg.name}</p>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">{pkg.event_type}</Badge>
                <span className="text-xs text-text-muted font-devanagari">{pkg.id}</span>
              </div>
              <p className="text-2xl font-display font-bold text-gold mb-3">₹{pkg.starting_price.toLocaleString()}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPkg(pkg)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gold/20 text-gold text-xs font-devanagari hover:bg-gold/30 transition-colors"
                >
                  <Edit size={12} /> संपादित करें
                </button>
                <button
                  onClick={() => setDeleteId(pkg.id)}
                  className="px-3 py-2 rounded-lg bg-rose-400/20 text-rose-400 text-xs font-devanagari hover:bg-rose-400/30 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card variant="outline" className="p-8 text-center">
          <Package size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-gold font-devanagari font-medium">कोई पैकेज नहीं मिला।</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> नया पैकेज बनाएं
          </Button>
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="नया पैकेज बनाएं">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-devanagari text-text-muted mb-1 block">पैकेज का नाम</label>
            <Input placeholder="जैसे — प्रीमियम वेडिंग पैकेज" />
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
              </select>
            </div>
            <div>
              <label className="text-sm font-devanagari text-text-muted mb-1 block">शुरुआती कीमत (₹)</label>
              <Input type="number" placeholder="15000" />
            </div>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/10 text-sm font-devanagari text-text-muted cursor-pointer hover:border-gold/30 transition-colors">
              <input type="checkbox" defaultChecked className="accent-gold" />
              <Star size={14} /> featured बनाएं
            </label>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/10 text-sm font-devanagari text-text-muted cursor-pointer hover:border-gold/30 transition-colors">
              <input type="checkbox" defaultChecked className="accent-gold" />
              <Eye size={14} /> active रखें
            </label>
          </div>
          <div>
            <label className="text-sm font-devanagari text-text-muted mb-1 block">छवि अपलोड</label>
            <div className="border-2 border-dashed border-gold/30 rounded-xl p-6 text-center hover:border-gold/50 transition-colors cursor-pointer">
              <Package size={24} className="mx-auto text-gold mb-2" />
              <p className="text-xs text-text-muted font-devanagari">छवि यहां खींचें या क्लिक करें</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowCreateModal(false)}>
              रद्द
            </Button>
            <Button variant="primary" size="md" className="flex-1">
              <Package size={16} /> पैकेज बनाएं
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeleteId(null) }}
        onConfirm={() => { setShowDeleteDialog(false); setDeleteId(null) }}
        title="पैकेज हटाएं"
        description={`क्या आप वाकई पैकेज ${deleteId} को हटाना चाहते हैं?`}
        confirmLabel="हटाएं"
      />

      {/* Package Detail Modal */}
      <Modal open={!!selectedPkg} onClose={() => setSelectedPkg(null)} title="पैकेज विवरण">
        {selectedPkg && (
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-bg-void/80">
              <img src={selectedPkg.image} alt={selectedPkg.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">नाम</p>
                <p className="font-devanagari text-text-primary font-medium">{selectedPkg.name}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">इवेंट टाइप</p>
                <Badge variant="info">{selectedPkg.event_type}</Badge>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10 col-span-2">
                <p className="text-xs text-text-muted font-devanagari mb-1">शुरुआती कीमत</p>
                <p className="text-2xl text-gold font-display font-bold">₹{selectedPkg.starting_price.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10 flex items-center gap-2 col-span-2">
                <Badge variant={selectedPkg.featured ? 'warning' : 'default'}>
                  {selectedPkg.featured ? '⭐ featured' : 'सामान्य'}
                </Badge>
                <Badge variant={selectedPkg.is_active ? 'success' : 'info'}>
                  {selectedPkg.is_active ? 'active' : 'inactive'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" className="flex-1">
                <Star size={14} /> featured टॉगल करें
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <Eye size={14} /> active/inactive टॉगल करें
              </Button>
              <Button variant="outline" size="sm">
                <Edit size={14} /> संपादित करें
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

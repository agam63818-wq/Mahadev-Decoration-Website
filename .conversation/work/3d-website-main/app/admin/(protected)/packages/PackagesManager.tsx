'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Package as PackageIcon,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Plus,
  GripVertical,
  Check,
  Clock,
  Maximize2,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/ui/Toast'
import { formatPrice } from '@/utils/booking'
import {
  savePackage,
  deletePackage,
  savePackageItem,
  deletePackageItem,
  reorderPackageItems,
} from './actions'

// ─── Types (plain data — passed from the server page) ─────────────────────────

export interface AdminPackageItem {
  id: string
  label: string
  sortOrder: number
}

export interface AdminPackage {
  id: string
  slug: string
  name: string
  description: string
  startingPrice: number | null
  priceMax: number | null
  setupTimeMinutes: number | null
  decorationArea: string
  customizable: boolean
  isFeatured: boolean
  isActive: boolean
  items: AdminPackageItem[]
}

interface PackagesManagerProps {
  initialPackages: AdminPackage[]
  supabaseReady: boolean
}

interface PackageFormState {
  id?: string
  name: string
  slug: string
  description: string
  startingPrice: string
  priceMax: string
  setupTimeMinutes: string
  decorationArea: string
  customizable: boolean
  isFeatured: boolean
  isActive: boolean
}

const EMPTY_FORM: PackageFormState = {
  name: '',
  slug: '',
  description: '',
  startingPrice: '',
  priceMax: '',
  setupTimeMinutes: '',
  decorationArea: '',
  customizable: true,
  isFeatured: false,
  isActive: true,
}

function formFromPackage(pkg: AdminPackage): PackageFormState {
  return {
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description,
    startingPrice: pkg.startingPrice != null ? String(pkg.startingPrice) : '',
    priceMax: pkg.priceMax != null ? String(pkg.priceMax) : '',
    setupTimeMinutes: pkg.setupTimeMinutes != null ? String(pkg.setupTimeMinutes) : '',
    decorationArea: pkg.decorationArea,
    customizable: pkg.customizable,
    isFeatured: pkg.isFeatured,
    isActive: pkg.isActive,
  }
}

function formatSetupTime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return ''
  if (minutes >= 60 * 24) return `${Math.round(minutes / (60 * 24))} दिन`
  if (minutes >= 60) return `${Math.round(minutes / 60)} घंटे`
  return `${minutes} मिनट`
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export function PackagesManager({ initialPackages, supabaseReady }: PackagesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{
    open: boolean
    type: 'success' | 'error' | 'info'
    title: string
    description?: string
  }>({ open: false, type: 'info', title: '' })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PackageFormState>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<AdminPackage | null>(null)

  // Inclusions editing state (per expanded package).
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [editingItem, setEditingItem] = useState<{ id: string; label: string } | null>(null)
  const dragItemId = useRef<string | null>(null)

  function showToast(type: 'success' | 'error', title: string, description?: string) {
    setToast({ open: true, type, title, description })
  }

  // ── Package form ────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setShowForm(true)
  }

  function openEdit(pkg: AdminPackage) {
    setForm(formFromPackage(pkg))
    setFieldErrors({})
    setShowForm(true)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'पैकेज का नाम ज़रूरी है'
    if (form.slug && !/^[a-z0-9-]*$/.test(form.slug))
      errors.slug = 'स्लग में सिर्फ़ छोटे अंग्रेज़ी अक्षर, अंक और डैश चलेंगे'
    if (form.startingPrice && (isNaN(Number(form.startingPrice)) || Number(form.startingPrice) < 0))
      errors.startingPrice = 'सही कीमत डालें'
    if (form.priceMax && (isNaN(Number(form.priceMax)) || Number(form.priceMax) < 0))
      errors.priceMax = 'सही कीमत डालें'
    if (
      form.startingPrice &&
      form.priceMax &&
      !errors.startingPrice &&
      !errors.priceMax &&
      Number(form.priceMax) < Number(form.startingPrice)
    )
      errors.priceMax = 'अधिकतम कीमत शुरुआती कीमत से कम नहीं हो सकती'
    if (
      form.setupTimeMinutes &&
      (isNaN(Number(form.setupTimeMinutes)) || Number(form.setupTimeMinutes) < 0)
    )
      errors.setupTimeMinutes = 'सही समय डालें (मिनटों में)'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return

    startTransition(async () => {
      const result = await savePackage({
        id: form.id,
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
        priceMax: form.priceMax ? Number(form.priceMax) : null,
        setupTimeMinutes: form.setupTimeMinutes ? Number(form.setupTimeMinutes) : null,
        decorationArea: form.decorationArea,
        customizable: form.customizable,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      })

      if (result.ok) {
        showToast('success', form.id ? 'पैकेज अपडेट हो गया' : 'नया पैकेज बन गया')
        setShowForm(false)
        router.refresh()
      } else {
        showToast('error', 'सेव नहीं हुआ', result.error)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deletePackage(deleteTarget.id)
      if (result.ok) {
        showToast('success', `"${deleteTarget.name}" हटा दिया गया`)
        setDeleteTarget(null)
        router.refresh()
      } else {
        showToast('error', 'हटाया नहीं जा सका', result.error)
      }
    })
  }

  // ── Inclusions ──────────────────────────────────────────────────────────────

  function handleAddItem(packageId: string) {
    const label = newItemLabel.trim()
    if (!label) return
    startTransition(async () => {
      const result = await savePackageItem({ packageId, label })
      if (result.ok) {
        setNewItemLabel('')
        router.refresh()
      } else {
        showToast('error', 'सेवा जुड़ नहीं पाई', result.error)
      }
    })
  }

  function handleSaveItemEdit() {
    if (!editingItem) return
    const label = editingItem.label.trim()
    if (!label) {
      setEditingItem(null)
      return
    }
    startTransition(async () => {
      const result = await savePackageItem({ id: editingItem.id, packageId: expandedId!, label })
      if (result.ok) {
        setEditingItem(null)
        router.refresh()
      } else {
        showToast('error', 'सेवा अपडेट नहीं हुई', result.error)
      }
    })
  }

  function handleDeleteItem(itemId: string) {
    startTransition(async () => {
      const result = await deletePackageItem(itemId)
      if (result.ok) {
        router.refresh()
      } else {
        showToast('error', 'सेवा नहीं हटी', result.error)
      }
    })
  }

  function handleItemDrop(pkg: AdminPackage, targetId: string) {
    const sourceId = dragItemId.current
    dragItemId.current = null
    if (!sourceId || sourceId === targetId) return

    const ids = pkg.items.map((i) => i.id)
    const from = ids.indexOf(sourceId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return

    ids.splice(to, 0, ids.splice(from, 1)[0])

    startTransition(async () => {
      const result = await reorderPackageItems(ids)
      if (result.ok) {
        router.refresh()
      } else {
        showToast('error', 'क्रम सेव नहीं हुआ', result.error)
      }
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-display font-bold text-gold font-devanagari">पैकेज प्रबंधक</h1>
        <Button variant="primary" size="md" onClick={openCreate} disabled={!supabaseReady}>
          <Plus size={16} /> नया पैकेज
        </Button>
      </div>
      <p className="text-text-muted text-sm font-devanagari mb-6">
        यहां से पैकेज बनाएं, बदलें, featured/active टॉगल करें और शामिल सेवाएं (bullets) प्रबंधित करें।
        बदलाव तुरंत सार्वजनिक /packages पेज और होमपेज पर दिखेंगे।
      </p>

      {!supabaseReady && (
        <Card variant="outline" className="p-4 mb-6 border-floral-red/40">
          <p className="text-floral-red text-sm font-devanagari">
            Supabase कॉन्फ़िगर नहीं है — बदलाव सेव नहीं होंगे। .env.local जांचें।
          </p>
        </Card>
      )}

      {/* Package list */}
      <div className="space-y-4">
        {initialPackages.map((pkg) => (
          <Card key={pkg.id} variant="outline" className="overflow-hidden">
            <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-devanagari text-text-primary font-semibold text-lg">{pkg.name}</p>
                    <Badge variant={pkg.isFeatured ? 'warning' : 'default'} dot>
                      {pkg.isFeatured ? '⭐ featured' : 'सामान्य'}
                    </Badge>
                    <Badge variant={pkg.isActive ? 'success' : 'info'} dot>
                      {pkg.isActive ? (
                        <>
                          <Eye size={10} /> active
                        </>
                      ) : (
                        <>
                          <EyeOff size={10} /> inactive
                        </>
                      )}
                    </Badge>
                    {pkg.customizable && <Badge variant="info">कस्टमाइज़ेबल</Badge>}
                  </div>
                  <p className="text-xs text-text-muted mb-2">/packages/{pkg.slug}</p>
                  <div className="flex items-center gap-4 text-sm text-text-muted flex-wrap">
                    <span className="text-gold font-display font-bold text-xl tabular-nums">
                      {pkg.startingPrice != null ? formatPrice(pkg.startingPrice) : '—'}
                      {pkg.priceMax != null && pkg.priceMax > (pkg.startingPrice ?? 0) && (
                        <span className="text-text-muted text-sm font-normal">
                          {' '}
                          – {formatPrice(pkg.priceMax)}
                        </span>
                      )}
                    </span>
                    {pkg.setupTimeMinutes != null && pkg.setupTimeMinutes > 0 && (
                      <span className="flex items-center gap-1 font-devanagari">
                        <Clock size={13} className="text-gold" />
                        {formatSetupTime(pkg.setupTimeMinutes)}
                        <span className="text-xs">({pkg.setupTimeMinutes} मिनट)</span>
                      </span>
                    )}
                    {pkg.decorationArea && (
                      <span className="flex items-center gap-1 font-devanagari">
                        <Maximize2 size={13} className="text-gold" />
                        {pkg.decorationArea}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === pkg.id ? null : pkg.id)
                    }
                    className="px-3 py-2 rounded-lg bg-gold/10 text-gold text-xs font-devanagari hover:bg-gold/20 transition-colors"
                  >
                    सेवाएं ({pkg.items.length})
                  </button>
                  <button
                    onClick={() => openEdit(pkg)}
                    className="px-3 py-2 rounded-lg bg-gold/20 text-gold text-xs font-devanagari hover:bg-gold/30 transition-colors"
                  >
                    <Edit size={12} /> संपादित करें
                  </button>
                  <button
                    onClick={() => setDeleteTarget(pkg)}
                    className="px-3 py-2 rounded-lg bg-rose-400/20 text-rose-400 text-xs font-devanagari hover:bg-rose-400/30 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {pkg.description && (
                <p className="text-text-muted text-sm font-devanagari mt-3 leading-relaxed">
                  {pkg.description}
                </p>
              )}

              {/* Inclusions panel */}
              {expandedId === pkg.id && (
                <div className="mt-4 pt-4 border-t border-gold/10">
                  <p className="text-sm text-text-muted font-devanagari mb-3">
                    शामिल सेवाएं — खींचकर क्रम बदलें (यही क्रम सार्वजनिक पेज पर दिखेगा)
                  </p>
                  <ul className="space-y-2 mb-3">
                    {pkg.items.map((item) => (
                      <li
                        key={item.id}
                        draggable
                        onDragStart={() => {
                          dragItemId.current = item.id
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleItemDrop(pkg, item.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-void/50 border border-gold/10 hover:border-gold/30 transition-colors"
                      >
                        <GripVertical size={14} className="text-text-muted cursor-grab flex-shrink-0" />
                        {editingItem?.id === item.id ? (
                          <>
                            <Input
                              value={editingItem.label}
                              onChange={(e) =>
                                setEditingItem({ id: item.id, label: e.target.value })
                              }
                              className="flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveItemEdit()
                                if (e.key === 'Escape') setEditingItem(null)
                              }}
                            />
                            <button
                              onClick={handleSaveItemEdit}
                              disabled={isPending}
                              className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded"
                              aria-label="सेव करें"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="p-1.5 text-text-muted hover:bg-gold/10 rounded"
                              aria-label="रद्द करें"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-text-primary font-devanagari">
                              {item.label}
                            </span>
                            <button
                              onClick={() => setEditingItem({ id: item.id, label: item.label })}
                              className="p-1.5 text-gold hover:bg-gold/10 rounded"
                              aria-label="संपादित करें"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={isPending}
                              className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded"
                              aria-label="हटाएं"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                    {pkg.items.length === 0 && (
                      <li className="text-xs text-text-muted font-devanagari px-3 py-2">
                        अभी कोई सेवा नहीं — नीचे से जोड़ें।
                      </li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <Input
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      placeholder="नई सेवा — जैसे: मंडप डेकोरेशन"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddItem(pkg.id)
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddItem(pkg.id)}
                      disabled={isPending || !newItemLabel.trim()}
                    >
                      <Plus size={14} /> जोड़ें
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}

        {initialPackages.length === 0 && (
          <Card variant="outline" className="p-8 text-center">
            <PackageIcon size={40} className="mx-auto text-text-muted mb-3" />
            <p className="text-gold font-devanagari font-medium">कोई पैकेज नहीं मिला।</p>
            <p className="text-text-muted text-sm font-devanagari mt-1">
              पहला पैकेज बनाएं — वह तुरंत सार्वजनिक पेज पर दिखेगा।
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={openCreate}
              disabled={!supabaseReady}
            >
              <Plus size={14} /> नया पैकेज बनाएं
            </Button>
          </Card>
        )}
      </div>

      {/* Create / Edit form panel */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-bg-void/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl my-8 bg-bg-purple border border-gold/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display font-bold text-gold font-devanagari">
                {form.id ? 'पैकेज संपादित करें' : 'नया पैकेज बनाएं'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-text-muted hover:text-champagne rounded-lg hover:bg-gold/10"
                aria-label="बंद करें"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-devanagari text-text-muted mb-1 block">
                  पैकेज का नाम *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="जैसे — प्रीमियम वेडिंग पैकेज"
                />
                {fieldErrors.name && (
                  <p className="text-floral-red text-xs mt-1 font-devanagari">{fieldErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-devanagari text-text-muted mb-1 block">
                    स्लग (URL) — खाली छोड़ें तो अपने आप बनेगा
                  </label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="wedding-premium"
                    dir="ltr"
                  />
                  {fieldErrors.slug && (
                    <p className="text-floral-red text-xs mt-1 font-devanagari">
                      {fieldErrors.slug}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-devanagari text-text-muted mb-1 block">
                    डेकोरेशन एरिया
                  </label>
                  <Input
                    value={form.decorationArea}
                    onChange={(e) => setForm({ ...form, decorationArea: e.target.value })}
                    placeholder="जैसे — पूरा वेन्यू"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-devanagari text-text-muted mb-1 block">
                    शुरुआती कीमत (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.startingPrice}
                    onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
                    placeholder="15000"
                  />
                  {fieldErrors.startingPrice && (
                    <p className="text-floral-red text-xs mt-1 font-devanagari">
                      {fieldErrors.startingPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-devanagari text-text-muted mb-1 block">
                    अधिकतम कीमत (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.priceMax}
                    onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
                    placeholder="30000"
                  />
                  {fieldErrors.priceMax && (
                    <p className="text-floral-red text-xs mt-1 font-devanagari">
                      {fieldErrors.priceMax}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-devanagari text-text-muted mb-1 block">
                    सेटअप समय (मिनट)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.setupTimeMinutes}
                    onChange={(e) => setForm({ ...form, setupTimeMinutes: e.target.value })}
                    placeholder="180 = 3 घंटे"
                  />
                  {fieldErrors.setupTimeMinutes && (
                    <p className="text-floral-red text-xs mt-1 font-devanagari">
                      {fieldErrors.setupTimeMinutes}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-devanagari text-text-muted mb-1 block">विवरण</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="पैकेज का छोटा विवरण…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-void/50 border border-gold/20 text-text-primary text-sm font-devanagari focus:outline-none focus:border-gold/50 resize-y"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/10 text-sm font-devanagari text-text-muted cursor-pointer hover:border-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="accent-gold"
                  />
                  <Star size={14} /> featured (होमपेज पर दिखाएं)
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/10 text-sm font-devanagari text-text-muted cursor-pointer hover:border-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="accent-gold"
                  />
                  <Eye size={14} /> active (सार्वजनिक रखें)
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/10 text-sm font-devanagari text-text-muted cursor-pointer hover:border-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.customizable}
                    onChange={(e) => setForm({ ...form, customizable: e.target.checked })}
                    className="accent-gold"
                  />
                  ✨ कस्टमाइज़ेबल
                </label>
              </div>

              {form.id && (
                <p className="text-xs text-text-muted font-devanagari">
                  शामिल सेवाएं (bullets) सेव करने के बाद पैकेज कार्ड में &quot;सेवाएं&quot; खोलकर जोड़ें।
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  रद्द
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  <PackageIcon size={16} />
                  {isPending ? 'सेव हो रहा है…' : form.id ? 'अपडेट करें' : 'पैकेज बनाएं'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="पैकेज हटाएं"
        description={`क्या आप वाकई "${deleteTarget?.name}" को हटाना चाहते हैं? इसकी सभी शामिल सेवाएं भी हट जाएंगी और पैकेज सार्वजनिक पेज से गायब हो जाएगा।`}
        confirmLabel="हटाएं"
      />

      <Toast
        open={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        type={toast.type}
        title={toast.title}
        description={toast.description}
      />
    </motion.div>
  )
}

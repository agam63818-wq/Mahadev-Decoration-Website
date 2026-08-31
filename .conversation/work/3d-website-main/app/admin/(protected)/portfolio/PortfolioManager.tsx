'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Star,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import {
  savePortfolioItem,
  deletePortfolioItem,
  updatePortfolioMedia,
  setPortfolioCover,
  deletePortfolioMedia,
  uploadPortfolioImage,
  reorderPortfolioMedia,
  savePortfolioCategory,
  deletePortfolioCategory,
  reorderPortfolioCategories,
} from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminPortfolioMedia {
  id: string
  url: string
  altText: string
  variantLabel: string
  price: number | null
  isBookable: boolean
  isCover: boolean
  sortOrder: number
}

export interface AdminPortfolioItem {
  id: string
  /** The live table has no slug column — this carries the item id. */
  slug: string
  title: string
  categoryId: string | null
  eventType: string
  location: string
  priceRange: string
  description: string
  servicesIncluded: string[]
  isFeatured: boolean
  isPublic: boolean
  media: AdminPortfolioMedia[]
}

export interface AdminPortfolioCategory {
  id: string
  slug: string
  name: string
  sortOrder: number
}

interface PortfolioManagerProps {
  initialItems: AdminPortfolioItem[]
  initialCategories: AdminPortfolioCategory[]
  supabaseReady: boolean
}

const EVENT_TYPES = [
  'wedding',
  'birthday',
  'anniversary',
  'haldi',
  'mehendi',
  'car',
  'stage',
  'mandap',
  'home',
  'flower',
  'lighting',
  'custom',
]

const EVENT_LABELS: Record<string, string> = {
  wedding: 'वेडिंग',
  birthday: 'बर्थडे',
  anniversary: 'एनिवर्सरी',
  haldi: 'हल्दी',
  mehendi: 'मेहंदी',
  car: 'कार',
  stage: 'स्टेज',
  mandap: 'मंडप',
  home: 'होम',
  flower: 'फ्लावर',
  lighting: 'लाइटिंग',
  custom: 'कस्टम',
}

const emptyForm = {
  title: '',
  categoryId: '' as string,
  eventType: 'wedding',
  location: '',
  priceRange: '',
  description: '',
  servicesIncluded: '',
  isFeatured: false,
  isPublic: true,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortfolioManager({
  initialItems,
  initialCategories,
  supabaseReady,
}: PortfolioManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const items = initialItems
  const categories = initialCategories

  function notify(kind: 'ok' | 'err', text: string) {
    setMessage({ kind, text })
    if (kind === 'ok') setTimeout(() => setMessage(null), 3500)
  }

  function refresh() {
    // Re-runs the server component so the list reflects the new DB state.
    startTransition(() => router.refresh())
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(item: AdminPortfolioItem) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      categoryId: item.categoryId ?? '',
      eventType: item.eventType || 'wedding',
      location: item.location,
      priceRange: item.priceRange,
      description: item.description,
      servicesIncluded: item.servicesIncluded.join(', '),
      isFeatured: item.isFeatured,
      isPublic: item.isPublic,
    })
    setShowForm(true)
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault()
    const result = await savePortfolioItem({
      id: editingId ?? undefined,
      title: form.title,
      categoryId: form.categoryId || null,
      eventType: form.eventType,
      location: form.location,
      priceRange: form.priceRange,
      description: form.description,
      servicesIncluded: form.servicesIncluded
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      isFeatured: form.isFeatured,
      isPublic: form.isPublic,
    })

    if (!result.ok) return notify('err', result.error ?? 'सेव नहीं हुआ')
    notify('ok', editingId ? 'डिज़ाइन अपडेट हो गया' : 'नया डिज़ाइन जुड़ गया')
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    refresh()
  }

  async function handleDeleteItem(item: AdminPortfolioItem) {
    if (
      !window.confirm(
        `"${item.title}" और इसकी सभी तस्वीरें हमेशा के लिए हट जाएँगी। जारी रखें?`,
      )
    )
      return
    const result = await deletePortfolioItem(item.id)
    if (!result.ok) return notify('err', result.error ?? 'डिलीट नहीं हुआ')
    notify('ok', 'डिज़ाइन हटा दिया गया')
    refresh()
  }

  if (!supabaseReady) {
    return (
      <div className="rounded-2xl border border-gold/20 bg-bg-purple/30 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-gold" />
        <p className="font-devanagari text-text-primary">
          Supabase कॉन्फ़िगर नहीं है, इसलिए पोर्टफोलियो प्रबंधन उपलब्ध नहीं है।
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-devanagari text-xl font-bold text-champagne">
            पोर्टफोलियो प्रबंधक
          </h2>
          <p className="font-devanagari mt-1 text-sm text-text-muted">
            डिज़ाइन जोड़ें, तस्वीरें अपलोड करें और हर लुक की कीमत तय करें — बदलाव सीधे
            वेबसाइट पर दिखेंगे।
          </p>
        </div>
        <button
          onClick={openCreate}
          className="font-devanagari inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-bg-void transition hover:brightness-110"
        >
          <Plus size={18} />
          नया डिज़ाइन
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-devanagari ${
            message.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'
              : 'border-red-500/30 bg-red-950/30 text-red-200'
          }`}
        >
          {message.kind === 'ok' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Categories — the public gallery filter pills come from this list. */}
      <CategoriesPanel categories={categories} notify={notify} onChanged={refresh} />

      {/* Item form */}
      {showForm && (
        <form
          onSubmit={handleSaveItem}
          className="space-y-4 rounded-2xl border border-gold/20 bg-bg-purple/30 p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-devanagari font-semibold text-champagne">
              {editingId ? 'डिज़ाइन एडिट करें' : 'नया डिज़ाइन'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-text-muted transition hover:text-gold"
              aria-label="बंद करें"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="शीर्षक *">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="शाही वेडिंग — बेगूसराय"
                required
              />
            </Field>

            <Field label="कैटेगरी">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="font-devanagari w-full rounded-xl border border-gold/20 bg-bg-void/50 px-4 py-2.5 text-sm text-text-primary focus:border-gold focus:outline-none"
              >
                <option value="">— बिना कैटेगरी —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="font-devanagari mt-1 block text-xs text-text-muted">
                गैलरी के फ़िल्टर बटन इन्हीं कैटेगरी से बनते हैं — ऊपर &quot;कैटेगरी&quot; सेक्शन से नई जोड़ें।
              </span>
            </Field>

            <Field label="इवेंट टाइप *">
              <select
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                className="font-devanagari w-full rounded-xl border border-gold/20 bg-bg-void/50 px-4 py-2.5 text-sm text-text-primary focus:border-gold focus:outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="लोकेशन">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="बेगूसराय, बिहार"
              />
            </Field>

            <Field label="प्राइस रेंज (वैकल्पिक)">
              <Input
                value={form.priceRange}
                onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
                placeholder="₹25,000 – ₹40,000"
              />
            </Field>
          </div>

          <Field label="विवरण">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="font-devanagari w-full rounded-xl border border-gold/20 bg-bg-void/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
              placeholder="इस डिज़ाइन के बारे में कुछ पंक्तियाँ…"
            />
          </Field>

          <Field label="शामिल सर्विसेज (कॉमा से अलग करें)">
            <Input
              value={form.servicesIncluded}
              onChange={(e) => setForm({ ...form, servicesIncluded: e.target.value })}
              placeholder="मंडप डेकोरेशन, स्टेज सजावट, LED लाइटिंग"
            />
          </Field>

          <div className="flex flex-wrap gap-6">
            <Toggle
              checked={form.isFeatured}
              onChange={(v) => setForm({ ...form, isFeatured: v })}
              label="फीचर्ड (होमपेज पर दिखाएँ)"
            />
            <Toggle
              checked={form.isPublic}
              onChange={(v) => setForm({ ...form, isPublic: v })}
              label="पब्लिक (वेबसाइट पर दिखे)"
            />
          </div>

          {/* Live preview — exactly how the public gallery card will look. */}
          <GalleryCardPreview
            title={form.title}
            categoryName={categories.find((c) => c.id === form.categoryId)?.name ?? ''}
            eventType={form.eventType}
            location={form.location}
            priceRange={form.priceRange}
            isFeatured={form.isFeatured}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="font-devanagari rounded-xl bg-gold px-6 py-2.5 font-semibold text-bg-void transition hover:brightness-110 disabled:opacity-60"
            >
              {editingId ? 'अपडेट करें' : 'सेव करें'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="font-devanagari rounded-xl border border-gold/30 px-6 py-2.5 text-text-muted transition hover:text-gold"
            >
              रद्द करें
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-gold/25 bg-bg-purple/20 p-10 text-center">
          <p className="font-devanagari text-text-primary">अभी कोई डिज़ाइन नहीं जोड़ा गया।</p>
          <p className="font-devanagari mt-1 text-sm text-text-muted">
            &ldquo;नया डिज़ाइन&rdquo; से शुरू करें — फिर तस्वीरें अपलोड कर हर लुक की कीमत डालें।
          </p>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-5">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            categoryName={categories.find((c) => c.id === item.categoryId)?.name ?? ''}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDeleteItem(item)}
            onChanged={refresh}
            notify={notify}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Categories panel (public gallery filter pills) ───────────────────────────

function CategoriesPanel({
  categories,
  notify,
  onChanged,
}: {
  categories: AdminPortfolioCategory[]
  notify: (kind: 'ok' | 'err', text: string) => void
  onChanged: () => void
}) {
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const dragId = useRef<string | null>(null)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    const result = await savePortfolioCategory({ name: newName.trim() })
    setBusy(false)
    if (!result.ok) return notify('err', result.error ?? 'सेव नहीं हुआ')
    notify('ok', 'कैटेगरी जुड़ गई')
    setNewName('')
    onChanged()
  }

  async function saveEdit() {
    if (!editing) return
    setBusy(true)
    const result = await savePortfolioCategory({ id: editing.id, name: editing.name.trim() })
    setBusy(false)
    if (!result.ok) return notify('err', result.error ?? 'सेव नहीं हुआ')
    notify('ok', 'कैटेगरी अपडेट हो गई')
    setEditing(null)
    onChanged()
  }

  async function remove(cat: AdminPortfolioCategory) {
    if (!window.confirm(`कैटेगरी "${cat.name}" हटा दी जाएगी। इसमें जुड़े डिज़ाइन बिना कैटेगरी के रह जाएँगे। जारी रखें?`)) return
    setBusy(true)
    const result = await deletePortfolioCategory(cat.id)
    setBusy(false)
    if (!result.ok) return notify('err', result.error ?? 'डिलीट नहीं हुआ')
    notify('ok', 'कैटेगरी हटा दी गई')
    onChanged()
  }

  async function handleDrop(targetId: string) {
    const fromId = dragId.current
    dragId.current = null
    if (!fromId || fromId === targetId) return

    const ids = categories.map((c) => c.id)
    const from = ids.indexOf(fromId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0])

    setBusy(true)
    const result = await reorderPortfolioCategories(ids)
    setBusy(false)
    if (!result.ok) return notify('err', result.error ?? 'क्रम सेव नहीं हुआ')
    notify('ok', 'क्रम बदल गया')
    onChanged()
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gold/20 bg-bg-purple/25 p-6">
      <h3 className="font-devanagari flex items-center gap-2 font-semibold text-champagne">
        <Tag size={16} className="text-gold" />
        कैटेगरी (गैलरी फ़िल्टर)
      </h3>
      <p className="font-devanagari text-xs text-text-muted">
        ये कैटेगरी पब्लिक गैलरी पर फ़िल्टर बटन के रूप में दिखती हैं — जोड़ें, नाम बदलें,
        खींचकर क्रम बदलें या हटाएँ। कोई कोड बदलने की ज़रूरत नहीं।
      </p>

      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="font-devanagari text-sm text-text-muted">
            अभी कोई कैटेगरी नहीं — नीचे से पहली कैटेगरी जोड़ें (जैसे वेडिंग, बर्थडे, मंडप)।
          </p>
        )}
        {categories.map((cat) => (
          <div
            key={cat.id}
            draggable
            onDragStart={() => {
              dragId.current = cat.id
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(cat.id)}
            className="flex items-center gap-2 rounded-xl border border-gold/10 bg-bg-void/40 px-3 py-2"
          >
            <GripVertical size={14} className="flex-shrink-0 cursor-grab text-text-muted/60" />
            {editing?.id === cat.id ? (
              <>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="max-w-[220px] py-1.5 text-sm"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  disabled={busy}
                  className="font-devanagari inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-bg-void transition hover:brightness-110 disabled:opacity-60"
                >
                  <Check size={12} />
                  सेव
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="font-devanagari rounded-lg border border-gold/25 px-3 py-1.5 text-xs text-text-muted transition hover:text-gold"
                >
                  रद्द
                </button>
              </>
            ) : (
              <>
                <span className="font-devanagari flex-1 text-sm text-text-primary">{cat.name}</span>
                <button
                  onClick={() => setEditing({ id: cat.id, name: cat.name })}
                  aria-label="नाम बदलें"
                  className="rounded-lg border border-gold/25 p-1.5 text-text-muted transition hover:text-gold"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => remove(cat)}
                  disabled={busy}
                  aria-label="कैटेगरी हटाएँ"
                  className="rounded-lg border border-red-500/25 p-1.5 text-red-300 transition hover:bg-red-950/40 disabled:opacity-60"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={add} className="flex items-center gap-2 border-t border-gold/10 pt-4">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="नई कैटेगरी — जैसे: एनिवर्सरी, मंडप, लाइटिंग"
          className="max-w-xs"
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="font-devanagari inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-bg-void transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          जोड़ें
        </button>
      </form>
    </section>
  )
}

// ─── Live gallery-card preview ────────────────────────────────────────────────

function GalleryCardPreview({
  title,
  categoryName,
  eventType,
  location,
  priceRange,
  isFeatured,
}: {
  title: string
  categoryName: string
  eventType: string
  location: string
  priceRange: string
  isFeatured: boolean
}) {
  return (
    <div className="rounded-xl border border-gold/10 bg-bg-void/30 p-4">
      <p className="font-devanagari mb-3 text-xs font-semibold uppercase tracking-wider text-gold/70">
        लाइव प्रीव्यू — गैलरी कार्ड
      </p>
      <div className="max-w-xs overflow-hidden rounded-2xl border border-gold/20 bg-bg-purple/40">
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-bg-purple to-bg-void text-text-muted/50">
          <Eye size={28} />
        </div>
        <div className="space-y-1 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-devanagari font-semibold text-champagne">
              {title.trim() || 'शीर्षक यहाँ दिखेगा'}
            </p>
            {isFeatured && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] text-gold font-devanagari">
                फीचर्ड
              </span>
            )}
          </div>
          <p className="font-devanagari text-xs text-text-muted">
            {categoryName || EVENT_LABELS[eventType] || eventType}
            {location.trim() ? ` · ${location.trim()}` : ''}
          </p>
          {priceRange.trim() && (
            <p className="text-xs font-semibold text-gold">{priceRange.trim()}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Item card with per-image pricing editor ──────────────────────────────────

function ItemCard({
  item,
  categoryName,
  onEdit,
  onDelete,
  onChanged,
  notify,
}: {
  item: AdminPortfolioItem
  categoryName: string
  onEdit: () => void
  onDelete: () => void
  onChanged: () => void
  notify: (kind: 'ok' | 'err', text: string) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const dragMediaId = useRef<string | null>(null)
  const [reordering, setReordering] = useState(false)

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) return notify('err', 'सिर्फ़ इमेज फ़ाइल चुनें')

    setUploading(true)
    let ok = 0
    const failures: string[] = []

    // Sequential: keeps memory low and lets one bad file fail alone.
    for (const file of list) {
      const fd = new FormData()
      fd.set('itemId', item.id)
      fd.set('file', file)
      fd.set('altText', `${item.title} — ${file.name}`)
      const result = await uploadPortfolioImage(fd)
      if (result.ok) ok += 1
      else failures.push(`${file.name}: ${result.error ?? 'त्रुटि'}`)
    }

    setUploading(false)
    if (ok > 0) notify('ok', `${ok} तस्वीर अपलोड हो गई`)
    if (failures.length > 0) notify('err', failures[0])
    if (ok > 0) onChanged()
  }

  /** Drop one image onto another to reorder; new order persists to sort_order. */
  async function handleMediaDrop(targetId: string) {
    const fromId = dragMediaId.current
    dragMediaId.current = null
    if (!fromId || fromId === targetId) return

    const ids = item.media.map((m) => m.id)
    const from = ids.indexOf(fromId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0])

    setReordering(true)
    const result = await reorderPortfolioMedia(ids)
    setReordering(false)
    if (!result.ok) return notify('err', result.error ?? 'क्रम सेव नहीं हुआ')
    notify('ok', 'तस्वीरों का क्रम बदल गया')
    onChanged()
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-bg-purple/25 p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-devanagari truncate font-semibold text-champagne">
              {item.title}
            </h3>
            {item.isFeatured && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] text-gold font-devanagari">
                फीचर्ड
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-devanagari ${
                item.isPublic
                  ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                  : 'border-white/15 bg-black/30 text-text-muted'
              }`}
            >
              {item.isPublic ? <Eye size={11} /> : <EyeOff size={11} />}
              {item.isPublic ? 'पब्लिक' : 'प्राइवेट'}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {categoryName || EVENT_LABELS[item.eventType] || item.eventType}
            {item.location ? ` · ${item.location}` : ''} · {item.media.length} तस्वीर
          </p>
        </div>

        <div className="flex items-center gap-2">
          {item.isPublic && (
            <Link
              href={`/gallery/${item.slug}`}
              target="_blank"
              className="font-devanagari rounded-lg border border-gold/25 px-3 py-1.5 text-xs text-text-muted transition hover:text-gold"
            >
              देखें
            </Link>
          )}
          <button
            onClick={onEdit}
            className="font-devanagari rounded-lg border border-gold/25 px-3 py-1.5 text-xs text-text-muted transition hover:text-gold"
          >
            एडिट
          </button>
          <button
            onClick={onDelete}
            aria-label="डिज़ाइन हटाएँ"
            className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
        }}
        className={`mb-4 rounded-xl border-2 border-dashed p-4 text-center transition ${
          dragOver ? 'border-gold bg-gold/5' : 'border-gold/20'
        }`}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="font-devanagari inline-flex items-center gap-2 text-sm text-gold transition hover:text-gold-warm disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'अपलोड हो रहा है…' : 'तस्वीरें अपलोड करें'}
        </button>
        <p className="font-devanagari mt-1 text-xs text-text-muted">
          यहाँ खींचकर छोड़ें या क्लिक करें — एक साथ कई तस्वीरें चुन सकते हैं
        </p>
      </div>

      {/* Per-image pricing rows — drag the handle to reorder. */}
      {item.media.length === 0 ? (
        <p className="font-devanagari text-center text-sm text-text-muted">
          अभी कोई तस्वीर नहीं — ऊपर से अपलोड करें।
        </p>
      ) : (
        <div className={`space-y-3 ${reordering ? 'opacity-60' : ''}`}>
          {item.media.map((media) => (
            <div
              key={media.id}
              draggable
              onDragStart={() => {
                dragMediaId.current = media.id
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleMediaDrop(media.id)}
            >
              <MediaRow
                itemId={item.id}
                media={media}
                onChanged={onChanged}
                notify={notify}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Single image editor row ──────────────────────────────────────────────────

function MediaRow({
  itemId,
  media,
  onChanged,
  notify,
}: {
  itemId: string
  media: AdminPortfolioMedia
  onChanged: () => void
  notify: (kind: 'ok' | 'err', text: string) => void
}) {
  const [label, setLabel] = useState(media.variantLabel)
  const [price, setPrice] = useState(media.price == null ? '' : String(media.price))
  const [bookable, setBookable] = useState(media.isBookable)
  const [saving, setSaving] = useState(false)

  const dirty =
    label !== media.variantLabel ||
    price !== (media.price == null ? '' : String(media.price)) ||
    bookable !== media.isBookable

  async function save() {
    // Blank price means "reference photo only", which is null — not 0.
    const trimmed = price.trim()
    const parsedPrice = trimmed === '' ? null : Number(trimmed)
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      return notify('err', 'कीमत सही नहीं है')
    }

    setSaving(true)
    const result = await updatePortfolioMedia({
      id: media.id,
      variantLabel: label.trim() || null,
      price: parsedPrice,
      isBookable: bookable,
    })
    setSaving(false)

    if (!result.ok) return notify('err', result.error ?? 'सेव नहीं हुआ')
    notify('ok', 'लुक अपडेट हो गया')
    onChanged()
  }

  async function makeCover() {
    const result = await setPortfolioCover(itemId, media.id)
    if (!result.ok) return notify('err', result.error ?? 'कवर सेट नहीं हुआ')
    notify('ok', 'कवर इमेज बदल गई')
    onChanged()
  }

  async function remove() {
    if (!window.confirm('यह तस्वीर हटा दी जाएगी। जारी रखें?')) return
    const result = await deletePortfolioMedia(media.id)
    if (!result.ok) return notify('err', result.error ?? 'डिलीट नहीं हुआ')
    notify('ok', 'तस्वीर हटा दी गई')
    onChanged()
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/15 bg-bg-void/40 p-3">
      {/* Drag handle */}
      <GripVertical
        size={16}
        className="flex-shrink-0 cursor-grab text-text-muted/60"
        aria-label="क्रम बदलने के लिए खींचें"
      />

      {/* Thumb */}
      <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-bg-purple">
        {media.url && (
          <Image src={media.url} alt={media.altText} fill className="object-cover" sizes="80px" />
        )}
        {media.isCover && (
          <span className="absolute left-1 top-1 rounded bg-gold px-1 py-0.5 text-[9px] font-bold text-bg-void">
            कवर
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="grid min-w-[260px] flex-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="font-devanagari mb-1 block text-[11px] text-text-muted">
            लुक का नाम
          </span>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="जैसे: प्रीमियम लुक"
            className="py-1.5 text-xs"
          />
        </label>
        <label className="block">
          <span className="font-devanagari mb-1 block text-[11px] text-text-muted">
            कीमत (₹)
          </span>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="खाली = सिर्फ़ संदर्भ"
            className="py-1.5 text-xs"
          />
        </label>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Toggle checked={bookable} onChange={setBookable} label="बुक करने योग्य" small />

        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="font-devanagari inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-bg-void transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            सेव
          </button>
        )}

        {!media.isCover && (
          <button
            onClick={makeCover}
            title="कवर इमेज बनाएँ"
            className="font-devanagari inline-flex items-center gap-1 rounded-lg border border-gold/25 px-3 py-1.5 text-xs text-text-muted transition hover:text-gold"
          >
            <Star size={12} />
            कवर
          </button>
        )}

        <button
          onClick={remove}
          aria-label="तस्वीर हटाएँ"
          className="rounded-lg border border-red-500/25 px-2.5 py-1.5 text-red-300 transition hover:bg-red-950/40"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Explain what an unpriced image does on the public site. */}
      {price.trim() === '' && (
        <p className="font-devanagari w-full text-[11px] text-text-muted/80">
          कीमत खाली है — यह तस्वीर वेबसाइट पर सिर्फ़ संदर्भ के तौर पर दिखेगी, बुक बटन के बिना।
        </p>
      )}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-devanagari mb-1.5 block text-sm text-text-primary">{label}</span>
      {children}
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  small = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  small?: boolean
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 items-center rounded-full transition ${
          small ? 'h-4 w-8' : 'h-5 w-10'
        } ${checked ? 'bg-gold' : 'bg-white/15'}`}
      >
        <span
          className={`inline-block transform rounded-full bg-white transition ${
            small ? 'h-3 w-3' : 'h-4 w-4'
          } ${checked ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5'}`}
        />
      </button>
      <span className={`font-devanagari text-text-muted ${small ? 'text-[11px]' : 'text-sm'}`}>
        {label}
      </span>
    </label>
  )
}

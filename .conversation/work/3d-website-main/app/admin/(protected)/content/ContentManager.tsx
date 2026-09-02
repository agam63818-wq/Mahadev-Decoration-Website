'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Database,
  Download,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getIcon } from '@/utils/icons'
import { cn } from '@/utils/cn'
import {
  deleteOccasion,
  importSeedContent,
  reorderOccasions,
  saveOccasion,
  uploadOccasionImage,
  type ActionResult,
} from './actions'

// ─── Types shared with page.tsx ───────────────────────────────────────────────

export interface AdminOccasion {
  id: string
  slug: string
  name: string
  nameEn: string | null
  description: string | null
  eventType: string
  startingPrice: number
  /** Raw value stored in DB: storage path, `/assets/...` or absolute URL. */
  imageUrl: string | null
  /** Resolved URL ready for <Image>. */
  imagePublicUrl: string
  imageAlt: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
}

export interface ContentCounts {
  live: { packages: number; portfolio: number; occasions: number }
  seed: { packages: number; portfolio: number; occasions: number }
  occasionsTableMissing: boolean
}

interface ContentManagerProps {
  counts: ContentCounts
  initialOccasions: AdminOccasion[]
  supabaseReady: boolean
}

const FALLBACK_IMAGE = '/assets/flower-arch-hero.png'

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'wedding', label: 'वेडिंग' },
  { value: 'birthday', label: 'बर्थडे' },
  { value: 'anniversary', label: 'एनिवर्सरी' },
  { value: 'haldi', label: 'हल्दी' },
  { value: 'mehendi', label: 'मेहंदी' },
  { value: 'car', label: 'कार' },
  { value: 'stage', label: 'स्टेज' },
  { value: 'mandap', label: 'मंडप' },
  { value: 'home', label: 'होम' },
  { value: 'flower', label: 'फूल' },
  { value: 'lighting', label: 'लाइटिंग' },
  { value: 'custom', label: 'अन्य' },
]

const ICON_CHOICES = [
  'Sparkles',
  'Heart',
  'Cake',
  'Gift',
  'Car',
  'Flower2',
  'Crown',
  'Star',
  'PartyPopper',
  'Lightbulb',
  'Home',
  'Church',
]

type Toast = { kind: 'ok' | 'error'; text: string } | null

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentManager({ counts, initialOccasions, supabaseReady }: ContentManagerProps) {
  const router = useRouter()
  const [toast, setToast] = useState<Toast>(null)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminOccasion | 'new' | null>(null)

  const [importPackages, setImportPackages] = useState(counts.live.packages === 0)
  const [importPortfolio, setImportPortfolio] = useState(counts.live.portfolio === 0)
  const [importOccasions, setImportOccasions] = useState(
    counts.live.occasions === 0 && !counts.occasionsTableMissing,
  )

  const occasions = useMemo(
    () => [...initialOccasions].sort((a, b) => a.sortOrder - b.sortOrder),
    [initialOccasions],
  )

  function notify(result: ActionResult, okText: string) {
    if (result.ok) {
      setToast({ kind: 'ok', text: result.summary ?? okText })
      router.refresh()
    } else {
      setToast({ kind: 'error', text: result.error ?? 'कुछ गलत हो गया' })
    }
    window.setTimeout(() => setToast(null), 6000)
  }

  function runImport() {
    if (!importPackages && !importPortfolio && !importOccasions) {
      setToast({ kind: 'error', text: 'कम से कम एक चीज़ चुनें' })
      return
    }
    startTransition(async () => {
      const res = await importSeedContent({
        packages: importPackages,
        portfolio: importPortfolio,
        occasions: importOccasions,
      })
      notify(res, 'इम्पोर्ट पूरा हुआ')
    })
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= occasions.length) return
    const ids = occasions.map((o) => o.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setBusyId(occasions[index].id)
    startTransition(async () => {
      const res = await reorderOccasions(ids)
      setBusyId(null)
      notify(res, 'क्रम बदल दिया गया')
    })
  }

  function remove(o: AdminOccasion) {
    if (!window.confirm(`"${o.name}" कार्ड हटाना है? यह होम पेज से भी हट जाएगा।`)) return
    setBusyId(o.id)
    startTransition(async () => {
      const res = await deleteOccasion(o.id)
      setBusyId(null)
      notify(res, 'कार्ड हटा दिया गया')
    })
  }

  function toggleActive(o: AdminOccasion) {
    setBusyId(o.id)
    startTransition(async () => {
      const res = await saveOccasion({
        id: o.id,
        name: o.name,
        nameEn: o.nameEn ?? '',
        slug: o.slug,
        description: o.description ?? '',
        eventType: o.eventType,
        startingPrice: o.startingPrice,
        imageUrl: o.imageUrl ?? '',
        imageAlt: o.imageAlt ?? '',
        icon: o.icon ?? 'Sparkles',
        isActive: !o.isActive,
      })
      setBusyId(null)
      notify(res, o.isActive ? 'कार्ड छुपा दिया गया' : 'कार्ड फिर से दिखेगा')
    })
  }

  function upload(o: AdminOccasion, file: File) {
    const fd = new FormData()
    fd.set('id', o.id)
    fd.set('file', file)
    setBusyId(o.id)
    startTransition(async () => {
      const res = await uploadOccasionImage(fd)
      setBusyId(null)
      notify(res, 'फोटो बदल दी गई')
    })
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-champagne">वेबसाइट कंटेंट</h1>
          <p className="mt-1 text-sm text-text-muted font-devanagari">
            होम पेज के अवसर कार्ड, पैकेज और गैलरी की तस्वीरें — सब यहाँ से बदलें या हटाएँ।
          </p>
        </div>
        {!counts.occasionsTableMissing && supabaseReady && (
          <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
            <Plus className="w-4 h-4" />
            नया अवसर कार्ड
          </Button>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-sm font-devanagari',
            toast.kind === 'ok'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border-floral-red/40 bg-floral-red/15 text-rose',
          )}
        >
          {toast.text}
        </div>
      )}

      {!supabaseReady && (
        <Card variant="outline" className="p-5 border-floral-red/40">
          <p className="text-sm text-rose font-devanagari">
            Supabase कॉन्फ़िगर नहीं है — वेबसाइट अभी सिर्फ़ बिल्ट-इन सैंपल कंटेंट दिखा रही है। पहले
            Vercel में Supabase environment variables सेट करें।
          </p>
        </Card>
      )}

      {/* Import panel */}
      <Card variant="premium" className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-bright to-gold-warm flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-bg-void" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg text-champagne">सैंपल कंटेंट को एडमिन में लाएँ</h2>
            <p className="mt-1 text-sm text-text-muted font-devanagari">
              वेबसाइट पर जो पैकेज, डिज़ाइन और अवसर कार्ड बिल्ट-इन दिख रहे हैं, उन्हें एक क्लिक में
              Supabase में कॉपी करें। इसके बाद हर चीज़ पोर्टफोलियो / पैकेज / यहाँ से बदली या हटाई जा
              सकेगी। पहले से मौजूद चीज़ें दोबारा नहीं बनेंगी।
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ImportRow
            icon={Package}
            title="पैकेज"
            live={counts.live.packages}
            seed={counts.seed.packages}
            checked={importPackages}
            onChange={setImportPackages}
            disabled={!supabaseReady || pending}
          />
          <ImportRow
            icon={ImageIcon}
            title="गैलरी डिज़ाइन"
            live={counts.live.portfolio}
            seed={counts.seed.portfolio}
            checked={importPortfolio}
            onChange={setImportPortfolio}
            disabled={!supabaseReady || pending}
          />
          <ImportRow
            icon={Sparkles}
            title="अवसर कार्ड"
            live={counts.live.occasions}
            seed={counts.seed.occasions}
            checked={importOccasions}
            onChange={setImportOccasions}
            disabled={!supabaseReady || pending || counts.occasionsTableMissing}
            note={
              counts.occasionsTableMissing
                ? 'पहले Supabase SQL editor में migration 0004_occasions_and_content_import.sql चलाएँ'
                : undefined
            }
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={runImport} disabled={!supabaseReady || pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            इम्पोर्ट करें
          </Button>
          <p className="text-xs text-text-muted font-devanagari">
            इम्पोर्ट के बाद: पैकेज →{' '}
            <a href="/admin/packages" className="text-gold-light underline-offset-2 hover:underline">
              पैकेज मैनेजर
            </a>
            , तस्वीरें →{' '}
            <a href="/admin/portfolio" className="text-gold-light underline-offset-2 hover:underline">
              पोर्टफोलियो मैनेजर
            </a>
            , अवसर कार्ड → नीचे।
          </p>
        </div>
      </Card>

      {/* Occasions */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-champagne">
            होम पेज अवसर कार्ड{' '}
            <span className="text-sm text-text-muted font-devanagari">({occasions.length})</span>
          </h2>
          {occasions.length === 0 && !counts.occasionsTableMissing && (
            <span className="text-xs text-text-muted font-devanagari">
              अभी वेबसाइट बिल्ट-इन 6 कार्ड दिखा रही है — ऊपर से इम्पोर्ट करें या नया बनाएँ।
            </span>
          )}
        </div>

        {counts.occasionsTableMissing ? (
          <Card variant="outline" className="p-5">
            <p className="text-sm text-text-muted font-devanagari">
              <span className="text-gold-light">occasions</span> टेबल अभी Supabase में नहीं है। Supabase →
              SQL Editor में{' '}
              <code className="text-champagne">supabase/migrations/0004_occasions_and_content_import.sql</code>{' '}
              चलाएँ, फिर यह पेज रीफ़्रेश करें।
            </p>
          </Card>
        ) : occasions.length === 0 ? (
          <Card variant="outline" className="p-8 text-center">
            <Sparkles className="w-8 h-8 text-gold/60 mx-auto" />
            <p className="mt-3 text-sm text-text-muted font-devanagari">कोई अवसर कार्ड नहीं है।</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {occasions.map((o, i) => (
              <OccasionCard
                key={o.id}
                occasion={o}
                index={i}
                total={occasions.length}
                busy={busyId === o.id && pending}
                onEdit={() => setEditing(o)}
                onDelete={() => remove(o)}
                onToggle={() => toggleActive(o)}
                onMove={(dir) => move(i, dir)}
                onUpload={(file) => upload(o, file)}
              />
            ))}
          </div>
        )}
      </section>

      {editing && (
        <OccasionForm
          occasion={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(res) => {
            setEditing(null)
            notify(res, 'अवसर कार्ड सेव हो गया')
          }}
        />
      )}
    </div>
  )
}

// ─── Import row ───────────────────────────────────────────────────────────────

function ImportRow({
  icon: Icon,
  title,
  live,
  seed,
  checked,
  onChange,
  disabled,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  live: number
  seed: number
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  note?: string
}) {
  const usingSeed = live === 0
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
        checked ? 'border-gold/50 bg-gold/5' : 'border-gold/15 bg-bg-void/40',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[#C9A84C]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gold" />
          <span className="font-devanagari text-sm text-champagne">{title}</span>
        </div>
        <p className="mt-1 text-xs text-text-muted font-devanagari">
          सैंपल: {seed} · एडमिन में: {live}
        </p>
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-devanagari',
            usingSeed ? 'bg-gold/10 text-gold-light' : 'bg-emerald-400/10 text-emerald-300',
          )}
        >
          {usingSeed ? (
            <>
              <Eye className="w-3 h-3" /> वेबसाइट सैंपल दिखा रही है
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" /> वेबसाइट एडमिन डेटा दिखा रही है
            </>
          )}
        </span>
        {note && <p className="mt-2 text-[11px] text-rose font-devanagari">{note}</p>}
      </div>
    </label>
  )
}

// ─── Occasion card ────────────────────────────────────────────────────────────

function OccasionCard({
  occasion: o,
  index,
  total,
  busy,
  onEdit,
  onDelete,
  onToggle,
  onMove,
  onUpload,
}: {
  occasion: AdminOccasion
  index: number
  total: number
  busy: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onMove: (dir: -1 | 1) => void
  onUpload: (file: File) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [imgSrc, setImgSrc] = useState(o.imagePublicUrl || FALLBACK_IMAGE)
  const Icon = getIcon(o.icon ?? 'Sparkles') ?? Sparkles
  const typeLabel = EVENT_TYPES.find((t) => t.value === o.eventType)?.label ?? o.eventType

  return (
    <Card variant="outline" className={cn('overflow-hidden', !o.isActive && 'opacity-60')}>
      <div className="relative aspect-[4/3] bg-bg-rich">
        <Image
          src={imgSrc}
          alt={o.imageAlt ?? o.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          unoptimized={imgSrc.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void/85 via-bg-void/20 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-bg-void/70 px-2 py-0.5 text-[11px] text-gold-light font-devanagari backdrop-blur">
            #{index + 1} · {typeLabel}
          </span>
          {!o.isActive && (
            <span className="rounded-full bg-floral-red/40 px-2 py-0.5 text-[11px] text-champagne font-devanagari">
              छुपा हुआ
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center">
                <Icon className="w-4 h-4 text-gold-light" />
              </span>
              <h3 className="font-devanagari text-base text-champagne truncate">{o.name}</h3>
            </div>
            {o.nameEn && <p className="text-xs text-text-muted truncate">{o.nameEn}</p>}
          </div>
          <span className="flex-shrink-0 text-sm text-gold-light font-display">
            ₹{o.startingPrice.toLocaleString('en-IN')}+
          </span>
        </div>
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-bg-void/60">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {o.description && (
          <p className="text-xs text-text-muted font-devanagari line-clamp-2">{o.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
              e.target.value = ''
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="w-3.5 h-3.5" />
            फोटो बदलें
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} disabled={busy}>
            <Pencil className="w-3.5 h-3.5" />
            एडिट
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} disabled={busy} title={o.isActive ? 'छुपाएँ' : 'दिखाएँ'}>
            {o.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <IconButton label="ऊपर" onClick={() => onMove(-1)} disabled={busy || index === 0}>
              <ArrowUp className="w-4 h-4" />
            </IconButton>
            <IconButton label="नीचे" onClick={() => onMove(1)} disabled={busy || index === total - 1}>
              <ArrowDown className="w-4 h-4" />
            </IconButton>
            <IconButton label="हटाएँ" onClick={onDelete} disabled={busy} danger>
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </div>
    </Card>
  )
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        danger
          ? 'border-floral-red/40 text-rose hover:bg-floral-red/20'
          : 'border-gold/20 text-text-muted hover:text-gold-light hover:border-gold/50',
      )}
    >
      {children}
    </button>
  )
}

// ─── Form modal ───────────────────────────────────────────────────────────────

function OccasionForm({
  occasion,
  onClose,
  onSaved,
}: {
  occasion: AdminOccasion | null
  onClose: () => void
  onSaved: (res: ActionResult) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: occasion?.name ?? '',
    nameEn: occasion?.nameEn ?? '',
    slug: occasion?.slug ?? '',
    description: occasion?.description ?? '',
    eventType: occasion?.eventType ?? 'custom',
    startingPrice: occasion ? String(occasion.startingPrice) : '',
    icon: occasion?.icon ?? 'Sparkles',
    imageUrl: occasion?.imageUrl ?? '',
    imageAlt: occasion?.imageAlt ?? '',
    isActive: occasion?.isActive ?? true,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const price = Number(form.startingPrice.replace(/[^\d]/g, ''))
    if (!form.name.trim()) return setError('अवसर का नाम ज़रूरी है')
    if (!Number.isFinite(price)) return setError('कीमत अंकों में डालें')

    startTransition(async () => {
      const res = await saveOccasion({
        id: occasion?.id,
        name: form.name,
        nameEn: form.nameEn,
        slug: form.slug || undefined,
        description: form.description,
        eventType: form.eventType,
        startingPrice: price,
        imageUrl: form.imageUrl,
        imageAlt: form.imageAlt,
        icon: form.icon,
        isActive: form.isActive,
      })
      if (!res.ok) {
        setError(res.error ?? 'सेव नहीं हुआ')
        return
      }
      onSaved(res)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-bg-void/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-gold/20 bg-bg-rich p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-champagne">
            {occasion ? 'अवसर कार्ड एडिट करें' : 'नया अवसर कार्ड'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="बंद करें"
            className="h-8 w-8 rounded-lg text-text-muted hover:text-champagne hover:bg-gold/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-floral-red/40 bg-floral-red/15 px-3 py-2 text-sm text-rose font-devanagari">
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="नाम (हिंदी) *">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="जैसे: शादी की सजावट" required />
          </Field>
          <Field label="नाम (English)">
            <Input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} placeholder="Wedding Decoration" />
          </Field>
          <Field label="इवेंट टाइप">
            <select
              value={form.eventType}
              onChange={(e) => set('eventType', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/20 text-text-primary text-sm font-devanagari focus:outline-none focus:border-gold"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="शुरुआती कीमत (₹) *">
            <Input
              inputMode="numeric"
              value={form.startingPrice}
              onChange={(e) => set('startingPrice', e.target.value)}
              placeholder="15000"
              required
            />
          </Field>
        </div>

        <Field label="छोटा विवरण">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/20 text-text-primary placeholder:text-text-muted text-sm font-devanagari focus:outline-none focus:border-gold"
            placeholder="एक लाइन में बताइए यह सजावट क्या है"
          />
        </Field>

        <Field label="आइकन">
          <div className="flex flex-wrap gap-2">
            {ICON_CHOICES.map((name) => {
              const I = getIcon(name)
              if (!I) return null
              const active = form.icon === name
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => set('icon', name)}
                  className={cn(
                    'h-9 w-9 rounded-lg border flex items-center justify-center transition-colors',
                    active
                      ? 'border-gold bg-gold/15 text-gold-light'
                      : 'border-gold/15 text-text-muted hover:border-gold/40',
                  )}
                >
                  <I className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="इमेज URL / पाथ" hint="खाली छोड़ें और सेव के बाद 'फोटो बदलें' से अपलोड करें">
            <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="/assets/… या https://…" />
          </Field>
          <Field label="इमेज alt टेक्स्ट">
            <Input value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} placeholder="फोटो का विवरण" />
          </Field>
        </div>

        <details className="text-xs text-text-muted">
          <summary className="cursor-pointer font-devanagari hover:text-champagne">एडवांस्ड</summary>
          <div className="mt-3 space-y-3">
            <Field label="स्लग (URL आईडी)" hint="सिर्फ़ a-z, 0-9 और डैश। खाली छोड़ने पर अपने आप बनेगा।">
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} placeholder="wedding" />
            </Field>
            <label className="flex items-center gap-2 font-devanagari text-sm text-text-primary">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#C9A84C]"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
              />
              वेबसाइट पर दिखाएँ
            </label>
          </div>
        </details>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            रद्द करें
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {occasion ? 'सेव करें' : 'बनाएँ'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-text-muted font-devanagari">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-text-muted/80 font-devanagari">{hint}</span>}
    </label>
  )
}

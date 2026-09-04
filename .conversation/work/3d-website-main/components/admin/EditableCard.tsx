'use client'

// ─── EditableCard — the one admin card editor (PART 2 §2, §4, §5, §6, §14, §15)
//
// WHY ONE COMPONENT
// Services, occasions and packages are three different tables, but from the
// owner's point of view they are the same object: a picture, a Hindi name, a
// description, a starting price, and two switches. Writing three editors would
// mean three places to fix every bug. Writing a fully generic "form engine"
// would mean nobody can read it.
//
// The middle path used here: this component owns everything that is IDENTICAL
// across the three grids —
//   * view ↔ edit mode switching and the always-visible pencil (never hover)
//   * the save/cancel state machine, including rollback and the last-saved
//     snapshot that Cancel restores
//   * the stale-response guard, so a slow save can't overwrite a newer one
//   * image replacement with client-side validation and a local preview
//   * the active / featured switches, each persisting independently
//   * per-field validation for text / textarea / price / number / select
//
// …and everything TYPE-SPECIFIC arrives as data or as nodes:
//   * `fields`   — a small descriptor list (what to edit, and how)
//   * `preview`  — the parent renders the real public-style card body
//   * `extraEdit`— the parent injects things only it has (package inclusions)
//
// So the parent decides *what* a service is; this file decides *how* editing
// behaves. The result is one interaction model the owner learns once.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Camera,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { getIcon } from '@/utils/icons'
import {
  IMAGE_ACCEPT_ATTR,
  MAX_IMAGE_LABEL,
  validateImageFile,
} from '@/lib/admin/media'
import { ADMIN_MSG, friendlyError } from '@/lib/admin/messages'

// ─── Public API ───────────────────────────────────────────────────────────────

/** Every grid's Server Actions already return this shape. */
export interface CardActionResult {
  ok: boolean
  error?: string
  id?: string
}

export type FieldKind = 'text' | 'textarea' | 'price' | 'number' | 'select'

export interface EditableField {
  /** Key inside the draft record — matches what the parent's onSave expects. */
  name: string
  label: string
  kind: FieldKind
  required?: boolean
  /** Mirrors the real DB constraint so we reject instead of silently cutting. */
  maxLength?: number
  placeholder?: string
  help?: string
  /** select only */
  options?: { value: string; label: string }[]
  /** number/price only */
  integer?: boolean
  min?: number
  max?: number
  /** Give the field the initial focus when edit mode opens. */
  focusFirst?: boolean
  /** Half-width on wide screens; full width on phones regardless. */
  half?: boolean
}

/** All values travel as strings — parsing happens once, at save time. */
export type DraftValues = Record<string, string>

export interface EditableCardProps {
  /** Stable row id. `null` for an unsaved local draft (§7). */
  id: string | null
  /** Heading used by the edit header and the a11y labels. */
  title: string

  /** Resolved, renderable image URL. '' means "no image → show the icon". */
  imageUrl: string
  imageAlt: string
  /** Lucide icon name used only when there is no image. */
  fallbackIcon?: string | null

  /** View-mode body — the parent renders its own public-style preview here. */
  preview: React.ReactNode

  fields: EditableField[]
  /** Last SUCCESSFULLY SAVED values. Cancel restores exactly this. */
  values: DraftValues

  isActive: boolean
  /** `null` when the table genuinely has no featured column (occasions). */
  isFeatured?: boolean | null

  onSave: (values: DraftValues) => Promise<CardActionResult>
  onToggleActive?: (next: boolean) => Promise<CardActionResult>
  onToggleFeatured?: (next: boolean) => Promise<CardActionResult>
  onUploadImage?: (file: File) => Promise<CardActionResult>
  /** Opens the PARENT's ConfirmDialog — this card never deletes on its own. */
  onRequestDelete?: () => void

  onNotify: (kind: 'ok' | 'error', text: string) => void

  /** Extra editor UI (e.g. package inclusions) shown inside edit mode. */
  extraEdit?: React.ReactNode
  /** Extra always-visible controls in view mode (e.g. ↑ ↓ reorder). */
  viewControls?: React.ReactNode

  /**
   * Unsaved local draft: starts in edit mode, Cancel discards the whole card
   * instead of reverting fields.
   */
  isDraft?: boolean
  onDiscardDraft?: () => void

  className?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateField(field: EditableField, raw: string): string | null {
  const value = raw.trim()

  if (field.required && !value) return `${field.label} जरूरी है`
  if (!value) return null // optional + empty is fine

  if (field.maxLength && value.length > field.maxLength) {
    // §5: never silently truncate — tell the owner and let them decide.
    return `${field.label} ${field.maxLength} अक्षरों से छोटा रखें (अभी ${value.length})`
  }

  if (field.kind === 'price' || field.kind === 'number') {
    // §4: "12abc" must NOT become 0. Number('') is 0, hence the explicit test.
    if (!/^-?\d+(\.\d+)?$/.test(value)) return `${field.label} में सिर्फ़ अंक लिखें`
    const num = Number(value)
    if (!Number.isFinite(num)) return `${field.label} सही नहीं है`
    if (field.integer && !Number.isInteger(num)) return `${field.label} पूरी संख्या में लिखें`
    const min = field.min ?? 0
    if (num < min) return `${field.label} ${min} से कम नहीं हो सकती`
    if (field.max != null && num > field.max) return `${field.label} बहुत ज़्यादा है`
  }

  if (field.kind === 'select' && field.options && !field.options.some((o) => o.value === value)) {
    return `${field.label} में से कोई विकल्प चुनें`
  }

  return null
}

function validateAll(fields: EditableField[], draft: DraftValues) {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const message = validateField(field, draft[field.name] ?? '')
    if (message) errors[field.name] = message
  }
  return errors
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditableCard(props: EditableCardProps) {
  const {
    id,
    title,
    imageUrl,
    imageAlt,
    fallbackIcon,
    preview,
    fields,
    values,
    isActive,
    isFeatured = null,
    onSave,
    onToggleActive,
    onToggleFeatured,
    onUploadImage,
    onRequestDelete,
    onNotify,
    extraEdit,
    viewControls,
    isDraft = false,
    onDiscardDraft,
    className,
  } = props

  const [editing, setEditing] = useState(isDraft)
  const [draft, setDraft] = useState<DraftValues>(values)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)
  const [togglingFeatured, setTogglingFeatured] = useState(false)

  // Optimistic switch positions. Rendered instead of the props while a toggle
  // is in flight, then thrown away — the server response is the truth (§6).
  const [activeOverride, setActiveOverride] = useState<boolean | null>(null)
  const [featuredOverride, setFeaturedOverride] = useState<boolean | null>(null)

  /**
   * Local object URL shown while the file uploads, so the owner sees the new
   * photo immediately on a slow phone connection. Cleared on success (the real
   * URL arrives via props) and on failure (the OLD image must come back — §3).
   */
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  /**
   * Last successfully-saved snapshot. This — not the initial mount value — is
   * what Cancel restores (§14). It is kept in a ref as well as in state so the
   * save handler can read it without re-subscribing.
   */
  const savedRef = useRef<DraftValues>(values)

  /** Monotonic save counter — the stale-response guard for §15. */
  const saveSeq = useRef(0)

  const editingRef = useRef(editing)
  editingRef.current = editing

  /**
   * §15: a background `router.refresh()` re-renders this card with fresh server
   * props. If the owner is mid-edit we must NOT stomp their typing. So new
   * props are only adopted while the card is in view mode.
   */
  const valuesKey = JSON.stringify(values)
  useEffect(() => {
    savedRef.current = values
    if (!editingRef.current) setDraft(values)
    // valuesKey (not `values`) — the parent rebuilds the object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey])

  // Revoke the blob URL when it stops being used, or the tab leaks memory
  // after a dozen photo changes.
  useEffect(() => {
    if (!localPreview) return
    return () => URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const effectiveActive = activeOverride ?? isActive
  const effectiveFeatured = featuredOverride ?? isFeatured
  const shownImage = localPreview ?? imageUrl
  const FallbackIcon = useMemo(
    () => (fallbackIcon ? getIcon(fallbackIcon) : null),
    [fallbackIcon],
  )

  const busy = saving || uploading

  // ─── Mode switching ────────────────────────────────────────────────────────

  const enterEdit = useCallback(() => {
    setDraft(savedRef.current)
    setErrors({})
    setEditing(true)
  }, [])

  function cancel() {
    if (busy) return
    if (isDraft) {
      onDiscardDraft?.()
      return
    }
    // §14: back to the last state the SERVER accepted.
    setDraft(savedRef.current)
    setErrors({})
    setEditing(false)
  }

  // §2: focus the most useful field once the edit fields exist.
  useEffect(() => {
    if (editing) firstFieldRef.current?.focus()
  }, [editing])

  function setValue(name: string, value: string) {
    setDraft((prev) => ({ ...prev, [name]: value }))
    // Clear the error as soon as the owner starts fixing it — a stale red
    // message under a now-valid field is just noise.
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  async function save() {
    if (busy) return // §14: no duplicate submits

    const found = validateAll(fields, draft)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      onNotify('error', ADMIN_MSG.validation)
      return
    }

    // Trim once, here, so what we validated is exactly what we send.
    const payload: DraftValues = {}
    for (const field of fields) payload[field.name] = (draft[field.name] ?? '').trim()

    const seq = ++saveSeq.current
    setSaving(true)
    setErrors({})

    let result: CardActionResult
    try {
      result = await onSave(payload)
    } catch {
      result = { ok: false }
    }

    // §15: a newer save started while this one was in flight — its result is
    // the current truth, so this stale response is discarded entirely.
    if (seq !== saveSeq.current) return

    setSaving(false)

    if (!result.ok) {
      // §14: rollback is "don't advance the snapshot". The owner's typed values
      // stay on screen and the card stays in edit mode so they can retry.
      onNotify('error', friendlyError(result.error))
      return
    }

    savedRef.current = payload
    setDraft(payload)
    setEditing(false)
    onNotify('ok', ADMIN_MSG.saved)
  }

  // ─── Image replacement (§3) ────────────────────────────────────────────────

  async function pickImage(file: File | undefined) {
    if (!file || !onUploadImage || uploading) return

    // Client-side gate: instant feedback, and no wasted upload. The Server
    // Action re-runs the identical check because this one is only UI.
    const check = validateImageFile(file)
    if (!check.ok) {
      onNotify('error', check.error)
      return
    }

    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    setUploading(true)

    let result: CardActionResult
    try {
      result = await onUploadImage(file)
    } catch {
      result = { ok: false }
    }

    setUploading(false)

    if (!result.ok) {
      // §3: upload failed → the OLD image must still be showing and image_url
      // must be untouched. Dropping the preview does exactly that.
      setLocalPreview(null)
      onNotify('error', friendlyError(result.error, ADMIN_MSG.imageFailed))
      return
    }

    // Keep the preview until the refreshed props bring the real public URL,
    // otherwise the card flashes the old photo for one paint.
    onNotify('ok', ADMIN_MSG.imageSaved)
  }

  useEffect(() => {
    // New server image arrived → the blob preview is no longer needed.
    if (localPreview && imageUrl) setLocalPreview(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  // ─── Toggles (§6) ──────────────────────────────────────────────────────────

  async function toggleActive() {
    if (!onToggleActive || togglingActive || !id) return
    const next = !effectiveActive
    setActiveOverride(next)
    setTogglingActive(true)
    let result: CardActionResult
    try {
      result = await onToggleActive(next)
    } catch {
      result = { ok: false }
    }
    setTogglingActive(false)
    if (!result.ok) {
      setActiveOverride(null) // full rollback to the server's value
      onNotify('error', friendlyError(result.error))
      return
    }
    onNotify('ok', next ? 'कार्ड वेबसाइट पर दिखेगा' : 'कार्ड वेबसाइट से छुप गया')
    setActiveOverride(null) // refreshed props are now authoritative
  }

  async function toggleFeatured() {
    if (!onToggleFeatured || togglingFeatured || !id) return
    const next = !effectiveFeatured
    setFeaturedOverride(next)
    setTogglingFeatured(true)
    let result: CardActionResult
    try {
      result = await onToggleFeatured(next)
    } catch {
      result = { ok: false }
    }
    setTogglingFeatured(false)
    if (!result.ok) {
      setFeaturedOverride(null)
      onNotify('error', friendlyError(result.error))
      return
    }
    onNotify('ok', next ? 'फ़ीचर्ड में जोड़ दिया' : 'फ़ीचर्ड से हटा दिया')
    setFeaturedOverride(null)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Card
      variant={effectiveFeatured ? 'premium' : 'outline'}
      className={cn(
        'relative flex flex-col overflow-hidden',
        // §2: the card keeps roughly the same footprint in both modes, so the
        // grid does not jump when one card opens.
        'min-h-[22rem]',
        !effectiveActive && !editing && 'opacity-70',
        className,
      )}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden bg-bg-purple">
        {shownImage ? (
          <Image
            src={shownImage}
            alt={imageAlt || title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 380px"
            // A blob: URL cannot go through the Next image optimizer.
            unoptimized={shownImage.startsWith('blob:')}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {FallbackIcon ? (
              <FallbackIcon className="h-12 w-12 text-gold/40" aria-hidden />
            ) : (
              <Camera className="h-10 w-10 text-gold/30" aria-hidden />
            )}
          </div>
        )}

        {/* §3: the change-photo control is a real, visible, thumb-sized button
            in edit mode — not a hover overlay (§1: the owner is on a phone). */}
        {editing && onUploadImage && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-devanagari absolute inset-x-0 bottom-0 flex min-h-[44px] items-center justify-center gap-2 bg-bg-void/80 px-4 py-2.5 text-sm font-semibold text-champagne backdrop-blur-sm transition hover:bg-bg-void/90 disabled:opacity-70"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  अपलोड हो रही है…
                </>
              ) : (
                <>
                  <Camera size={16} aria-hidden />
                  फोटो बदलें
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              // Standard picker → the phone offers camera *and* gallery.
              accept={IMAGE_ACCEPT_ATTR}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                // Reset first: picking the same file twice must still fire.
                e.target.value = ''
                void pickImage(file)
              }}
            />
          </>
        )}

        {/* Always-visible edit affordance (§2 — never hover-only). */}
        {!editing && (
          <button
            type="button"
            onClick={enterEdit}
            aria-label={`${title} में बदलाव करें`}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-bg-void/85 text-gold shadow-lg backdrop-blur-sm transition hover:bg-bg-void focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            <Pencil size={17} aria-hidden />
          </button>
        )}

        {!editing && !effectiveActive && (
          <span className="font-devanagari absolute left-3 top-3 rounded-lg bg-bg-void/85 px-2 py-1 text-[11px] font-semibold text-rose">
            छुपा हुआ
          </span>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {editing ? (
          <>
            {/*
              §3/§18: state the accepted formats and size limit UP FRONT. A
              phone camera photo can easily exceed the cap, and a rejection
              after a long upload with no stated rule feels like a broken app.
            */}
            {onUploadImage && (
              <p className="font-devanagari text-[11px] text-text-muted">
                फोटो: JPG, PNG या WebP — {MAX_IMAGE_LABEL} तक
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field, index) => {
                const error = errors[field.name]
                const value = draft[field.name] ?? ''
                const inputId = `${id ?? 'draft'}-${field.name}`
                const isFirst = field.focusFirst ?? index === 0

                return (
                  <div
                    key={field.name}
                    className={cn('flex flex-col gap-1', !field.half && 'sm:col-span-2')}
                  >
                    <label
                      htmlFor={inputId}
                      className="font-devanagari text-[11px] font-medium text-text-muted"
                    >
                      {field.label}
                      {field.required && <span className="text-rose"> *</span>}
                    </label>

                    {field.kind === 'textarea' ? (
                      <textarea
                        id={inputId}
                        ref={isFirst ? (el) => { firstFieldRef.current = el } : undefined}
                        value={value}
                        onChange={(e) => setValue(field.name, e.target.value)}
                        rows={3}
                        placeholder={field.placeholder}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${inputId}-err` : undefined}
                        className={cn(
                          'font-devanagari w-full resize-y rounded-xl border bg-bg-void/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1',
                          error
                            ? 'border-floral-red/60 focus:border-floral-red focus:ring-floral-red/30'
                            : 'border-gold/20 focus:border-gold focus:ring-gold/50',
                        )}
                      />
                    ) : field.kind === 'select' ? (
                      <select
                        id={inputId}
                        value={value}
                        onChange={(e) => setValue(field.name, e.target.value)}
                        aria-invalid={Boolean(error)}
                        className={cn(
                          'font-devanagari w-full rounded-xl border bg-bg-void/50 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1',
                          error
                            ? 'border-floral-red/60 focus:ring-floral-red/30'
                            : 'border-gold/20 focus:border-gold focus:ring-gold/50',
                        )}
                      >
                        {!field.required && <option value="">—</option>}
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        ref={isFirst ? (el) => { firstFieldRef.current = el } : undefined}
                        value={value}
                        onChange={(e) => setValue(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        // §4: numeric keypad on mobile, and type=text so a
                        // partially-typed value is never silently discarded by
                        // the browser's own number parsing.
                        inputMode={
                          field.kind === 'price' || field.kind === 'number' ? 'numeric' : 'text'
                        }
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${inputId}-err` : undefined}
                        className={cn(
                          'font-devanagari w-full rounded-xl border bg-bg-void/50 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1',
                          error
                            ? 'border-floral-red/60 focus:border-floral-red focus:ring-floral-red/30'
                            : 'border-gold/20 focus:border-gold focus:ring-gold/50',
                        )}
                      />
                    )}

                    {error ? (
                      <p
                        id={`${inputId}-err`}
                        role="alert"
                        className="font-devanagari text-[11px] text-rose"
                      >
                        {error}
                      </p>
                    ) : field.help ? (
                      <p className="font-devanagari text-[11px] text-text-muted/70">{field.help}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {extraEdit}

            {/* §2/§18: Save & Cancel pinned to the bottom of the card, full
                width, 44px tall — reachable with one thumb. */}
            <div className="mt-auto flex gap-2 pt-2">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="font-devanagari inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-bright to-gold-warm px-4 text-sm font-bold text-bg-void transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    सेव हो रहा है…
                  </>
                ) : (
                  <>
                    <Check size={16} aria-hidden />
                    सेव करें
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="font-devanagari inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-gold/25 px-4 text-sm font-semibold text-text-muted transition hover:border-gold/50 hover:text-champagne disabled:opacity-60"
              >
                <X size={15} aria-hidden />
                रद्द
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Parent-rendered, public-style preview (§20). */}
            <div className="flex-1">{preview}</div>

            {/* Compact, tappable controls — visible without hovering (§6). */}
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-gold/10 pt-3">
              {onToggleActive && id && (
                <button
                  type="button"
                  onClick={toggleActive}
                  disabled={togglingActive}
                  aria-pressed={effectiveActive}
                  className={cn(
                    'font-devanagari inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition disabled:opacity-60',
                    effectiveActive
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border-gold/20 text-text-muted',
                  )}
                >
                  {togglingActive ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden />
                  ) : effectiveActive ? (
                    <Eye size={13} aria-hidden />
                  ) : (
                    <EyeOff size={13} aria-hidden />
                  )}
                  {effectiveActive ? 'दिख रहा है' : 'छुपा है'}
                </button>
              )}

              {onToggleFeatured && isFeatured !== null && id && (
                <button
                  type="button"
                  onClick={toggleFeatured}
                  disabled={togglingFeatured}
                  aria-pressed={Boolean(effectiveFeatured)}
                  className={cn(
                    'font-devanagari inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition disabled:opacity-60',
                    effectiveFeatured
                      ? 'border-gold/40 bg-gold/15 text-gold-light'
                      : 'border-gold/20 text-text-muted',
                  )}
                >
                  {togglingFeatured ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden />
                  ) : (
                    <Star
                      size={13}
                      className={effectiveFeatured ? 'fill-gold text-gold' : ''}
                      aria-hidden
                    />
                  )}
                  फ़ीचर्ड
                </button>
              )}

              {viewControls}

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={enterEdit}
                  className="font-devanagari inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-gold/30 px-3 text-xs font-semibold text-gold-light transition hover:bg-gold/10"
                >
                  <Pencil size={13} aria-hidden />
                  बदलें
                </button>
                {onRequestDelete && id && (
                  <button
                    type="button"
                    onClick={onRequestDelete}
                    aria-label={`${title} हटाएँ`}
                    className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-floral-red/30 text-rose transition hover:bg-floral-red/10"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Blocks stray taps on the card while a mutation is running, so the same
          card cannot receive two conflicting edits (§14). */}
      {busy && <span className="pointer-events-none absolute inset-0" aria-busy="true" />}
    </Card>
  )
}

// ─── "Add new card" tile (§7) ─────────────────────────────────────────────────

/**
 * Sits at the END of a grid and creates a LOCAL draft. Nothing is written to
 * the database until the owner fills the required fields and presses Save, so
 * a mis-tap can never leave a blank row on the public site.
 */
export function AddCardTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-devanagari flex min-h-[22rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gold/25 bg-bg-rich/30 p-6 text-center transition hover:border-gold/50 hover:bg-bg-rich/50 focus:outline-none focus:ring-2 focus:ring-gold/50"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-2xl text-gold">
        +
      </span>
      <span className="text-sm font-semibold text-champagne">{label}</span>
      <span className="text-xs text-text-muted">
        जानकारी भरकर सेव करने पर ही वेबसाइट पर जुड़ेगा
      </span>
    </button>
  )
}

/** Small helpers shared by the grids that build DraftValues records. */
export function numToDraft(value: number | null | undefined): string {
  return value == null ? '' : String(value)
}

export function draftToNum(value: string | undefined): number | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : null
}

'use client'

// ─── Occasions grid (PART 2 §11) ──────────────────────────────────────────────
//
// The occasions management already existed — inside /admin/content, NOT at a
// dedicated /admin/occasions route. This file replaces only the card grid and
// its modal form with the shared EditableCard, so the owner gets the same
// interaction model as services and packages while every existing Server
// Action (`saveOccasion`, `deleteOccasion`, `reorderOccasions`,
// `uploadOccasionImage`) is reused untouched.
//
// EDITABLE FIELDS = exactly the columns that exist on public.occasions
// (migration 0004): name, name_en, description, event_type, starting_price,
// image_url (upload), image_alt, icon, is_active, sort_order.
//
// The occasions table has NO is_featured and NO description_en, so this grid
// does not offer them — inventing columns would make every save fail (§11).

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import {
  AddCardTile,
  EditableCard,
  draftToNum,
  numToDraft,
  type CardActionResult,
  type DraftValues,
  type EditableField,
} from '@/components/admin/EditableCard'
import { ReorderControls } from '../services/ServicesManager'
import { ADMIN_MSG, friendlyError } from '@/lib/admin/messages'
import { eventTypeLabel, eventTypeOptions } from '@/lib/admin/event-types'
import { formatPrice } from '@/utils/booking'
import {
  deleteOccasion,
  reorderOccasions,
  saveOccasion,
  uploadOccasionImage,
} from './actions'
import type { AdminOccasion } from './ContentManager'

interface OccasionsGridProps {
  occasions: AdminOccasion[]
  /** §17: the read failed — do not render this as "no occasion cards". */
  loadFailed?: boolean
  supabaseReady: boolean
}

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

function fieldsFor(currentType: string | null, currentIcon: string | null): EditableField[] {
  const iconOptions = ICON_CHOICES.map((value) => ({ value, label: value }))
  // Keep whatever the row actually stores selectable, so merely opening the
  // editor cannot change the icon.
  if (currentIcon && !ICON_CHOICES.includes(currentIcon)) {
    iconOptions.unshift({ value: currentIcon, label: currentIcon })
  }

  return [
    {
      name: 'name',
      label: 'अवसर का नाम (हिंदी)',
      kind: 'text',
      required: true,
      // 80, matching the existing occasionSchema max — not a guess.
      maxLength: 80,
      placeholder: 'जैसे: शादी',
      focusFirst: true,
    },
    {
      name: 'nameEn',
      label: 'नाम (English)',
      kind: 'text',
      maxLength: 80,
      placeholder: 'Wedding',
    },
    {
      name: 'description',
      label: 'छोटा विवरण',
      kind: 'textarea',
      // The DB column and the existing schema both cap at 200.
      maxLength: 200,
      help: 'होम पेज के कार्ड पर दिखेगा — 200 अक्षर तक',
    },
    {
      name: 'eventType',
      label: 'इवेंट टाइप',
      kind: 'select',
      required: true,
      options: eventTypeOptions(currentType),
      half: true,
    },
    {
      name: 'startingPrice',
      label: 'शुरुआती कीमत (₹)',
      kind: 'price',
      required: true,
      integer: true,
      min: 0,
      max: 10000000,
      half: true,
      help: 'सिर्फ़ अंक',
    },
    {
      name: 'imageAlt',
      label: 'फोटो का विवरण (SEO)',
      kind: 'text',
      maxLength: 200,
      half: true,
    },
    {
      name: 'icon',
      label: 'आइकन',
      kind: 'select',
      options: iconOptions,
      half: true,
      help: 'फोटो न होने पर यही दिखेगा',
    },
  ]
}

function valuesOf(o: AdminOccasion): DraftValues {
  return {
    name: o.name,
    nameEn: o.nameEn ?? '',
    description: o.description ?? '',
    eventType: o.eventType,
    startingPrice: numToDraft(o.startingPrice),
    imageAlt: o.imageAlt ?? '',
    icon: o.icon ?? 'Sparkles',
  }
}

const DRAFT_VALUES: DraftValues = {
  name: '',
  nameEn: '',
  description: '',
  eventType: 'wedding',
  startingPrice: '',
  imageAlt: '',
  icon: 'Sparkles',
}

export function OccasionsGrid({
  occasions: input,
  loadFailed = false,
  supabaseReady,
}: OccasionsGridProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; title: string }>({
    open: false,
    type: 'success',
    title: '',
  })
  const [deleteTarget, setDeleteTarget] = useState<AdminOccasion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDraft, setShowDraft] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const occasions = useMemo(
    () => [...input].sort((a, b) => a.sortOrder - b.sortOrder),
    [input],
  )

  function notify(kind: 'ok' | 'error', text: string) {
    setToast({ open: true, type: kind === 'ok' ? 'success' : 'error', title: text })
  }

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleSave(
    occasion: AdminOccasion | null,
    values: DraftValues,
  ): Promise<CardActionResult> {
    const price = draftToNum(values.startingPrice)
    if (price == null) return { ok: false, error: 'शुरुआती कीमत जरूरी है' }

    const result = await saveOccasion({
      id: occasion?.id,
      name: values.name,
      nameEn: values.nameEn,
      // Existing rows keep their slug (public /?occasion links depend on it);
      // new rows get one generated inside saveOccasion.
      slug: occasion?.slug,
      description: values.description,
      eventType: values.eventType,
      startingPrice: price,
      // Pass the RAW stored value, never the resolved public URL — writing the
      // resolved URL back would turn a bucket path into an absolute URL and
      // break future cleanup checks.
      imageUrl: occasion?.imageUrl ?? '',
      imageAlt: values.imageAlt,
      icon: values.icon,
      isActive: occasion?.isActive ?? true,
    })

    if (result.ok) {
      if (!occasion) setShowDraft(false)
      refresh()
    }
    return { ok: result.ok, error: result.error }
  }

  async function handleUpload(o: AdminOccasion, file: File): Promise<CardActionResult> {
    const fd = new FormData()
    fd.set('id', o.id)
    fd.set('file', file)
    const result = await uploadOccasionImage(fd)
    if (result.ok) refresh()
    return { ok: result.ok, error: result.error }
  }

  /**
   * Occasions have no dedicated flag action, so the toggle round-trips through
   * `saveOccasion` with every other field kept at its current value — the
   * pattern the existing ContentManager already used.
   */
  async function handleToggleActive(o: AdminOccasion, next: boolean): Promise<CardActionResult> {
    const result = await saveOccasion({
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
      isActive: next,
    })
    if (result.ok) refresh()
    return { ok: result.ok, error: result.error }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= occasions.length) return

    const ids = occasions.map((o) => o.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    setReorderingId(occasions[index].id)
    const result = await reorderOccasions(ids)
    setReorderingId(null)

    if (!result.ok) {
      notify('error', friendlyError(result.error, ADMIN_MSG.orderFailed))
      return
    }
    notify('ok', ADMIN_MSG.orderSaved)
    refresh()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteOccasion(deleteTarget.id)
    setDeleting(false)

    if (!result.ok) {
      notify('error', friendlyError(result.error, ADMIN_MSG.deleteFailed))
      return
    }
    setDeleteTarget(null)
    notify('ok', ADMIN_MSG.deleted)
    refresh()
  }

  // §17: a failed query outranks the empty state. Showing EmptyState here
  // would invite the owner to re-create cards that still exist in the DB.
  if (loadFailed) {
    return (
      <RetryableErrorState
        title="अवसर कार्ड लोड नहीं हो सके"
        description="इंटरनेट या सर्वर की समस्या हो सकती है। फिर कोशिश करें।"
      />
    )
  }

  if (occasions.length === 0 && !showDraft) {
    return (
      <>
        <EmptyState
          title="कोई अवसर कार्ड नहीं है"
          description="होम पेज का पहला अवसर कार्ड जोड़ें, या ऊपर से सैंपल कंटेंट इम्पोर्ट करें।"
          action={
            supabaseReady ? (
              <button
                type="button"
                onClick={() => setShowDraft(true)}
                className="font-devanagari min-h-[44px] rounded-xl bg-gradient-to-r from-gold-bright to-gold-warm px-5 text-sm font-bold text-bg-void"
              >
                + नया कार्ड जोड़ें
              </button>
            ) : null
          }
        />
        <Toast
          open={toast.open}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          type={toast.type}
          title={toast.title}
        />
      </>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {occasions.map((o, index) => (
          <EditableCard
            key={o.id}
            id={o.id}
            title={o.name}
            imageUrl={o.imagePublicUrl}
            imageAlt={o.imageAlt ?? o.name}
            fallbackIcon={o.icon}
            fields={fieldsFor(o.eventType, o.icon)}
            values={valuesOf(o)}
            isActive={o.isActive}
            // occasions has no is_featured column — null hides the control
            // rather than showing a switch that cannot be saved.
            isFeatured={null}
            onSave={(values) => handleSave(o, values)}
            onUploadImage={(file) => handleUpload(o, file)}
            onToggleActive={(next) => handleToggleActive(o, next)}
            onRequestDelete={() => setDeleteTarget(o)}
            onNotify={notify}
            viewControls={
              <ReorderControls
                busy={reorderingId === o.id}
                canUp={index > 0}
                canDown={index < occasions.length - 1}
                onUp={() => void move(index, -1)}
                onDown={() => void move(index, 1)}
              />
            }
            preview={<OccasionPreview occasion={o} position={index + 1} />}
          />
        ))}

        {showDraft && (
          <EditableCard
            id={null}
            isDraft
            title="नया अवसर कार्ड"
            imageUrl=""
            imageAlt=""
            fallbackIcon="Sparkles"
            fields={fieldsFor(null, null)}
            values={DRAFT_VALUES}
            isActive
            isFeatured={null}
            onSave={(values) => handleSave(null, values)}
            onNotify={notify}
            onDiscardDraft={() => setShowDraft(false)}
            preview={null}
          />
        )}

        {!showDraft && supabaseReady && (
          <AddCardTile label="+ नया अवसर कार्ड जोड़ें" onClick={() => setShowDraft(true)} />
        )}
      </div>

      {/* §8: the shared ConfirmDialog replaces the old window.confirm(), which
          could not be styled, was not translated consistently, and blocked the
          whole tab on mobile. */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
        title="अवसर कार्ड हटाएँ?"
        description={
          deleteTarget ? `"${deleteTarget.name}" होम पेज से हट जाएगा। यह वापस नहीं आएगा।` : ''
        }
        confirmLabel="हटा दें"
        confirmVariant="danger"
      />

      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        type={toast.type}
        title={toast.title}
      />
    </>
  )
}

function OccasionPreview({ occasion: o, position }: { occasion: AdminOccasion; position: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-devanagari text-base font-semibold leading-snug text-champagne">
          {o.name}
        </h3>
        <span className="font-devanagari flex-shrink-0 rounded-lg bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light">
          #{position} · {eventTypeLabel(o.eventType)}
        </span>
      </div>

      {o.nameEn && o.nameEn !== o.name && (
        <p className="text-xs text-text-muted">{o.nameEn}</p>
      )}

      {o.description ? (
        <p className="font-devanagari line-clamp-2 text-sm text-text-muted">{o.description}</p>
      ) : (
        <p className="font-devanagari text-sm italic text-text-muted/60">विवरण नहीं लिखा गया</p>
      )}

      <p className="font-devanagari pt-1 text-sm text-gold-light">
        शुरुआत <span className="font-bold">{formatPrice(o.startingPrice)}</span> से
      </p>

      {!o.imageUrl && (
        <p className="flex items-center gap-1 text-[11px] text-text-muted/70">
          <Sparkles size={11} aria-hidden />
          फोटो नहीं है — आइकन दिख रहा है
        </p>
      )}
    </div>
  )
}

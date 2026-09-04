'use client'

// ─── /admin/services — the services grid (PART 2 §10) ─────────────────────────
//
// Every editable field here corresponds to a real column in migration 0005:
// name, name_en, description, description_en, event_type, starting_price,
// image_url (via upload), image_alt, icon, is_featured, is_active, sort_order.
//
// Deliberately NOT exposed: id, slug, created_at, updated_at. The slug is
// derived from the name on insert and changing it later would break existing
// /services/<slug> links and any WhatsApp message the owner already shared.

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Sparkles } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import {
  AddCardTile,
  EditableCard,
  numToDraft,
  draftToNum,
  type CardActionResult,
  type DraftValues,
  type EditableField,
} from '@/components/admin/EditableCard'
import { ADMIN_MSG, friendlyError } from '@/lib/admin/messages'
import { eventTypeLabel, eventTypeOptions } from '@/lib/admin/event-types'
import { formatPrice } from '@/utils/booking'
import { saveService, deleteService, setServiceFlags, uploadServiceImage } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminService {
  id: string
  slug: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  eventType: string
  startingPrice: number
  /** Raw DB value — needed to tell "no photo" from "photo present". */
  imageUrl: string | null
  /** Resolved URL for <Image>. */
  imagePublicUrl: string
  imageAlt: string
  icon: string
  isFeatured: boolean
  isActive: boolean
  sortOrder: number
}

interface ServicesManagerProps {
  initialServices: AdminService[]
  supabaseReady: boolean
  /** True when the query itself failed — NOT the same as an empty table (§17). */
  loadFailed: boolean
}

type ToastState = {
  open: boolean
  type: 'success' | 'error'
  title: string
}

// ─── Field descriptors ────────────────────────────────────────────────────────

function fieldsFor(current: string | null): EditableField[] {
  return [
    {
      name: 'name',
      label: 'सर्विस का नाम (हिंदी)',
      kind: 'text',
      required: true,
      maxLength: 120,
      placeholder: 'जैसे: वेडिंग स्टेज सजावट',
      focusFirst: true,
    },
    {
      // §5: both languages are separate columns, so both get their own input.
      // Editing the Hindi name must never overwrite the English one.
      name: 'nameEn',
      label: 'नाम (English)',
      kind: 'text',
      maxLength: 120,
      placeholder: 'Wedding Stage Decoration',
      help: 'खाली छोड़ें तो हिंदी नाम ही इस्तेमाल होगा',
    },
    {
      name: 'description',
      label: 'विवरण (हिंदी)',
      kind: 'textarea',
      maxLength: 2000,
      placeholder: 'ग्राहक को क्या मिलेगा, छोटे में लिखें',
    },
    {
      name: 'descriptionEn',
      label: 'विवरण (English)',
      kind: 'textarea',
      maxLength: 2000,
    },
    {
      name: 'eventType',
      label: 'इवेंट टाइप',
      kind: 'select',
      required: true,
      options: eventTypeOptions(current),
      half: true,
    },
    {
      // §4: numeric only, and the ₹ symbol is NEVER stored — it is added by
      // formatPrice() at display time.
      name: 'startingPrice',
      label: 'शुरुआती कीमत (₹)',
      kind: 'price',
      required: true,
      integer: true,
      min: 0,
      max: 10000000,
      placeholder: '5000',
      half: true,
      help: 'सिर्फ़ अंक — ₹ अपने आप लगेगा',
    },
    {
      name: 'imageAlt',
      label: 'फोटो का विवरण (SEO)',
      kind: 'text',
      maxLength: 200,
      half: true,
      help: 'Google और स्क्रीन रीडर के लिए',
    },
    {
      name: 'icon',
      label: 'आइकन नाम',
      kind: 'text',
      maxLength: 60,
      half: true,
      placeholder: 'Sparkles',
      help: 'फोटो न होने पर यही आइकन दिखेगा',
    },
  ]
}

function valuesOf(service: AdminService): DraftValues {
  return {
    name: service.name,
    nameEn: service.nameEn,
    description: service.description,
    descriptionEn: service.descriptionEn,
    eventType: service.eventType,
    startingPrice: numToDraft(service.startingPrice),
    imageAlt: service.imageAlt,
    icon: service.icon,
  }
}

const DRAFT_VALUES: DraftValues = {
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  eventType: 'wedding',
  startingPrice: '',
  imageAlt: '',
  icon: 'Sparkles',
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export function ServicesManager({
  initialServices,
  supabaseReady,
  loadFailed,
}: ServicesManagerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', title: '' })
  const [deleteTarget, setDeleteTarget] = useState<AdminService | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDraft, setShowDraft] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const services = useMemo(
    () => [...initialServices].sort((a, b) => a.sortOrder - b.sortOrder),
    [initialServices],
  )

  function notify(kind: 'ok' | 'error', text: string) {
    setToast({ open: true, type: kind === 'ok' ? 'success' : 'error', title: text })
  }

  /**
   * §14: a targeted server re-render, NOT window.location.reload(). The owner
   * keeps their scroll position and any other card stays where it was.
   */
  function refresh() {
    startTransition(() => router.refresh())
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleSave(
    service: AdminService | null,
    values: DraftValues,
  ): Promise<CardActionResult> {
    const price = draftToNum(values.startingPrice)
    // EditableCard has already validated this; the check remains because a
    // null here would violate the NOT NULL column and the DB error would be
    // far less clear than this message.
    if (price == null) return { ok: false, error: 'शुरुआती कीमत जरूरी है' }

    const result = await saveService({
      id: service?.id,
      name: values.name,
      nameEn: values.nameEn,
      description: values.description,
      descriptionEn: values.descriptionEn,
      eventType: values.eventType,
      startingPrice: price,
      imageAlt: values.imageAlt,
      icon: values.icon,
    })

    if (result.ok) {
      if (!service) setShowDraft(false)
      refresh()
    }
    return result
  }

  async function handleUpload(service: AdminService, file: File): Promise<CardActionResult> {
    const fd = new FormData()
    fd.set('id', service.id)
    fd.set('file', file)
    const result = await uploadServiceImage(fd)
    if (result.ok) refresh()
    return result
  }

  async function handleFlag(
    service: AdminService,
    patch: { isActive?: boolean; isFeatured?: boolean },
  ): Promise<CardActionResult> {
    const result = await setServiceFlags({ id: service.id, ...patch })
    if (result.ok) refresh()
    return result
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= services.length) return

    const ids = services.map((s) => s.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    setReorderingId(services[index].id)
    // Imported lazily so the reorder action isn't pulled into the initial
    // client bundle for owners who never reorder.
    const { reorderServices } = await import('./actions')
    const result = await reorderServices(ids)
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
    const result = await deleteService(deleteTarget.id)
    setDeleting(false)

    if (!result.ok) {
      notify('error', friendlyError(result.error, ADMIN_MSG.deleteFailed))
      return
    }
    // §8: the card only disappears once the server confirms the delete.
    setDeleteTarget(null)
    notify('ok', ADMIN_MSG.deleted)
    refresh()
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-champagne sm:text-3xl">सर्विस कार्ड</h1>
          <p className="font-devanagari mt-1 text-sm text-text-muted">
            वेबसाइट के &ldquo;हमारी सेवाएँ&rdquo; वाले कार्ड — फोटो, नाम, कीमत सब यहीं से बदलें।
          </p>
        </div>
        {services.length > 0 && (
          <span className="font-devanagari rounded-lg border border-gold/20 px-3 py-1.5 text-xs text-text-muted">
            {services.filter((s) => s.isActive).length} दिख रहे · {services.length} कुल
          </span>
        )}
      </header>

      {!supabaseReady && (
        <Card variant="outline" className="border-floral-red/40 p-5">
          <p className="font-devanagari text-sm text-rose">
            Supabase कॉन्फ़िगर नहीं है — सर्विस कार्ड बदले नहीं जा सकेंगे।
          </p>
        </Card>
      )}

      {/* §17: three genuinely different outcomes, three different screens.
          A failed query must never look like an empty table. */}
      {loadFailed ? (
        <RetryableErrorState
          title="सर्विस लोड नहीं हो सकीं"
          description="कनेक्शन जाँचकर फिर कोशिश करें।"
        />
      ) : services.length === 0 && !showDraft ? (
        <EmptyState
          title="अभी कोई सर्विस कार्ड नहीं है"
          description="पहला कार्ड जोड़ें — वह तुरंत वेबसाइट पर दिखने लगेगा।"
          action={
            <button
              type="button"
              onClick={() => setShowDraft(true)}
              className="font-devanagari min-h-[44px] rounded-xl bg-gradient-to-r from-gold-bright to-gold-warm px-5 text-sm font-bold text-bg-void"
            >
              + नया कार्ड जोड़ें
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <EditableCard
              key={service.id}
              id={service.id}
              title={service.name}
              imageUrl={service.imagePublicUrl}
              imageAlt={service.imageAlt}
              fallbackIcon={service.icon}
              fields={fieldsFor(service.eventType)}
              values={valuesOf(service)}
              isActive={service.isActive}
              isFeatured={service.isFeatured}
              onSave={(values) => handleSave(service, values)}
              onUploadImage={(file) => handleUpload(service, file)}
              onToggleActive={(next) => handleFlag(service, { isActive: next })}
              onToggleFeatured={(next) => handleFlag(service, { isFeatured: next })}
              onRequestDelete={() => setDeleteTarget(service)}
              onNotify={notify}
              viewControls={
                <ReorderControls
                  busy={reorderingId === service.id}
                  canUp={index > 0}
                  canDown={index < services.length - 1}
                  onUp={() => void move(index, -1)}
                  onDown={() => void move(index, 1)}
                />
              }
              preview={<ServicePreview service={service} />}
            />
          ))}

          {/* §7: a LOCAL draft. Nothing hits the database until Save. */}
          {showDraft && (
            <EditableCard
              id={null}
              isDraft
              title="नई सर्विस"
              imageUrl=""
              imageAlt=""
              fallbackIcon="Sparkles"
              fields={fieldsFor(null)}
              values={DRAFT_VALUES}
              isActive
              isFeatured={false}
              onSave={(values) => handleSave(null, values)}
              onNotify={notify}
              onDiscardDraft={() => setShowDraft(false)}
              preview={null}
            />
          )}

          {!showDraft && supabaseReady && (
            <AddCardTile label="+ नया कार्ड जोड़ें" onClick={() => setShowDraft(true)} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
        title="सर्विस कार्ड हटाएँ?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" वेबसाइट से हट जाएगा। यह वापस नहीं आएगा।`
            : ''
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
    </div>
  )
}

// ─── View-mode preview (§20 — mirrors the public card) ────────────────────────

function ServicePreview({ service }: { service: AdminService }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-devanagari text-base font-semibold leading-snug text-champagne">
          {service.name}
        </h3>
        <span className="font-devanagari flex-shrink-0 rounded-lg bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light">
          {eventTypeLabel(service.eventType)}
        </span>
      </div>

      {service.nameEn && service.nameEn !== service.name && (
        <p className="text-xs text-text-muted">{service.nameEn}</p>
      )}

      {service.description ? (
        <p className="font-devanagari line-clamp-3 text-sm text-text-muted">
          {service.description}
        </p>
      ) : (
        <p className="font-devanagari text-sm italic text-text-muted/60">
          विवरण नहीं लिखा गया
        </p>
      )}

      <p className="font-devanagari pt-1 text-sm text-gold-light">
        शुरुआत <span className="font-bold">{formatPrice(service.startingPrice)}</span> से
      </p>

      {!service.imageUrl && (
        <p className="flex items-center gap-1 text-[11px] text-text-muted/70">
          <Sparkles size={11} aria-hidden />
          फोटो नहीं है — आइकन दिख रहा है
        </p>
      )}
    </div>
  )
}

// ─── Reorder buttons ──────────────────────────────────────────────────────────

/**
 * §9/§18: real ↑ ↓ buttons. Drag-and-drop is unusable on a phone with one
 * thumb, so tap controls are the primary (and here the only) mechanism.
 */
export function ReorderControls({
  busy,
  canUp,
  canDown,
  onUp,
  onDown,
}: {
  busy: boolean
  canUp: boolean
  canDown: boolean
  onUp: () => void
  onDown: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onUp}
        disabled={!canUp || busy}
        aria-label="ऊपर ले जाएँ"
        className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-gold/20 text-text-muted transition hover:border-gold/50 hover:text-gold disabled:opacity-30"
      >
        <ArrowUp size={14} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={!canDown || busy}
        aria-label="नीचे ले जाएँ"
        className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-gold/20 text-text-muted transition hover:border-gold/50 hover:text-gold disabled:opacity-30"
      >
        <ArrowDown size={14} aria-hidden />
      </button>
    </div>
  )
}

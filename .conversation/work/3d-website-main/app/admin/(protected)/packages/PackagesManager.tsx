'use client'

// ─── /admin/packages (PART 2 §12 + §9) ────────────────────────────────────────
//
// This is an UPGRADE of the existing packages manager, not a parallel system:
// every Server Action it calls (`savePackage`, `deletePackage`,
// `savePackageItem`, `deletePackageItem`, `reorderPackageItems`) is the one
// that was already here. What changed is the surface the owner touches.
//
// BEFORE: one modal form for everything. To fix a price the owner tapped Edit,
// waited for a modal, scrolled past nine fields, saved, and the modal closed —
// and the bullet inclusions lived in a separate expand-panel with drag-only
// reordering that does not work on touch.
//
// NOW: the card itself is the editor (shared EditableCard, identical to
// services and occasions), so the frequent edits — name, price range, photo,
// featured/active — are two taps. The genuinely complex fields (setup time,
// decoration area, customizable, slug-affecting rename) live in a compact
// Advanced section revealed inside the SAME edit mode, so it is one workflow,
// not two. Inclusions are edited inline with ↑ ↓ controls.

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Maximize2, Package as PackageIcon, Sparkles } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
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
import { PackageItemsEditor, type AdminPackageItem } from './PackageItemsEditor'
import { ADMIN_MSG, friendlyError } from '@/lib/admin/messages'
import { formatPrice } from '@/utils/booking'
import {
  deletePackage,
  reorderPackages,
  savePackage,
  setPackageFlags,
  uploadPackageImage,
} from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type { AdminPackageItem }

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
  /** Raw DB value — distinguishes "no photo" from "photo present". */
  imageUrl: string | null
  imagePublicUrl: string
  imageAlt: string
  sortOrder: number
  items: AdminPackageItem[]
}

interface PackagesManagerProps {
  initialPackages: AdminPackage[]
  supabaseReady: boolean
  loadFailed: boolean
}

// ─── Field descriptors ────────────────────────────────────────────────────────
//
// Packages have NO name_en and NO event_type columns in the live schema, so
// neither is offered here — showing them would produce saves that silently
// drop data.

const FIELDS: EditableField[] = [
  {
    name: 'name',
    label: 'पैकेज का नाम',
    kind: 'text',
    required: true,
    maxLength: 120,
    placeholder: 'जैसे: प्रीमियम वेडिंग पैकेज',
    focusFirst: true,
  },
  {
    name: 'description',
    label: 'विवरण',
    kind: 'textarea',
    maxLength: 2000,
    placeholder: 'ग्राहक को क्या मिलेगा',
  },
  {
    name: 'startingPrice',
    label: 'शुरुआती कीमत (₹)',
    kind: 'price',
    integer: true,
    min: 0,
    max: 10000000,
    half: true,
    help: 'खाली = कीमत नहीं दिखेगी',
  },
  {
    name: 'priceMax',
    label: 'अधिकतम कीमत (₹)',
    kind: 'price',
    integer: true,
    min: 0,
    max: 10000000,
    half: true,
    help: 'रेंज दिखाने के लिए',
  },
  {
    name: 'imageAlt',
    label: 'फोटो का विवरण (SEO)',
    kind: 'text',
    maxLength: 200,
    half: true,
  },
  {
    // §12 calls setup time and decoration area "complex"; they are still just
    // two fields, so a compact half-width pair inside the same edit mode is
    // simpler for the owner than a second modal.
    name: 'setupTimeMinutes',
    label: 'सेटअप समय (मिनट)',
    kind: 'number',
    integer: true,
    min: 0,
    max: 60 * 24 * 30,
    half: true,
    placeholder: '240',
    help: 'मिनटों में — 240 = 4 घंटे',
  },
  {
    name: 'decorationArea',
    label: 'सजावट का क्षेत्र',
    kind: 'text',
    maxLength: 200,
    placeholder: 'जैसे: स्टेज + एंट्री गेट',
  },
  {
    /*
     * §20: `customizable` drives a visible "मनपसंद बदलाव संभव" badge on the
     * home-page section, the packages list AND the package detail page, but it
     * had no admin control — saving a package silently re-sent the old value.
     * A public-facing property with no admin path is exactly what §20 forbids.
     */
    name: 'customizable',
    label: 'मनपसंद बदलाव संभव?',
    kind: 'select',
    half: true,
    options: [
      { value: 'yes', label: 'हाँ — बैज दिखाएँ' },
      { value: 'no', label: 'नहीं' },
    ],
    help: 'वेबसाइट पर बैज के रूप में दिखता है',
  },
]

function valuesOf(pkg: AdminPackage): DraftValues {
  return {
    name: pkg.name,
    description: pkg.description,
    startingPrice: numToDraft(pkg.startingPrice),
    priceMax: numToDraft(pkg.priceMax),
    imageAlt: pkg.imageAlt,
    setupTimeMinutes: numToDraft(pkg.setupTimeMinutes),
    decorationArea: pkg.decorationArea,
    customizable: pkg.customizable ? 'yes' : 'no',
  }
}

const DRAFT_VALUES: DraftValues = {
  name: '',
  description: '',
  startingPrice: '',
  priceMax: '',
  imageAlt: '',
  setupTimeMinutes: '',
  decorationArea: '',
  customizable: 'yes',
}

/** Minutes → the phrase the owner would actually say. */
function formatSetupTime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return ''
  if (minutes >= 60 * 24) return `${Math.round(minutes / (60 * 24))} दिन`
  if (minutes >= 60) return `${Math.round(minutes / 60)} घंटे`
  return `${minutes} मिनट`
}

/** Price line: a range when both ends exist, otherwise whichever one does. */
function priceLabel(pkg: AdminPackage): string {
  if (pkg.startingPrice != null && pkg.priceMax != null && pkg.priceMax > pkg.startingPrice) {
    return `${formatPrice(pkg.startingPrice)} – ${formatPrice(pkg.priceMax)}`
  }
  if (pkg.startingPrice != null) return `${formatPrice(pkg.startingPrice)} से`
  if (pkg.priceMax != null) return `${formatPrice(pkg.priceMax)} तक`
  return 'कीमत नहीं डाली गई'
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export function PackagesManager({
  initialPackages,
  supabaseReady,
  loadFailed,
}: PackagesManagerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; title: string }>({
    open: false,
    type: 'success',
    title: '',
  })
  const [deleteTarget, setDeleteTarget] = useState<AdminPackage | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDraft, setShowDraft] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const packages = useMemo(
    () => [...initialPackages].sort((a, b) => a.sortOrder - b.sortOrder),
    [initialPackages],
  )

  function notify(kind: 'ok' | 'error', text: string) {
    setToast({ open: true, type: kind === 'ok' ? 'success' : 'error', title: text })
  }

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleSave(
    pkg: AdminPackage | null,
    values: DraftValues,
  ): Promise<CardActionResult> {
    const startingPrice = draftToNum(values.startingPrice)
    const priceMax = draftToNum(values.priceMax)

    // Cross-field rule the per-field validator cannot express. Checked here as
    // well as in the Zod schema so the owner sees it before the round-trip.
    if (startingPrice != null && priceMax != null && priceMax < startingPrice) {
      return { ok: false, error: 'अधिकतम कीमत शुरुआती कीमत से कम नहीं हो सकती' }
    }

    const result = await savePackage({
      id: pkg?.id,
      name: values.name,
      // The slug is intentionally NOT sent: renaming a package must not change
      // its public URL, which the owner may already have shared on WhatsApp.
      description: values.description,
      startingPrice,
      priceMax,
      setupTimeMinutes: draftToNum(values.setupTimeMinutes),
      decorationArea: values.decorationArea,
      // §20: now the owner's actual choice, not a pass-through of the old value.
      customizable: values.customizable !== 'no',
      isFeatured: pkg?.isFeatured ?? false,
      isActive: pkg?.isActive ?? true,
    })

    if (result.ok) {
      if (!pkg) setShowDraft(false)
      refresh()
    }
    return result
  }

  async function handleUpload(pkg: AdminPackage, file: File): Promise<CardActionResult> {
    const fd = new FormData()
    fd.set('id', pkg.id)
    fd.set('file', file)
    const result = await uploadPackageImage(fd)
    if (result.ok) refresh()
    return result
  }

  async function handleFlag(
    pkg: AdminPackage,
    patch: { isActive?: boolean; isFeatured?: boolean },
  ): Promise<CardActionResult> {
    const result = await setPackageFlags({ id: pkg.id, ...patch })
    if (result.ok) refresh()
    return result
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= packages.length) return

    const ids = packages.map((p) => p.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    setReorderingId(packages[index].id)
    const result = await reorderPackages(ids)
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
    const result = await deletePackage(deleteTarget.id)
    setDeleting(false)

    if (!result.ok) {
      notify('error', friendlyError(result.error, ADMIN_MSG.deleteFailed))
      return
    }
    setDeleteTarget(null)
    notify('ok', ADMIN_MSG.deleted)
    refresh()
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-champagne sm:text-3xl">पैकेज</h1>
          <p className="font-devanagari mt-1 text-sm text-text-muted">
            कीमत, फोटो और शामिल सेवाएँ यहीं से बदलें — बदलाव तुरंत /packages पेज पर दिखेंगे।
          </p>
        </div>
        {packages.length > 0 && (
          <span className="font-devanagari rounded-lg border border-gold/20 px-3 py-1.5 text-xs text-text-muted">
            {packages.filter((p) => p.isActive).length} दिख रहे · {packages.length} कुल
          </span>
        )}
      </header>

      {!supabaseReady && (
        <Card variant="outline" className="border-floral-red/40 p-5">
          <p className="font-devanagari text-sm text-rose">
            Supabase कॉन्फ़िगर नहीं है — बदलाव सेव नहीं होंगे।
          </p>
        </Card>
      )}

      {loadFailed ? (
        <RetryableErrorState
          title="पैकेज लोड नहीं हो सके"
          description="कनेक्शन जाँचकर फिर कोशिश करें।"
        />
      ) : packages.length === 0 && !showDraft ? (
        <EmptyState
          title="अभी कोई पैकेज नहीं है"
          description="पहला पैकेज बनाएँ — नाम और कीमत भरते ही वह वेबसाइट पर दिखने लगेगा।"
          action={
            supabaseReady ? (
              <button
                type="button"
                onClick={() => setShowDraft(true)}
                className="font-devanagari min-h-[44px] rounded-xl bg-gradient-to-r from-gold-bright to-gold-warm px-5 text-sm font-bold text-bg-void"
              >
                + नया पैकेज जोड़ें
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg, index) => (
            <EditableCard
              key={pkg.id}
              id={pkg.id}
              title={pkg.name}
              imageUrl={pkg.imagePublicUrl}
              imageAlt={pkg.imageAlt || pkg.name}
              fallbackIcon="Package"
              fields={FIELDS}
              values={valuesOf(pkg)}
              isActive={pkg.isActive}
              isFeatured={pkg.isFeatured}
              onSave={(values) => handleSave(pkg, values)}
              onUploadImage={(file) => handleUpload(pkg, file)}
              onToggleActive={(next) => handleFlag(pkg, { isActive: next })}
              onToggleFeatured={(next) => handleFlag(pkg, { isFeatured: next })}
              onRequestDelete={() => setDeleteTarget(pkg)}
              onNotify={notify}
              // §9: inclusions are edited in place, inside the card's edit
              // mode, instead of in a separate expandable panel.
              extraEdit={
                <PackageItemsEditor
                  packageId={pkg.id}
                  items={pkg.items}
                  onNotify={notify}
                  onChanged={refresh}
                />
              }
              viewControls={
                <ReorderControls
                  busy={reorderingId === pkg.id}
                  canUp={index > 0}
                  canDown={index < packages.length - 1}
                  onUp={() => void move(index, -1)}
                  onDown={() => void move(index, 1)}
                />
              }
              preview={<PackagePreview pkg={pkg} />}
            />
          ))}

          {showDraft && (
            <EditableCard
              id={null}
              isDraft
              title="नया पैकेज"
              imageUrl=""
              imageAlt=""
              fallbackIcon="Package"
              fields={FIELDS}
              values={DRAFT_VALUES}
              isActive
              isFeatured={false}
              onSave={(values) => handleSave(null, values)}
              onNotify={notify}
              onDiscardDraft={() => setShowDraft(false)}
              // No inclusions editor on a draft: package_items rows need a
              // package_id, which does not exist until the first save.
              preview={null}
            />
          )}

          {!showDraft && supabaseReady && (
            <AddCardTile label="+ नया पैकेज जोड़ें" onClick={() => setShowDraft(true)} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
        title="पैकेज हटाएँ?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" और इसकी ${deleteTarget.items.length} शामिल सेवाएँ हट जाएँगी। यह वापस नहीं आएगा।`
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

// ─── View-mode preview ────────────────────────────────────────────────────────

function PackagePreview({ pkg }: { pkg: AdminPackage }) {
  const setupTime = formatSetupTime(pkg.setupTimeMinutes)

  return (
    <div className="space-y-2">
      <h3 className="font-devanagari text-base font-semibold leading-snug text-champagne">
        {pkg.name}
      </h3>

      {pkg.description ? (
        <p className="font-devanagari line-clamp-2 text-sm text-text-muted">{pkg.description}</p>
      ) : (
        <p className="font-devanagari text-sm italic text-text-muted/60">विवरण नहीं लिखा गया</p>
      )}

      <p className="font-devanagari text-sm font-bold text-gold-light">{priceLabel(pkg)}</p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
        {setupTime && (
          <span className="font-devanagari flex items-center gap-1">
            <Clock size={11} aria-hidden />
            {setupTime}
          </span>
        )}
        {pkg.decorationArea && (
          <span className="font-devanagari flex items-center gap-1">
            <Maximize2 size={11} aria-hidden />
            {pkg.decorationArea}
          </span>
        )}
        <span className="font-devanagari flex items-center gap-1">
          <PackageIcon size={11} aria-hidden />
          {pkg.items.length} सेवाएँ
        </span>
      </div>

      {/* §20: the public card shows this badge, so the preview must too —
          otherwise the owner cannot see the effect of the toggle he just set. */}
      {pkg.customizable && (
        <span className="font-devanagari inline-block rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] text-gold-light">
          मनपसंद बदलाव संभव
        </span>
      )}

      {/* The first few inclusions, exactly as the public card lists them. */}
      {pkg.items.length > 0 && (
        <ul className="space-y-0.5 pt-1">
          {pkg.items.slice(0, 3).map((item) => (
            <li key={item.id} className="font-devanagari truncate text-xs text-text-muted">
              <span className="text-gold-light">•</span> {item.label}
            </li>
          ))}
          {pkg.items.length > 3 && (
            <li className="font-devanagari text-xs text-text-muted/70">
              +{pkg.items.length - 3} और
            </li>
          )}
        </ul>
      )}

      {!pkg.imageUrl && (
        <p className="flex items-center gap-1 text-[11px] text-text-muted/70">
          <Sparkles size={11} aria-hidden />
          फोटो नहीं है — आइकन दिख रहा है
        </p>
      )}
    </div>
  )
}

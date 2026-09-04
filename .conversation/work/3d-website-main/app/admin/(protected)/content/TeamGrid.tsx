'use client'

// ─── Team members grid (PART 3 §14–§16) ───────────────────────────────────────
//
// §14: the owner could edit services, occasions, packages and portfolio, but
// the /about "हमारी टीम" cards were seeded once by migration 0006 and then
// frozen — adding a new decorator required a code change. This grid closes
// that gap using the table that already exists.
//
// §15: it lives inside /admin/content, next to the occasion cards, because
// that page is already "everything the public site shows". A new top-level
// route for three cards would add a sidebar entry and a URL to remember for no
// benefit.
//
// EDITABLE FIELDS = exactly the columns migration 0006 defines:
//   name, role, phone, photo_url (upload), is_active, sort_order.
// There is no bio, no email and no years-of-experience column, so this grid
// does not offer them — inventing fields would make every save fail.
//
// §14 "don't invent employees": there is no draft prefill, no sample member and
// no placeholder photo. A new card starts completely blank.

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, UserRound } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import {
  AddCardTile,
  EditableCard,
  type CardActionResult,
  type DraftValues,
  type EditableField,
} from '@/components/admin/EditableCard'
import { ReorderControls } from '../services/ServicesManager'
import { ADMIN_MSG, friendlyError } from '@/lib/admin/messages'
import {
  deleteTeamMember,
  reorderTeamMembers,
  saveTeamMember,
  setTeamMemberActive,
  uploadTeamMemberImage,
} from './team-actions'

// ─── Types shared with page.tsx ───────────────────────────────────────────────

export interface AdminTeamMember {
  id: string
  name: string
  role: string
  /** Raw DB value — needed to tell "no photo" from "photo present". */
  photoUrl: string | null
  /** Resolved URL for <Image>. */
  photoPublicUrl: string
  phone: string | null
  isActive: boolean
  sortOrder: number
}

interface TeamGridProps {
  members: AdminTeamMember[]
  /** §24: the read failed — this must NOT render as "no team members". */
  loadFailed?: boolean
  supabaseReady: boolean
}

// ─── Field descriptors ────────────────────────────────────────────────────────

const FIELDS: EditableField[] = [
  {
    name: 'name',
    label: 'नाम',
    kind: 'text',
    required: true,
    // 120 mirrors the zod cap in team-actions.ts; the column itself is `text`.
    maxLength: 120,
    placeholder: 'जैसे: राजेश कुमार',
    focusFirst: true,
  },
  {
    name: 'role',
    label: 'पद / काम',
    kind: 'text',
    maxLength: 120,
    placeholder: 'जैसे: वरिष्ठ डेकोरेटर',
    help: 'वेबसाइट के टीम कार्ड पर नाम के नीचे दिखेगा',
  },
  {
    name: 'phone',
    label: 'फ़ोन नंबर (सिर्फ़ आपके लिए)',
    kind: 'text',
    maxLength: 20,
    placeholder: '+91 98765 43210',
    // This is the honest description of the current security posture — see the
    // note in migration 0006. It is NOT selected by the public query.
    help: 'वेबसाइट पर नहीं दिखता — सिर्फ़ इस एडमिन पैनल में',
  },
]

function valuesOf(m: AdminTeamMember): DraftValues {
  return {
    name: m.name,
    role: m.role,
    phone: m.phone ?? '',
  }
}

const DRAFT_VALUES: DraftValues = { name: '', role: '', phone: '' }

// ─── Component ────────────────────────────────────────────────────────────────

export function TeamGrid({ members: input, loadFailed = false, supabaseReady }: TeamGridProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; title: string }>({
    open: false,
    type: 'success',
    title: '',
  })
  const [deleteTarget, setDeleteTarget] = useState<AdminTeamMember | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDraft, setShowDraft] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const members = useMemo(
    () => [...input].sort((a, b) => a.sortOrder - b.sortOrder),
    [input],
  )

  function notify(kind: 'ok' | 'error', text: string) {
    setToast({ open: true, type: kind === 'ok' ? 'success' : 'error', title: text })
  }

  /** Targeted server re-render — the owner keeps their scroll position. */
  function refresh() {
    startTransition(() => router.refresh())
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleSave(
    member: AdminTeamMember | null,
    values: DraftValues,
  ): Promise<CardActionResult> {
    const result = await saveTeamMember({
      id: member?.id,
      name: values.name,
      role: values.role,
      phone: values.phone,
    })

    if (result.ok) {
      if (!member) setShowDraft(false)
      refresh()
    }
    return result
  }

  async function handleUpload(member: AdminTeamMember, file: File): Promise<CardActionResult> {
    const fd = new FormData()
    fd.set('id', member.id)
    fd.set('file', file)
    const result = await uploadTeamMemberImage(fd)
    if (result.ok) refresh()
    return result
  }

  async function handleToggleActive(
    member: AdminTeamMember,
    next: boolean,
  ): Promise<CardActionResult> {
    const result = await setTeamMemberActive({ id: member.id, isActive: next })
    if (result.ok) refresh()
    return result
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= members.length) return

    const ids = members.map((m) => m.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    setReorderingId(members[index].id)
    const result = await reorderTeamMembers(ids)
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
    const result = await deleteTeamMember(deleteTarget.id)
    setDeleting(false)

    if (!result.ok) {
      notify('error', friendlyError(result.error, ADMIN_MSG.deleteFailed))
      return
    }
    // The card only disappears once the SERVER confirms the delete (§1: no
    // fake success).
    setDeleteTarget(null)
    notify('ok', ADMIN_MSG.deleted)
    refresh()
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  // §24: a failed query outranks the empty state. "कोई टीम सदस्य नहीं" after a
  // network blip would invite the owner to re-add people who already exist.
  if (loadFailed) {
    return (
      <RetryableErrorState
        title="टीम की जानकारी लोड नहीं हो सकी"
        description="इंटरनेट या सर्वर की समस्या हो सकती है। यह खाली सूची नहीं है — फिर कोशिश करें।"
      />
    )
  }

  if (members.length === 0 && !showDraft) {
    return (
      <>
        <EmptyState
          title="अभी कोई टीम सदस्य नहीं है"
          description="पहला सदस्य जोड़ें — वह वेबसाइट के “हमारी टीम” हिस्से में दिखने लगेगा।"
          action={
            supabaseReady ? (
              <button
                type="button"
                onClick={() => setShowDraft(true)}
                className="font-devanagari min-h-[44px] rounded-xl bg-gradient-to-r from-gold-bright to-gold-warm px-5 text-sm font-bold text-bg-void"
              >
                + नया सदस्य जोड़ें
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
        {members.map((member, index) => (
          <EditableCard
            key={member.id}
            id={member.id}
            title={member.name}
            imageUrl={member.photoPublicUrl}
            imageAlt={member.photoUrl ? `${member.name} — महादेव डेकोरेशन` : ''}
            fallbackIcon="UserRound"
            fields={FIELDS}
            values={valuesOf(member)}
            isActive={member.isActive}
            // team_members has NO is_featured column — passing null tells the
            // card not to render a featured toggle that could never save.
            isFeatured={null}
            onSave={(values) => handleSave(member, values)}
            onUploadImage={(file) => handleUpload(member, file)}
            onToggleActive={(next) => handleToggleActive(member, next)}
            onRequestDelete={() => setDeleteTarget(member)}
            onNotify={notify}
            viewControls={
              <ReorderControls
                busy={reorderingId === member.id}
                canUp={index > 0}
                canDown={index < members.length - 1}
                onUp={() => void move(index, -1)}
                onDown={() => void move(index, 1)}
              />
            }
            preview={<TeamPreview member={member} />}
          />
        ))}

        {/* A LOCAL draft — nothing touches the database until Save. */}
        {showDraft && (
          <EditableCard
            id={null}
            isDraft
            title="नया सदस्य"
            imageUrl=""
            imageAlt=""
            fallbackIcon="UserRound"
            fields={FIELDS}
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
          <AddCardTile label="+ नया सदस्य जोड़ें" onClick={() => setShowDraft(true)} />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
        title="टीम सदस्य हटाएँ?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" वेबसाइट से हट जाएगा और उनकी फोटो भी मिट जाएगी। यह वापस नहीं आएगा। सिर्फ़ कुछ समय के लिए छिपाना है तो हटाने के बजाय “दिख रहा है” बंद कर दें।`
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
    </>
  )
}

// ─── View-mode preview (mirrors the public /about card) ───────────────────────

function TeamPreview({ member }: { member: AdminTeamMember }) {
  return (
    <div className="space-y-2">
      <h3 className="font-devanagari text-base font-semibold leading-snug text-champagne">
        {member.name}
      </h3>

      {member.role ? (
        <p className="font-devanagari text-sm text-gold-light">{member.role}</p>
      ) : (
        <p className="font-devanagari text-sm italic text-text-muted/60">पद नहीं लिखा गया</p>
      )}

      {member.phone && (
        <p className="flex items-center gap-1.5 text-xs text-text-muted">
          <Phone size={12} aria-hidden />
          <span className="font-mono">{member.phone}</span>
        </p>
      )}

      {!member.photoUrl && (
        <p className="flex items-center gap-1 text-[11px] text-text-muted/70">
          <UserRound size={11} aria-hidden />
          फोटो नहीं है — नाम का पहला अक्षर दिखेगा
        </p>
      )}
    </div>
  )
}

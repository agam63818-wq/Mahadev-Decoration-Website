'use client'

// ─── Package inclusions editor (PART 2 §9) ────────────────────────────────────
//
// The bullet list a customer reads on a package card ("मंडप सजावट", "100 फूल
// माला", …). Add, rename, delete and reorder — all inline, inside the card.
//
// THE REORDER DECISION
// The previous implementation was drag-and-drop ONLY, using HTML5 dragstart /
// drop. Those events do not fire on touch devices at all, so on the owner's
// phone the inclusion order was simply not editable. §9 requires ↑ ↓ controls
// as a real mechanism, so here they ARE the mechanism: two 40px buttons per
// row, no drag at all. Nothing is lost — drag was never usable where this app
// is actually used.
//
// THE STALE-ORDER PROBLEM
// Tapping ↓ five times quickly used to fire five overlapping
// `reorderPackageItems` calls; whichever finished last won, which was not
// necessarily the last one the owner pressed. Now the order is held locally,
// every tap updates it instantly, and a short debounce sends ONE coordinated
// write of the final list. A monotonic sequence number discards any response
// that is no longer the newest request.

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import { ADMIN_MSG, friendlyError } from '@/lib/admin/messages'
import {
  deletePackageItem,
  reorderPackageItems,
  savePackageItem,
} from './actions'

export interface AdminPackageItem {
  id: string
  label: string
  sortOrder: number
}

interface PackageItemsEditorProps {
  packageId: string
  items: AdminPackageItem[]
  onNotify: (kind: 'ok' | 'error', text: string) => void
  /** Targeted server refresh — never a full page reload (§14). */
  onChanged: () => void
}

/** How long to wait for more ↑ ↓ taps before writing the order. */
const REORDER_DEBOUNCE_MS = 600

export function PackageItemsEditor({
  packageId,
  items,
  onNotify,
  onChanged,
}: PackageItemsEditorProps) {
  // Local mirror so ↑ ↓ feel instant; the server is caught up by the debounce.
  const [order, setOrder] = useState<AdminPackageItem[]>(items)
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reorderSeq = useRef(0)
  /** True while the owner is mid-reorder, so incoming props must not stomp it. */
  const dirtyOrder = useRef(false)

  // §15: adopt fresh server data ONLY when there is no pending local reorder,
  // otherwise a background refresh would visibly undo the owner's taps.
  const itemsKey = items.map((i) => `${i.id}:${i.label}`).join('|')
  useEffect(() => {
    if (!dirtyOrder.current) setOrder(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey])

  useEffect(
    () => () => {
      if (reorderTimer.current) clearTimeout(reorderTimer.current)
    },
    [],
  )

  function queueReorder(next: AdminPackageItem[]) {
    setOrder(next)
    dirtyOrder.current = true

    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(() => {
      void flushReorder(next)
    }, REORDER_DEBOUNCE_MS)
  }

  async function flushReorder(next: AdminPackageItem[]) {
    const seq = ++reorderSeq.current
    setReordering(true)

    const result = await reorderPackageItems(next.map((i) => i.id))

    // A newer reorder was queued while this one was in flight — that one owns
    // the outcome, so this response is ignored entirely.
    if (seq !== reorderSeq.current) return

    setReordering(false)
    dirtyOrder.current = false

    if (!result.ok) {
      // Rollback: drop back to the server's order rather than leaving the UI
      // claiming an order the database does not have.
      setOrder(items)
      onNotify('error', friendlyError(result.error, ADMIN_MSG.orderFailed))
      return
    }
    onChanged()
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    queueReorder(next)
  }

  async function add() {
    const label = newLabel.trim()
    if (!label) {
      onNotify('error', 'पहले सेवा का नाम लिखें')
      return
    }
    if (adding) return

    setAdding(true)
    const result = await savePackageItem({ packageId, label })
    setAdding(false)

    if (!result.ok) {
      onNotify('error', friendlyError(result.error))
      return
    }
    setNewLabel('')
    onNotify('ok', 'सेवा जोड़ दी गई')
    onChanged()
  }

  async function saveEdit(item: AdminPackageItem) {
    const label = editingLabel.trim()
    if (!label) {
      onNotify('error', 'सेवा का नाम खाली नहीं हो सकता')
      return
    }
    if (label === item.label) {
      setEditingId(null)
      return
    }

    setSavingId(item.id)
    const result = await savePackageItem({ id: item.id, packageId, label })
    setSavingId(null)

    if (!result.ok) {
      // Stay in edit mode with the typed text intact so the owner can retry.
      onNotify('error', friendlyError(result.error))
      return
    }
    setEditingId(null)
    onNotify('ok', ADMIN_MSG.saved)
    onChanged()
  }

  async function remove(item: AdminPackageItem) {
    setSavingId(item.id)
    const result = await deletePackageItem(item.id)
    setSavingId(null)

    if (!result.ok) {
      onNotify('error', friendlyError(result.error, ADMIN_MSG.deleteFailed))
      return
    }
    setOrder((prev) => prev.filter((i) => i.id !== item.id))
    onNotify('ok', ADMIN_MSG.deleted)
    onChanged()
  }

  return (
    <div className="space-y-2 rounded-xl border border-gold/15 bg-bg-void/30 p-3">
      <div className="flex items-center justify-between">
        <p className="font-devanagari text-[11px] font-medium text-text-muted">
          इस पैकेज में क्या-क्या शामिल है
        </p>
        {reordering && (
          <span className="font-devanagari flex items-center gap-1 text-[11px] text-gold-light">
            <Loader2 size={11} className="animate-spin" aria-hidden />
            क्रम सेव हो रहा है
          </span>
        )}
      </div>

      {order.length === 0 && (
        <p className="font-devanagari py-2 text-xs italic text-text-muted/70">
          अभी कोई सेवा नहीं जोड़ी गई। नीचे लिखकर जोड़ें।
        </p>
      )}

      <ul className="space-y-1.5">
        {order.map((item, index) => {
          const busy = savingId === item.id
          const isEditing = editingId === item.id

          return (
            <li
              key={item.id}
              className="flex items-center gap-1.5 rounded-lg border border-gold/10 bg-bg-void/40 p-1.5"
            >
              {isEditing ? (
                <>
                  <input
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveEdit(item)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    aria-label="सेवा का नाम"
                    className="font-devanagari min-w-0 flex-1 rounded-lg border border-gold/30 bg-bg-void/60 px-2 py-1.5 text-xs text-text-primary focus:border-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void saveEdit(item)}
                    disabled={busy}
                    aria-label="सेवा सेव करें"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gold text-bg-void disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 size={13} className="animate-spin" aria-hidden />
                    ) : (
                      <Check size={13} aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={busy}
                    aria-label="रद्द करें"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gold/20 text-text-muted"
                  >
                    <X size={13} aria-hidden />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditingLabel(item.label)
                    }}
                    className="font-devanagari min-w-0 flex-1 truncate px-1 py-1.5 text-left text-xs text-text-primary transition hover:text-champagne"
                  >
                    <span className="text-gold-light">•</span> {item.label}
                  </button>

                  {/* §9: tap-based reorder — the only mechanism that works on
                      the phone this admin is actually used on. */}
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || busy}
                    aria-label="ऊपर ले जाएँ"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gold/15 text-text-muted transition hover:text-gold disabled:opacity-30"
                  >
                    <ArrowUp size={13} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1 || busy}
                    aria-label="नीचे ले जाएँ"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gold/15 text-text-muted transition hover:text-gold disabled:opacity-30"
                  >
                    <ArrowDown size={13} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    disabled={busy}
                    aria-label={`"${item.label}" हटाएँ`}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-floral-red/25 text-rose transition hover:bg-floral-red/10 disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 size={13} className="animate-spin" aria-hidden />
                    ) : (
                      <Trash2 size={13} aria-hidden />
                    )}
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex gap-1.5 pt-1">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void add()
            }
          }}
          placeholder="नई सेवा लिखें"
          aria-label="नई सेवा जोड़ें"
          className="font-devanagari min-w-0 flex-1 rounded-lg border border-gold/20 bg-bg-void/50 px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={adding}
          className="font-devanagari inline-flex min-h-[38px] flex-shrink-0 items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-3 text-xs font-semibold text-gold-light disabled:opacity-60"
        >
          {adding ? (
            <Loader2 size={13} className="animate-spin" aria-hidden />
          ) : (
            <Plus size={13} aria-hidden />
          )}
          जोड़ें
        </button>
      </div>
    </div>
  )
}

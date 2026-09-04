'use client'

// ─── Admin notification bell (PART 3 §9–§11, §13, §24–§26) ───────────────────
//
// Reads public.notifications with the BROWSER client, using the signed-in
// admin's own session. That is deliberate and is the security model (§13):
// the table's RLS policies require public.is_admin(), so the anon key alone
// returns nothing — a logged-out visitor, or a signed-in customer, gets zero
// rows from the same code. No service-role key is involved anywhere in this
// file, and none may ever be: this runs in the browser.
//
// §12: no Supabase Realtime subscription. The panel re-fetches when opened and
// on window focus, which matches how the owner actually uses it (he opens the
// bell; he does not leave a wall display running). Realtime is left unbuilt
// rather than half-built — see migration 0011 for the one-line path to add it.

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Loader2, RefreshCw, X, CheckCheck, ImageOff } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import { ADMIN_MSG } from '@/lib/admin/messages'
import type { NotificationRow } from '@/lib/supabase/database.types'

const PANEL_LIMIT = 20

interface AdminNotification {
  id: string
  bookingRequestId: string | null
  title: string
  message: string
  imageUrl: string
  isRead: boolean
  createdAt: string
}

/** "5 मिनट पहले" style relative time — no date library needed. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const seconds = Math.floor((Date.now() - then) / 1000)

  if (seconds < 60) return 'अभी'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} मिनट पहले`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} घंटे पहले`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} दिन पहले`
  return new Date(iso).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })
}

function mapRow(row: NotificationRow): AdminNotification {
  return {
    id: row.id,
    bookingRequestId: row.booking_request_id,
    title: row.title || 'नई सूचना',
    message: row.message || '',
    imageUrl: portfolioPublicUrl(row.image_url_snapshot ?? ''),
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AdminNotification[]>([])
  const [unread, setUnread] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  // Guards against an older in-flight fetch resolving after a newer one and
  // overwriting the fresher list (same stale-response problem as PART 2 §15).
  const fetchSeq = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      // Unconfigured is an honest failure, NOT "zero notifications" (§24) —
      // showing a 0 badge here would be a fabricated count.
      setFailed(true)
      setUnread(null)
      return
    }

    const seq = ++fetchSeq.current
    setLoading(true)

    const [listResult, countResult] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, type, booking_request_id, title, message, image_url_snapshot, is_read, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(PANEL_LIMIT),
      // head+exact = the server counts; no rows travel over the wire.
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false),
    ])

    if (seq !== fetchSeq.current) return // a newer load already landed
    setLoading(false)

    if (listResult.error || countResult.error) {
      console.error(
        '[notifications] load failed:',
        listResult.error?.message ?? countResult.error?.message,
      )
      setFailed(true)
      // §9: null, never 0 — the badge must not claim "all caught up" when we
      // simply do not know.
      setUnread(null)
      return
    }

    setFailed(false)
    setItems(((listResult.data ?? []) as unknown as NotificationRow[]).map(mapRow))
    setUnread(countResult.count ?? 0)
  }, [])

  // Initial badge fetch, plus a refresh when the tab regains focus (the owner
  // switching back from WhatsApp is the common case).
  useEffect(() => {
    void load()
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  // Fresh data every time the panel opens.
  useEffect(() => {
    if (open) void load()
  }, [open, load])

  // Close on outside tap / Escape. Both matter on mobile, where there is no
  // hover and the panel covers most of the screen.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  /**
   * §10: persist read state, then reflect it. Optimistic with rollback — the
   * row is marked read locally so the tap feels instant, and restored exactly
   * if the write fails (§1 rule 5: no fake success).
   */
  async function markRead(notification: AdminNotification) {
    if (notification.isRead) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    setItems((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    )
    setUnread((prev) => (prev == null ? prev : Math.max(0, prev - 1)))

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notification.id)

    if (error) {
      console.error('[notifications] mark read failed:', error.message)
      // Rollback — the badge must keep matching the database.
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: false } : n)),
      )
      setUnread((prev) => (prev == null ? prev : prev + 1))
    }
  }

  /**
   * §10: scoped to unread rows only. RLS restricts this to notifications this
   * admin may touch, so there is no cross-tenant concern.
   */
  async function markAllRead() {
    const supabase = getSupabaseBrowserClient()
    if (!supabase || markingAll) return

    setMarkingAll(true)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false)
    setMarkingAll(false)

    if (error) {
      console.error('[notifications] mark all read failed:', error.message)
      return
    }
    // Re-read rather than assume, so the badge reflects the real DB state.
    await load()
  }

  // §9: only a real, non-zero count renders a badge.
  const showBadge = unread != null && unread > 0
  const badgeText = unread != null && unread > 99 ? '99+' : String(unread ?? '')

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          failed
            ? 'सूचनाएँ — लोड नहीं हो सकीं'
            : showBadge
              ? `सूचनाएँ — ${unread} नई`
              : 'सूचनाएँ — कोई नई नहीं'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-bg-rich/60 text-gold transition-all hover:bg-gold/10 focus:outline-none focus:ring-2 focus:ring-gold/60 active:scale-95"
      >
        <Bell size={18} aria-hidden />

        {showBadge && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-floral-red px-1 text-[10px] font-bold text-white">
            {badgeText}
          </span>
        )}

        {/* A failed count is shown as a neutral dot, never as a number. */}
        {failed && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-text-muted"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="सूचनाएँ"
          /*
            §25: on phones this is pinned to the viewport with `fixed` and a
            width capped by `calc(100vw-2rem)`, so it cannot cause horizontal
            overflow no matter how narrow the screen. On >=sm it becomes a
            normal dropdown anchored to the bell.
          */
          className="fixed inset-x-4 top-16 z-50 max-h-[70vh] w-auto overflow-hidden rounded-2xl border border-gold/25 bg-bg-purple shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gold/15 px-4 py-3">
            <h2 className="font-devanagari text-sm font-semibold text-champagne">सूचनाएँ</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                aria-label="फिर लोड करें"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:text-gold disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden />
                ) : (
                  <RefreshCw size={15} aria-hidden />
                )}
              </button>
              {showBadge && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  disabled={markingAll}
                  aria-label="सभी को पढ़ा हुआ मार्क करें"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:text-gold disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                  ) : (
                    <CheckCheck size={15} aria-hidden />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="बंद करें"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:text-gold"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(70vh-3.25rem)] overflow-y-auto overscroll-contain">
            {/* §24: three distinct states — error, loading, empty. */}
            {failed ? (
              <div className="px-4 py-8 text-center">
                <p className="font-devanagari text-sm text-text-primary">
                  {ADMIN_MSG.loadFailed}
                </p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="font-devanagari mt-3 min-h-[40px] rounded-xl border border-gold/30 px-4 text-sm text-gold transition hover:bg-gold/10"
                >
                  फिर कोशिश करें
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <div className="space-y-2 p-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-void/60" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-devanagari text-sm text-text-primary">कोई सूचना नहीं</p>
                <p className="font-devanagari mt-1 text-xs text-text-muted">
                  नई बुकिंग आने पर यहाँ दिखेगी।
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gold/10">
                {items.map((n) => (
                  <li key={n.id}>
                    <NotificationItem
                      notification={n}
                      onOpen={() => {
                        void markRead(n)
                        setOpen(false)
                      }}
                      onMarkRead={() => void markRead(n)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification,
  onOpen,
  onMarkRead,
}: {
  notification: AdminNotification
  onOpen: () => void
  onMarkRead: () => void
}) {
  const body = (
    <div
      className={`flex items-start gap-3 px-4 py-3 text-left transition ${
        notification.isRead ? 'bg-transparent' : 'bg-gold/[0.06]'
      }`}
    >
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gold/20 bg-bg-void">
        {notification.imageUrl ? (
          <Image
            src={notification.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted/60">
            <ImageOff size={14} aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`font-devanagari text-sm leading-snug ${
            notification.isRead ? 'text-text-muted' : 'font-semibold text-champagne'
          }`}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="font-devanagari mt-0.5 break-words text-xs text-text-muted">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-[10px] text-text-muted/70">{relativeTime(notification.createdAt)}</p>
      </div>

      {!notification.isRead && (
        <span
          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold"
          aria-label="अपठित"
        />
      )}
    </div>
  )

  /*
   * §11: deep link to the project's ACTUAL admin booking route. /admin/bookings
   * is a list with a detail modal rather than a per-id route, so the link
   * carries ?ref= and the list focuses that row — inventing /admin/bookings/[id]
   * would mean building a route that does not exist.
   *
   * When booking_request_id is null (the referenced booking was deleted — the
   * FK cascades, but a non-booking notification type may legitimately have no
   * link) we render a plain button that only marks read, instead of a link to
   * nowhere.
   */
  if (!notification.bookingRequestId) {
    return (
      <button type="button" onClick={onMarkRead} className="block w-full">
        {body}
      </button>
    )
  }

  return (
    <Link
      href={`/admin/bookings?ref=${encodeURIComponent(notification.bookingRequestId)}`}
      onClick={onOpen}
      className="block"
    >
      {body}
    </Link>
  )
}

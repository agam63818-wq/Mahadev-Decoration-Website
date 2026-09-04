// ─── Payment / booking status vocabulary ──────────────────────────────────────
// `payments.status` and `bookings.status` are free-text columns written by
// Razorpay callbacks AND by manual admin entry, so the same real-world state
// arrives under several spellings. Every admin aggregate must group them the
// SAME way, otherwise the dashboard total and the payments-page total disagree.
//
// This module is the single source of truth for that grouping. Keep it in sync
// with the comment block at the top of
// supabase/migrations/0008_admin_reporting_access.sql.

/** Money that has actually arrived. Only these count toward revenue. */
export const RECEIVED_STATUSES = [
  'captured',
  'completed',
  'success',
  'succeeded',
  'paid',
  'settled',
] as const

/** Money still expected — an initiated but unfinished payment. */
export const PENDING_STATUSES = ['created', 'pending', 'authorized', 'attempted'] as const

/** Money that never arrived. NEVER added to received (§3/§4). */
export const FAILED_STATUSES = ['failed', 'error', 'cancelled', 'canceled'] as const

/** Money that arrived and was given back. Subtracted, never ignored. */
export const REFUNDED_STATUSES = ['refunded', 'refund', 'reversed'] as const

export type PaymentBucket = 'received' | 'pending' | 'failed' | 'refunded' | 'other'

/**
 * Classify a raw status string into exactly ONE bucket.
 *
 * An unrecognised status returns 'other' and is deliberately excluded from
 * every money total rather than being optimistically counted as received —
 * inflating revenue is the worst possible failure mode here.
 */
export function classifyPaymentStatus(status: string | null | undefined): PaymentBucket {
  if (!status) return 'other'
  const s = status.trim().toLowerCase()
  if ((RECEIVED_STATUSES as readonly string[]).includes(s)) return 'received'
  if ((PENDING_STATUSES as readonly string[]).includes(s)) return 'pending'
  if ((FAILED_STATUSES as readonly string[]).includes(s)) return 'failed'
  if ((REFUNDED_STATUSES as readonly string[]).includes(s)) return 'refunded'
  return 'other'
}

// ─── Booking statuses ─────────────────────────────────────────────────────────

/** Booking states that represent real, committed work. */
export const CONFIRMED_BOOKING_STATUSES = [
  'confirmed',
  'in_progress',
  'in-progress',
  'completed',
  'done',
] as const

/** Booking states that are cancelled — excluded from revenue entirely (§3). */
export const CANCELLED_BOOKING_STATUSES = ['cancelled', 'canceled', 'rejected'] as const

/** Booking states still awaiting a decision. */
export const PENDING_BOOKING_STATUSES = [
  'inquiry',
  'pending',
  'pending_review',
  'quoted',
] as const

export function isConfirmedBooking(status: string | null | undefined): boolean {
  if (!status) return false
  return (CONFIRMED_BOOKING_STATUSES as readonly string[]).includes(status.trim().toLowerCase())
}

export function isCancelledBooking(status: string | null | undefined): boolean {
  if (!status) return false
  return (CANCELLED_BOOKING_STATUSES as readonly string[]).includes(status.trim().toLowerCase())
}

export function isPendingBooking(status: string | null | undefined): boolean {
  if (!status) return false
  return (PENDING_BOOKING_STATUSES as readonly string[]).includes(status.trim().toLowerCase())
}

/** Hindi labels for the admin UI. Unknown statuses show their raw value. */
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  inquiry: 'पूछताछ',
  pending: 'लंबित',
  pending_review: 'नई रिक्वेस्ट',
  quoted: 'कोटेशन भेजा',
  confirmed: 'कॉन्फर्म',
  in_progress: 'चल रहा है',
  'in-progress': 'चल रहा है',
  completed: 'पूर्ण',
  done: 'पूर्ण',
  cancelled: 'रद्द',
  canceled: 'रद्द',
  rejected: 'अस्वीकृत',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentBucket, string> = {
  received: 'प्राप्त',
  pending: 'लंबित',
  failed: 'विफल',
  refunded: 'रिफंड',
  other: 'अन्य',
}

/** ₹ formatting used by every admin money figure, so they always match. */
export function formatRupees(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0
  return `₹${Math.round(safe).toLocaleString('en-IN')}`
}

/**
 * `YYYY-MM-DD` for a Date — matches how DATE columns compare in PostgREST.
 *
 * Lives here rather than in services/admin-reporting.ts because it is a pure
 * function needed by BOTH the server aggregates and the calendar Client
 * Component. services/admin-reporting.ts imports lib/supabase/server.ts, which
 * imports next/headers, so a Client Component cannot import from it at all —
 * not even for a helper this small.
 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

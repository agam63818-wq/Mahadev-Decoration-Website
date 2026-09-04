import { getSupabaseReadClient } from '@/lib/supabase/server'
import type {
  BookingRow,
  BookingRequestRow,
  CustomerRow,
  PaymentRow,
} from '@/lib/supabase/database.types'
import {
  classifyPaymentStatus,
  isCancelledBooking,
  isConfirmedBooking,
  isPendingBooking,
  toDateKey,
} from '@/lib/admin/payment-status'
import {
  dataError,
  dataOk,
  logQueryFailure,
  SUPABASE_UNCONFIGURED,
  type DataResult,
} from './result'

// ─── Admin reporting service ──────────────────────────────────────────────────
// Every number on /admin (dashboard), /admin/payments, /admin/analytics,
// /admin/customers and /admin/calendar comes from here. Before this module all
// five screens rendered hardcoded arrays — invented customer names, invented
// revenue, invented growth percentages.
//
// RULES ENCODED HERE (from the brief):
//  §3  Cancelled bookings are NEVER counted as revenue.
//  §4  Failed payments are NEVER counted as received. Refunds are subtracted.
//  §3  A trend/growth figure is only produced when there is enough history to
//      compute it honestly; otherwise the caller receives `null` and shows
//      "डेटा पर्याप्त नहीं" instead of an invented "+18%".
//  §3  No N+1 queries: each screen issues a small fixed set of queries and
//      aggregates in one pass. Counts that don't need rows use PostgREST's
//      head+exact count so no payload is transferred at all.
//  §2  A failed query returns DataResult.ok === false — no fake fallback.

// ─── Date helpers (all in the server's local timezone, consistently) ─────────
// `toDateKey` lives in lib/admin/payment-status.ts so Client Components can use
// it too — this module pulls in next/headers and is server-only.

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1)
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

// ─── Shared column lists ──────────────────────────────────────────────────────
// Deliberately narrow. PostgREST fails the WHOLE request on an unknown column,
// and these tables have documented live-schema divergences, so every column
// below is one that the corresponding Row type declares.

const PAYMENT_COLUMNS =
  'id, booking_id, customer_id, razorpay_order_id, razorpay_payment_id, payment_type, amount, status, created_at'

const BOOKING_COLUMNS =
  'id, customer_id, event_type, event_date, event_time, location, occasion_name, status, advance_paid, total_quote, decoration_area_sqft, is_urgent, created_at'

const REQUEST_COLUMNS =
  'id, reference_number, status, event_type, event_date, city, area, contact_name, contact_phone, created_at'

const CUSTOMER_COLUMNS = 'id, name, phone, whatsapp, email, created_at'

// ─── Types exposed to the admin pages ─────────────────────────────────────────

export interface PaymentTotals {
  received: number
  pending: number
  failed: number
  refunded: number
  /** received − refunded: the money actually kept. */
  net: number
  count: number
}

export interface AdminPayment {
  id: string
  bookingId: string | null
  customerId: string | null
  customerName: string
  amount: number
  /** Razorpay id when present, else '—'. Never invented. */
  reference: string
  method: string
  status: string
  bucket: ReturnType<typeof classifyPaymentStatus>
  createdAt: string
}

export interface DashboardMetrics {
  todayEvents: number
  upcomingEvents: number
  pendingInquiries: number
  confirmedBookings: number
  totalRevenue: number
  advanceReceived: number
  pendingPayments: number
  /**
   * Month-over-month revenue growth as a percentage, or null when there is
   * not enough history to state one honestly (no prior-month revenue at all).
   */
  monthlyGrowthPercent: number | null
  /** How many complete prior months of payment history exist. */
  historyMonths: number
}

export interface RecentBooking {
  id: string
  customerName: string
  eventType: string
  eventDate: string | null
  status: string
  total: number | null
}

export interface AdminCustomer {
  id: string
  name: string
  phone: string
  whatsapp: string
  email: string
  createdAt: string
  bookingCount: number
  totalSpent: number
  /**
   * Event date of this customer's most recent non-cancelled booking, or null
   * when they have never booked. Null renders as '—', never as a placeholder
   * date.
   */
  lastBookingDate: string | null
}

export interface CalendarEventRecord {
  id: string
  title: string
  eventType: string
  customerName: string
  location: string
  /** `YYYY-MM-DD`. */
  date: string
  time: string | null
  status: string
  /** Real sqft from the booking, or null. Never a placeholder like "200 sqft". */
  decorationAreaSqft: number | null
  /** 'booking' = confirmed job, 'request' = unconverted inquiry. */
  source: 'booking' | 'request'
}

export interface MonthlyPoint {
  /** `YYYY-MM`. */
  month: string
  label: string
  bookings: number
  revenue: number
}

/**
 * The four headline ratios on /admin/analytics.
 *
 * EVERY field is nullable, and null means "this cannot be stated honestly from
 * the data we have" — not zero. The page renders "डेटा पर्याप्त नहीं" for
 * null rather than an invented figure (§3). These replace the hardcoded
 * "78% / 22% / 4.7 / 12%" that the screen used to display.
 */
export interface AnalyticsKeyMetrics {
  /** Confirmed bookings as a % of all inquiries received in the window. */
  conversionRate: number | null
  /** % of booking customers who have booked more than once. */
  repeatCustomerRate: number | null
  /** Mean approved review rating, 1–5, one decimal. */
  averageRating: number | null
  /** Pending money as a % of (received + pending). */
  pendingPaymentRate: number | null
}

export interface AnalyticsData {
  monthly: MonthlyPoint[]
  /** Real per-type counts (NOT percentages) — the page derives shares itself. */
  eventTypeBreakdown: Array<{ eventType: string; count: number }>
  paymentTotals: PaymentTotals
  keyMetrics: AnalyticsKeyMetrics
  /** Non-cancelled bookings created inside the window. */
  totalBookings: number
  /** True when there are at least two months of data to compare. */
  hasComparableHistory: boolean
}

const MONTH_LABELS_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्तूबर', 'नवंबर', 'दिसंबर',
]

function monthLabel(d: Date): string {
  return `${MONTH_LABELS_HI[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

// ─── Aggregation helpers ──────────────────────────────────────────────────────

function safeAmount(value: number | null | undefined): number {
  if (value == null) return 0
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Bucket a list of payment rows into totals.
 * Failed payments contribute ONLY to `failed`; refunds are subtracted from
 * `net` but retained in `refunded` so the admin can see them.
 */
export function totalPayments(rows: PaymentRow[]): PaymentTotals {
  const totals: PaymentTotals = {
    received: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    net: 0,
    count: rows.length,
  }

  for (const row of rows) {
    const amount = safeAmount(row.amount)
    switch (classifyPaymentStatus(row.status)) {
      case 'received':
        totals.received += amount
        break
      case 'pending':
        totals.pending += amount
        break
      case 'failed':
        totals.failed += amount
        break
      case 'refunded':
        totals.refunded += amount
        break
      default:
        // 'other' — an unrecognised status. Counted nowhere on purpose.
        break
    }
  }

  totals.net = totals.received - totals.refunded
  return totals
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Full payment list plus totals. One query, no N+1: customer names are pulled
 * in a single follow-up `in(...)` lookup rather than per row.
 */
export async function getAdminPayments(): Promise<
  DataResult<{ payments: AdminPayment[]; totals: PaymentTotals }>
> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('admin-payments', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    logQueryFailure('admin-payments', error.message)
    return dataError(error.message)
  }

  const rows = (data as unknown as PaymentRow[] | null) ?? []
  const totals = totalPayments(rows)

  // Resolve customer names in ONE extra query for all distinct ids.
  const customerIds = Array.from(
    new Set(rows.map((r) => r.customer_id).filter((id): id is string => Boolean(id))),
  )

  const nameById = new Map<string, string>()
  if (customerIds.length > 0) {
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name')
      .in('id', customerIds)

    // A failed name lookup must not blank out the money figures — the payment
    // rows are already correct, so names simply fall back to '—'.
    if (custError) logQueryFailure('admin-payments/customers', custError.message)
    for (const c of (customers as unknown as Array<{ id: string; name: string | null }> | null) ??
      []) {
      if (c.name) nameById.set(c.id, c.name)
    }
  }

  const payments: AdminPayment[] = rows.map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    customerId: row.customer_id,
    customerName: (row.customer_id && nameById.get(row.customer_id)) || '—',
    amount: safeAmount(row.amount),
    reference: row.razorpay_payment_id || row.razorpay_order_id || '—',
    method: row.payment_type || '—',
    status: row.status || 'unknown',
    bucket: classifyPaymentStatus(row.status),
    createdAt: row.created_at,
  }))

  return dataOk({ payments, totals })
}

/**
 * Every headline number on the admin dashboard.
 *
 * Query plan (6 queries, all bounded — no per-row follow-ups):
 *   1. count of bookings with event_date = today
 *   2. count of bookings with event_date in (today, today+7]
 *   3. count of pending booking_requests
 *   4. count of confirmed bookings
 *   5. bookings needed for advance/quote sums (non-cancelled only)
 *   6. payments from the start of last month (for revenue + growth)
 */
export async function getDashboardMetrics(): Promise<DataResult<DashboardMetrics>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('admin-dashboard', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const now = new Date()
  const todayKey = toDateKey(now)
  const weekAheadKey = toDateKey(addDays(now, 7))
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = addMonths(thisMonthStart, -1)

  const [
    todayRes,
    upcomingRes,
    inquiriesRes,
    bookingsRes,
    paymentsRes,
  ] = await Promise.all([
    // 1. Today's events — head-only count, zero payload.
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('event_date', todayKey),

    // 2. Next 7 days (exclusive of today, which is counted above).
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gt('event_date', todayKey)
      .lte('event_date', weekAheadKey),

    // 3. Unanswered inquiries.
    supabase.from('booking_requests').select('id, status'),

    // 4/5. Booking rows for status counts + advance/quote sums.
    supabase.from('bookings').select('id, status, advance_paid, total_quote, event_date'),

    // 6. Payments since the start of LAST month, so this month and last month
    //    can both be summed for an honest growth figure.
    supabase
      .from('payments')
      .select('id, amount, status, created_at')
      .gte('created_at', lastMonthStart.toISOString()),
  ])

  // The dashboard is all-or-nothing: a partially-filled dashboard with some
  // real and some zero figures would be actively misleading.
  const firstError =
    todayRes.error || upcomingRes.error || inquiriesRes.error || bookingsRes.error ||
    paymentsRes.error
  if (firstError) {
    logQueryFailure('admin-dashboard', firstError.message)
    return dataError(firstError.message)
  }

  const requestRows =
    (inquiriesRes.data as unknown as Array<Pick<BookingRequestRow, 'id' | 'status'>> | null) ?? []
  const bookingRows =
    (bookingsRes.data as unknown as Array<
      Pick<BookingRow, 'id' | 'status' | 'advance_paid' | 'total_quote' | 'event_date'>
    > | null) ?? []
  const paymentRows =
    (paymentsRes.data as unknown as Array<
      Pick<PaymentRow, 'id' | 'amount' | 'status' | 'created_at'>
    > | null) ?? []

  const pendingInquiries = requestRows.filter((r) => isPendingBooking(r.status)).length
  const confirmedBookings = bookingRows.filter((b) => isConfirmedBooking(b.status)).length

  // Advance received / still outstanding — cancelled bookings excluded (§3).
  let advanceReceived = 0
  let pendingPayments = 0
  for (const b of bookingRows) {
    if (isCancelledBooking(b.status)) continue
    const advance = safeAmount(b.advance_paid)
    const quote = safeAmount(b.total_quote)
    advanceReceived += advance
    if (quote > advance) pendingPayments += quote - advance
  }

  // Revenue = money actually received this month, minus refunds.
  const thisMonthPayments = paymentRows.filter(
    (p) => new Date(p.created_at) >= thisMonthStart,
  ) as PaymentRow[]
  const lastMonthPayments = paymentRows.filter((p) => {
    const d = new Date(p.created_at)
    return d >= lastMonthStart && d < thisMonthStart
  }) as PaymentRow[]

  const thisMonthTotals = totalPayments(thisMonthPayments)
  const lastMonthTotals = totalPayments(lastMonthPayments)

  // §3: only state a growth % when last month actually had revenue to grow
  // from. "+100%" from a ₹0 base, or any figure with no history, is invented.
  const monthlyGrowthPercent =
    lastMonthTotals.net > 0
      ? Math.round(((thisMonthTotals.net - lastMonthTotals.net) / lastMonthTotals.net) * 100)
      : null

  return dataOk({
    todayEvents: todayRes.count ?? 0,
    upcomingEvents: upcomingRes.count ?? 0,
    pendingInquiries,
    confirmedBookings,
    totalRevenue: thisMonthTotals.net,
    advanceReceived,
    pendingPayments,
    monthlyGrowthPercent,
    historyMonths: lastMonthPayments.length > 0 ? 1 : 0,
  })
}

/** The newest bookings for the dashboard preview table. */
export async function getRecentBookings(limit = 5): Promise<DataResult<RecentBooking[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('admin-recent-bookings', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logQueryFailure('admin-recent-bookings', error.message)
    return dataError(error.message)
  }

  const rows = (data as unknown as BookingRow[] | null) ?? []

  // Names in one extra query, not one per row.
  const ids = Array.from(
    new Set(rows.map((r) => r.customer_id).filter((id): id is string => Boolean(id))),
  )
  const nameById = new Map<string, string>()
  if (ids.length > 0) {
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name')
      .in('id', ids)
    if (custError) logQueryFailure('admin-recent-bookings/customers', custError.message)
    for (const c of (customers as unknown as Array<{ id: string; name: string | null }> | null) ??
      []) {
      if (c.name) nameById.set(c.id, c.name)
    }
  }

  return dataOk(
    rows.map((row) => ({
      id: row.id,
      customerName: (row.customer_id && nameById.get(row.customer_id)) || '—',
      eventType: row.event_type || '—',
      eventDate: row.event_date,
      status: row.status || 'unknown',
      total: row.total_quote != null ? safeAmount(row.total_quote) : null,
    })),
  )
}

/** Customer list with real booking counts and real spend. */
export async function getAdminCustomers(): Promise<
  DataResult<{ customers: AdminCustomer[]; newThisMonth: number }>
> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('admin-customers', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const [customersRes, bookingsRes, paymentsRes] = await Promise.all([
    supabase.from('customers').select(CUSTOMER_COLUMNS).order('created_at', { ascending: false }),
    supabase.from('bookings').select('id, customer_id, status, event_date'),
    supabase.from('payments').select('id, customer_id, amount, status'),
  ])

  if (customersRes.error) {
    logQueryFailure('admin-customers', customersRes.error.message)
    return dataError(customersRes.error.message)
  }
  // Booking/payment roll-ups are enrichment: log a failure but still show the
  // real customer list with 0s rather than failing the whole screen.
  if (bookingsRes.error) logQueryFailure('admin-customers/bookings', bookingsRes.error.message)
  if (paymentsRes.error) logQueryFailure('admin-customers/payments', paymentsRes.error.message)

  const customerRows = (customersRes.data as unknown as CustomerRow[] | null) ?? []

  const bookingCount = new Map<string, number>()
  const lastBookingById = new Map<string, string>()
  for (const b of (bookingsRes.data as unknown as Array<
    Pick<BookingRow, 'id' | 'customer_id' | 'status' | 'event_date'>
  > | null) ?? []) {
    // Cancelled bookings are not achievements — excluded from the count.
    if (!b.customer_id || isCancelledBooking(b.status)) continue
    bookingCount.set(b.customer_id, (bookingCount.get(b.customer_id) ?? 0) + 1)
    if (b.event_date) {
      const date = b.event_date.slice(0, 10)
      const current = lastBookingById.get(b.customer_id)
      // ISO dates compare correctly as strings.
      if (!current || date > current) lastBookingById.set(b.customer_id, date)
    }
  }

  const spendById = new Map<string, number>()
  for (const p of (paymentsRes.data as unknown as Array<
    Pick<PaymentRow, 'id' | 'customer_id' | 'amount' | 'status'>
  > | null) ?? []) {
    if (!p.customer_id) continue
    const bucket = classifyPaymentStatus(p.status)
    if (bucket === 'received') {
      spendById.set(p.customer_id, (spendById.get(p.customer_id) ?? 0) + safeAmount(p.amount))
    } else if (bucket === 'refunded') {
      spendById.set(p.customer_id, (spendById.get(p.customer_id) ?? 0) - safeAmount(p.amount))
    }
  }

  const monthStart = startOfMonth(new Date())
  let newThisMonth = 0

  const customers: AdminCustomer[] = customerRows.map((row) => {
    if (row.created_at && new Date(row.created_at) >= monthStart) newThisMonth += 1
    return {
      id: row.id,
      name: row.name || '—',
      phone: row.phone || '',
      whatsapp: row.whatsapp || '',
      email: row.email || '',
      createdAt: row.created_at,
      bookingCount: bookingCount.get(row.id) ?? 0,
      totalSpent: Math.max(0, spendById.get(row.id) ?? 0),
      lastBookingDate: lastBookingById.get(row.id) ?? null,
    }
  })

  return dataOk({ customers, newThisMonth })
}

/**
 * Calendar events, merged from confirmed bookings AND unconverted booking
 * requests, because both occupy a date the owner must plan around.
 */
export async function getCalendarEvents(): Promise<DataResult<CalendarEventRecord[]>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('admin-calendar', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const [bookingsRes, requestsRes] = await Promise.all([
    supabase.from('bookings').select(BOOKING_COLUMNS).not('event_date', 'is', null),
    supabase.from('booking_requests').select(REQUEST_COLUMNS).not('event_date', 'is', null),
  ])

  const firstError = bookingsRes.error || requestsRes.error
  if (firstError) {
    logQueryFailure('admin-calendar', firstError.message)
    return dataError(firstError.message)
  }

  const bookingRows = (bookingsRes.data as unknown as BookingRow[] | null) ?? []
  const requestRows = (requestsRes.data as unknown as BookingRequestRow[] | null) ?? []

  const ids = Array.from(
    new Set(bookingRows.map((r) => r.customer_id).filter((id): id is string => Boolean(id))),
  )
  const nameById = new Map<string, string>()
  if (ids.length > 0) {
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name')
      .in('id', ids)
    if (custError) logQueryFailure('admin-calendar/customers', custError.message)
    for (const c of (customers as unknown as Array<{ id: string; name: string | null }> | null) ??
      []) {
      if (c.name) nameById.set(c.id, c.name)
    }
  }

  const events: CalendarEventRecord[] = []

  for (const row of bookingRows) {
    if (!row.event_date) continue
    const customerName = (row.customer_id && nameById.get(row.customer_id)) || '—'
    events.push({
      id: row.id,
      // Title uses whatever the row actually has — never a fabricated
      // "वेडिंग शादी — रमेश और सीमा" style string.
      title: row.occasion_name || row.event_type || 'इवेंट',
      eventType: row.event_type || 'custom',
      customerName,
      location: row.location || '',
      date: row.event_date.slice(0, 10),
      time: row.event_time,
      status: row.status || 'unknown',
      decorationAreaSqft:
        row.decoration_area_sqft != null ? Number(row.decoration_area_sqft) : null,
      source: 'booking',
    })
  }

  // Requests that were already converted into a booking would double-count, so
  // skip any request whose date+contact matches an existing booking entry.
  const bookingKeys = new Set(events.map((e) => `${e.date}|${e.customerName}`))

  for (const row of requestRows) {
    if (!row.event_date) continue
    const date = row.event_date.slice(0, 10)
    const name = row.contact_name || '—'
    if (bookingKeys.has(`${date}|${name}`)) continue
    events.push({
      id: row.id,
      title: row.event_type || 'रिक्वेस्ट',
      eventType: row.event_type || 'custom',
      customerName: name,
      location: [row.area, row.city].filter(Boolean).join(', '),
      date,
      time: null,
      status: row.status || 'pending_review',
      // booking_requests carries no area figure — null, not a guess.
      decorationAreaSqft: null,
      source: 'request',
    })
  }

  events.sort((a, b) => a.date.localeCompare(b.date))
  return dataOk(events)
}

/**
 * Analytics: the last 6 months of real booking counts and real received
 * revenue, plus a real event-type breakdown.
 *
 * Months with no data are still emitted (with zeros) so the chart's x-axis is
 * continuous — but `hasComparableHistory` tells the page whether it may draw
 * comparisons at all, so it can show "डेटा पर्याप्त नहीं" instead of a
 * meaningless trend.
 */
export async function getAnalytics(monthsBack = 6): Promise<DataResult<AnalyticsData>> {
  const supabase = getSupabaseReadClient()
  if (!supabase) {
    logQueryFailure('admin-analytics', SUPABASE_UNCONFIGURED)
    return dataError(SUPABASE_UNCONFIGURED)
  }

  const now = new Date()
  const windowStart = addMonths(startOfMonth(now), -(monthsBack - 1))

  const [bookingsRes, paymentsRes, requestsRes, reviewsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, customer_id, event_type, status, created_at')
      .gte('created_at', windowStart.toISOString()),
    supabase
      .from('payments')
      .select('id, amount, status, created_at')
      .gte('created_at', windowStart.toISOString()),
    // For the real inquiry → booking conversion rate.
    supabase
      .from('booking_requests')
      .select('id, status', { count: 'exact' })
      .gte('created_at', windowStart.toISOString()),
    // For the real average rating. Not windowed — a rating average over all
    // approved reviews is the figure the owner actually cares about.
    supabase.from('reviews').select('rating').eq('approved', true),
  ])

  // Bookings and payments drive the charts — losing either makes the screen
  // meaningless, so those are fatal.
  const firstError = bookingsRes.error || paymentsRes.error
  if (firstError) {
    logQueryFailure('admin-analytics', firstError.message)
    return dataError(firstError.message)
  }
  // Requests and reviews only feed two of the four ratios. If they fail, those
  // ratios become null ("डेटा पर्याप्त नहीं") while the charts still render.
  if (requestsRes.error) logQueryFailure('admin-analytics/requests', requestsRes.error.message)
  if (reviewsRes.error) logQueryFailure('admin-analytics/reviews', reviewsRes.error.message)

  const bookingRows =
    (bookingsRes.data as unknown as Array<
      Pick<BookingRow, 'id' | 'customer_id' | 'event_type' | 'status' | 'created_at'>
    > | null) ?? []
  const paymentRows =
    (paymentsRes.data as unknown as Array<
      Pick<PaymentRow, 'id' | 'amount' | 'status' | 'created_at'>
    > | null) ?? []
  const requestRows = requestsRes.error
    ? []
    : ((requestsRes.data as unknown as Array<Pick<BookingRequestRow, 'id' | 'status'>> | null) ?? [])
  const ratingRows = reviewsRes.error
    ? []
    : ((reviewsRes.data as unknown as Array<{ rating: number | null }> | null) ?? [])

  // Build a continuous month axis.
  const monthly: MonthlyPoint[] = []
  const indexByMonth = new Map<string, number>()
  for (let i = 0; i < monthsBack; i += 1) {
    const d = addMonths(windowStart, i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    indexByMonth.set(key, monthly.length)
    monthly.push({ month: key, label: monthLabel(d), bookings: 0, revenue: 0 })
  }

  const monthKeyOf = (iso: string): string => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const eventTypeCount = new Map<string, number>()
  const bookingsPerCustomer = new Map<string, number>()
  let totalBookings = 0
  let confirmedBookings = 0

  for (const b of bookingRows) {
    // Cancelled bookings are not business won — excluded from both the trend
    // line and the event-type mix.
    if (isCancelledBooking(b.status)) continue
    totalBookings += 1
    if (isConfirmedBooking(b.status)) confirmedBookings += 1
    const idx = indexByMonth.get(monthKeyOf(b.created_at))
    if (idx != null) monthly[idx].bookings += 1
    const type = b.event_type || 'custom'
    eventTypeCount.set(type, (eventTypeCount.get(type) ?? 0) + 1)
    if (b.customer_id) {
      bookingsPerCustomer.set(b.customer_id, (bookingsPerCustomer.get(b.customer_id) ?? 0) + 1)
    }
  }

  for (const p of paymentRows) {
    const idx = indexByMonth.get(monthKeyOf(p.created_at))
    if (idx == null) continue
    const bucket = classifyPaymentStatus(p.status)
    if (bucket === 'received') monthly[idx].revenue += safeAmount(p.amount)
    else if (bucket === 'refunded') monthly[idx].revenue -= safeAmount(p.amount)
  }

  for (const point of monthly) point.revenue = Math.max(0, point.revenue)

  const eventTypeBreakdown = Array.from(eventTypeCount.entries())
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)

  // "Comparable" means at least two DIFFERENT months carry data. One month of
  // history cannot support a month-over-month statement.
  const monthsWithData = monthly.filter((m) => m.bookings > 0 || m.revenue > 0).length

  const paymentTotals = totalPayments(paymentRows as PaymentRow[])

  // ── Key ratios: each one is null unless its denominator is real ────────────

  // Inquiries = every request received in the window. Conversion compares that
  // against bookings that actually reached a confirmed state.
  const inquiryCount = requestsRes.count ?? requestRows.length
  const conversionRate =
    inquiryCount > 0
      ? // Capped at 100: bookings can also arrive without a web request (walk-in
        // or phone), which would otherwise produce a nonsensical >100% rate.
        Math.min(100, Math.round((confirmedBookings / inquiryCount) * 100))
      : null

  const customersWithBookings = bookingsPerCustomer.size
  const repeatCustomers = Array.from(bookingsPerCustomer.values()).filter((n) => n > 1).length
  const repeatCustomerRate =
    customersWithBookings > 0
      ? Math.round((repeatCustomers / customersWithBookings) * 100)
      : null

  const validRatings = ratingRows
    .map((r) => Number(r.rating))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5)
  const averageRating =
    validRatings.length > 0
      ? Math.round((validRatings.reduce((s, n) => s + n, 0) / validRatings.length) * 10) / 10
      : null

  const paymentBase = paymentTotals.received + paymentTotals.pending
  const pendingPaymentRate =
    paymentBase > 0 ? Math.round((paymentTotals.pending / paymentBase) * 100) : null

  return dataOk({
    monthly,
    eventTypeBreakdown,
    paymentTotals,
    totalBookings,
    keyMetrics: {
      conversionRate,
      repeatCustomerRate,
      averageRating,
      pendingPaymentRate,
    },
    hasComparableHistory: monthsWithData >= 2,
  })
}

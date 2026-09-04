'use client'

import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import { formatRupees } from '@/lib/admin/payment-status'
import type { AnalyticsData } from '@/services/admin-reporting'

// Brand palette (mirrors tailwind.config.ts) — charts are inline-styled so they
// need literal colours, not utility class names.
const BRAND = {
  gold: '#C9A84C',
  goldLight: '#F0C868',
  champagne: '#F5E8D0',
  floralRed: '#8B1E3F',
  rose: '#C25B7C',
  emerald: '#34D399',
  emeraldDeep: '#059669',
} as const

/** Colour cycle for the category donut — assigned by rank, not hardcoded per type. */
const SEGMENT_COLORS = [
  BRAND.gold,
  BRAND.rose,
  BRAND.goldLight,
  BRAND.floralRed,
  BRAND.champagne,
  BRAND.emerald,
] as const

/** Hindi labels for known event types; unknown types show their raw value. */
const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'वेडिंग',
  birthday: 'बर्थडे',
  haldi: 'हल्दी',
  mehndi: 'मेहंदी',
  car: 'कार',
  stage: 'स्टेज',
  engagement: 'सगाई',
  anniversary: 'एनिवर्सरी',
  babyshower: 'बेबी शावर',
  custom: 'अन्य',
}

// Simple CSS-bar chart to avoid heavy deps.
function BarChart({
  data,
  from = BRAND.gold,
  to = BRAND.goldLight,
  height = 200,
  showValue = true,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number }[]
  from?: string
  to?: string
  height?: number
  showValue?: boolean
  format?: (v: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="flex items-end gap-1.5 sm:gap-2 min-w-[420px]" style={{ height }}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * 100 : 0
          return (
            <div key={i} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end">
              {showValue && (
                <span className="text-[10px] sm:text-xs text-champagne/80 font-devanagari mb-1 tabular-nums">
                  {format(d.value)}
                </span>
              )}
              <div
                className="w-full rounded-t-md shadow-[0_0_14px_rgba(201,168,76,0.25)] transition-[height] duration-700 ease-out"
                style={{
                  background: `linear-gradient(180deg, ${to} 0%, ${from} 100%)`,
                  height: `${h}%`,
                  minHeight: h > 0 ? '4px' : '0',
                }}
              />
              <span className="mt-2 text-[10px] sm:text-xs text-text-muted font-devanagari text-center truncate w-full">
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Donut chart using stroke-dasharray / dashoffset (legend lives beside it).
function PieChartSimple({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[]
  centerValue: string
  centerLabel: string
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const R = 40
  const C = 2 * Math.PI * R
  let consumed = 0
  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth="14" />
        {segments.map((seg, i) => {
          const len = total > 0 ? (seg.value / total) * C : 0
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`}
              strokeDashoffset={-consumed}
              className="transition-all duration-500"
            />
          )
          consumed += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Centre shows the real total count, not a hardcoded "100%". */}
        <span className="text-2xl font-display font-bold text-gold leading-none">{centerValue}</span>
        <span className="text-[10px] text-text-muted font-devanagari mt-1">{centerLabel}</span>
      </div>
    </div>
  )
}

const NO_DATA = 'डेटा पर्याप्त नहीं'

interface AnalyticsClientProps {
  data: AnalyticsData | null
  hasError: boolean
}

export function AnalyticsClient({ data, hasError }: AnalyticsClientProps) {
  const header = (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-gold font-devanagari">
          एनालिटिक्स डैशबोर्ड
        </h1>
        {/* The monthly/quarterly toggle is gone: it never changed the data, it
            only re-rendered the same invented arrays. It returns in a later
            part when a real quarterly aggregate exists to switch to. */}
        <Badge variant="default">
          <Calendar size={12} /> पिछले 6 माह
        </Badge>
      </div>
    </div>
  )

  if (hasError || !data) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {header}
        <RetryableErrorState
          title="एनालिटिक्स डेटा लोड नहीं हो सका"
          description="कृपया फिर कोशिश करें"
        />
      </motion.div>
    )
  }

  const { monthly, eventTypeBreakdown, paymentTotals, keyMetrics, totalBookings } = data

  const bookingSeries = monthly.map((m) => ({ label: m.label, value: m.bookings }))
  const revenueSeries = monthly.map((m) => ({ label: m.label, value: m.revenue }))

  const monthsWithBookings = monthly.filter((m) => m.bookings > 0).length
  // Average over months that actually have data — dividing by 6 when only one
  // month has any bookings would understate the real average.
  const avgBooking = monthsWithBookings > 0 ? Math.round(totalBookings / monthsWithBookings) : 0

  const revenueMonths = monthly.filter((m) => m.revenue > 0)
  const avgRevenue =
    revenueMonths.length > 0
      ? Math.round(revenueMonths.reduce((s, m) => s + m.revenue, 0) / revenueMonths.length)
      : 0

  // Month-over-month booking growth, only when two consecutive months qualify.
  const last = monthly[monthly.length - 1]
  const prev = monthly[monthly.length - 2]
  const monthlyGrowth =
    prev && prev.bookings > 0 && last
      ? Math.round(((last.bookings - prev.bookings) / prev.bookings) * 100)
      : null

  const hasAnyData = totalBookings > 0 || paymentTotals.count > 0

  const topStats: Array<{
    label: string
    value: string
    icon: typeof Calendar
    color: string
    trend: number | null
  }> = [
    {
      label: 'कुल बुकिंग्स',
      value: String(totalBookings),
      icon: Calendar,
      color: 'from-gold to-gold-light',
      trend: null,
    },
    {
      label: 'कुल राजस्व',
      value: formatRupees(paymentTotals.net),
      icon: DollarSign,
      color: 'from-emerald-400 to-emerald-600',
      trend: null,
    },
    {
      label: 'औसत बुकिंग/माह',
      value: monthsWithBookings > 0 ? String(avgBooking) : '—',
      icon: Activity,
      color: 'from-champagne to-gold',
      trend: null,
    },
    {
      label: 'माहवार वृद्धि',
      value: monthlyGrowth != null ? `${monthlyGrowth}%` : '—',
      icon: monthlyGrowth != null && monthlyGrowth < 0 ? TrendingDown : TrendingUp,
      color: 'from-rose to-floral-red',
      trend: monthlyGrowth,
    },
  ]

  const segments = eventTypeBreakdown.slice(0, 6).map((seg, i) => ({
    label: EVENT_TYPE_LABELS[seg.eventType.toLowerCase()] ?? seg.eventType,
    value: seg.count,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  }))
  const segmentTotal = segments.reduce((s, seg) => s + seg.value, 0)

  const ratios: Array<{ label: string; value: string; icon: typeof Users }> = [
    {
      label: 'Inquiry → Booking रेट',
      value: keyMetrics.conversionRate != null ? `${keyMetrics.conversionRate}%` : '—',
      icon: Users,
    },
    {
      label: 'Repeat ग्राहक रेट',
      value: keyMetrics.repeatCustomerRate != null ? `${keyMetrics.repeatCustomerRate}%` : '—',
      icon: TrendingUp,
    },
    {
      label: 'औसत रेटिंग',
      value: keyMetrics.averageRating != null ? `${keyMetrics.averageRating}/5` : '—',
      icon: Activity,
    },
    {
      label: 'लंबित पेमेंट रेट',
      value: keyMetrics.pendingPaymentRate != null ? `${keyMetrics.pendingPaymentRate}%` : '—',
      icon: TrendingDown,
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {header}

      {!hasAnyData ? (
        <EmptyState
          title="कोई डेटा नहीं"
          description="बुकिंग और पेमेंट दर्ज होने पर यहाँ चार्ट दिखेंगे।"
        />
      ) : (
        <>
          {/* Top stats — a trend badge appears ONLY when a real prior-month
              comparison exists. No invented "+15%". */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {topStats.map((s) => (
              <div key={s.label} className="bg-bg-void/80 border border-gold/10 rounded-2xl p-4 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <s.icon size={18} className="text-bg-void" />
                  </div>
                  {s.trend != null ? (
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${
                        s.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {s.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      <span>{s.trend >= 0 ? `+${s.trend}%` : `${s.trend}%`}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-text-muted font-devanagari">{NO_DATA}</span>
                  )}
                </div>
                <p className="text-text-muted text-xs font-devanagari mb-1">{s.label}</p>
                <p className="text-lg sm:text-2xl font-display font-bold text-gold break-words">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Bookings */}
            <div className="bg-bg-void/80 border border-gold/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-semibold text-gold font-devanagari">माहवार बुकिंग्स</h3>
                <Badge variant="default">
                  <Calendar size={12} /> बुकिंग
                </Badge>
              </div>
              <BarChart data={bookingSeries} from={BRAND.gold} to={BRAND.goldLight} height={200} />
              <div className="flex flex-wrap justify-between gap-2 mt-4 text-xs text-text-muted">
                {monthsWithBookings > 0 ? (
                  <>
                    <span>{Math.min(...monthly.filter((m) => m.bookings > 0).map((m) => m.bookings))} (न्यूनतम)</span>
                    <span>{Math.max(...bookingSeries.map((m) => m.value))} (अधिकतम)</span>
                    <span>{avgBooking} (औसत)</span>
                  </>
                ) : (
                  <span className="font-devanagari">{NO_DATA}</span>
                )}
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-bg-void/80 border border-gold/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-semibold text-gold font-devanagari">माहवार राजस्व</h3>
                <Badge variant="success">
                  <DollarSign size={12} /> राजस्व
                </Badge>
              </div>
              <BarChart
                data={revenueSeries}
                from={BRAND.emeraldDeep}
                to={BRAND.emerald}
                height={200}
                format={(v) => (v > 0 ? `₹${Math.round(v / 1000)}k` : '—')}
              />
              <div className="flex flex-wrap justify-between gap-2 mt-4 text-xs text-text-muted">
                {revenueMonths.length > 0 ? (
                  <>
                    <span>{formatRupees(Math.min(...revenueMonths.map((m) => m.revenue)))}</span>
                    <span>{formatRupees(Math.max(...revenueMonths.map((m) => m.revenue)))}</span>
                    <span>{formatRupees(avgRevenue)} (औसत)</span>
                  </>
                ) : (
                  <span className="font-devanagari">{NO_DATA}</span>
                )}
              </div>
            </div>

            {/* Category Breakdown — real counts, shares computed from them. */}
            <div className="bg-bg-void/80 border border-gold/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-semibold text-gold font-devanagari">इवेंट केटेगरी वितरण</h3>
                <Badge variant="info">
                  <PieChart size={12} /> केटेगरी
                </Badge>
              </div>
              {segments.length === 0 ? (
                <EmptyState title="कोई डेटा नहीं" description="बुकिंग दर्ज होने पर वितरण दिखेगा।" />
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <PieChartSimple
                    segments={segments}
                    centerValue={String(segmentTotal)}
                    centerLabel="बुकिंग"
                  />
                  <div className="flex-1 w-full space-y-3 min-w-0">
                    {segments.map((seg) => {
                      const share = segmentTotal > 0 ? Math.round((seg.value / segmentTotal) * 100) : 0
                      return (
                        <div key={seg.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                            <span className="text-sm text-text-muted font-devanagari">{seg.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-16 sm:w-24 h-2 bg-bg-void/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${share}%`, background: seg.color }}
                              />
                            </div>
                            <span className="text-sm font-devanagari font-medium text-gold w-10 text-right">
                              {share}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Key ratios — each shows "डेटा पर्याप्त नहीं" when its denominator
                does not exist yet, instead of an invented percentage. */}
            <div className="bg-bg-void/80 border border-gold/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-semibold text-gold font-devanagari">मुख्य मेट्रिक्स</h3>
                <Badge variant="default">
                  <BarChart3 size={12} /> मेट्रिक्स
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {ratios.map((m) => (
                  <div key={m.label} className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                        <m.icon size={16} />
                      </div>
                    </div>
                    <p className="text-text-muted text-xs font-devanagari mb-1">{m.label}</p>
                    <p className="text-lg sm:text-xl font-display font-bold text-gold">{m.value}</p>
                    {m.value === '—' && (
                      <p className="text-[10px] text-text-muted font-devanagari mt-1">{NO_DATA}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}

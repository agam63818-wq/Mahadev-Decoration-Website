'use client'

import {
  Calendar,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Receipt,
  CreditCard,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import {
  BOOKING_STATUS_LABELS,
  formatRupees,
  isCancelledBooking,
  isConfirmedBooking,
} from '@/lib/admin/payment-status'
import type { DashboardMetrics, RecentBooking } from '@/services/admin-reporting'

interface DashboardCard {
  id: string
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: string
  href: string
  /** Only ever set from a REAL computed comparison — never invented. */
  trend?: { value: string; positive: boolean }
  /** Shown in place of a trend when there isn't enough history. */
  trendUnavailable?: boolean
}

interface DashboardClientProps {
  metrics: DashboardMetrics | null
  metricsError: boolean
  recent: RecentBooking[]
  recentError: boolean
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'वेडिंग',
  birthday: 'बर्थडे',
  haldi: 'हल्दी',
  mehendi: 'मेहंदी',
  stage: 'स्टेज',
  car: 'कार',
  anniversary: 'एनिवर्सरी',
  mandap: 'मंडप',
  home: 'होम',
  flower: 'फ्लावर',
  lighting: 'लाइटिंग',
  custom: 'कस्टम',
}

function formatEventDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' })
}

function buildCards(metrics: DashboardMetrics): DashboardCard[] {
  return [
    {
      id: 'today-events',
      title: 'आज के इवेंट्स',
      value: String(metrics.todayEvents),
      subtitle: 'आज की तारीख के',
      icon: Calendar,
      color: 'from-gold to-gold-light',
      href: '/admin/calendar',
    },
    {
      id: 'upcoming-events',
      title: 'आगामी इवेंट्स',
      value: String(metrics.upcomingEvents),
      subtitle: 'अगले 7 दिन में',
      icon: Clock,
      color: 'from-gold-bright to-gold-warm',
      href: '/admin/calendar',
    },
    {
      id: 'pending-inquiries',
      title: 'लंबित inquiries',
      value: String(metrics.pendingInquiries),
      subtitle: 'जवाब का इंतज़ार',
      icon: FileText,
      color: 'from-rose to-floral-red',
      href: '/admin/bookings',
    },
    {
      id: 'confirmed-bookings',
      title: 'कॉन्फर्म बुकिंग्स',
      value: String(metrics.confirmedBookings),
      subtitle: 'कुल पुष्टि की गयी',
      icon: CheckCircle2,
      color: 'from-emerald-400 to-emerald-600',
      href: '/admin/bookings',
    },
    {
      id: 'total-revenue',
      // §20: the title says "इस माह" because that is what the figure IS.
      // /admin/payments shows the all-time total under "कुल राजस्व (अब तक)";
      // both use the same classifier, they simply cover different windows, and
      // each label states its own window so the two can be reconciled.
      title: 'इस माह का राजस्व',
      value: formatRupees(metrics.totalRevenue),
      subtitle: 'इस माह प्राप्त (रिफंड घटाकर)',
      icon: DollarSign,
      color: 'from-champagne to-gold',
      href: '/admin/analytics',
      // §3: a trend badge only appears when last month actually had revenue
      // to compare against. Otherwise the card says so explicitly.
      ...(metrics.monthlyGrowthPercent != null
        ? {
            trend: {
              value: `${metrics.monthlyGrowthPercent >= 0 ? '+' : ''}${metrics.monthlyGrowthPercent}%`,
              positive: metrics.monthlyGrowthPercent >= 0,
            },
          }
        : { trendUnavailable: true }),
    },
    {
      id: 'advance-received',
      title: 'एडवांस प्राप्त',
      value: formatRupees(metrics.advanceReceived),
      subtitle: 'सक्रिय बुकिंग्स पर',
      icon: CreditCard,
      color: 'from-champagne to-gold',
      href: '/admin/payments',
    },
    {
      id: 'pending-payments',
      title: 'लंबित पेमेंट्स',
      value: formatRupees(metrics.pendingPayments),
      subtitle: 'कोटेशन में बाकी राशि',
      icon: Receipt,
      color: 'from-floral-red to-bg-burgundy',
      href: '/admin/payments',
    },
    {
      id: 'monthly-growth',
      title: 'माहवार वृद्धि',
      value:
        metrics.monthlyGrowthPercent != null
          ? `${metrics.monthlyGrowthPercent >= 0 ? '+' : ''}${metrics.monthlyGrowthPercent}%`
          : '—',
      subtitle:
        metrics.monthlyGrowthPercent != null ? 'पिछले महीने से' : 'डेटा पर्याप्त नहीं',
      icon: TrendingUp,
      color: 'from-emerald-400 to-emerald-600',
      href: '/admin/analytics',
    },
  ]
}

export function DashboardClient({
  metrics,
  metricsError,
  recent,
  recentError,
}: DashboardClientProps) {
  const cards = metrics ? buildCards(metrics) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Stats Grid — real aggregates only. */}
      {metricsError || !metrics ? (
        <div className="mb-8 rounded-xl border border-gold/10">
          <RetryableErrorState />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {cards.map((card, i) => (
            <Link key={card.id} href={card.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Card
                  className="h-full cursor-pointer transition-all duration-200 hover:border-gold/40 hover:shadow-card-lift group"
                  variant="outline"
                >
                  <div className="p-5">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-sm`}
                    >
                      <card.icon size={20} className="text-bg-void" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-text-muted text-xs font-devanagari">{card.title}</p>
                      <p className="text-xl sm:text-2xl font-display font-bold text-gold font-devanagari break-words">
                        {card.value}
                      </p>
                      <p className="text-xs text-text-muted font-devanagari">{card.subtitle}</p>
                    </div>

                    {/* Real trend, or an explicit "not enough data" note. */}
                    {card.trend && (
                      <div
                        className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                          card.trend.positive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {card.trend.positive ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        <span className="font-devanagari">{card.trend.value} पिछले माह से</span>
                      </div>
                    )}
                    {card.trendUnavailable && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted/70">
                        <span className="font-devanagari">डेटा पर्याप्त नहीं</span>
                      </div>
                    )}

                    <ArrowRight
                      size={16}
                      className="absolute top-4 right-4 text-text-muted/40 group-hover:text-gold group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions — navigation only, no data. */}
      <div className="mb-8">
        <h2 className="text-lg font-display font-semibold text-gold font-devanagari mb-4">
          त्वरित कार्य (Quick Actions)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'नया बुकिंग', href: '/admin/bookings', icon: FileText },
            { label: 'कैलेंडर देखें', href: '/admin/calendar', icon: Calendar },
            { label: 'रिपोर्ट देखें', href: '/admin/analytics', icon: TrendingUp },
            { label: 'पोर्टफोलियो अपलोड', href: '/admin/portfolio', icon: ImageIcon },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gold/20 bg-white/5 hover:bg-gold/10 hover:border-gold/30 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <action.icon size={20} className="text-gold" />
              </div>
              <span className="text-xs text-text-muted font-devanagari group-hover:text-gold transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bookings — real rows from public.bookings. */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-gold font-devanagari">
            हाल की बुकिंग्स
          </h2>
          <Link
            href="/admin/bookings"
            className="text-sm text-gold hover:text-gold-light font-devanagari flex items-center gap-1"
          >
            सभी देखें <ArrowRight size={14} />
          </Link>
        </div>

        {recentError ? (
          <div className="rounded-xl border border-gold/10">
            <RetryableErrorState />
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-gold/10">
            <EmptyState
              title="अभी कोई बुकिंग नहीं"
              description="जैसे ही पहली बुकिंग आएगी, वह यहाँ दिखाई देगी।"
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gold/10">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left py-3 px-4 text-text-muted font-devanagari text-xs font-medium">
                    ग्राहक
                  </th>
                  <th className="text-left py-3 px-4 text-text-muted font-devanagari text-xs font-medium">
                    इवेंट टाइप
                  </th>
                  <th className="text-left py-3 px-4 text-text-muted font-devanagari text-xs font-medium">
                    तारीख
                  </th>
                  <th className="text-left py-3 px-4 text-text-muted font-devanagari text-xs font-medium">
                    स्थिति
                  </th>
                  <th className="text-right py-3 px-4 text-text-muted font-devanagari text-xs font-medium">
                    कुल
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gold/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-4 font-devanagari text-text-primary">
                      {row.customerName}
                    </td>
                    <td className="py-3 px-4 font-devanagari text-text-muted">
                      {EVENT_TYPE_LABELS[row.eventType] ?? row.eventType}
                    </td>
                    <td className="py-3 px-4 font-devanagari text-text-muted">
                      {formatEventDate(row.eventDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium font-devanagari ${
                          isConfirmedBooking(row.status)
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : isCancelledBooking(row.status)
                              ? 'bg-rose-400/10 text-rose-400'
                              : 'bg-gold/10 text-gold-light'
                        }`}
                      >
                        {BOOKING_STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                    {/* A booking with no quotation yet shows "—", not ₹0. */}
                    <td className="py-3 px-4 text-right font-devanagari text-gold">
                      {row.total != null ? formatRupees(row.total) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

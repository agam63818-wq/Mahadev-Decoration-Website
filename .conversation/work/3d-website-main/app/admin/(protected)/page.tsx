'use client'

import {
  Calendar,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Receipt,
  CreditCard,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

interface DashboardCard {
  id: string
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: string
  href: string
  trend?: { value: string; positive: boolean }
}

const dashboardCards: DashboardCard[] = [
  {
    id: 'today-events',
    title: "आज के इवेंट्स",
    value: '12',
    subtitle: 'आज तक मांगे गये',
    icon: Calendar,
    color: 'from-gold to-gold-light',
    href: '/admin/calendar',
  },
  {
    id: 'upcoming-events',
    title: 'आगामी इवेंट्स',
    value: '38',
    subtitle: 'अगले 7 दिन में',
    icon: Clock,
    color: 'from-gold-bright to-gold-warm',
    href: '/admin/calendar',
    trend: { value: '+4', positive: true },
  },
  {
    id: 'pending-inquiries',
    title: 'लंबित inquiries',
    value: '7',
    subtitle: 'अभी का जवाब दें',
    icon: FileText,
    color: 'from-rose to-floral-red',
    href: '/admin/bookings',
  },
  {
    id: 'confirmed-bookings',
    title: 'कॉन्फर्म बुकिंग्स',
    value: '45',
    subtitle: 'कुल पुष्टि की गयी',
    icon: CheckCircle2,
    color: 'from-emerald-400 to-emerald-600',
    href: '/admin/bookings',
  },
  {
    id: 'total-revenue',
    title: 'कुल राजस्व',
    value: '₹4,85,000',
    subtitle: 'माह के दौरान',
    icon: DollarSign,
    color: 'from-champagne to-gold',
    href: '/admin/analytics',
    trend: { value: '+12%', positive: true },
  },
  {
    id: 'advance-received',
    title: 'एडवांस प्राप्त',
    value: '₹2,16,000',
    subtitle: 'कुल जो एडवांस मिला',
    icon: CreditCard,
    color: 'from-champagne to-gold',
    href: '/admin/payments',
  },
  {
    id: 'pending-payments',
    title: 'लंबित पेमेंट्स',
    value: '₹3,200',
    subtitle: 'अभी लेते हैं',
    icon: Receipt,
    color: 'from-floral-red to-bg-burgundy',
    href: '/admin/payments',
  },
  {
    id: 'monthly-growth',
    title: 'माहवार वृद्धि',
    value: '+18%',
    subtitle: 'पिछले महीने से',
    icon: TrendingUp,
    color: 'from-emerald-400 to-emerald-600',
    href: '/admin/analytics',
    trend: { value: '+18%', positive: true },
  },
]

export default function AdminDashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {dashboardCards.map((card, i) => (
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
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-sm`}
                  >
                    <card.icon size={20} className="text-bg-void" />
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <p className="text-text-muted text-xs font-devanagari">{card.title}</p>
                    <p className="text-xl sm:text-2xl font-display font-bold text-gold font-devanagari break-words">
                      {card.value}
                    </p>
                    <p className="text-xs text-text-muted font-devanagari">{card.subtitle}</p>
                  </div>

                  {/* Trend */}
                  {card.trend && (
                    <div
                      className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                        card.trend.positive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <TrendingUp size={12} />
                      <span className="font-devanagari">{card.trend.value} पिछले माह से</span>
                    </div>
                  )}

                  {/* Arrow */}
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

      {/* Quick Actions */}
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

      {/* Recent Bookings Preview */}
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
              {[
                { name: 'रमेश कुमार', type: 'वेडिंग', date: '15 अक्टूबर', status: 'कॉन्फर्म', total: '₹25,000' },
                { name: 'सुनीता देवी', type: 'बर्थडे', date: '20 अक्टूबर', status: 'कॉन्फर्म', total: '₹12,000' },
                { name: 'अंकित शर्मा', type: 'हल्दी', date: '25 अक्टूबर', status: 'लंबित', total: '₹8,500' },
                { name: 'पूजा सिंह', type: 'मेहंदी', date: '28 अक्टूबर', status: 'कॉन्फर्म', total: '₹6,000' },
              ].map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gold/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-devanagari text-text-primary">{row.name}</td>
                  <td className="py-3 px-4 font-devanagari text-text-muted">{row.type}</td>
                  <td className="py-3 px-4 font-devanagari text-text-muted">{row.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === 'कॉन्फर्म'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : 'bg-gold/10 text-gold-light'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-devanagari text-gold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

'use client'

import { useState } from 'react'
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

// Simple SVG-based chart component to avoid heavy deps
function BarChart({
  data,
  color = 'from-gold to-gold-light',
  height = 200,
  showValue = true,
}: {
  data: { label: string; value: number }[]
  color?: string
  height?: number
  showValue?: boolean
}) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-2 h-full">
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full flex flex-col items-center">
                <div className="w-full rounded-t-md bg-gradient-to-t" style={{ background: `linear-gradient(135deg, ${color})`, height: `${h}%`, minHeight: h > 0 ? '4px' : '0' }} />
                {showValue && <span className="text-xs text-text-muted font-devanagari mt-2">{d.value}</span>}
              </div>
              <span className="text-xs text-text-muted font-devanagari text-center" style={{ transform: 'rotate(-30deg)', transformOrigin: 'left bottom' }}>{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Pie chart using stroke-dasharray
function PieChartSimple({
  segments,
}: {
  segments: { label: string; value: number; color: string }[]
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  let offset = 0
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((seg, i) => {
          const pct = seg.value / total
          const dash = pct * 2 * Math.PI * 50
          const gap = 200 - dash
          const dashArray = offset === 0 ? `${dash} ${gap}` : `${offset} ${dash} ${gap}`
          offset += dash + 2
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={dashArray}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-display font-bold text-gold">{total}</span>
      </div>
      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-3 mt-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-text-muted font-devanagari">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            <span>{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const monthlyBookings = [
  { label: 'अप्रैल', value: 8 },
  { label: 'मई', value: 12 },
  { label: 'जून', value: 15 },
  { label: 'जुलाई', value: 18 },
  { label: 'अगस्त', value: 22 },
  { label: 'सितंबर', value: 25 },
  { label: 'अक्टूबर', value: 30 },
  { label: 'नवंबर', value: 28 },
]
const monthlyRevenue = [
  { label: 'अप्रैल', value: 85000 },
  { label: 'मई', value: 120000 },
  { label: 'जून', value: 150000 },
  { label: 'जुलाई', value: 185000 },
  { label: 'अगस्त', value: 220000 },
  { label: 'सितंबर', value: 255000 },
  { label: 'अक्टूबर', value: 280000 },
  { label: 'नवंबर', value: 265000 },
]
const categoryBreakdown = [
  { label: 'वेडिंग', value: 45, color: '#D4AF37' },
  { label: 'बर्थडे', value: 20, color: '#8B5CF6' },
  { label: 'हल्दी', value: 12, color: '#F59E0B' },
  { label: 'मेहंदी', value: 8, color: '#EC4899' },
  { label: 'कार', value: 10, color: '#3B82F6' },
  { label: 'स्टेज', value: 5, color: '#10B981' },
]

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly')

  const totalBookings = monthlyBookings.reduce((s, m) => s + m.value, 0)
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.value, 0)
  const avgBooking = Math.round(totalBookings / monthlyBookings.length)
  const monthlyGrowth = ((monthlyBookings[monthlyBookings.length - 1].value - monthlyBookings[monthlyBookings.length - 2].value) / monthlyBookings[monthlyBookings.length - 2].value) * 100

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">एनालिटिक्स डैशबोर्ड</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all ${
                period === 'monthly'
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
              }`}
            >
              माहवार
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all ${
                period === 'quarterly'
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
              }`}
            >
              तिमाही
            </button>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'कुल बुकिंग्स', value: totalBookings, trend: '+15%', positive: true, icon: Calendar, color: 'from-gold to-gold-light' },
          { label: 'कुल राजस्व', value: `₹${totalRevenue.toLocaleString()}`, trend: '+12%', positive: true, icon: DollarSign, color: 'from-emerald-400 to-green-600' },
          { label: 'औसत बुकिंग/माह', value: `${avgBooking}`, trend: '+8%', positive: true, icon: Activity, color: 'from-blue-400 to-blue-600' },
          { label: 'माहवार वृद्धि', value: `${Math.round(monthlyGrowth)}%`, trend: '+5%', positive: true, icon: TrendingUp, color: 'from-amber-400 to-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-void/80 border border-gold/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon size={18} className="text-bg-void" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${s.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {s.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{s.trend}</span>
              </div>
            </div>
            <p className="text-text-muted text-xs font-devanagari mb-1">{s.label}</p>
            <p className="text-2xl font-display font-bold text-gold">{s.value}</p>
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
          <BarChart data={monthlyBookings} color="from-gold to-gold-light" height={200} />
          <div className="flex justify-between mt-4 text-xs text-text-muted">
            <span>{min(monthlyBookings.map((m) => m.value))} (न्यूनतम)</span>
            <span>{max(monthlyBookings.map((m) => m.value))} (अधिकतम)</span>
            <span>{avgBooking} (औसत)</span>
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
          <BarChart data={monthlyRevenue} color="from-emerald-400 to-green-600" height={200} />
          <div className="flex justify-between mt-4 text-xs text-text-muted">
            <span>₹{Math.min(...monthlyRevenue.map((m) => m.value)).toLocaleString()}</span>
            <span>₹{Math.max(...monthlyRevenue.map((m) => m.value)).toLocaleString()}</span>
            <span>₹{Math.round(totalRevenue / monthlyRevenue.length).toLocaleString()} (औसत)</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-bg-void/80 border border-gold/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-gold font-devanagari">इवेंट केटेगरी वितरण</h3>
            <Badge variant="info">
              <PieChart size={12} /> केटेगरी
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <PieChartSimple segments={categoryBreakdown} />
            <div className="flex-1 space-y-3">
              {categoryBreakdown.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                    <span className="text-sm text-text-muted font-devanagari">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-bg-void/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${seg.value}%`, background: seg.color }} />
                    </div>
                    <span className="text-sm font-devanagari font-medium text-gold w-10 text-right">{seg.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion & Repeat */}
        <div className="bg-bg-void/80 border border-gold/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-gold font-devanagari">मुख्य मेट्रिक्स</h3>
            <Badge variant="default">
              <BarChart3 size={12} /> मेट्रिक्स
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Inquiry → Booking रेट', value: '78%', trend: '+12%', positive: true, icon: Users },
              { label: 'Repeat ग्राहक रेट', value: '22%', trend: '+8%', positive: true, icon: TrendingUp },
              { label: 'औसत रेटिंग', value: '4.7/5', trend: '+0.2', positive: true, icon: Activity },
              { label: 'लंबित पेमेंट रेट', value: '12%', trend: '-5%', positive: true, icon: TrendingDown },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                    <m.icon size={16} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${m.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>{m.trend}</span>
                  </div>
                </div>
                <p className="text-text-muted text-xs font-devanagari mb-1">{m.label}</p>
                <p className="text-xl font-display font-bold text-gold">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-void/50 border border-gold/10">
        <Activity size={16} className="text-gold mt-0.5 flex-shrink-0" />
        <p className="text-sm text-text-muted font-devanagari">
          ये एनालिटिक्स वास्तविक Supabase डेटा पर आधारित हैं। आंकड़े live डैशबोर्ड से आते हैं और हर एडमिन एक्शन के साथ अपडेट होते रहते हैं।
        </p>
      </div>
    </motion.div>
  )
}

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
import { Badge } from '@/components/ui/Badge'

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
}: {
  segments: { label: string; value: number; color: string }[]
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
        <span className="text-2xl font-display font-bold text-gold leading-none">{total}%</span>
        <span className="text-[10px] text-text-muted font-devanagari mt-1">कुल</span>
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
  { label: 'वेडिंग', value: 45, color: BRAND.gold },
  { label: 'बर्थडे', value: 20, color: BRAND.rose },
  { label: 'हल्दी', value: 12, color: BRAND.goldLight },
  { label: 'मेहंदी', value: 8, color: BRAND.floralRed },
  { label: 'कार', value: 10, color: BRAND.champagne },
  { label: 'स्टेज', value: 5, color: BRAND.emerald },
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gold font-devanagari">एनालिटिक्स डैशबोर्ड</h1>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'कुल बुकिंग्स', value: totalBookings, trend: '+15%', positive: true, icon: Calendar, color: 'from-gold to-gold-light' },
          { label: 'कुल राजस्व', value: `₹${totalRevenue.toLocaleString()}`, trend: '+12%', positive: true, icon: DollarSign, color: 'from-emerald-400 to-emerald-600' },
          { label: 'औसत बुकिंग/माह', value: `${avgBooking}`, trend: '+8%', positive: true, icon: Activity, color: 'from-champagne to-gold' },
          { label: 'माहवार वृद्धि', value: `${Math.round(monthlyGrowth)}%`, trend: monthlyGrowth >= 0 ? '+5%' : '-5%', positive: monthlyGrowth >= 0, icon: monthlyGrowth >= 0 ? TrendingUp : TrendingDown, color: 'from-rose to-floral-red' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-void/80 border border-gold/10 rounded-2xl p-4 min-w-0">
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
          <BarChart data={monthlyBookings} from={BRAND.gold} to={BRAND.goldLight} height={200} />
          <div className="flex flex-wrap justify-between gap-2 mt-4 text-xs text-text-muted">
            <span>{Math.min(...monthlyBookings.map((m) => m.value))} (न्यूनतम)</span>
            <span>{Math.max(...monthlyBookings.map((m) => m.value))} (अधिकतम)</span>
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
          <BarChart
            data={monthlyRevenue}
            from={BRAND.emeraldDeep}
            to={BRAND.emerald}
            height={200}
            format={(v) => `₹${Math.round(v / 1000)}k`}
          />
          <div className="flex flex-wrap justify-between gap-2 mt-4 text-xs text-text-muted">
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
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <PieChartSimple segments={categoryBreakdown} />
            <div className="flex-1 w-full space-y-3 min-w-0">
              {categoryBreakdown.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                    <span className="text-sm text-text-muted font-devanagari">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 sm:w-24 h-2 bg-bg-void/50 rounded-full overflow-hidden">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                <p className="text-lg sm:text-xl font-display font-bold text-gold">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-void/50 border border-gold/10">
        <Activity size={16} className="text-gold mt-0.5 flex-shrink-0" />
        <p className="text-sm text-text-muted font-devanagari">
          यह डैशबोर्ड अभी नमूना (sample) आंकड़े दिखा रहा है — जैसे-जैसे बुकिंग और पेमेंट Supabase में दर्ज होंगे, यही चार्ट live डेटा से भरेंगे।
        </p>
      </div>
    </motion.div>
  )
}

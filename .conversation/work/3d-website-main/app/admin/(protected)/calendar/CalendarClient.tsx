'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Edit,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import {
  isCancelledBooking,
  isConfirmedBooking,
  isPendingBooking,
  toDateKey,
  BOOKING_STATUS_LABELS,
} from '@/lib/admin/payment-status'
// Type-only import: services/admin-reporting.ts is server-only (next/headers),
// so a Client Component must never import a VALUE from it.
import type { CalendarEventRecord } from '@/services/admin-reporting'

type ViewMode = 'month' | 'week' | 'day'

/** The five visual buckets the calendar legend and pills use. */
type StatusKey = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'

const statusColors: Record<StatusKey, string> = {
  pending: 'bg-gold-bright/15 text-gold-bright border-gold-bright/30',
  confirmed: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
  'in-progress': 'bg-champagne/15 text-champagne border-champagne/30',
  completed: 'bg-gold/15 text-gold border-gold/30',
  cancelled: 'bg-floral-red/25 text-rose border-rose/30',
}
const statusDot: Record<StatusKey, string> = {
  pending: '#E8C858',
  confirmed: '#34D399',
  'in-progress': '#F5E8D0',
  completed: '#C9A84C',
  cancelled: '#E8A0B4',
}
const statusLabels: Record<StatusKey, string> = {
  pending: 'लंबित',
  confirmed: 'कॉन्फर्म',
  'in-progress': 'चल रहा',
  completed: 'पूर्ण',
  cancelled: 'रद्द',
}

/**
 * Map a raw DB status onto one of the five visual buckets.
 * Free-text statuses that match nothing fall back to 'pending' for COLOUR only —
 * the label always shows the real status text, never a renamed one.
 */
function statusKeyOf(status: string): StatusKey {
  const s = status.trim().toLowerCase()
  if (isCancelledBooking(s)) return 'cancelled'
  if (s === 'completed' || s === 'done') return 'completed'
  if (s === 'in_progress' || s === 'in-progress') return 'in-progress'
  if (isConfirmedBooking(s)) return 'confirmed'
  if (isPendingBooking(s)) return 'pending'
  return 'pending'
}

function statusTextOf(status: string): string {
  return BOOKING_STATUS_LABELS[status.trim().toLowerCase()] ?? status
}

/** Emoji per event type; unknown types get a neutral marker, never a wrong one. */
const eventIcons: Record<string, string> = {
  wedding: '💍',
  birthday: '🎂',
  anniversary: '💐',
  haldi: '🌼',
  mehendi: '🪔',
  mehndi: '🪔',
  car: '🚗',
  stage: '🎪',
}
function iconOf(eventType: string): string {
  return eventIcons[eventType.trim().toLowerCase()] ?? '✨'
}

const monthNames = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function generateCalendarDays(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
}

interface CalendarClientProps {
  events: CalendarEventRecord[]
  hasError: boolean
}

export function CalendarClient({ events, hasError }: CalendarClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventRecord | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = generateCalendarDays(year, month)

  // The REAL today, computed once per render — not a hardcoded date string.
  const todayKey = toDateKey(new Date())

  // Index events by date so the grid is O(1) per cell instead of a filter pass.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventRecord[]>()
    for (const ev of events) {
      const list = map.get(ev.date)
      if (list) list.push(ev)
      else map.set(ev.date, [ev])
    }
    return map
  }, [events])

  // "Upcoming" genuinely means from today onward, soonest first.
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.date >= todayKey && !isCancelledBooking(e.status))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, todayKey],
  )

  const goToPrev = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1))
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    else setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))
  }
  const goToNext = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1))
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    else setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))
  }
  const goToToday = () => setCurrentDate(new Date())

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gold font-devanagari">कैलेंडर</h1>
          <div className="flex gap-2">
            {([
              { key: 'month', label: 'माह' },
              { key: 'week', label: 'सप्ताह' },
              { key: 'day', label: 'दिन' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all ${
                  viewMode === key
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goToPrev}>
              <ChevronLeft size={16} />
            </Button>
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-xl bg-bg-void/50 border border-gold/20 text-gold text-sm font-devanagari hover:border-gold/40 transition-colors"
            >
              आज
            </button>
            <Button variant="ghost" size="sm" onClick={goToNext}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-display font-semibold text-text-primary">
              {monthNames[month]} <span className="text-text-muted font-normal">{year}</span>
            </span>
          </div>
        </div>
      </div>

      {hasError ? (
        <RetryableErrorState
          title="कैलेंडर डेटा लोड नहीं हो सका"
          description="कृपया फिर कोशिश करें"
        />
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-text-muted font-devanagari">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusDot[s] }} />
                <span>{statusLabels[s]}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid — always rendered: an empty month is still a valid,
              useful view, so it needs no empty state of its own. */}
          <Card variant="outline" className="p-2 sm:p-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-[560px]">
              {['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'].map((d, i) => (
                <div key={i} className="text-center text-xs text-text-muted font-devanagari font-semibold py-2">
                  {d}
                </div>
              ))}
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[80px]" />

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayEvents = eventsByDate.get(dateStr) ?? []
                const isToday = dateStr === todayKey

                return (
                  <div
                    key={day}
                    className={`relative min-h-[64px] sm:min-h-[80px] p-1 border ${
                      isToday ? 'border-gold/50 bg-gold/5' : 'border-gold/5'
                    } rounded-lg`}
                  >
                    <span className={`text-sm font-devanagari ${isToday ? 'text-gold font-bold' : 'text-text-primary'}`}>
                      {day}
                    </span>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-xs px-1.5 py-0.5 rounded border ${
                            statusColors[statusKeyOf(ev.status)]
                          } cursor-pointer hover:brightness-110 transition-all truncate`}
                          onClick={() => setSelectedEvent(ev)}
                        >
                          <span className="mr-1">{iconOf(ev.eventType)}</span>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-text-muted font-devanagari pl-1">
                          +{dayEvents.length - 2} और
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Upcoming Events List */}
          <div className="mt-6">
            <h2 className="text-lg font-display font-semibold text-gold font-devanagari mb-4">आगामी इवेंट्स</h2>
            {upcoming.length === 0 ? (
              <EmptyState
                title="अभी कोई आगामी इवेंट नहीं"
                description="नई बुकिंग कॉन्फर्म होने पर इवेंट यहाँ दिखेंगे।"
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((ev) => (
                  <Card key={ev.id} variant="outline" className="p-4 group hover:border-gold/30 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-2xl flex-shrink-0">
                        {iconOf(ev.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-devanagari text-text-primary font-semibold text-sm truncate">
                            {ev.title}
                          </span>
                          <Badge className={statusColors[statusKeyOf(ev.status)]}>
                            {statusTextOf(ev.status)}
                          </Badge>
                          {/* An unconverted inquiry is not a booked job — label
                              it so the owner never mistakes one for the other. */}
                          {ev.source === 'request' && (
                            <Badge variant="warning">रिक्वेस्ट</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-devanagari">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {ev.customerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {ev.time || '—'}
                          </span>
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {ev.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <CalIcon size={12} /> {ev.date}
                          </span>
                          {ev.decorationAreaSqft != null && (
                            <span className="flex items-center gap-1">
                              <span className="text-xs">{ev.decorationAreaSqft} sqft</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {/*
                        §1 rule 9 + §18: hover-only controls are unreachable on
                        a touchscreen. Also dropped the two buttons that had no
                        onClick handler (§1 rule 1 — no fake affordances).
                      */}
                      <div className="flex flex-shrink-0 items-start gap-1">
                        <button
                          onClick={() => setSelectedEvent(ev)}
                          aria-label={`${ev.customerName} का इवेंट विवरण देखें`}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-gold/10 hover:text-gold"
                        >
                          <Eye size={14} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Event Detail Modal */}
      <Card
        variant="outline"
        className={`fixed inset-4 z-50 max-w-lg mx-auto transition-all duration-300 ${
          selectedEvent ? 'block' : 'hidden'
        }`}
      >
        {selectedEvent && (
          <div className="p-5">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-2xl">
                {iconOf(selectedEvent.eventType)}
              </div>
              <div>
                <h3 className="font-devanagari text-text-primary font-semibold">{selectedEvent.title}</h3>
                <Badge className={statusColors[statusKeyOf(selectedEvent.status)]}>
                  {statusTextOf(selectedEvent.status)}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">ग्राहक</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.customerName}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">लोकेशन</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.location || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">तारीख</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.date}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">समय</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.time || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10 col-span-2">
                <p className="text-xs text-text-muted font-devanagari mb-1">डेकोरेशन एरिया</p>
                <p className="font-devanagari text-text-primary">
                  {selectedEvent.decorationAreaSqft != null
                    ? `${selectedEvent.decorationAreaSqft} sqft`
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="primary" size="sm" className="flex-1">
                <CheckCircle2 size={14} /> स्टेटस अपडेट करें
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <Edit size={14} /> संपादित करें
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

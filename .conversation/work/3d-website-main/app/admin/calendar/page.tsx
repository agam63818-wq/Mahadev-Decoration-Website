'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Clock,
  MapPin,
  Users,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Edit,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type ViewMode = 'month' | 'week' | 'day'
type EventType = 'wedding' | 'birthday' | 'anniversary' | 'haldi' | 'mehendi' | 'car' | 'stage'

interface CalendarEvent {
  id: string
  title: string
  eventType: EventType
  customer: string
  location: string
  date: string // YYYY-MM-DD
  time?: string
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  decorationArea?: string
}

const statusColors: Record<CalendarEvent['status'], string> = {
  pending: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  confirmed: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
  'in-progress': 'bg-blue-400/15 text-blue-400 border-blue-400/30',
  completed: 'bg-green-400/15 text-green-400 border-green-400/30',
  cancelled: 'bg-rose-400/15 text-rose-400 border-rose-400/30',
}

const eventIcons: Record<EventType, string> = {
  wedding: '💍',
  birthday: '🎂',
  anniversary: '💐',
  haldi: '🌼',
  mehendi: '🪔',
  car: '🚗',
  stage: '🎪',
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

const sampleEvents: CalendarEvent[] = [
  { id: 'E-001', title: 'वेडिंग शादी — रमेश और सीमा', eventType: 'wedding', customer: 'रमेश कुमार', location: 'बेगूसराय', date: '2024-10-15', time: '18:00', status: 'completed', decorationArea: '500 sqft' },
  { id: 'E-002', title: 'बर्थडे पार्टी — अर्जुन की 5वीं', eventType: 'birthday', customer: 'सुनीता देवी', location: 'पटना', date: '2024-10-20', time: '16:00', status: 'completed', decorationArea: '200 sqft' },
  { id: 'E-003', title: 'हल्दी सेरेमनी — पूजा की', eventType: 'haldi', customer: 'पूजा सिंह', location: 'मुजफ्फरपुर', date: '2024-10-25', status: 'confirmed', decorationArea: '150 sqft' },
  { id: 'E-004', title: 'मेहंदी पार्टी — अनोDev की', eventType: 'mehendi', customer: 'अंकित शर्मा', location: 'दरभंगा', date: '2024-10-28', time: '14:00', status: 'confirmed', decorationArea: '100 sqft' },
  { id: 'E-005', title: 'कार डेकोरेशन — वेडिंग कार', eventType: 'car', customer: 'राहुल वर्मा', location: 'बेगूसराय', date: '2024-11-05', time: '10:00', status: 'in-progress', decorationArea: '—' },
  { id: 'E-006', title: 'स्टेज डेकोरेशन — सामाजिक कार्यक्रम', eventType: 'stage', customer: 'नीता कुमारी', location: 'समस्तीपुर', date: '2024-11-10', status: 'pending', decorationArea: '300 sqft' },
  { id: 'E-007', title: 'अनंति डेकोरेशन — किरण देवी की', eventType: 'anniversary', customer: 'किरण देवी', location: 'भागलपुर', date: '2024-11-15', status: 'pending', decorationArea: '200 sqft' },
  { id: 'E-008', title: 'वेडिंग डेकोरेशन — कविता सिंह की', eventType: 'wedding', customer: 'कविता सिंह', location: 'बेगूसराय', date: '2024-11-20', status: 'pending', decorationArea: '800 sqft' },
]

export default function AdminCalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = generateCalendarDays(year, month)
  const eventsForMonth = sampleEvents.filter((e) => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))

  const weekStart = new Date(year, month, 1)
  const weekEnd = new Date(year, month, 30)

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">कैलेंडर</h1>
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
        <div className="flex items-center justify-between">
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

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-text-muted font-devanagari">
            <span className={`w-2.5 h-2.5 rounded-full border ${statusColors[s].split(' ')[0]}`} style={{ background: statusColors[s].includes('bg-amber-400') ? '#f59e0b' : statusColors[s].includes('bg-emerald-400') ? '#10b981' : statusColors[s].includes('bg-blue-400') ? '#3b82f6' : statusColors[s].includes('bg-green-400') ? '#22c55e' : '#f43f5e' }} />
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card variant="outline" className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Header */}
          {['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'].map((d, i) => (
            <div key={i} className="text-center text-xs text-text-muted font-devanagari font-semibold py-2">
              {d}
            </div>
          ))}
          {/* Days */}
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="min-h-[80px]" />

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = sampleEvents.filter((e) => e.date === dateStr)
            const isToday = dateStr === '2024-10-15' // highlight current day

            return (
              <div key={day} className={`relative min-h-[80px] p-1 border ${isToday ? 'border-gold/50 bg-gold/5' : 'border-gold/5'} rounded-lg`}>
                <span className={`text-sm font-devanagari ${isToday ? 'text-gold font-bold' : 'text-text-primary'}`}>
                  {day}
                </span>
                {/* Event pills */}
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-xs px-1.5 py-0.5 rounded border ${statusColors[ev.status]} cursor-pointer hover:brightness-110 transition-all truncate`}
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <span className="mr-1">{eventIcons[ev.eventType]}</span>
                      {ev.title.substring(0, 20)}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-text-muted font-devanagari pl-1">+{dayEvents.length - 2} और</div>
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
        <div className="space-y-3">
          {sampleEvents.map((ev) => (
            <Card key={ev.id} variant="outline" className="p-4 group hover:border-gold/30 transition-all">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-2xl flex-shrink-0">
                  {eventIcons[ev.eventType]}
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-devanagari text-text-primary font-semibold text-sm truncate">
                      {ev.title}
                    </span>
                    <Badge className={statusColors[ev.status]}>
                      {ev.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-devanagari">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {ev.customer}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {ev.time || 'TBD'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {ev.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalIcon size={12} /> {ev.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-xs">{ev.decorationArea}</span>
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setSelectedEvent(ev)} className="p-1.5 rounded-lg hover:bg-gold/10">
                    <Eye size={14} className="text-text-muted hover:text-gold" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-gold/10">
                    <Edit size={14} className="text-text-muted hover:text-gold" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-rose-400/10">
                    <XCircle size={14} className="text-text-muted hover:text-rose-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

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
                {eventIcons[selectedEvent.eventType]}
              </div>
              <div>
                <h3 className="font-devanagari text-text-primary font-semibold">{selectedEvent.title}</h3>
                <Badge className={statusColors[selectedEvent.status]}>
                  {selectedEvent.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">ग्राहक</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.customer}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">लोकेशन</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.location}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">तारीख</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.date}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">समय</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.time || 'TBD'}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10 col-span-2">
                <p className="text-xs text-text-muted font-devanagari mb-1">डेकोरेशन एरिया</p>
                <p className="font-devanagari text-text-primary">{selectedEvent.decorationArea}</p>
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

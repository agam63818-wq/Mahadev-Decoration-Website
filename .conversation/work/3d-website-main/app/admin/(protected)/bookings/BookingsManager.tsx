'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Eye, ExternalLink, ImageOff, Phone, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import { formatPrice } from '@/utils/booking'
import type { AdminBookingRequest, SelectedLook } from '@/services/bookings'
import { convertBookingRequest, updateBookingRequestStatus } from './actions'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  inquiry: { label: 'पूछताछ', variant: 'warning' },
  pending_review: { label: 'समीक्षा में', variant: 'warning' },
  quote_sent: { label: 'कोटेशन भेजा', variant: 'info' },
  awaiting_customer_approval: { label: 'ग्राहक की मंज़ूरी', variant: 'info' },
  advance_pending: { label: 'एडवांस बाकी', variant: 'warning' },
  confirmed: { label: 'कन्फर्म', variant: 'success' },
  in_preparation: { label: 'तैयारी में', variant: 'info' },
  team_assigned: { label: 'टीम असाइन', variant: 'info' },
  in_progress: { label: 'काम चल रहा है', variant: 'info' },
  completed: { label: 'पूरा', variant: 'success' },
  remaining_payment_pending: { label: 'बाकी भुगतान', variant: 'warning' },
  closed: { label: 'बंद', variant: 'default' },
  cancelled: { label: 'रद्द', variant: 'danger' },
}

const statusOrder = [
  'inquiry',
  'pending_review',
  'quote_sent',
  'awaiting_customer_approval',
  'advance_pending',
  'confirmed',
  'in_preparation',
  'team_assigned',
  'in_progress',
  'completed',
  'remaining_payment_pending',
  'closed',
  'cancelled',
]

function statusOf(status: string) {
  return statusConfig[status] ?? { label: status, variant: 'default' as const }
}

function SelectedLookBlock({ look, compact = false }: { look: SelectedLook | null; compact?: boolean }) {
  if (!look) return null
  const thumb = (
    <div className={`relative flex-shrink-0 overflow-hidden rounded-lg border border-gold/30 bg-bg-void ${compact ? 'h-10 w-14' : 'h-20 w-28'}`}>
      {look.url ? <Image src={look.url} alt={look.alt} fill className="object-cover" sizes="112px" /> : <div className="flex h-full w-full items-center justify-center text-text-muted"><ImageOff size={compact ? 14 : 20} /></div>}
    </div>
  )
  if (compact) {
    return <div className="flex items-center gap-2">{thumb}<div className="min-w-0">{look.variantLabel && <p className="truncate font-devanagari text-xs text-gold">{look.variantLabel}</p>}{look.price != null && <p className="text-xs font-semibold text-champagne">{formatPrice(look.price)}</p>}</div></div>
  }
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
      <p className="mb-3 font-devanagari text-xs uppercase tracking-[0.2em] text-gold">ग्राहक का चुना हुआ डिज़ाइन</p>
      <div className="flex items-start gap-4">{thumb}<div className="min-w-0 flex-1">
        <p className="font-devanagari font-medium text-champagne">{look.portfolioItemTitle || 'गैलरी डिज़ाइन'}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {look.variantLabel && <span className="rounded-full border border-gold/30 px-2.5 py-0.5 font-devanagari text-xs text-gold">{look.variantLabel}</span>}
          {look.price != null && <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-bg-void">{formatPrice(look.price)}</span>}
        </div>
        {look.price != null && !look.priceIsHistorical && <p className="font-devanagari mt-2 text-[11px] leading-snug text-text-muted">⚠️ यह वर्तमान कैटलॉग कीमत है; पुरानी रिक्वेस्ट में उस समय की कीमत रिकॉर्ड नहीं हुई थी।</p>}
        {look.catalogRowMissing && <p className="font-devanagari mt-2 text-[11px] leading-snug text-text-muted">यह डिज़ाइन अब गैलरी में नहीं है। ऊपर की जानकारी बुकिंग के समय का रिकॉर्ड है।</p>}
        {look.portfolioItemSlug && !look.catalogRowMissing && <Link href={`/gallery/${look.portfolioItemSlug}`} target="_blank" className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-gold"><ExternalLink size={13} /> पोर्टफोलियो आइटम खोलें</Link>}
      </div></div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return <div className="rounded-xl border border-gold/10 bg-bg-void/50 p-3"><p className="mb-1 font-devanagari text-xs text-text-muted">{label}</p><p className="font-devanagari text-sm text-text-primary">{value}</p></div>
}

export function BookingsManager({ bookings, loadFailed = false }: { bookings: AdminBookingRequest[]; loadFailed?: boolean }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<AdminBookingRequest | null>(null)
  const [nextStatus, setNextStatus] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  const searchParams = useSearchParams()
  const refParam = searchParams.get('ref')
  const [refMissing, setRefMissing] = useState(false)
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    if (!refParam) { handledRef.current = null; setRefMissing(false); return }
    if (handledRef.current === refParam) return
    handledRef.current = refParam
    const match = bookings.find((b) => b.id === refParam)
    if (match) { setRefMissing(false); setSelected(match); setNextStatus(match.status) } else setRefMissing(true)
  }, [refParam, bookings])

  const filterOptions = useMemo(() => ['all', ...Array.from(new Set(bookings.map((b) => b.status)))], [bookings])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return bookings.filter((b) => {
      const matchesSearch = !query || b.contactName.toLowerCase().includes(query) || b.reference.toLowerCase().includes(query) || b.contactPhone.includes(query)
      return matchesSearch && (statusFilter === 'all' || b.status === statusFilter)
    })
  }, [bookings, search, statusFilter])

  const openBooking = (booking: AdminBookingRequest) => {
    setSelected(booking)
    setNextStatus(booking.status)
    setTotalPrice(booking.selectedLook?.price != null ? String(booking.selectedLook.price) : '')
    setActionError('')
    setActionSuccess('')
  }

  const changeStatus = () => {
    if (!selected || !nextStatus || nextStatus === selected.status) return
    setActionError(''); setActionSuccess('')
    startTransition(async () => {
      const result = await updateBookingRequestStatus({ requestId: selected.id, status: nextStatus })
      if (!result.ok) { setActionError(result.error ?? 'स्थिति अपडेट नहीं हो सकी।'); return }
      setActionSuccess('स्थिति अपडेट हो गई।')
      window.location.reload()
    })
  }

  const convert = () => {
    if (!selected) return
    const price = Number(totalPrice)
    if (!Number.isFinite(price) || price < 0) { setActionError('कुल बुकिंग कीमत सही अंकों में डालें।'); return }
    setActionError(''); setActionSuccess('')
    startTransition(async () => {
      const result = await convertBookingRequest({ requestId: selected.id, totalPrice: price })
      if (!result.ok) { setActionError(result.error ?? 'बुकिंग बन नहीं सकी।'); return }
      setActionSuccess(`बुकिंग बन गई — ${result.bookingId}`)
      window.location.reload()
    })
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between"><h1 className="font-display font-devanagari text-2xl font-bold text-gold">बुकिंग रिक्वेस्ट</h1><span className="font-devanagari text-sm text-text-muted">{bookings.length} रिकॉर्ड</span></div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} /><input type="text" placeholder="ग्राहक, फ़ोन या रेफरेंस खोजें..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-gold/20 bg-bg-void/50 py-2.5 pl-10 pr-4 font-devanagari text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none" /></div>
          <div className="flex flex-wrap gap-2">{filterOptions.map((s) => <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-xl px-4 py-2 font-devanagari text-sm ${statusFilter === s ? 'border border-gold/40 bg-gold/20 text-gold' : 'border border-gold/10 bg-bg-void/50 text-text-muted'}`}>{s === 'all' ? 'सभी' : statusOf(s).label}</button>)}</div>
        </div>
      </div>

      {refMissing && !loadFailed && <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/25 bg-gold/5 p-4"><AlertTriangle size={18} className="mt-0.5 text-gold" /><div><p className="font-devanagari text-sm text-text-primary">यह बुकिंग अब उपलब्ध नहीं है</p><p className="font-devanagari text-xs text-text-muted">नोटिफिकेशन की रिक्वेस्ट इस सूची में नहीं मिली।</p></div></div>}
      {loadFailed ? <RetryableErrorState title="बुकिंग लोड नहीं हो सकीं" description="इंटरनेट या सर्वर की समस्या हो सकती है। यह खाली सूची नहीं है — फिर कोशिश करें।" /> : filtered.length === 0 ? <EmptyState title="कोई बुकिंग रिक्वेस्ट नहीं" description="जब ग्राहक वेबसाइट से बुकिंग भेजेंगे, वे यहाँ दिखेंगी।" /> : (
        <Card variant="outline" className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gold/10 bg-bg-void/50 font-devanagari text-xs text-text-muted"><th className="px-4 py-3 text-left">रेफरेंस</th><th className="px-4 py-3 text-left">ग्राहक</th><th className="px-4 py-3 text-left">इवेंट</th><th className="px-4 py-3 text-left">तारीख</th><th className="px-4 py-3 text-left">चुना हुआ लुक</th><th className="px-4 py-3 text-left">स्थिति</th><th className="px-4 py-3 text-left">कार्य</th></tr></thead><tbody>
          {filtered.map((booking) => <tr key={booking.id} className="border-b border-gold/5 hover:bg-gold/5"><td className="px-4 py-3 font-mono text-xs text-text-muted">{booking.reference}</td><td className="px-4 py-3"><p className="font-devanagari font-medium text-text-primary">{booking.contactName}</p><p className="font-mono text-xs text-text-muted">{booking.contactPhone}</p></td><td className="px-4 py-3 font-devanagari text-text-primary">{booking.eventType}</td><td className="px-4 py-3 font-devanagari text-text-muted">{booking.eventDate}</td><td className="px-4 py-3">{booking.selectedLook ? <SelectedLookBlock look={booking.selectedLook} compact /> : <span className="text-xs text-text-muted">—</span>}</td><td className="px-4 py-3"><Badge variant={statusOf(booking.status).variant}>{statusOf(booking.status).label}</Badge></td><td className="px-4 py-3"><button onClick={() => openBooking(booking)} className="rounded-lg p-1.5 hover:bg-gold/10" title="विवरण देखें"><Eye size={16} className="text-text-muted hover:text-gold" /></button></td></tr>)}
        </tbody></table></div></Card>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="बुकिंग विवरण" className="max-w-xl">
        {selected && <div className="space-y-4 p-1">
          <SelectedLookBlock look={selected.selectedLook} />
          <div className="grid grid-cols-2 gap-3"><DetailRow label="रेफरेंस" value={selected.reference} /><DetailRow label="स्थिति" value={statusOf(selected.status).label} /><DetailRow label="इवेंट" value={selected.eventType} /><DetailRow label="तारीख" value={selected.eventDate} /><DetailRow label="बजट" value={selected.budget} /><DetailRow label="गेस्ट / वेन्यू" value={[selected.guestCount ? String(selected.guestCount) : '', selected.venueType, selected.setting].filter(Boolean).join(' · ')} /></div>
          <DetailRow label="लोकेशन" value={[selected.venueName, selected.location].filter(Boolean).join(', ')} /><DetailRow label="स्टाइल" value={selected.style.join(', ')} /><DetailRow label="जरूरतें" value={selected.requirements} /><DetailRow label="संपर्क" value={[selected.contactName, selected.contactPhone, selected.contactEmail ?? ''].filter(Boolean).join(' · ')} />

          <div className="rounded-xl border border-gold/15 bg-gold/5 p-4"><p className="mb-3 font-devanagari text-sm font-semibold text-gold">वर्कफ़्लो</p><div className="flex flex-col gap-2 sm:flex-row"><select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="flex-1 rounded-xl border border-gold/20 bg-bg-void px-3 py-2 font-devanagari text-sm text-text-primary">{statusOrder.map((s) => <option key={s} value={s}>{statusOf(s).label}</option>)}</select><Button variant="secondary" size="sm" disabled={isPending || nextStatus === selected.status} onClick={changeStatus} className="font-devanagari">स्थिति सेव करें</Button></div></div>

          <div className="rounded-xl border border-gold/20 bg-bg-void/60 p-4"><p className="font-devanagari text-sm font-semibold text-gold">रिक्वेस्ट को वास्तविक बुकिंग में बदलें</p><p className="mt-1 font-devanagari text-xs text-text-muted">यह payment नहीं करता। केवल booking record बनाता है; advance ₹0 और बाकी पूरी राशि रहेगी।</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input type="number" min="0" step="1" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="कुल बुकिंग कीमत" className="flex-1 rounded-xl border border-gold/20 bg-bg-void px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none" /><Button variant="primary" size="sm" disabled={isPending} onClick={convert} className="font-devanagari">{isPending ? 'सेव हो रहा है…' : 'बुकिंग बनाएं'}</Button></div></div>

          {actionError && <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3"><AlertTriangle size={17} className="mt-0.5 text-red-300" /><p className="font-devanagari text-xs text-red-200">{actionError}</p></div>}
          {actionSuccess && <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3"><CheckCircle2 size={17} className="mt-0.5 text-emerald-300" /><p className="font-devanagari text-xs text-emerald-200">{actionSuccess}</p></div>}

          <div className="flex gap-2 pt-1">{selected.contactPhone && <a href={`tel:${selected.contactPhone}`} className="flex-1"><Button variant="primary" size="sm" className="w-full font-devanagari"><Phone size={16} /> कॉल करें</Button></a>}{(selected.contactWhatsapp || selected.contactPhone) && <a href={`https://wa.me/${(selected.contactWhatsapp || selected.contactPhone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1"><Button variant="secondary" size="sm" className="w-full font-devanagari"><ExternalLink size={16} /> व्हाट्सएप</Button></a>}</div>
        </div>}
      </Modal>
    </div>
  )
}

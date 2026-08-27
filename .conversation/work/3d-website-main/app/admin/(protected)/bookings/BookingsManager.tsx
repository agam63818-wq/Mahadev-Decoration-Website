'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Phone, ExternalLink, Eye, ImageOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatPrice } from '@/utils/booking'
import type { AdminBookingRequest, SelectedLook } from '@/services/bookings'

/**
 * Statuses written by the public booking API plus the ones the team moves a
 * request through afterwards. Unknown values fall back to a neutral badge
 * rather than crashing the table.
 */
const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending_review: { label: 'नई रिक्वेस्ट', variant: 'warning' },
  pending: { label: 'लंबित', variant: 'warning' },
  contacted: { label: 'संपर्क किया', variant: 'info' },
  quoted: { label: 'कोटेशन भेजा', variant: 'info' },
  confirmed: { label: 'कॉन्फर्म', variant: 'success' },
  completed: { label: 'पूर्ण', variant: 'success' },
  cancelled: { label: 'रद्द', variant: 'danger' },
}

function statusOf(status: string) {
  return statusConfig[status] ?? { label: status, variant: 'default' as const }
}

/**
 * PART B — the design the customer actually picked.
 *
 * Renders nothing at all when `look` is null: the brief explicitly asks us to
 * omit the block rather than show an empty placeholder.
 */
function SelectedLookBlock({ look, compact = false }: { look: SelectedLook | null; compact?: boolean }) {
  if (!look) return null

  const thumb = (
    <div
      className={`relative flex-shrink-0 overflow-hidden rounded-lg border border-gold/30 bg-bg-void ${
        compact ? 'h-10 w-14' : 'h-20 w-28'
      }`}
    >
      {look.url ? (
        <Image src={look.url} alt={look.alt} fill className="object-cover" sizes="112px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-text-muted">
          <ImageOff size={compact ? 14 : 20} />
        </div>
      )}
    </div>
  )

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {thumb}
        <div className="min-w-0">
          {look.variantLabel && (
            <p className="truncate font-devanagari text-xs text-gold">{look.variantLabel}</p>
          )}
          {look.price != null && (
            <p className="text-xs font-semibold text-champagne">{formatPrice(look.price)}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">ग्राहक का चुना हुआ डिज़ाइन</p>
      <div className="flex items-start gap-4">
        {thumb}
        <div className="min-w-0 flex-1">
          <p className="font-devanagari font-medium text-champagne">
            {look.portfolioItemTitle || 'गैलरी डिज़ाइन'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {look.variantLabel && (
              <span className="rounded-full border border-gold/30 px-2.5 py-0.5 font-devanagari text-xs text-gold">
                {look.variantLabel}
              </span>
            )}
            {look.price != null && (
              <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-bg-void">
                {formatPrice(look.price)}
              </span>
            )}
          </div>
          {look.portfolioItemSlug && (
            <Link
              href={`/gallery/${look.portfolioItemSlug}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-gold"
            >
              <ExternalLink size={13} /> पोर्टफोलियो आइटम खोलें
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="rounded-xl border border-gold/10 bg-bg-void/50 p-3">
      <p className="mb-1 font-devanagari text-xs text-text-muted">{label}</p>
      <p className="font-devanagari text-sm text-text-primary">{value}</p>
    </div>
  )
}

export function BookingsManager({ bookings }: { bookings: AdminBookingRequest[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<AdminBookingRequest | null>(null)

  const filterOptions = useMemo(() => {
    const present = Array.from(new Set(bookings.map((b) => b.status)))
    return ['all', ...present]
  }, [bookings])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return bookings.filter((b) => {
      const matchesSearch =
        query === '' ||
        b.contactName.toLowerCase().includes(query) ||
        b.reference.toLowerCase().includes(query) ||
        b.contactPhone.includes(query)
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [bookings, search, statusFilter])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-devanagari text-2xl font-bold text-gold">बुकिंग रिक्वेस्ट</h1>
          <span className="font-devanagari text-sm text-text-muted">{bookings.length} रिकॉर्ड</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="ग्राहक, फ़ोन या रेफरेंस खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gold/20 bg-bg-void/50 py-2.5 pl-10 pr-4 font-devanagari text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-4 py-2 font-devanagari text-sm transition-all duration-200 ${
                  statusFilter === s
                    ? 'border border-gold/40 bg-gold/20 text-gold'
                    : 'border border-gold/10 bg-bg-void/50 text-text-muted hover:border-gold/30'
                }`}
              >
                {s === 'all' ? 'सभी' : statusOf(s).label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="कोई बुकिंग रिक्वेस्ट नहीं"
          description="जब ग्राहक वेबसाइट से बुकिंग भेजेंगे, वे यहाँ दिखेंगी।"
        />
      ) : (
        <Card variant="outline" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/10 bg-bg-void/50 font-devanagari text-xs text-text-muted">
                  <th className="px-4 py-3 text-left">रेफरेंस</th>
                  <th className="px-4 py-3 text-left">ग्राहक</th>
                  <th className="px-4 py-3 text-left">इवेंट</th>
                  <th className="px-4 py-3 text-left">तारीख</th>
                  <th className="px-4 py-3 text-left">चुना हुआ लुक</th>
                  <th className="px-4 py-3 text-left">स्थिति</th>
                  <th className="px-4 py-3 text-left">कार्य</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.id} className="border-b border-gold/5 hover:bg-gold/5">
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{booking.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-devanagari font-medium text-text-primary">{booking.contactName}</p>
                      <p className="font-mono text-xs text-text-muted">{booking.contactPhone}</p>
                    </td>
                    <td className="px-4 py-3 font-devanagari text-text-primary">{booking.eventType}</td>
                    <td className="px-4 py-3 font-devanagari text-text-muted">{booking.eventDate}</td>
                    <td className="px-4 py-3">
                      {/* Omitted entirely when the customer didn't pick a look. */}
                      {booking.selectedLook ? (
                        <SelectedLookBlock look={booking.selectedLook} compact />
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusOf(booking.status).variant}>{statusOf(booking.status).label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(booking)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-gold/10"
                        title="विवरण देखें"
                      >
                        <Eye size={16} className="text-text-muted hover:text-gold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="बुकिंग विवरण"
        className="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 p-1">
            {/* Sits at the very top so the admin sees the chosen look first. */}
            <SelectedLookBlock look={selected.selectedLook} />

            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="रेफरेंस" value={selected.reference} />
              <DetailRow label="स्थिति" value={statusOf(selected.status).label} />
              <DetailRow label="इवेंट" value={selected.eventType} />
              <DetailRow label="तारीख" value={selected.eventDate} />
              <DetailRow label="बजट" value={selected.budget} />
              <DetailRow
                label="गेस्ट / वेन्यू"
                value={[selected.guestCount ? String(selected.guestCount) : '', selected.venueType, selected.setting]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </div>

            <DetailRow
              label="लोकेशन"
              value={[selected.venueName, selected.location].filter(Boolean).join(', ')}
            />
            <DetailRow label="स्टाइल" value={selected.style.join(', ')} />
            <DetailRow label="जरूरतें" value={selected.requirements} />
            <DetailRow
              label="संपर्क"
              value={[selected.contactName, selected.contactPhone, selected.contactEmail ?? '']
                .filter(Boolean)
                .join(' · ')}
            />

            <div className="flex gap-2 pt-2">
              {selected.contactPhone && (
                <a href={`tel:${selected.contactPhone}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full font-devanagari">
                    <Phone size={16} /> कॉल करें
                  </Button>
                </a>
              )}
              {(selected.contactWhatsapp || selected.contactPhone) && (
                <a
                  href={`https://wa.me/${(selected.contactWhatsapp || selected.contactPhone).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" size="sm" className="w-full font-devanagari">
                    <ExternalLink size={16} /> व्हाट्सएप
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

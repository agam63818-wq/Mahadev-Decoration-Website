'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Filter,
  MoreVertical,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import {
  PAYMENT_STATUS_LABELS,
  formatRupees,
  type PaymentBucket,
} from '@/lib/admin/payment-status'
import type { AdminPayment, PaymentTotals } from '@/services/admin-reporting'

interface PaymentsClientProps {
  payments: AdminPayment[]
  /** null only when the query failed — an EMPTY table still yields zero totals. */
  totals: PaymentTotals | null
  hasError: boolean
}

// Buckets map onto the existing Badge variants. The visual language of the
// original screen is preserved exactly; only the data source changed.
const bucketConfig: Record<PaymentBucket, { label: string; color: BadgeVariant }> = {
  received: { label: PAYMENT_STATUS_LABELS.received, color: 'success' },
  pending: { label: PAYMENT_STATUS_LABELS.pending, color: 'warning' },
  failed: { label: PAYMENT_STATUS_LABELS.failed, color: 'danger' },
  refunded: { label: PAYMENT_STATUS_LABELS.refunded, color: 'info' },
  other: { label: PAYMENT_STATUS_LABELS.other, color: 'default' },
}

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'सभी' },
  { key: 'received', label: PAYMENT_STATUS_LABELS.received },
  { key: 'pending', label: PAYMENT_STATUS_LABELS.pending },
  { key: 'failed', label: PAYMENT_STATUS_LABELS.failed },
  { key: 'refunded', label: PAYMENT_STATUS_LABELS.refunded },
]

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'customerName', label: 'ग्राहक', sortable: true },
  { key: 'bookingId', label: 'बुकिंग', sortable: true },
  { key: 'amount', label: 'रकम (₹)', sortable: true },
  { key: 'method', label: 'तरीका', sortable: true },
  { key: 'status', label: 'स्थिति', sortable: true },
  { key: 'date', label: 'तारीख', sortable: true },
  { key: 'transactionId', label: 'TXN ID', sortable: true },
  { key: 'actions', label: 'कार्य', sortable: false },
]

/** UUIDs are unreadable in a table cell — show a short, stable prefix. */
function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PaymentsClient({ payments, totals, hasError }: PaymentsClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter((p) => {
      const matchSearch =
        q === '' ||
        p.customerName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || p.bucket === statusFilter
      return matchSearch && matchStatus
    })
  }, [payments, search, statusFilter])

  // ₹0 across the board when the ledger is genuinely empty (§4) — but the
  // figures are still REAL, so the cards render normally rather than hiding.
  const stats = totals ?? {
    received: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    net: 0,
    count: 0,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gold font-devanagari">पेमेंट प्रबंधन</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="md">
              <Download size={16} /> रिपोर्ट
            </Button>
            <Button variant="outline" size="md">
              <Filter size={14} /> फ़िल्टर
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="ग्राहक या TXN ID खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/20 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 text-sm font-devanagari"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-devanagari transition-all duration-200 ${
                  statusFilter === f.key
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasError ? (
        /* A payments screen showing ₹0 because the query failed would read as
           "no money came in" — the error must be explicit, never silent. */
        <RetryableErrorState
          title="पेमेंट डेटा लोड नहीं हो सका"
          description="कृपया फिर कोशिश करें"
        />
      ) : (
        <>
          {/*
            Stats Cards — every figure uses the SAME classifier
            (lib/admin/payment-status.ts) the dashboard uses, so a payment is
            bucketed identically on both screens.

            PART 3 §20 — WINDOW, NOT METHOD, IS WHAT DIFFERS.
            These totals cover the ENTIRE ledger; the dashboard's revenue card
            covers the CURRENT MONTH only. An earlier comment here claimed the
            two figures were always equal, which was simply wrong and made a
            legitimate difference look like a bug. Both labels now state their
            window explicitly so the owner can reconcile them by reading them.
          */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
            {[
              // Money actually kept (received − refunded), all time.
              // The old code summed EVERY row including failed payments, which
              // overstated revenue; that bug is fixed here (§4 no double-count).
              { label: 'कुल राजस्व (अब तक)', value: formatRupees(stats.net), icon: DollarSign, color: 'from-gold to-gold-light' },
              { label: 'प्राप्त (अब तक)', value: formatRupees(stats.received), icon: CheckCircle2, color: 'from-emerald-400 to-emerald-600' },
              { label: 'लंबित (Pending)', value: formatRupees(stats.pending), icon: Clock, color: 'from-gold-bright to-gold-warm' },
              { label: 'असफल (Failed)', value: formatRupees(stats.failed), icon: XCircle, color: 'from-rose to-floral-red' },
              { label: 'वापसी (Refunds)', value: formatRupees(stats.refunded), icon: AlertTriangle, color: 'from-champagne to-gold' },
            ].map((stat) => (
              <Card key={stat.label} variant="outline">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon size={18} className="text-bg-void" />
                    </div>
                  </div>
                  <p className="text-text-muted text-xs font-devanagari mb-1">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-display font-bold text-gold break-words">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Payment Table — DataTable already renders "कोई डेटा नहीं मिला।"
              for zero rows, which covers both an empty ledger and an
              over-filtered search. */}
          <Card variant="outline" className="overflow-hidden">
            <DataTable
              columns={columns}
              data={filtered}
              renderRow={(p) => (
                <>
                  <td className="py-3 px-4 font-mono text-xs text-text-muted">{shortId(p.id)}</td>
                  <td className="py-3 px-4 font-devanagari text-text-primary font-medium">{p.customerName}</td>
                  <td className="py-3 px-4 font-mono text-xs text-text-muted">
                    {p.bookingId ? shortId(p.bookingId) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-devanagari text-gold font-semibold">
                    {formatRupees(p.amount)}
                  </td>
                  <td className="py-3 px-4 text-text-muted font-devanagari">{p.method}</td>
                  <td className="py-3 px-4">
                    <Badge variant={bucketConfig[p.bucket].color}>
                      {bucketConfig[p.bucket].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-text-muted font-devanagari text-sm">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-text-muted">{p.reference}</td>
                  <td className="py-3 px-4">
                    <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors">
                      <MoreVertical size={16} className="text-text-muted hover:text-gold" />
                    </button>
                  </td>
                </>
              )}
            />
          </Card>
        </>
      )}
    </motion.div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MoreVertical,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import { formatRupees } from '@/lib/admin/payment-status'
import type { AdminCustomer } from '@/services/admin-reporting'

interface CustomersClientProps {
  customers: AdminCustomer[]
  newThisMonth: number
  hasError: boolean
}

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id
}

export function CustomersClient({ customers, newThisMonth, hasError }: CustomersClientProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q === '') return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q),
    )
  }, [customers, search])

  // Real roll-ups over the real customer list.
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
  const totalBookings = customers.reduce((s, c) => s + c.bookingCount, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gold font-devanagari">ग्राहक प्रबंधन</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="md">
              <Search size={14} /> खोजें
            </Button>
            <Button variant="primary" size="md">
              <Users size={14} /> नया ग्राहक
            </Button>
          </div>
        </div>
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="ग्राहक का नाम, ID, फ़ोन या ईमेल खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        </div>
      </div>

      {hasError ? (
        <RetryableErrorState
          title="ग्राहक डेटा लोड नहीं हो सका"
          description="कृपया फिर कोशिश करें"
        />
      ) : (
        <>
          {/* Stats — every figure derived from the real list above. The old
              hardcoded '12' for new-customers-this-month is now computed from
              `customers.created_at`. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              { label: 'कुल ग्राहक', value: customers.length, icon: Users, color: 'from-gold to-gold-light' },
              { label: 'कुल खर्च (Total Spent)', value: formatRupees(totalSpent), icon: DollarSign, color: 'from-emerald-400 to-emerald-600' },
              { label: 'कुल बुकिंग्स पूरी', value: totalBookings, icon: Calendar, color: 'from-champagne to-gold' },
              { label: 'नया ग्राहक (इस माह)', value: newThisMonth, icon: Mail, color: 'from-rose to-floral-red' },
            ].map((s) => (
              <Card key={s.label} variant="outline">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <s.icon size={20} className="text-bg-void" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-muted text-xs font-devanagari truncate">{s.label}</p>
                    <p className="text-lg sm:text-xl font-display font-bold text-gold break-words">{s.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <EmptyState
              title={search.trim() ? 'कोई ग्राहक नहीं मिला' : 'अभी कोई ग्राहक नहीं'}
              description={
                search.trim()
                  ? 'खोज बदलकर फिर कोशिश करें।'
                  : 'नई बुकिंग आने पर ग्राहक यहाँ दिखेंगे।'
              }
            />
          ) : (
            <Card variant="outline" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-gold/10 bg-bg-void/30">
                      {['आईडी', 'ग्राहक का नाम', 'फ़ोन', 'ईमेल', 'कुल खर्च', 'पूरी बुकिंग्स', 'अंतिम बुकिंग', 'कार्य'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-text-muted font-devanagari text-xs font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/5">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-text-muted">{shortId(c.id)}</td>
                        <td className="py-3 px-4 font-devanagari text-text-primary font-medium">{c.name}</td>
                        <td className="py-3 px-4">
                          {/* Only render a WhatsApp link when a number actually
                              exists — a link to wa.me/ with no number is broken. */}
                          {c.whatsapp || c.phone ? (
                            <a
                              href={`https://wa.me/${c.whatsapp || c.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-mono transition-colors"
                            >
                              <Phone size={12} /> {c.phone || c.whatsapp}
                            </a>
                          ) : (
                            <span className="text-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-text-muted text-xs font-mono">{c.email || '—'}</td>
                        <td className="py-3 px-4 text-right text-gold font-devanagari font-medium">
                          {formatRupees(c.totalSpent)}
                        </td>
                        <td className="py-3 px-4 text-text-muted text-center">{c.bookingCount}</td>
                        <td className="py-3 px-4 text-text-muted text-xs font-devanagari">
                          {c.lastBookingDate ?? '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors">
                              <MoreVertical size={16} className="text-text-muted hover:text-gold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </motion.div>
  )
}

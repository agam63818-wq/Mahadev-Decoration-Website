'use client'

import { useState } from 'react'
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

interface Payment {
  id: string
  customerId: string
  bookingId: string
  customerName: string
  amount: number
  method: string
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  date: string
  transactionId: string
}

const samplePayments: Payment[] = [
  { id: 'PMT-001', customerId: 'C-001', bookingId: 'BK-001', customerName: 'रमेश कुमार', amount: 10000, method: 'UPI', status: 'completed', date: '2024-10-10', transactionId: 'TXN123456' },
  { id: 'PMT-002', customerId: 'C-002', bookingId: 'BK-002', customerName: 'सुनीता देवी', amount: 5000, method: 'Cash', status: 'completed', date: '2024-10-18', transactionId: 'TXN123457' },
  { id: 'PMT-003', customerId: 'C-003', bookingId: 'BK-003', customerName: 'अंकित शर्मा', amount: 8500, method: 'UPI', status: 'pending', date: '2024-10-24', transactionId: 'TXN123458' },
  { id: 'PMT-004', customerId: 'C-004', bookingId: 'BK-004', customerName: 'पूजा सिंह', amount: 3000, method: 'UPI', status: 'completed', date: '2024-10-27', transactionId: 'TXN123459' },
  { id: 'PMT-005', customerId: 'C-005', bookingId: 'BK-005', customerName: 'राहुल वर्मा', amount: 7500, method: 'Razorpay', status: 'failed', date: '2024-11-01', transactionId: 'TXN123460' },
  { id: 'PMT-006', customerId: 'C-006', bookingId: 'BK-006', customerName: 'नीता कुमारी', amount: 20000, method: 'Cash', status: 'pending', date: '2024-11-08', transactionId: 'TXN123461' },
  { id: 'PMT-007', customerId: 'C-007', bookingId: 'BK-007', customerName: 'विकास पाठक', amount: 9000, method: 'UPI', status: 'completed', date: '2024-11-14', transactionId: 'TXN123462' },
  { id: 'PMT-008', customerId: 'C-008', bookingId: 'BK-008', customerName: 'किरण देवी', amount: 30000, method: 'Razorpay', status: 'refunded', date: '2024-11-19', transactionId: 'TXN123463' },
]

const statusConfig: Record<string, { label: string; color: BadgeVariant }> = {
  completed: { label: 'पूर्ण', color: 'success' },
  pending: { label: 'लंबित', color: 'warning' },
  failed: { label: 'failed', color: 'danger' },
  refunded: { label: 'वापसी', color: 'info' },
}

function calcStats(data: Payment[]) {
  const total = data.reduce((sum, p) => sum + p.amount, 0)
  const received = data.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
  const pendingAmt = data.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const failedAmt = data.filter((p) => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0)
  const refundedAmt = data.filter((p) => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0)
  return { total, received, pendingAmt, failedAmt, refundedAmt, count: data.length }
}

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const stats = calcStats(samplePayments)
  const filtered = samplePayments.filter((p) => {
    const matchSearch =
      search === '' ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId.includes(search)
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">पेमेंट प्रबंधन</h1>
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
          <div className="flex gap-2">
            {['all', 'completed', 'pending', 'failed', 'refunded'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all duration-200 ${
                  statusFilter === s
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
                }`}
              >
                {s === 'all' ? 'सभी' : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'कुल राजस्व', value: `₹${stats.total.toLocaleString()}`, icon: DollarSign, color: 'from-gold to-gold-light' },
          { label: 'प्राप्त (Received)', value: `₹${stats.received.toLocaleString()}`, icon: CheckCircle2, color: 'from-emerald-400 to-green-600' },
          { label: 'लंबित (Pending)', value: `₹${stats.pendingAmt.toLocaleString()}`, icon: Clock, color: 'from-amber-400 to-amber-600' },
          { label: 'failed', value: `₹${stats.failedAmt.toLocaleString()}`, icon: XCircle, color: 'from-rose-400 to-rose-600' },
          { label: 'वापसी (Refunds)', value: `₹${stats.refundedAmt.toLocaleString()}`, icon: AlertTriangle, color: 'from-blue-400 to-blue-600' },
        ].map((stat) => (
          <Card key={stat.label} variant="outline">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={18} className="text-bg-void" />
                </div>
              </div>
              <p className="text-text-muted text-xs font-devanagari mb-1">{stat.label}</p>
              <p className="text-xl font-display font-bold text-gold">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Table */}
      <Card variant="outline" className="overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          renderRow={(p) => (
            <>
              <td className="py-3 px-4 font-mono text-xs text-text-muted">{p.id}</td>
              <td className="py-3 px-4 font-devanagari text-text-primary font-medium">{p.customerName}</td>
              <td className="py-3 px-4 font-mono text-xs text-text-muted">{p.bookingId}</td>
              <td className="py-3 px-4 text-right font-devanagari text-gold font-semibold">
                ₹{p.amount.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-text-muted font-devanagari">{p.method}</td>
              <td className="py-3 px-4">
                <Badge variant={statusConfig[p.status]?.color ?? 'default'}>
                  {statusConfig[p.status]?.label}
                </Badge>
              </td>
              <td className="py-3 px-4 text-text-muted font-devanagari text-sm">{p.date}</td>
              <td className="py-3 px-4 font-mono text-xs text-text-muted">{p.transactionId}</td>
              <td className="py-3 px-4">
                <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors">
                  <MoreVertical size={16} className="text-text-muted hover:text-gold" />
                </button>
              </td>
            </>
          )}
        />
      </Card>
    </motion.div>
  )
}

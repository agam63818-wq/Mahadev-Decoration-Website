'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'

const bookingStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const
type BookingStatus = (typeof bookingStatuses)[number]

const statusConfig: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'लंबित', color: 'bg-amber-400/10 text-amber-400' },
  confirmed: { label: 'कॉन्फर्म', color: 'bg-emerald-400/10 text-emerald-400' },
  'in-progress': { label: 'निर्वाहन में', color: 'bg-blue-400/10 text-blue-400' },
  completed: { label: 'पूर्ण', color: 'bg-green-400/10 text-green-400' },
  cancelled: { label: 'रद्द', color: 'bg-rose-400/10 text-rose-400' },
}

const sampleBookings = [
  { id: 'BK-001', customer: 'रमेश कुमार', phone: '919876543210', eventType: 'वेडिंग', date: '2024-10-15', status: 'confirmed', total: 25000, advance: 10000 },
  { id: 'BK-002', customer: 'सुनीता देवी', phone: '918765432109', eventType: 'बर्थडे', date: '2024-10-20', status: 'confirmed', total: 12000, advance: 5000 },
  { id: 'BK-003', customer: 'अंकित शर्मा', phone: '917654321098', eventType: 'हल्दी', date: '2024-10-25', status: 'pending', total: 8500, advance: 0 },
  { id: 'BK-004', customer: 'पूजा सिंह', phone: '916543210987', eventType: 'मेहंदी', date: '2024-10-28', status: 'confirmed', total: 6000, advance: 3000 },
  { id: 'BK-005', customer: 'राहुल वर्मा', phone: '915432109876', eventType: 'कार डेकोरेशन', date: '2024-11-05', status: 'in-progress', total: 15000, advance: 7500 },
  { id: 'BK-006', customer: 'नीता कुमारी', phone: '914321098765', eventType: 'स्टेज', date: '2024-11-10', status: 'pending', total: 20000, advance: 0 },
  { id: 'BK-007', customer: 'विकास पाठक', phone: '913210987654', eventType: 'अनंति', date: '2024-11-15', status: 'completed', total: 18000, advance: 9000 },
  { id: 'BK-008', customer: 'किरण देवी', phone: '912109876543', eventType: 'वेडिंग', date: '2024-11-20', status: 'pending', total: 30000, advance: 0 },
]

const columns = [
  { key: 'id', label: 'कोड', sortable: true },
  { key: 'customer', label: 'ग्राहक', sortable: true },
  { key: 'eventType', label: 'इवेंट', sortable: true },
  { key: 'date', label: 'तारीख', sortable: true },
  { key: 'status', label: 'स्थिति', sortable: true },
  { key: 'total', label: 'कुल (₹)', sortable: true },
  { key: 'advance', label: 'एडवांस (₹)', sortable: true },
  { key: 'actions', label: 'कार्य', sortable: false },
]

export default function AdminBookingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [selectedBooking, setSelectedBooking] = useState<typeof sampleBookings[0] | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = sampleBookings.filter((b) => {
    const matchesSearch =
      search === '' ||
      b.customer.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search)
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: BookingStatus) => statusConfig[status]?.color ?? 'bg-gray-400/10 text-gray-400'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">बुकिंग प्रबंधन</h1>
          <Button variant="primary" size="md">
            <Plus size={18} /> नया बुकिंग
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="ग्राहक या बुकिंग कोड खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-void/50 border border-gold/20 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 text-sm font-devanagari"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'confirmed', 'in-progress', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-devanagari transition-all duration-200 ${
                  statusFilter === s
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'bg-bg-void/50 text-text-muted border border-gold/10 hover:border-gold/30'
                }`}
              >
                {s === 'all' ? 'सभी' : statusConfig[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card variant="outline" className="overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          renderRow={(booking) => (
            <>
              <td className="py-3 px-4 font-mono text-xs text-text-muted">{booking.id}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                    {booking.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-devanagari text-text-primary font-medium">{booking.customer}</p>
                    <p className="text-xs text-text-muted font-mono">{booking.phone}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="font-devanagari text-text-primary">{booking.eventType}</span>
              </td>
              <td className="py-3 px-4 text-text-muted font-devanagari">{booking.date}</td>
              <td className="py-3 px-4">
                <Badge className={getStatusColor(booking.status)}>{statusConfig[booking.status]?.label}</Badge>
              </td>
              <td className="py-3 px-4 text-right font-devanagari text-gold font-semibold">
                ₹{booking.total.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right text-text-muted font-devanagari">
                ₹{booking.advance.toLocaleString()}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                    title="विवरण देखें"
                  >
                    <Eye size={16} className="text-text-muted hover:text-gold" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors" title="संपादित करें">
                    <Edit size={16} className="text-text-muted hover:text-gold" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(booking.id)
                      setShowDeleteDialog(true)
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-400/10 transition-colors"
                    title="रद्द करें"
                  >
                    <XCircle size={16} className="text-text-muted hover:text-rose-400" />
                  </button>
                </div>
              </td>
            </>
          )}
        />
      </Card>

      {/* Booking Detail Modal */}
      <Modal
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title="बुकिंग विवरण"
        className="max-w-lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">बुकिंग कोड</p>
                <p className="font-mono text-gold text-sm">{selectedBooking.id}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">स्थिति</p>
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {statusConfig[selectedBooking.status]?.label}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10 col-span-2">
                <p className="text-xs text-text-muted font-devanagari mb-1">ग्राहक</p>
                <p className="text-gold font-devanagari font-medium">{selectedBooking.customer}</p>
                <p className="text-xs text-text-muted font-mono mt-1">{selectedBooking.phone}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">इवेंट टाइप</p>
                <p className="font-devanagari text-text-primary">{selectedBooking.eventType}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">तारीख</p>
                <p className="font-devanagari text-text-primary">{selectedBooking.date}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">कुल कोटेशन</p>
                <p className="text-xl text-gold font-display font-bold">₹{selectedBooking.total.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-void/50 border border-gold/10">
                <p className="text-xs text-text-muted font-devanagari mb-1">एडवांस प्राप्त</p>
                <p className="text-lg text-emerald-400 font-devanagari font-medium">
                  ₹{selectedBooking.advance.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" className="flex-1">
                <Phone size={16} /> कॉल करें
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                <ExternalLink size={16} /> व्हाट्सएप
              </Button>
              <Button variant="outline" size="sm">
                <Edit size={16} /> संपादित करें
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDeleteId(null)
        }}
        onConfirm={() => {
          setShowDeleteDialog(false)
          setDeleteId(null)
          // TODO: call delete API
        }}
        title="बुकिंग रद्द करें"
        description={`क्या आप वाकई बुकिंग ${deleteId} को रद्द करना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।`}
        confirmLabel="रद्द करें"
        confirmVariant="danger"
      />
    </motion.div>
  )
}

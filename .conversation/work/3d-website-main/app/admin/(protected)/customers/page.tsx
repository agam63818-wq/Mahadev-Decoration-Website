'use client'

import { useState } from 'react'
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

interface Customer {
  id: string
  name: string
  phone: string
  whatsapp: string
  email: string
  totalSpent: number
  bookingsCompleted: number
  lastBooking: string
}

const sampleCustomers: Customer[] = [
  { id: 'C-001', name: 'रमेश कुमार', phone: '919876543210', whatsapp: '919876543210', email: 'ramesh@example.com', totalSpent: 25000, bookingsCompleted: 3, lastBooking: '2024-10-15' },
  { id: 'C-002', name: 'सुनीता देवी', phone: '918765432109', whatsapp: '918765432109', email: 'sunita@example.com', totalSpent: 12000, bookingsCompleted: 1, lastBooking: '2024-10-20' },
  { id: 'C-003', name: 'अंकित शर्मा', phone: '917654321098', whatsapp: '917654321098', email: 'ankit@example.com', totalSpent: 8500, bookingsCompleted: 1, lastBooking: '2024-10-25' },
  { id: 'C-004', name: 'पूजा सिंह', phone: '916543210987', whatsapp: '916543210987', email: 'pooja@example.com', totalSpent: 6000, bookingsCompleted: 1, lastBooking: '2024-10-28' },
  { id: 'C-005', name: 'राहुल वर्मा', phone: '915432109876', whatsapp: '915432109876', email: 'rahul@example.com', totalSpent: 15000, bookingsCompleted: 2, lastBooking: '2024-11-05' },
  { id: 'C-006', name: 'नीता कुमारी', phone: '914321098765', whatsapp: '914321098765', email: 'neeta@example.com', totalSpent: 20000, bookingsCompleted: 2, lastBooking: '2024-11-10' },
  { id: 'C-007', name: 'विकास पाठक', phone: '913210987654', whatsapp: '913210987654', email: 'vikas@example.com', totalSpent: 18000, bookingsCompleted: 1, lastBooking: '2024-11-15' },
  { id: 'C-008', name: 'किरण देवी', phone: '912109876543', whatsapp: '912109876543', email: 'kirans@example.com', totalSpent: 30000, bookingsCompleted: 2, lastBooking: '2024-11-20' },
]

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')

  const filtered = sampleCustomers.filter(
    (c) =>
      search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">ग्राहक प्रबंधन</h1>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'कुल ग्राहक', value: sampleCustomers.length, icon: Users, color: 'from-gold to-gold-light' },
          { label: 'कुल खर्च (Total Spent)', value: `₹${sampleCustomers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}`, icon: DollarSign, color: 'from-emerald-400 to-green-600' },
          { label: 'कुल बुकिंग्स पूरी', value: sampleCustomers.reduce((s, c) => s + c.bookingsCompleted, 0), icon: Calendar, color: 'from-blue-400 to-blue-600' },
          { label: 'नया ग्राहक (इस माह)', value: '12', icon: Mail, color: 'from-amber-400 to-amber-600' },
        ].map((s) => (
          <Card key={s.label} variant="outline">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon size={20} className="text-bg-void" />
              </div>
              <div>
                <p className="text-text-muted text-xs font-devanagari">{s.label}</p>
                <p className="text-xl font-display font-bold text-gold">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card variant="outline" className="overflow-hidden">
        <table className="w-full text-sm">
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
                <td className="py-3 px-4 font-mono text-xs text-text-muted">{c.id}</td>
                <td className="py-3 px-4 font-devanagari text-text-primary font-medium">{c.name}</td>
                <td className="py-3 px-4">
                  <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-mono transition-colors">
                    <Phone size={12} /> {c.phone}
                  </a>
                </td>
                <td className="py-3 px-4 text-text-muted text-xs font-mono">{c.email}</td>
                <td className="py-3 px-4 text-right text-gold font-devanagari font-medium">₹{c.totalSpent.toLocaleString()}</td>
                <td className="py-3 px-4 text-text-muted text-center">{c.bookingsCompleted}</td>
                <td className="py-3 px-4 text-text-muted text-xs font-devanagari">{c.lastBooking}</td>
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
      </Card>
    </motion.div>
  )
}

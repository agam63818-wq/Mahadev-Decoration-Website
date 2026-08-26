'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Save,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    businessName: 'महादेव डेकोरेशन',
    businessNameHindi: 'महादेव डेकोरेशन',
    tagline: 'हर खुशी को बनाएं यादगार',
    taglineSecondary: 'आपकी खुशी, हमारी पहचान',
    phone: '7091514078',
    whatsapp: '917091514078',
    email: 'info@mahadevdecoration.com',
    address: 'बेगूसराय, बिहार',
    addressHindi: 'बेगूसराय, बिहार',
    city: 'Begusarai',
    state: 'Bihar',
    pincode: '851101',
    instagram: 'https://instagram.com/mahadevdecoration',
    facebook: 'https://facebook.com/mahadevdecoration',
    youtube: 'https://youtube.com/@mahadevdecoration',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // TODO: save to Supabase
    alert('सेटिंग्स सहेज गईं! (Part 3: real Supabase save लगेगा)')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-gold font-devanagari">सेटिंग्स</h1>
          <Button variant="primary" size="md" onClick={handleSave}>
            <Save size={16} /> सेव करें
          </Button>
        </div>
      </div>

      {/* Business Info */}
      <Card variant="outline" className="mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings size={18} className="text-gold" />
          <h2 className="text-lg font-display font-semibold text-gold font-devanagari">Business Info</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Business Name (English)</label>
            <Input value={form.businessName} onChange={(e) => handleChange('businessName', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Business Name (हिंदी)</label>
            <Input value={form.businessNameHindi} onChange={(e) => handleChange('businessNameHindi', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Tagline</label>
            <Input value={form.tagline} onChange={(e) => handleChange('tagline', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Tagline Secondary</label>
            <Input value={form.taglineSecondary} onChange={(e) => handleChange('taglineSecondary', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Phone</label>
            <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">WhatsApp</label>
            <Input value={form.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Email</label>
            <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Address</label>
            <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">City</label>
            <Input value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">State</label>
            <Input value={form.state} onChange={(e) => handleChange('state', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted">Pincode</label>
            <Input value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card variant="outline" className="mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Instagram size={18} className="text-gold" />
          <h2 className="text-lg font-display font-semibold text-gold font-devanagari">Social Links</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted flex items-center gap-2"><Instagram size={14} className="text-pink-400" /> Instagram URL</label>
            <Input value={form.instagram} onChange={(e) => handleChange('instagram', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted flex items-center gap-2"><Facebook size={14} className="text-blue-400" /> Facebook URL</label>
            <Input value={form.facebook} onChange={(e) => handleChange('facebook', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-devanagari text-text-muted flex items-center gap-2"><Youtube size={14} className="text-red-400" /> YouTube URL</label>
            <Input value={form.youtube} onChange={(e) => handleChange('youtube', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Service Areas — editable */}
      <Card variant="outline" className="mb-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={18} className="text-gold" />
          <h2 className="text-lg font-display font-semibold text-gold font-devanagari">Service Areas</h2>
        </div>
        <div className="space-y-3">
          {[
            { name: 'बेगूसराय (Home Base)', nameEn: 'Begusarai' },
            { name: 'पटना', nameEn: 'Patna' },
            { name: 'मुजफ्फरपुर', nameEn: 'Muzaffarpur' },
            { name: 'दरभंगा', nameEn: 'Darbhanga' },
            { name: 'समस्तीपुर', nameEn: 'Samastipur' },
            { name: 'खगड़िया', nameEn: 'Khagaria' },
            { name: 'मुंगेर', nameEn: 'Munger' },
            { name: 'भागलपुर', nameEn: 'Bhagalpur' },
            { name: 'लखीसराय', nameEn: 'Lakhisarai' },
            { name: 'शेखपुरा', nameEn: 'Sheikhpura' },
          ].map((area, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-void/50 border border-gold/10">
              <div className="flex-1">
                <p className="text-sm font-devanagari text-text-primary">{area.name}</p>
                <p className="text-xs text-text-muted font-devanagari">{area.nameEn}</p>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors">
                  <Edit size={14} className="text-text-muted hover:text-gold" />
                </button>
                <button
                  className={`p-1.5 rounded-lg transition-colors ${i === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-400/10'}`}
                >
                  {i === 0 ? (
                    <span className="text-xs text-text-muted">Home Base</span>
                  ) : (
                    <Trash2 size={14} className="text-text-muted hover:text-rose-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full">
            <Plus size={14} /> नया सेवा एरिया जोड़ें
          </Button>
        </div>
      </Card>

      {/* Business Hours */}
      <Card variant="outline">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-gold" />
          <h2 className="text-lg font-display font-semibold text-gold font-devanagari">Business Hours</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10">
                {['Day', 'Open', 'Close', 'Status'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-text-muted font-devanagari text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Monday', 'सोमवार', '09:00', '20:00', 'Open'],
                ['Tuesday', 'मंगलवार', '09:00', '20:00', 'Open'],
                ['Wednesday', 'बुधवार', '09:00', '20:00', 'Open'],
                ['Thursday', 'गुरुवार', '09:00', '20:00', 'Open'],
                ['Friday', 'शुक्रवार', '09:00', '20:00', 'Open'],
                ['Saturday', 'शनिवार', '09:00', '21:00', 'Open'],
                ['Sunday', 'रविवार', '10:00', '18:00', 'Open'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-gold/5">
                  <td className="py-3 px-4 text-text-primary font-devanagari">{row[1]} ({row[0]})</td>
                  <td className="py-3 px-4 text-text-muted">{row[2]}</td>
                  <td className="py-3 px-4 text-text-muted">{row[3]}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400">
                      {row[4]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="ghost" size="sm" className="mt-4">
          <Edit size={14} /> हours संपादित करें
        </Button>
      </Card>

      {/* Save status toast */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-devanagari flex items-center gap-2 shadow-lg">
          <Save size={14} />
          <span className="opacity-0 transition-opacity duration-300">सेटिंग्स सहेजी गईं</span>
        </div>
      </div>
    </motion.div>
  )
}

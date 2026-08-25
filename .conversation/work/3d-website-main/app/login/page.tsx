'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function requestOtp(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    const result = await fetch('/api/auth/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) }).then((res) => res.json())
    setMessage(result.message || result.error || 'कृपया दोबारा प्रयास करें।'); setBusy(false)
  }
  return <main className="min-h-screen bg-bg-void px-4 pb-20 pt-32"><div className="mx-auto max-w-md rounded-3xl border border-gold/20 bg-bg-purple p-8 shadow-card-lift"><p className="text-xs uppercase tracking-[0.25em] text-gold">CUSTOMER LOGIN</p><h1 className="mt-3 font-devanagari text-3xl font-bold text-champagne">फोन OTP से लॉगिन</h1><p className="mt-3 text-sm text-text-muted">आपकी booking, quotation और payments सुरक्षित रखने के लिए OTP भेजा जाएगा।</p><form onSubmit={requestOtp} className="mt-7"><label className="text-sm text-champagne">मोबाइल नंबर<input required minLength={10} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 7091514078" className="mt-2 w-full rounded-xl border border-gold/20 bg-bg-void px-4 py-3 text-text-primary outline-none focus:border-gold" /></label><button disabled={busy} className="mt-5 w-full rounded-xl bg-gold px-6 py-3 font-semibold text-bg-void disabled:opacity-50">{busy ? 'OTP भेजा जा रहा है…' : 'OTP भेजें'}</button></form>{message && <p className="mt-4 rounded-xl border border-gold/20 bg-gold/10 p-3 text-sm text-gold">{message}</p>}<Link href="/booking" className="mt-6 block text-center text-sm text-text-muted hover:text-gold">बिना लॉगिन booking जारी रखें →</Link></div></main>
}
import Link from 'next/link'
import { CalendarCheck, LogIn } from 'lucide-react'

export default function DashboardPage() {
  return <main className="min-h-screen bg-bg-void px-4 pb-20 pt-32"><div className="mx-auto max-w-5xl">
    <p className="text-xs uppercase tracking-[0.25em] text-gold">CUSTOMER SPACE</p><h1 className="mt-3 font-devanagari text-4xl font-bold text-champagne">आपका डैशबोर्ड</h1>
    <section className="mt-8 rounded-3xl border border-gold/20 bg-bg-purple p-8 md:p-12"><LogIn className="mb-5 text-gold" size={32}/><h2 className="font-devanagari text-2xl text-champagne">अपनी बुकिंग ट्रैक करने के लिए लॉगिन करें</h2><p className="mt-3 max-w-xl text-text-muted">फोन OTP से सुरक्षित लॉगिन के बाद आपको quotation, payment history और booking timeline एक ही जगह मिलेगी।</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/login" className="rounded-xl bg-gold px-6 py-3 font-semibold text-bg-void">फोन OTP से लॉगिन</Link><Link href="/booking" className="inline-flex items-center gap-2 rounded-xl border border-gold px-6 py-3 text-gold"><CalendarCheck size={18}/> नई बुकिंग करें</Link></div></section>
    <p className="mt-5 text-sm text-text-muted">Auth और customer records Supabase Auth/RLS से जुड़े हैं। Production में login button को Supabase phone OTP flow से wire किया जाएगा।</p>
  </div></main>
}
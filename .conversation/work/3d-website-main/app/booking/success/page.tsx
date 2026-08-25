import Link from 'next/link'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { businessSettings } from '@/lib/data'
import { buildWhatsAppUrl } from '@/utils/booking'

export default async function BookingSuccess({ searchParams }: { searchParams: { ref?: string } }) {
  const reference = searchParams.ref ?? 'आपकी रिक्वेस्ट'
  return <main className="min-h-screen bg-bg-void px-4 pb-20 pt-32"><div className="mx-auto max-w-xl rounded-3xl border border-gold/20 bg-bg-purple p-8 text-center shadow-card-lift md:p-12">
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold"><CheckCircle2 size={42} /></div>
    <p className="text-xs uppercase tracking-[0.25em] text-gold">REQUEST RECEIVED</p>
    <h1 className="mt-3 font-devanagari text-3xl font-bold text-champagne">बुकिंग रिक्वेस्ट भेज दी गई!</h1>
    <p className="mt-4 text-text-muted">हमारी टीम तारीख और जरूरतें रिव्यू करके आपसे 24 घंटे में संपर्क करेगी।</p>
    <div className="my-7 rounded-2xl border border-gold/20 bg-bg-void/60 p-5"><span className="text-sm text-text-muted">आपका रेफरेंस नंबर</span><strong className="mt-2 block text-xl tracking-wider text-gold">{reference}</strong></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center"><Link href="/dashboard" className="rounded-xl bg-gold px-6 py-3 font-semibold text-bg-void">मेरी बुकिंग देखें</Link><a href={buildWhatsAppUrl(businessSettings.whatsapp, `मेरी booking request ${reference} के बारे में सहायता चाहिए`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366] px-6 py-3 text-[#25D366]"><MessageCircle size={18} /> WhatsApp सपोर्ट</a></div>
  </div></main>
}
'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { businessSettings } from '@/lib/data'
import { buildWhatsAppUrl } from '@/utils/booking'

const events = [
  ['wedding', '💍', 'शादी', 'Wedding'], ['birthday', '🎂', 'जन्मदिन', 'Birthday'],
  ['anniversary', '🥂', 'एनिवर्सरी', 'Anniversary'], ['haldi', '🌼', 'हल्दी', 'Haldi'],
  ['mehendi', '🌿', 'मेहंदी', 'Mehendi'], ['car', '🚗', 'कार', 'Car'],
  ['stage', '🎭', 'स्टेज', 'Stage'], ['custom', '✦', 'अन्य', 'Other'],
] as const
const budgets = ['₹2,000 – ₹5,000', '₹5,000 – ₹10,000', '₹10,000 – ₹25,000', '₹25,000 – ₹50,000', '₹50,000+']
const styles = [['royal', '👑', 'Royal'], ['floral', '🌸', 'Floral'], ['minimal', '◌', 'Minimal'], ['traditional', '🪔', 'Traditional'], ['modern', '◇', 'Modern'], ['luxury', '✨', 'Luxury'], ['custom', '✦', 'Custom']] as const

type BookingData = {
  eventType: string; eventDate: string; city: string; area: string; address: string; venueName: string
  budget: string; customBudget: string; style: string[]; guestCount: string; venueType: string
  setting: string; requirements: string; name: string; phone: string; whatsapp: string; email: string
}
const initial: BookingData = {
  eventType: '', eventDate: '', city: 'Begusarai', area: '', address: '', venueName: '', budget: '',
  customBudget: '', style: [], guestCount: '', venueType: 'Home', setting: 'Indoor', requirements: '',
  name: '', phone: '', whatsapp: '', email: '',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-left"><span className="text-sm text-champagne font-devanagari">{label}</span>{children}</label>
}
const inputClass = 'mt-2 w-full rounded-xl border border-gold/20 bg-bg-void/60 px-4 py-3 text-text-primary placeholder:text-text-muted/60 focus:border-gold focus:outline-none'

export function BookingPlaceholder() {
  const params = useSearchParams()
  const router = useRouter()
  const prefilledEvent = params.get('eventType') ?? ''
  const sourceName = params.get('sourceName')
  const [step, setStep] = useState(0)
  const [data, setData] = useState<BookingData>({ ...initial, eventType: prefilledEvent })
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const update = (patch: Partial<BookingData>) => setData((current) => ({ ...current, ...patch }))
  const selectedEvent = events.find(([id]) => id === data.eventType)
  const whatsapp = buildWhatsAppUrl(businessSettings.whatsapp, `नमस्ते! मेरी बुकिंग के बारे में सहायता चाहिए${data.phone ? ` (${data.phone})` : ''}`)
  const steps = ['इवेंट', 'तारीख', 'लोकेशन', 'बजट', 'स्टाइल', 'डिटेल्स', 'आपकी जानकारी', 'सारांश']

  const canContinue = useMemo(() => {
    if (step === 0) return !!data.eventType
    if (step === 1) return !!data.eventDate
    if (step === 2) return !!data.city && !!data.area && !!data.address
    if (step === 3) return !!data.budget || !!data.customBudget
    if (step === 4) return data.style.length > 0
    if (step === 5) return !!data.guestCount
    if (step === 6) return !!data.name && data.phone.replace(/\D/g, '').length >= 10
    return true
  }, [data, step])

  async function submit() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/booking-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, referenceFiles: files.map((file) => file.name) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'बुकिंग भेजने में समस्या आई।')
      router.push(`/booking/success?ref=${encodeURIComponent(result.reference)}`)
    } catch (e) { setError(e instanceof Error ? e.message : 'कृपया दोबारा प्रयास करें।') }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-bg-void px-4 pb-20 pt-28">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-text-muted hover:text-gold"><ArrowLeft size={16} /> होम पर वापस जाएं</Link>
      <div className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold">MAHADEV DECORATION · BOOKING</p>
        <h1 className="font-devanagari text-3xl font-bold text-champagne md:text-5xl">अपना इवेंट बुक करें</h1>
        <p className="mt-3 text-text-muted">कुछ आसान स्टेप्स में अपनी जरूरत बताएं — हमारी टीम 24 घंटे में रिव्यू करके आपसे संपर्क करेगी।</p>
      </div>
      {sourceName && <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold">✨ {sourceName} से प्री-फिल्ड <button onClick={() => update({ eventType: '' })} aria-label="prefill हटाएं"><X size={14} /></button></div>}
      <div className="mb-8 grid grid-cols-4 gap-1 md:grid-cols-8">{steps.map((label, index) => <button key={label} onClick={() => index <= step && setStep(index)} className={`group flex flex-col items-center gap-2 text-center text-[10px] ${index <= step ? 'text-gold' : 'text-text-muted/50'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${index < step ? 'border-gold bg-gold text-bg-void' : index === step ? 'border-gold text-gold' : 'border-text-muted/30'}`}>{index < step ? <Check size={14} /> : index + 1}</span>{label}</button>)}</div>
      <motion.section key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-gold/15 bg-bg-purple/70 p-5 shadow-card-lift md:p-10">
        <p className="mb-2 text-sm text-gold">STEP {String(step + 1).padStart(2, '0')} / 08</p>
        <h2 className="mb-7 font-devanagari text-2xl font-semibold text-champagne">{steps[step]}</h2>
        {step === 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{events.map(([id, icon, hi, en]) => <button key={id} onClick={() => update({ eventType: id })} className={`rounded-2xl border p-5 text-left transition ${data.eventType === id ? 'border-gold bg-gold/15 text-gold' : 'border-gold/15 bg-bg-void/40 hover:border-gold/50'}`}><span className="text-2xl">{icon}</span><span className="mt-3 block font-devanagari">{hi}</span><small className="text-text-muted">{en}</small></button>)}</div>}
        {step === 1 && <div><Field label="इवेंट की तारीख"><input type="date" min={new Date().toISOString().split('T')[0]} value={data.eventDate} onChange={(e) => update({ eventDate: e.target.value })} className={inputClass} /></Field><div className="mt-5 flex items-center gap-3 rounded-xl border border-gold/10 bg-bg-void/40 p-4 text-sm text-text-muted"><CalendarDays className="text-gold" size={18} /> तारीख की उपलब्धता हमारी टीम आपके रिक्वेस्ट रिव्यू के दौरान कन्फर्म करेगी।</div></div>}
        {step === 2 && <div className="grid gap-5 md:grid-cols-2"><Field label="शहर"><input className={inputClass} value={data.city} onChange={(e) => update({ city: e.target.value })} placeholder="जैसे Begusarai" /></Field><Field label="एरिया / मोहल्ला"><input className={inputClass} value={data.area} onChange={(e) => update({ area: e.target.value })} placeholder="एरिया का नाम" /></Field><Field label="पूरा पता"><textarea className={`${inputClass} min-h-28`} value={data.address} onChange={(e) => update({ address: e.target.value })} placeholder="घर/हॉल का पूरा पता" /></Field><Field label="वेन्यू का नाम (वैकल्पिक)"><input className={inputClass} value={data.venueName} onChange={(e) => update({ venueName: e.target.value })} placeholder="जैसे Shagun Banquet Hall" /></Field><div className="flex items-center gap-3 text-sm text-text-muted"><MapPin className="text-gold" size={18} /> Google Maps लिंक आप बाद में सपोर्ट टीम को भेज सकते हैं।</div></div>}
        {step === 3 && <div className="grid gap-3 md:grid-cols-3">{budgets.map((budget) => <button key={budget} onClick={() => update({ budget, customBudget: '' })} className={`rounded-xl border p-5 text-left ${data.budget === budget ? 'border-gold bg-gold/15 text-gold' : 'border-gold/15 hover:border-gold/50'}`}>{budget}</button>)}<Field label="अपना बजट"><input className={inputClass} type="number" min="0" value={data.customBudget} onChange={(e) => update({ customBudget: e.target.value, budget: '' })} placeholder="₹ राशि" /></Field></div>}
        {step === 4 && <div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{styles.map(([id, icon, label]) => <button key={id} onClick={() => update({ style: data.style.includes(id) ? data.style.filter((item) => item !== id) : [...data.style, id] })} className={`rounded-2xl border p-5 text-left ${data.style.includes(id) ? 'border-gold bg-gold/15 text-gold' : 'border-gold/15 hover:border-gold/50'}`}><span className="text-2xl">{icon}</span><span className="mt-2 block">{label}</span></button>)}</div><label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gold/30 p-4 text-text-muted"><Upload size={18} className="text-gold" /> reference images जोड़ें (वैकल्पिक)<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></label>{files.length > 0 && <p className="mt-2 text-sm text-gold">{files.length} image चुनी गई</p>}</div>}
        {step === 5 && <div className="grid gap-5 md:grid-cols-2"><Field label="अनुमानित गेस्ट काउंट"><input className={inputClass} type="number" min="1" value={data.guestCount} onChange={(e) => update({ guestCount: e.target.value })} placeholder="जैसे 150" /></Field><Field label="वेन्यू टाइप"><select className={inputClass} value={data.venueType} onChange={(e) => update({ venueType: e.target.value })}><option>Home</option><option>Banquet Hall</option><option>Open Lawn</option><option>Community Hall</option><option>Other</option></select></Field><Field label="Indoor / Outdoor"><select className={inputClass} value={data.setting} onChange={(e) => update({ setting: e.target.value })}><option>Indoor</option><option>Outdoor</option><option>Both</option></select></Field><Field label="खास जरूरतें / नोट्स"><textarea className={`${inputClass} min-h-28`} value={data.requirements} onChange={(e) => update({ requirements: e.target.value })} placeholder="कलर थीम, फूल, लाइटिंग आदि" /></Field></div>}
        {step === 6 && <div className="grid gap-5 md:grid-cols-2"><Field label="आपका नाम"><input className={inputClass} value={data.name} onChange={(e) => update({ name: e.target.value })} /></Field><Field label="फोन नंबर"><input className={inputClass} type="tel" value={data.phone} onChange={(e) => update({ phone: e.target.value })} /></Field><Field label="WhatsApp नंबर (वैकल्पिक)"><input className={inputClass} type="tel" value={data.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} /></Field><Field label="ईमेल (वैकल्पिक)"><input className={inputClass} type="email" value={data.email} onChange={(e) => update({ email: e.target.value })} /></Field></div>}
        {step === 7 && <div className="space-y-3 text-sm">{[['इवेंट', `${selectedEvent?.[2] ?? ''} · ${selectedEvent?.[3] ?? ''}`], ['तारीख', data.eventDate], ['लोकेशन', `${data.venueName ? `${data.venueName}, ` : ''}${data.area}, ${data.city}`], ['बजट', data.budget || `₹${data.customBudget}`], ['स्टाइल', data.style.join(', ')], ['गेस्ट / वेन्यू', `${data.guestCount} · ${data.venueType} · ${data.setting}`], ['संपर्क', `${data.name} · ${data.phone}`]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 rounded-xl border border-gold/10 bg-bg-void/40 p-4"><span className="text-text-muted">{label}</span><strong className="text-right text-champagne">{value}</strong></div>)}</div>}
        {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-gold/10 pt-6"><button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="rounded-xl px-5 py-3 text-text-muted disabled:opacity-30">पीछे</button>{step < 7 ? <button onClick={() => setStep((value) => value + 1)} disabled={!canContinue} className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-bg-void disabled:cursor-not-allowed disabled:opacity-40">आगे बढ़ें <ArrowRight size={17} /></button> : <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-bg-void disabled:opacity-50">{busy ? 'भेजा जा रहा है…' : 'Request Booking'} <Check size={17} /></button>}</div>
      </motion.section>
      <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-5 block text-center text-sm text-text-muted hover:text-gold">तुरंत मदद चाहिए? WhatsApp पर बात करें →</a>
    </div>
  </main>
}
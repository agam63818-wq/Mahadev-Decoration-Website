'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  Clock,
  Facebook,
  Instagram,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import type { BusinessHours } from '@/types'
import { saveBusinessSettings } from './actions'

interface SettingsValues {
  phone: string
  whatsapp: string
  email: string
  address: string
  businessHours: BusinessHours[]
  socialLinks: Record<string, string>
}

interface SettingsFormProps {
  initial: SettingsValues
  supabaseReady: boolean
}

/**
 * Platforms surfaced as first-class fields. social_links itself stays an open
 * map, so anything added under "अन्य प्लेटफ़ॉर्म" works the same way without a
 * code change.
 */
const KNOWN_PLATFORMS = [
  { key: 'facebook', label: 'Facebook URL', icon: Facebook },
  { key: 'instagram', label: 'Instagram URL', icon: Instagram },
] as const

const PHONE_RE = /^\+?[\d\s-]{7,18}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SettingsForm({ initial, supabaseReady }: SettingsFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<SettingsValues>(initial)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{
    open: boolean
    type: 'success' | 'error'
    title: string
    description?: string
  }>({ open: false, type: 'success', title: '' })

  // Any platform the admin added beyond the two named ones.
  const [extraLinks, setExtraLinks] = useState<Array<{ key: string; url: string }>>(() =>
    Object.entries(initial.socialLinks ?? {})
      .filter(([k]) => !KNOWN_PLATFORMS.some((p) => p.key === k))
      .map(([key, url]) => ({ key, url })),
  )

  const incomplete =
    !values.phone.trim() || !values.whatsapp.trim() || !values.address.trim()

  function set<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function setSocial(key: string, url: string) {
    setValues((v) => ({ ...v, socialLinks: { ...v.socialLinks, [key]: url } }))
  }

  function setHour(index: number, patch: Partial<BusinessHours>) {
    setValues((v) => ({
      ...v,
      businessHours: v.businessHours.map((h, i) => (i === index ? { ...h, ...patch } : h)),
    }))
  }

  /** Client-side check mirroring the server rules, so errors surface instantly. */
  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) {
      errors.phone = 'सही फ़ोन नंबर डालें'
    }
    if (values.whatsapp.trim() && !PHONE_RE.test(values.whatsapp.trim())) {
      errors.whatsapp = 'सही WhatsApp नंबर डालें'
    }
    if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) {
      errors.email = 'सही ईमेल पता डालें'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      setToast({
        open: true,
        type: 'error',
        title: 'कुछ जानकारी सही नहीं है',
        description: 'लाल निशान वाले फ़ील्ड ठीक करके दोबारा सेव करें।',
      })
      return
    }
    setSaving(true)

    const socialLinks: Record<string, string> = {}
    for (const p of KNOWN_PLATFORMS) {
      const url = values.socialLinks[p.key]
      if (url?.trim()) socialLinks[p.key] = url.trim()
    }
    for (const { key, url } of extraLinks) {
      if (key.trim() && url.trim()) socialLinks[key.trim().toLowerCase()] = url.trim()
    }

    const result = await saveBusinessSettings({ ...values, socialLinks })
    setSaving(false)

    if (!result.ok) {
      setToast({
        open: true,
        type: 'error',
        title: 'सेव नहीं हुआ',
        description: result.error ?? 'कृपया दोबारा कोशिश करें।',
      })
      return
    }
    setToast({
      open: true,
      type: 'success',
      title: 'जानकारी सेव हो गई',
      description: 'पूरी वेबसाइट पर अपडेट हो गई — नेवबार, फुटर, संपर्क पेज, सब कुछ।',
    })
    router.refresh()
  }

  if (!supabaseReady) {
    return (
      <div className="rounded-2xl border border-gold/20 bg-bg-purple/30 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-gold" />
        <p className="font-devanagari text-text-primary">
          Supabase कॉन्फ़िगर नहीं है, इसलिए सेटिंग्स सेव नहीं हो सकतीं।
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-devanagari text-xl font-bold text-champagne">
          व्यवसाय की जानकारी
        </h2>
        <p className="font-devanagari mt-1 text-sm text-text-muted">
          यह जानकारी वेबसाइट के हर हिस्से में दिखती है — नेवबार, फुटर, संपर्क पेज और
          फ्लोटिंग बटन। एक बार बदलिए, हर जगह अपडेट हो जाएगी।
        </p>
      </div>

      {/* Reminder until phone + whatsapp + address are all filled. */}
      {incomplete && (
        <div className="flex gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
          <div>
            <p className="font-devanagari text-sm font-semibold text-champagne">
              व्यवसाय की जानकारी अधूरी है
            </p>
            <p className="font-devanagari mt-1 text-sm text-text-muted">
              फ़ोन, WhatsApp और पता — तीनों भरने तक वेबसाइट पर संपर्क बटन छिपे रहेंगे।
              हमने कोई नकली नंबर या पता नहीं डाला है, ताकि ग्राहक का भरोसा बना रहे।
            </p>
          </div>
        </div>
      )}

      {/* Contact */}
      <section className="space-y-4 rounded-2xl border border-gold/20 bg-bg-purple/25 p-6">
        <h3 className="font-devanagari flex items-center gap-2 font-semibold text-champagne">
          <Phone size={16} className="text-gold" />
          संपर्क
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="फ़ोन नंबर" hint="जैसे: 7091514078" error={fieldErrors.phone}>
            <Input
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              inputMode="tel"
              placeholder="अपना फ़ोन नंबर डालें"
            />
          </Field>
          <Field
            label="WhatsApp नंबर"
            hint="देश कोड के साथ, जैसे: 917091514078"
            error={fieldErrors.whatsapp}
          >
            <Input
              value={values.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              inputMode="tel"
              placeholder="अपना WhatsApp नंबर डालें"
            />
          </Field>
          <Field label="ईमेल" error={fieldErrors.email}>
            <Input
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              type="email"
              placeholder="info@example.com"
            />
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4 rounded-2xl border border-gold/20 bg-bg-purple/25 p-6">
        <h3 className="font-devanagari flex items-center gap-2 font-semibold text-champagne">
          <MapPin size={16} className="text-gold" />
          पता
        </h3>

        <Field
          label="स्टूडियो / दुकान का पूरा पता"
          hint="खाली रहने तक वेबसाइट पर पता नहीं दिखेगा — कोई नकली पता कभी नहीं दिखाया जाता।"
        >
          <textarea
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
            rows={3}
            className="font-devanagari w-full rounded-xl border border-gold/20 bg-bg-void/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
            placeholder="जैसे: दुकान नं. 12, मेन रोड, आपका शहर, राज्य — पिनकोड"
          />
        </Field>
      </section>

      {/* Business hours — day-by-day open/close editor */}
      <section className="space-y-4 rounded-2xl border border-gold/20 bg-bg-purple/25 p-6">
        <h3 className="font-devanagari flex items-center gap-2 font-semibold text-champagne">
          <Clock size={16} className="text-gold" />
          काम का समय
        </h3>
        <p className="font-devanagari text-xs text-text-muted">
          हर दिन का खुलने-बंद होने का समय सेट करें। बंद वाले दिन वेबसाइट पर &quot;बंद&quot; दिखेगा।
        </p>

        <div className="space-y-2">
          {values.businessHours.map((h, i) => (
            <div
              key={h.day || i}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/10 bg-bg-void/40 px-3 py-2"
            >
              <span className="font-devanagari w-24 text-sm text-text-primary">
                {h.dayHindi || h.day}
              </span>
              {h.isClosed ? (
                <span className="font-devanagari text-sm text-text-muted">बंद</span>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.open}
                    onChange={(e) => setHour(i, { open: e.target.value })}
                    aria-label={`${h.dayHindi || h.day} खुलने का समय`}
                    className="rounded-lg border border-gold/20 bg-bg-void/60 px-2 py-1 text-sm text-text-primary focus:border-gold focus:outline-none [color-scheme:dark]"
                  />
                  <span className="text-text-muted">—</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={(e) => setHour(i, { close: e.target.value })}
                    aria-label={`${h.dayHindi || h.day} बंद होने का समय`}
                    className="rounded-lg border border-gold/20 bg-bg-void/60 px-2 py-1 text-sm text-text-primary focus:border-gold focus:outline-none [color-scheme:dark]"
                  />
                </div>
              )}
              <label className="font-devanagari ml-auto inline-flex cursor-pointer items-center gap-2 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={h.isClosed}
                  onChange={(e) => setHour(i, { isClosed: e.target.checked })}
                  className="h-4 w-4 rounded border-gold/30 bg-bg-void accent-[#d4af37]"
                />
                इस दिन बंद
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="space-y-4 rounded-2xl border border-gold/20 bg-bg-purple/25 p-6">
        <h3 className="font-devanagari font-semibold text-champagne">सोशल मीडिया</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {KNOWN_PLATFORMS.map((p) => (
            <Field key={p.key} label={p.label}>
              <div className="flex items-center gap-2">
                <p.icon size={16} className="flex-shrink-0 text-gold" />
                <Input
                  value={values.socialLinks[p.key] ?? ''}
                  onChange={(e) => setSocial(p.key, e.target.value)}
                  placeholder={`https://${p.key}.com/...`}
                />
              </div>
            </Field>
          ))}
        </div>

        {/* Open map — add any platform without touching code. */}
        <div className="space-y-3 border-t border-gold/10 pt-4">
          <p className="font-devanagari text-sm text-text-muted">
            अन्य प्लेटफ़ॉर्म (जैसे youtube, x) — नाम और लिंक डालें
          </p>

          {extraLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={link.key}
                onChange={(e) => {
                  const next = [...extraLinks]
                  next[i] = { ...next[i], key: e.target.value }
                  setExtraLinks(next)
                }}
                placeholder="youtube"
                className="max-w-[160px]"
              />
              <Input
                value={link.url}
                onChange={(e) => {
                  const next = [...extraLinks]
                  next[i] = { ...next[i], url: e.target.value }
                  setExtraLinks(next)
                }}
                placeholder="https://youtube.com/@..."
              />
              <button
                type="button"
                onClick={() => setExtraLinks(extraLinks.filter((_, j) => j !== i))}
                aria-label="हटाएँ"
                className="flex-shrink-0 rounded-lg border border-red-500/25 p-2 text-red-300 transition hover:bg-red-950/40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setExtraLinks([...extraLinks, { key: '', url: '' }])}
            className="font-devanagari inline-flex items-center gap-1.5 text-sm text-gold transition hover:text-gold-warm"
          >
            <Plus size={14} />
            प्लेटफ़ॉर्म जोड़ें
          </button>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="font-devanagari inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-3 font-semibold text-bg-void transition hover:brightness-110 disabled:opacity-60"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        {saving ? 'सेव हो रहा है…' : 'सेव करें'}
      </button>

      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        type={toast.type}
        title={toast.title}
        description={toast.description}
      />
    </form>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-devanagari mb-1.5 block text-sm text-text-primary">{label}</span>
      {children}
      {error && (
        <span className="font-devanagari mt-1 block text-xs text-red-300">{error}</span>
      )}
      {!error && hint && (
        <span className="font-devanagari mt-1 block text-xs text-text-muted">{hint}</span>
      )}
    </label>
  )
}

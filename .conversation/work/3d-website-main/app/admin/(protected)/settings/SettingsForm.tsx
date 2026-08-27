'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  Facebook,
  Instagram,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { saveBusinessSettings } from './actions'

interface SettingsValues {
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  mapEmbedUrl: string
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

export function SettingsForm({ initial, supabaseReady }: SettingsFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<SettingsValues>(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

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
      setMessage({ kind: 'err', text: result.error ?? 'सेव नहीं हुआ' })
      return
    }
    setMessage({ kind: 'ok', text: 'जानकारी सेव हो गई — पूरी वेबसाइट पर अपडेट हो गई।' })
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

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-devanagari ${
            message.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'
              : 'border-red-500/30 bg-red-950/30 text-red-200'
          }`}
        >
          {message.kind === 'ok' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Contact */}
      <section className="space-y-4 rounded-2xl border border-gold/20 bg-bg-purple/25 p-6">
        <h3 className="font-devanagari flex items-center gap-2 font-semibold text-champagne">
          <Phone size={16} className="text-gold" />
          संपर्क
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="फ़ोन नंबर" hint="जैसे: 7091514078">
            <Input
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              inputMode="tel"
              placeholder="अपना फ़ोन नंबर डालें"
            />
          </Field>
          <Field label="WhatsApp नंबर" hint="देश कोड के साथ, जैसे: 917091514078">
            <Input
              value={values.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              inputMode="tel"
              placeholder="अपना WhatsApp नंबर डालें"
            />
          </Field>
          <Field label="ईमेल">
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

        <Field label="स्टूडियो / दुकान का पता">
          <textarea
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            className="font-devanagari w-full rounded-xl border border-gold/20 bg-bg-void/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
            placeholder="अपना पूरा पता डालें"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="शहर">
            <Input value={values.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="राज्य">
            <Input value={values.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="पिनकोड">
            <Input
              value={values.pincode}
              onChange={(e) => set('pincode', e.target.value)}
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field label="Google Maps embed URL (वैकल्पिक)">
          <Input
            value={values.mapEmbedUrl}
            onChange={(e) => set('mapEmbedUrl', e.target.value)}
            placeholder="https://www.google.com/maps/embed?..."
          />
        </Field>
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
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-devanagari mb-1.5 block text-sm text-text-primary">{label}</span>
      {children}
      {hint && <span className="font-devanagari mt-1 block text-xs text-text-muted">{hint}</span>}
    </label>
  )
}

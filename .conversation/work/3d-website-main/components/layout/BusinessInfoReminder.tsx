import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { getAdminUser } from '@/lib/auth/session'
import { getBusinessSettings, isBusinessInfoIncomplete } from '@/services/business'

/**
 * Subtle reminder shown ONLY to logged-in staff, and only while phone,
 * WhatsApp or address are still blank. It disappears by itself once all three
 * are filled in — regular visitors never see it.
 */
export async function BusinessInfoReminder() {
  const admin = await getAdminUser()
  if (!admin) return null

  const settings = await getBusinessSettings()
  if (!isBusinessInfoIncomplete(settings)) return null

  const missing = [
    !settings.phone?.trim() && 'फ़ोन',
    !settings.whatsapp?.trim() && 'WhatsApp',
    !settings.address?.trim() && 'पता',
  ].filter(Boolean) as string[]

  return (
    <div className="border-b border-gold/20 bg-gold/[0.07]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
        <AlertCircle size={15} className="flex-shrink-0 text-gold" />
        <span className="font-devanagari text-champagne">व्यवसाय की जानकारी जोड़ें</span>
        <span className="font-devanagari text-text-muted">
          {missing.join(', ')} अभी बाकी है — तब तक संपर्क बटन छिपे रहेंगे।
        </span>
        <Link
          href="/admin/settings"
          className="font-devanagari ml-auto whitespace-nowrap font-semibold text-gold underline decoration-gold/40 underline-offset-4 hover:text-gold-warm"
        >
          अभी जोड़ें
        </Link>
      </div>
    </div>
  )
}

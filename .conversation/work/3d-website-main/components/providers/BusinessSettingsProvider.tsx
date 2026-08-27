'use client'

import { createContext, useContext } from 'react'
import type { BusinessSettings } from '@/types'
import { businessSettings as fallbackSettings } from '@/lib/data'

// ─── Live business settings for client components ─────────────────────────────
// The root layout (a Server Component) fetches business_settings once per
// request and feeds it in here, so every client component in the tree — navbar,
// footer, floating buttons, mobile action bar — reads the SAME live values.
// One admin edit in /admin/settings therefore updates every surface at once,
// with no hardcoded phone numbers left anywhere.

const BusinessSettingsContext = createContext<BusinessSettings>(fallbackSettings)

export function BusinessSettingsProvider({
  settings,
  children,
}: {
  settings: BusinessSettings
  children: React.ReactNode
}) {
  return (
    <BusinessSettingsContext.Provider value={settings}>
      {children}
    </BusinessSettingsContext.Provider>
  )
}

export function useBusinessSettings(): BusinessSettings {
  return useContext(BusinessSettingsContext)
}

/**
 * Derived contact flags.
 *
 * Anything the admin hasn't filled in is reported as unavailable rather than
 * rendered as a broken tel:/wa.me link. Components use these to HIDE a CTA
 * instead of showing one that goes nowhere.
 */
export function useContactAvailability() {
  const settings = useBusinessSettings()
  const phone = settings.phone?.trim() ?? ''
  const whatsapp = settings.whatsapp?.trim() ?? ''
  const address = settings.address?.trim() || settings.addressHindi?.trim() || ''

  return {
    phone,
    whatsapp,
    address,
    hasPhone: phone.length > 0,
    hasWhatsapp: whatsapp.length > 0,
    hasAddress: address.length > 0,
    /** True until phone, WhatsApp and address are ALL present. */
    isIncomplete: !phone || !whatsapp || !address,
  }
}

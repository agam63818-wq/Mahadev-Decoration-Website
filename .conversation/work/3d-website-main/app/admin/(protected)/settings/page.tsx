import { getBusinessSettings } from '@/services/business'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { SettingsForm } from './SettingsForm'

export const dynamic = 'force-dynamic'

/**
 * /admin/settings — the single place the business contact info is edited.
 * Writes to business_settings, which the whole public site reads.
 */
export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings()

  return (
    <SettingsForm
      initial={{
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        pincode: settings.pincode,
        mapEmbedUrl: settings.mapEmbedUrl,
        socialLinks: settings.socialLinks as Record<string, string>,
      }}
      supabaseReady={isSupabaseConfigured()}
    />
  )
}

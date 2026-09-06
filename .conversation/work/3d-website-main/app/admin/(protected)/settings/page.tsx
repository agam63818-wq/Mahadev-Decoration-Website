import { getBusinessSettings } from '@/services/business'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { SettingsForm } from './SettingsForm'
import { TeamSettingsSection } from './TeamSettingsSection'

export const dynamic = 'force-dynamic'

/**
 * /admin/settings — the single place the business contact info and team roster
 * are edited. Both are owner-controlled business records and use the same
 * Supabase-backed CRUD as the rest of the admin.
 */
export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings()

  return (
    <div className="space-y-10">
      <SettingsForm
        initial={{
          phone: settings.phone,
          whatsapp: settings.whatsapp,
          email: settings.email,
          address: settings.address,
          businessHours: settings.businessHours,
          socialLinks: settings.socialLinks as Record<string, string>,
        }}
        supabaseReady={isSupabaseConfigured()}
      />
      <TeamSettingsSection />
    </div>
  )
}

import type { Metadata } from 'next'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import { getAllPackages } from '@/services/packages'
import { PackagesPageClient } from '@/features/packages/PackagesPageClient'

export const metadata: Metadata = {
  title: 'पैकेज — डेकोरेशन पैकेज और कीमतें',
  description:
    'महादेव डेकोरेशन के पैकेज — बर्थडे बेसिक ₹2,000 से, वेडिंग प्रीमियम ₹50,000+ तक। हर पैकेज कस्टमाइज होता है। बेगूसराय, बिहार।',
  openGraph: {
    title: 'पैकेज | महादेव डेकोरेशन',
    description: 'बजट के अनुसार डेकोरेशन पैकेज — बर्थडे से वेडिंग तक',
  },
}

// Admin-editable at /admin/packages — render on every request so admin
// changes appear on the public page immediately.
export const dynamic = 'force-dynamic'

export default async function PackagesPage() {
  const result = await getAllPackages()
  const packages = result.ok ? result.data : []

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      <div className="bg-gradient-to-b from-bg-purple to-bg-void py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading
            title="हमारे पैकेज"
            subtitle="आपके बजट और जरूरत के अनुसार — हर पैकेज कस्टमाइज होता है"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Live packages + package_items only. The previous `seedPackages`
            fallback meant a database failure still showed six packages with
            prices the owner never set — that is now an explicit error. */}
        {!result.ok ? (
          <RetryableErrorState />
        ) : packages.length === 0 ? (
          <EmptyState
            title="अभी कोई पैकेज नहीं"
            description="कस्टम कोटेशन के लिए कृपया हमसे संपर्क करें।"
          />
        ) : (
          <PackagesPageClient packages={packages} />
        )}
      </div>
    </div>
  )
}

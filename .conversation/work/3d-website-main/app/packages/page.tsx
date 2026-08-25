import type { Metadata } from 'next'
import { SectionHeading } from '@/components/ui/SectionHeading'
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

export default async function PackagesPage() {
  const packages = await getAllPackages()

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
        <PackagesPageClient packages={packages} />
      </div>
    </div>
  )
}

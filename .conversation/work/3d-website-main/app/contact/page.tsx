import type { Metadata } from 'next'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getBusinessSettings, getServiceAreas } from '@/services/business'
import { ContactPageClient } from '@/features/contact/ContactPageClient'

export const metadata: Metadata = {
  title: 'संपर्क करें — महादेव डेकोरेशन',
  description:
    'महादेव डेकोरेशन से संपर्क करें — फोन, WhatsApp, या ऑनलाइन फॉर्म से अपनी बुकिंग शुरू करें।',
  openGraph: {
    title: 'संपर्क करें | महादेव डेकोरेशन',
    description: 'फोन, WhatsApp, या ऑनलाइन फॉर्म से संपर्क करें',
  },
}

export default async function ContactPage() {
  const [business, areas] = await Promise.all([
    getBusinessSettings(),
    getServiceAreas(),
  ])

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      <div className="bg-gradient-to-b from-bg-purple to-bg-void py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading
            title="संपर्क करें"
            subtitle="हम 24/7 उपलब्ध हैं — फोन, WhatsApp, या ऑनलाइन फॉर्म से"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ContactPageClient business={business} areas={areas} />
      </div>
    </div>
  )
}

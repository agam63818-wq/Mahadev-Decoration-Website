import type { Metadata } from 'next'
import Link from 'next/link'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getAllServices } from '@/services/services'
import { ServicesGrid } from '@/features/services/ServicesGrid'

export const metadata: Metadata = {
  title: 'सर्विसेज — सभी डेकोरेशन सर्विसेज',
  description:
    'महादेव डेकोरेशन की सभी 12 सर्विसेज — वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार, मंडप, होम, फ्लावर, लाइटिंग और कस्टम डेकोरेशन। बेगूसराय, बिहार।',
  openGraph: {
    title: 'सर्विसेज | महादेव डेकोरेशन',
    description: 'बेगूसराय में सभी डेकोरेशन सर्विसेज — वेडिंग से लेकर कस्टम इवेंट तक',
  },
}

export default async function ServicesPage() {
  const services = await getAllServices()

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      {/* Page header */}
      <div className="bg-gradient-to-b from-bg-purple to-bg-void py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading
            title="हमारी सर्विसेज"
            subtitle="हर खास मौके के लिए — 12 तरह की प्रीमियम डेकोरेशन सर्विसेज"
          />
        </div>
      </div>

      {/* Services grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ServicesGrid services={services} />
      </div>

      {/* CTA */}
      <div className="bg-bg-purple/30 py-16 text-center">
        <p className="text-text-muted font-devanagari mb-6 text-lg">
          अपनी जरूरत के अनुसार कस्टम पैकेज बनवाएं
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gold text-bg-void font-semibold hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
          >
            बुकिंग करें
          </Link>
          <Link
            href="/packages"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-gold text-gold hover:bg-gold hover:text-bg-void transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
          >
            पैकेज देखें
          </Link>
        </div>
      </div>
    </div>
  )
}

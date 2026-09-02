import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FloatingActions } from '@/components/layout/FloatingActions'
import { LenisProvider } from '@/components/layout/LenisProvider'
import { PageTransition } from '@/components/layout/PageTransition'
import { BusinessInfoReminder } from '@/components/layout/BusinessInfoReminder'
import { BusinessSettingsProvider } from '@/components/providers/BusinessSettingsProvider'
import { getBusinessSettings } from '@/services/business'

// ─── Fonts ────────────────────────────────────────────────────────────────────
// Fonts are loaded via CSS @import in globals.css for build-environment
// compatibility (no outbound network in CI). In production, swap to
// next/font/google for optimal performance and subsetting.
// Font variables are defined in globals.css.

// ─── Root Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'महादेव डेकोरेशन — बेगूसराय में प्रीमियम डेकोरेशन सर्विस',
    template: '%s | महादेव डेकोरेशन',
  },
  description:
    'बेगूसराय में प्रीमियम डेकोरेशन सर्विस — वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार और हर खास अवसर के लिए शानदार सजावट। 1000+ खुश ग्राहक, 5+ वर्ष का अनुभव। अभी बुकिंग करें।',
  keywords: [
    'Decoration in Begusarai',
    'Wedding decoration Begusarai',
    'Birthday decoration Begusarai',
    'Car decoration Begusarai',
    'Stage decoration Begusarai',
    'Haldi decoration Begusarai',
    'Mehendi decoration Begusarai',
    'महादेव डेकोरेशन',
    'बेगूसराय डेकोरेशन',
    'Bihar decoration',
  ],
  authors: [{ name: 'Mahadev Decoration' }],
  creator: 'Mahadev Decoration',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mahadevdecoration.com'),
  openGraph: {
    type: 'website',
    locale: 'hi_IN',
    siteName: 'महादेव डेकोरेशन',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetched once per request and shared with every client component below, so
  // the navbar, footer, floating buttons and mobile action bar all show the
  // same live phone / WhatsApp / address from business_settings.
  const settings = await getBusinessSettings()

  return (
    <html lang="hi">
      <body className="bg-bg-void text-text-primary antialiased">
        <BusinessSettingsProvider settings={settings}>
          <LenisProvider />
          {/* Staff-only nudge while contact info is incomplete. */}
          <Suspense fallback={null}>
            <BusinessInfoReminder />
          </Suspense>
          <Navbar />
          <main id="main-content">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <FloatingActions />
        </BusinessSettingsProvider>
      </body>
    </html>
  )
}

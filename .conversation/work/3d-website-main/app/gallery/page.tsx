import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'
import { getAllPortfolioItems, getPortfolioCategories } from '@/services/portfolio'
import { GalleryPageClient } from '@/features/gallery/GalleryPageClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'गैलरी — हमारे बेहतरीन काम',
  description:
    'महादेव डेकोरेशन की गैलरी — वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार डेकोरेशन के बेहतरीन काम देखें।',
  openGraph: {
    title: 'गैलरी | महादेव डेकोरेशन',
    description: 'हमारे 1500+ इवेंट्स की झलक — हर डिजाइन एक नई कहानी',
  },
}

export default async function GalleryPage() {
  // force-dynamic + no-store queries: admin edits appear here immediately,
  // without any redeploy.
  const [itemsResult, categories] = await Promise.all([
    getAllPortfolioItems(),
    getPortfolioCategories(),
  ])

  const items = itemsResult.ok ? itemsResult.data : []

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      <div className="bg-gradient-to-b from-bg-purple to-bg-void py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading
            title="हमारी शानदार सजावट"
            subtitle="हर इवेंट एक नई कहानी — हमारे बेहतरीन कामों की झलक"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Real portfolio rows only — no static seed fallback. */}
        {!itemsResult.ok ? (
          <RetryableErrorState />
        ) : items.length === 0 ? (
          <EmptyState
            title="अभी कोई डिजाइन नहीं"
            description="गैलरी में अभी कोई तस्वीर नहीं जोड़ी गई है।"
          />
        ) : (
          <Suspense
            fallback={<div className="text-text-muted text-center py-12">लोड हो रहा है...</div>}
          >
            <GalleryPageClient items={items} categories={categories} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

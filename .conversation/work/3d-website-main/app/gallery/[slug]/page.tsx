import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPortfolioItemById } from '@/services/portfolio'
import { buildBookingUrl } from '@/utils/booking'
import { GalleryDetailClient } from '@/features/gallery/GalleryDetailClient'

// The live portfolio_items table has no slug column — the route param is the
// row `id`. force-dynamic so admin edits appear immediately (no stale SSG).
export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getPortfolioItemById(params.slug)
  if (!item) return { title: 'Not Found' }

  return {
    title: `${item.title} — गैलरी`,
    description: `${item.description} | ${item.location} | ${item.priceRange}`,
    openGraph: {
      title: `${item.title} | महादेव डेकोरेशन`,
      description: item.description,
      images: item.images[0] ? [{ url: item.images[0].url, alt: item.images[0].alt }] : [],
    },
  }
}

export default async function GalleryDetailPage({ params }: Props) {
  const item = await getPortfolioItemById(params.slug)
  if (!item) notFound()

  const bookingUrl = buildBookingUrl({
    eventType: item.eventType,
    portfolioItemId: item.id,
    sourceName: item.title,
  })

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-text-muted hover:text-gold transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          <ArrowLeft size={16} />
          <span>गैलरी पर वापस जाएं</span>
        </Link>

        <GalleryDetailClient item={item} bookingUrl={bookingUrl} />
      </div>
    </div>
  )
}

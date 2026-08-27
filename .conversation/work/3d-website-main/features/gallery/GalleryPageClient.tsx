'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { PortfolioItem, EventType } from '@/types'
import { isBookableLook } from '@/types'
import { LooksGallery } from '@/features/gallery/LooksGallery'
import { buildBookingUrl } from '@/utils/booking'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

const filterLabels: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'सभी' },
  { value: 'wedding', label: 'वेडिंग' },
  { value: 'birthday', label: 'बर्थडे' },
  { value: 'car', label: 'कार' },
  { value: 'haldi', label: 'हल्दी' },
  { value: 'mehendi', label: 'मेहंदी' },
  { value: 'stage', label: 'स्टेज' },
  { value: 'anniversary', label: 'एनिवर्सरी' },
  { value: 'mandap', label: 'मंडप' },
]

interface GalleryPageClientProps {
  items: PortfolioItem[]
}

export function GalleryPageClient({ items }: GalleryPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const typeParam = searchParams.get('type') as EventType | null
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>(typeParam ?? 'all')
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)

  useEffect(() => {
    if (typeParam) setActiveFilter(typeParam)
  }, [typeParam])

  const filtered = activeFilter === 'all' ? items : items.filter((i) => i.eventType === activeFilter)

  const handleBook = (item: PortfolioItem) => {
    router.push(buildBookingUrl({ eventType: item.eventType, portfolioItemId: item.id, sourceName: item.title }))
  }

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="गैलरी फिल्टर">
        {filterLabels.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            aria-pressed={activeFilter === f.value}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari ${
              activeFilter === f.value
                ? 'bg-gold text-bg-void shadow-gold-glow-sm'
                : 'border border-gold/30 text-text-muted hover:border-gold hover:text-champagne'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="कोई आइटम नहीं मिला"
          description="इस कैटेगरी में अभी कोई काम नहीं है। जल्द ही जोड़ा जाएगा।"
          action={
            <Button variant="secondary" size="sm" onClick={() => setActiveFilter('all')} className="font-devanagari">
              सभी देखें
            </Button>
          }
        />
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => {
              const primaryImage = item.images.find((img) => img.isPrimary) ?? item.images[0]
              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: (i % 8) * 0.04 }}
                  className="group relative overflow-hidden rounded-xl cursor-pointer border border-gold/10 hover:border-gold/40 transition-colors"
                  onClick={() => setSelectedItem(item)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.title} देखें`}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedItem(item)}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-bg-purple to-bg-burgundy">
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]"
                      style={{
                        background: [
                          'linear-gradient(135deg, #1A0B2E, #3D0F24)',
                          'linear-gradient(135deg, #0A0710, #8B1E3F)',
                          'linear-gradient(135deg, #3D0F24, #1A0B2E)',
                          'linear-gradient(135deg, #145A32, #0A0710)',
                        ][i % 4],
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <span className="text-4xl">🌸</span>
                    </div>
                    {primaryImage && (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        onError={() => {}}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-void/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-3 bg-bg-purple/80">
                    <h2 className="text-champagne text-sm font-semibold font-devanagari truncate">{item.title}</h2>
                    <p className="text-gold text-xs mt-0.5">{item.priceRange}</p>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detail modal */}
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem?.title}>
        {selectedItem && (
          <div className="p-6">
            {/* PART A: every image in this design's portfolio_media set, each with
                its own admin-set price / variant label / book button. */}
            <LooksGallery item={selectedItem} compact />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-champagne font-devanagari mb-2">{selectedItem.title}</h2>
                <p className="text-text-muted text-sm mb-1">📍 {selectedItem.location}</p>
                {!selectedItem.images.some(isBookableLook) && (
                  <p className="text-gold font-semibold mb-3">{selectedItem.priceRange}</p>
                )}
                <p className="text-text-muted text-sm leading-relaxed font-devanagari">{selectedItem.description}</p>
              </div>
              <div>
                <h3 className="text-champagne font-semibold mb-3 text-sm uppercase tracking-wider">शामिल सर्विसेज</h3>
                <ul className="space-y-1.5">
                  {selectedItem.servicesIncluded.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-text-muted text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                      <span className="font-devanagari">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gold/10 flex flex-col sm:flex-row gap-3">
              {/* When individual looks are priced, the per-look buttons above are
                  the primary CTA — this becomes a quiet custom-quote fallback. */}
              <Button
                variant={selectedItem.images.some(isBookableLook) ? 'outline' : 'primary'}
                size="lg"
                onClick={() => handleBook(selectedItem)}
                className="flex-1 font-devanagari"
              >
                {selectedItem.images.some(isBookableLook) ? 'कस्टम कोटेशन चाहिए' : 'ऐसा ही डिजाइन बुक करें'}
              </Button>
              <Link
                href={`/gallery/${selectedItem.slug}`}
                className="flex-1 inline-flex items-center justify-center px-6 py-4 rounded-xl border border-gold/30 text-text-muted hover:border-gold hover:text-gold transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                पूरी जानकारी देखें
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

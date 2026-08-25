'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { PortfolioItem, EventType } from '@/types'
import { buildBookingUrl } from '@/utils/booking'

const filterLabels: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'सभी' },
  { value: 'wedding', label: 'वेडिंग' },
  { value: 'birthday', label: 'बर्थडे' },
  { value: 'car', label: 'कार' },
  { value: 'haldi', label: 'हल्दी' },
  { value: 'mehendi', label: 'मेहंदी' },
  { value: 'stage', label: 'स्टेज' },
]

interface GalleryCardProps {
  item: PortfolioItem
  index: number
  onClick: () => void
}

function GalleryCard({ item, index, onClick }: GalleryCardProps) {
  const primaryImage = item.images.find((img) => img.isPrimary) ?? item.images[0]

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-xl cursor-pointer border border-gold/10 hover:border-gold/40 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${item.title} देखें`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-bg-purple to-bg-burgundy">
        {/* Gradient placeholder */}
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]"
          style={{
            background: [
              'linear-gradient(135deg, #1A0B2E, #3D0F24)',
              'linear-gradient(135deg, #0A0710, #8B1E3F)',
              'linear-gradient(135deg, #3D0F24, #1A0B2E)',
              'linear-gradient(135deg, #145A32, #0A0710)',
              'linear-gradient(135deg, #8B1E3F, #1A0B2E)',
              'linear-gradient(135deg, #1A0B2E, #3D0F24)',
            ][index % 6],
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <span className="text-5xl">🌸</span>
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
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-champagne text-xs font-devanagari">{item.location}</p>
        </div>
      </div>
      <div className="p-3 bg-bg-purple/80">
        <h3 className="text-champagne text-sm font-semibold font-devanagari truncate">{item.title}</h3>
        <p className="text-gold text-xs mt-0.5">{item.priceRange}</p>
      </div>
    </motion.article>
  )
}

interface GalleryDetailModalProps {
  item: PortfolioItem | null
  onClose: () => void
  onBook: (item: PortfolioItem) => void
}

function GalleryDetailModal({ item, onClose, onBook }: GalleryDetailModalProps) {
  const [activeImage, setActiveImage] = useState(0)

  if (!item) return null

  return (
    <Modal open={!!item} onClose={onClose} title={item.title}>
      <div className="p-6">
        {/* Image */}
        <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-bg-void to-bg-burgundy">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-8xl">🌸</span>
          </div>
          {item.images[activeImage] && (
            <Image
              src={item.images[activeImage].url}
              alt={item.images[activeImage].alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              onError={() => {}}
            />
          )}
        </div>

        {/* Thumbnail strip */}
        {item.images.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {item.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`तस्वीर ${i + 1} देखें`}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeImage ? 'border-gold' : 'border-transparent'
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-bg-purple to-bg-burgundy" />
              </button>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-champagne font-devanagari mb-2">{item.title}</h2>
            <p className="text-text-muted text-sm mb-1">📍 {item.location}</p>
            <p className="text-gold font-semibold mb-3">{item.priceRange}</p>
            <p className="text-text-muted text-sm leading-relaxed font-devanagari">{item.description}</p>
          </div>
          <div>
            <h3 className="text-champagne font-semibold mb-3 text-sm uppercase tracking-wider">शामिल सर्विसेज</h3>
            <ul className="space-y-1.5">
              {item.servicesIncluded.map((service) => (
                <li key={service} className="flex items-center gap-2 text-text-muted text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span className="font-devanagari">{service}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA — typed hook for Part 2 booking flow */}
        <div className="mt-6 pt-6 border-t border-gold/10">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onBook(item)}
            className="w-full font-devanagari"
          >
            ऐसा ही डिजाइन बुक करें
          </Button>
          <p className="text-text-muted text-xs text-center mt-2">
            इस डिजाइन के साथ बुकिंग फॉर्म प्री-फिल होगा
          </p>
        </div>
      </div>
    </Modal>
  )
}

interface FeaturedGallerySectionProps {
  items: PortfolioItem[]
}

export function FeaturedGallerySection({ items }: FeaturedGallerySectionProps) {
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all')
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const router = useRouter()

  const filtered = activeFilter === 'all' ? items : items.filter((i) => i.eventType === activeFilter)

  // Typed callback hook for Part 2 — navigates to /booking with prefill context
  const handleBookFromGallery = (item: PortfolioItem) => {
    const url = buildBookingUrl({
      eventType: item.eventType,
      portfolioItemId: item.id,
      sourceName: item.title,
    })
    router.push(url)
  }

  return (
    <section className="py-16 md:py-24 bg-bg-purple/30" aria-labelledby="gallery-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="gallery-heading"
          title="हमारी शानदार सजावट"
          subtitle="हमारे बेहतरीन कामों की झलक — हर इवेंट एक नई कहानी"
          className="mb-10"
        />

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8" role="group" aria-label="गैलरी फिल्टर">
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

        {/* Gallery grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <GalleryCard
                key={item.id}
                item={item}
                index={i}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View all CTA */}
        <div className="text-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/gallery')}
            className="font-devanagari"
          >
            सभी काम देखें
          </Button>
        </div>
      </div>

      {/* Detail modal */}
      <GalleryDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onBook={handleBookFromGallery}
      />
    </section>
  )
}

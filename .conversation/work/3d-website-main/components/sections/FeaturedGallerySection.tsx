'use client'

import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EASE_PREMIUM, Magnetic, Reveal } from '@/components/motion'
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
  const isFeatured = item.featured

  return (
    <motion.article
      layout
      layoutId={`gallery-card-${item.id}`}
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ duration: 0.55, delay: index * 0.05, ease: EASE_PREMIUM, layout: { duration: 0.45, ease: EASE_PREMIUM } }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer border border-gold/10 hover:border-gold/40 shadow-card-lift hover:shadow-gold-glow-sm transition-[border-color,box-shadow] duration-300"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${item.title} देखें`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.985 }}
    >
      {/* Image area — stacked gradients for depth */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-bg-purple to-bg-burgundy rounded-2xl">
        {/* Rich gradient base */}
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.08] will-change-transform rounded-2xl"
          style={{
            background: [
              'linear-gradient(135deg, #1A0B2E 0%, #2D0B1C 50%, #0D0815 100%)',
              'linear-gradient(135deg, #0D0815 0%, #3A0F24 50%, #1A0B2E 100%)',
              'linear-gradient(135deg, #2D0B1C 0%, #1A0B2E 50%, #3D0F24 100%)',
              'linear-gradient(135deg, #145A32 0%, #1A0B2E 40%, #0D0815 100%)',
              'linear-gradient(135deg, #8B1E3F 0%, #2D0B1C 50%, #1A0B2E 100%)',
              'linear-gradient(135deg, #1A0B2E 0%, #0D0815 50%, #3D0F24 100%)',
              'linear-gradient(135deg, #0D0815 0%, #2D0B1C 50%, #8B1E3F 100%)',
            ][index % 7],
          }}
        />

        {/* Decorative icon overlay — subtle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 group-hover:opacity-25 transition-opacity duration-300">
          <span className="text-6xl">🌸</span>
        </div>

        {/* Image */}
        {primaryImage && (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] will-change-transform"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={() => {}}
          />
        )}

        {/* Gradient overlays for rich text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void/85 via-bg-void/30 to-bg-void/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-rose/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Featured badge — premium gold */}
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-gold-warm/20 to-gold/10 border border-gold/30 text-gold text-xs font-devanagari font-semibold backdrop-blur-sm">
              ⭐ Featured
            </div>
          </div>
        )}

        {/* Location badge — bottom left on hover */}
        <div className="absolute bottom-3 left-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-void/80 backdrop-blur-sm border border-gold/15 text-champagne text-xs font-devanagari">
            <span>📍</span> {item.location}
          </div>
        </div>

        {/* Price — bottom right on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="bg-bg-void/80 backdrop-blur-sm border border-gold/15 px-2.5 py-1 rounded-full text-gold text-xs font-semibold font-devanagari">
            {item.priceRange}
          </span>
        </div>
      </div>

      {/* Content card below image */}
      <div className="p-3 bg-bg-void/70 border border-gold/5 rounded-b-2xl">
        <h3 className="text-champagne text-sm font-semibold font-devanagari truncate group-hover:text-gold-bright transition-colors duration-300">
          {item.title}
        </h3>
        <p className="text-gold text-xs mt-1 font-semibold">{item.priceRange}</p>
      </div>

      {/* Premium corner ornament */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-gold/10 to-transparent pointer-events-none rounded-br-2xl" />
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
    <Modal open={!!item} onClose={onClose} title={item.title} className="max-w-2xl">
      <div className="p-6 space-y-6">
        {/* Primary image — deep premium treatment */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-bg-purple to-bg-burgundy">
          <div className="absolute inset-0 bg-gradient-to-t from-bg-void/50 via-transparent to-bg-void/20 pointer-events-none" />
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
          {/* Featured label */}
          {item.featured && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-gold-warm/20 to-gold/10 border border-gold/30 text-gold text-xs font-devanagari font-semibold">
                ⭐ Featured
              </div>
            </div>
          )}
          {/* Navigation arrows */}
          {item.images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImage((i) => (i - 1 + item.images.length) % item.images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg-void/70 backdrop-blur-sm border border-gold/20 text-champagne hover:text-gold hover:border-gold flex items-center justify-center transition-all"
                aria-label="पिछली तस्वीर"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => setActiveImage((i) => (i + 1) % item.images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg-void/70 backdrop-blur-sm border border-gold/20 text-champagne hover:text-gold hover:border-gold flex items-center justify-center transition-all"
                aria-label="अगली तस्वीर"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {item.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {item.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`तस्वीर ${i + 1} देखें`}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activeImage
                    ? 'border-gold shadow-lg shadow-gold/10 scale-105'
                    : 'border-transparent hover:border-gold/30'
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-bg-purple to-bg-burgundy">
                  {item.images[i] && (
                    <Image
                      src={item.images[i].url}
                      alt={item.images[i].alt}
                      fill
                      className="object-cover"
                      onError={() => {}}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted text-sm mb-1 font-devanagari">📍 {item.location}</p>
            <p className="text-gold text-lg font-display font-bold font-devanagari mb-3">{item.priceRange}</p>
            <p className="text-text-muted text-sm leading-relaxed font-devanagari line-clamp-3">{item.description}</p>
          </div>
          <div>
            <h3 className="text-champagne font-semibold text-sm uppercase tracking-wider mb-3 font-devanagari">
              शामिल सेवाएं
            </h3>
            <ul className="space-y-1.5">
              {item.servicesIncluded.map((service) => (
                <li key={service} className="flex items-center gap-2 text-text-muted text-sm font-devanagari">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gold-warm to-gold flex-shrink-0" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-gold/10">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onBook(item)}
              className="flex-1 font-devanagari"
            >
              ऐसा ही डिजाइन बुक करें <span className="text-bg-void text-sm">→</span>
            </Button>
            <Button variant="outline" size="lg" onClick={onClose} className="flex-shrink-0">
              बाद में देखूंगा
            </Button>
          </div>
          <p className="text-text-muted text-xs text-center mt-2 font-devanagari">
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

  const handleBookFromGallery = (item: PortfolioItem) => {
    const url = buildBookingUrl({
      eventType: item.eventType,
      portfolioItemId: item.id,
      sourceName: item.title,
    })
    router.push(url)
  }

  return (
    <section className="relative py-16 md:py-24 bg-bg-purple/30 overflow-hidden" aria-labelledby="gallery-heading">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gold/3 blur-3xl pointer-events-none opacity-30" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-burgundy/5 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="gallery-heading"
          title="हमारी शानदार सजावट"
          subtitle="हमारे बेहतरीन कामों की झलक — हर इवेंट एक नई कहानी, हर फोटो एक यादगार पल"
          className="mb-10"
          align="left"
        />

        <LayoutGroup id="featured-gallery">
          {/* Filter pills — shared-layout gold indicator slides between pills */}
          <Reveal
            className="flex flex-wrap gap-2 mb-10"
            y={12}
          >
            <div className="flex flex-wrap gap-2" role="group" aria-label="गैलरी फिल्टर">
              {filterLabels.map((f) => {
                const active = activeFilter === f.value
                return (
                  <motion.button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    aria-pressed={active}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-5 py-2.5 rounded-full text-sm font-medium font-devanagari transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      active
                        ? 'text-bg-void'
                        : 'border border-gold/20 text-text-muted hover:border-gold/50 hover:text-champagne hover:bg-bg-void/50'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="featured-filter-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-warm to-gold shadow-gold-glow-sm"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {f.label}
                      {active && <span className="text-bg-void/60 text-xs">✓</span>}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </Reveal>

          {/* Gallery grid — shared-layout reflow on filter change */}
          <Reveal className="mb-10" y={24} duration={0.7}>
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout" initial={false}>
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
          </Reveal>
        </LayoutGroup>

        {/* View all CTA */}
        <Reveal className="text-center">
          <Magnetic strength={0.2}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/gallery')}
              className="font-devanagari gap-2"
            >
              <span>सभी काम देखें</span>
              <span>→</span>
            </Button>
          </Magnetic>
        </Reveal>
      </div>

      <GalleryDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onBook={handleBookFromGallery}
      />
    </section>
  )
}

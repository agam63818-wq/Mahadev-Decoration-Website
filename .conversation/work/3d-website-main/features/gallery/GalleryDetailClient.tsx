'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PortfolioItem } from '@/types'
import { Button } from '@/components/ui/Button'

interface GalleryDetailClientProps {
  item: PortfolioItem
  bookingUrl: string
}

export function GalleryDetailClient({ item, bookingUrl }: GalleryDetailClientProps) {
  const [activeImage, setActiveImage] = useState(0)

  const prev = () => setActiveImage((i) => (i - 1 + item.images.length) % item.images.length)
  const next = () => setActiveImage((i) => (i + 1) % item.images.length)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Image gallery */}
      <div>
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gold/20 bg-gradient-to-br from-bg-purple to-bg-burgundy mb-4">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-8xl">🌸</span>
          </div>
          {item.images[activeImage] && (
            <Image
              src={item.images[activeImage].url}
              alt={item.images[activeImage].alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              onError={() => {}}
            />
          )}
          {item.images.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="पिछली तस्वीर"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-gold/30 text-champagne hover:text-gold flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                aria-label="अगली तस्वीर"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-gold/30 text-champagne hover:text-gold flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {item.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {item.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`तस्वीर ${i + 1}`}
                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  i === activeImage ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-bg-purple to-bg-burgundy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold text-champagne font-devanagari mb-3">{item.title}</h1>

        <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
          <MapPin size={14} className="text-gold" />
          {item.location}
        </div>

        <div className="text-gold font-bold text-xl mb-4">{item.priceRange}</div>

        <p className="text-text-muted leading-relaxed font-devanagari mb-6">{item.description}</p>

        {/* Services included */}
        <div className="mb-6">
          <h2 className="text-champagne font-semibold mb-3 text-sm uppercase tracking-wider">शामिल सर्विसेज</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {item.servicesIncluded.map((service) => (
              <li key={service} className="flex items-center gap-2 text-text-muted text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                <span className="font-devanagari">{service}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA — typed hook for Part 2 */}
        <Link
          href={bookingUrl}
          className="block w-full text-center px-8 py-4 rounded-xl bg-gold text-bg-void font-bold text-lg hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
        >
          ऐसा ही डिजाइन बुक करें
        </Link>
        <p className="text-text-muted text-xs text-center mt-2 font-devanagari">
          इस डिजाइन के साथ बुकिंग फॉर्म प्री-फिल होगा
        </p>
      </motion.div>
    </div>
  )
}

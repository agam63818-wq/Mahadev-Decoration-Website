'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PortfolioItem } from '@/types'
import { isBookableLook } from '@/types'
import { LooksGallery } from './LooksGallery'

interface GalleryDetailClientProps {
  item: PortfolioItem
  bookingUrl: string
}

export function GalleryDetailClient({ item, bookingUrl }: GalleryDetailClientProps) {
  // When individual looks are priced, LooksGallery renders a per-look CTA next
  // to each image, so the whole-item CTA below steps back to a quieter style.
  const hasPricedLooks = item.images.some(isBookableLook)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Every look in this design, each with its own label + price */}
      <div>
        <LooksGallery item={item} />
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

        {item.priceRange && (
          <div className="text-gold font-bold text-xl mb-4">{item.priceRange}</div>
        )}

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

        {/* Whole-item CTA (custom quote when per-look prices exist) */}
        <Link
          href={bookingUrl}
          className={`block w-full text-center px-8 py-4 rounded-xl font-bold text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari ${
            hasPricedLooks
              ? 'border border-gold/40 text-gold hover:bg-gold/10'
              : 'bg-gold text-bg-void hover:bg-gold-light'
          }`}
        >
          {hasPricedLooks ? 'कस्टम कोटेशन चाहिए' : 'ऐसा ही डिजाइन बुक करें'}
        </Link>
        <p className="text-text-muted text-xs text-center mt-2 font-devanagari">
          {hasPricedLooks
            ? 'अपनी ज़रूरत के मुताबिक बदलाव चाहिए? हमें बताएँ।'
            : 'इस डिजाइन के साथ बुकिंग फॉर्म प्री-फिल होगा'}
        </p>
      </motion.div>
    </div>
  )
}

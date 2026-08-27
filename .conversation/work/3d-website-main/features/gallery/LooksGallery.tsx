'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownUp, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import type { PortfolioItem, PortfolioImage } from '@/types'
import { isBookableLook } from '@/types'
import { buildBookingUrl, formatPrice } from '@/utils/booking'

interface LooksGalleryProps {
  item: PortfolioItem
  /** Compact variant for the gallery modal; the detail page uses the full one. */
  compact?: boolean
}

type SortMode = 'curated' | 'price-asc'

/**
 * Shows EVERY image in a design's portfolio_media set as one browsable set of
 * "looks", each with its own admin-defined label and price.
 *
 * Pricing rules (per the brief):
 *  - A look with a price shows a price badge + its variant label, and gets its
 *    own "इसी लुक जैसा बुक करें" button carrying THAT image's id into booking.
 *  - A look with no price (or is_bookable = false) is just a reference photo:
 *    no badge, no button. Nothing is hardcoded — labels come from the DB.
 */
export function LooksGallery({ item, compact = false }: LooksGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sortMode, setSortMode] = useState<SortMode>('curated')

  // 'curated' = the admin's sort_order (already applied upstream).
  // 'price-asc' = सस्ता से महंगा; unpriced reference photos sink to the end.
  const images = useMemo(() => {
    if (sortMode === 'curated') return item.images
    return [...item.images].sort((a, b) => {
      const ap = a.price ?? Number.POSITIVE_INFINITY
      const bp = b.price ?? Number.POSITIVE_INFINITY
      if (ap === bp) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      return ap - bp
    })
  }, [item.images, sortMode])

  const active: PortfolioImage | undefined = images[activeIndex]
  const pricedCount = item.images.filter(isBookableLook).length

  const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length)
  const next = () => setActiveIndex((i) => (i + 1) % images.length)

  function changeSort(mode: SortMode) {
    setSortMode(mode)
    setActiveIndex(0)
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-2xl border border-gold/20 bg-gradient-to-br from-bg-purple to-bg-burgundy flex items-center justify-center">
        <p className="text-text-muted text-sm font-devanagari">तस्वीरें जल्द जोड़ी जाएँगी</p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort control — only meaningful when there are 2+ priced looks. */}
      {pricedCount > 1 && (
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownUp size={14} className="text-gold flex-shrink-0" />
          <span className="text-xs text-text-muted font-devanagari">क्रम:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => changeSort('curated')}
              className={`px-3 py-1 rounded-full text-xs font-devanagari border transition-colors ${
                sortMode === 'curated'
                  ? 'bg-gold/15 border-gold/50 text-gold'
                  : 'border-gold/20 text-text-muted hover:text-gold hover:border-gold/40'
              }`}
            >
              सुझाया गया
            </button>
            <button
              onClick={() => changeSort('price-asc')}
              className={`px-3 py-1 rounded-full text-xs font-devanagari border transition-colors ${
                sortMode === 'price-asc'
                  ? 'bg-gold/15 border-gold/50 text-gold'
                  : 'border-gold/20 text-text-muted hover:text-gold hover:border-gold/40'
              }`}
            >
              सस्ता से महंगा
            </button>
          </div>
        </div>
      )}

      {/* Active look */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-gold/20 bg-gradient-to-br from-bg-purple to-bg-burgundy mb-4 ${
          compact ? 'aspect-video' : 'aspect-[4/3]'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <span className="text-8xl">🌸</span>
        </div>

        {active && (
          <Image
            src={active.url}
            alt={active.alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={!compact}
          />
        )}

        {/* Price + label badge — only for looks the admin actually priced. */}
        {active && active.price != null && (
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-gold/50 text-gold font-bold text-sm shadow-lg">
              {formatPrice(active.price)}
            </span>
            {active.variantLabel && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-gold/25 text-champagne text-xs font-devanagari inline-flex items-center gap-1">
                <Tag size={11} className="text-gold" />
                {active.variantLabel}
              </span>
            )}
          </div>
        )}

        {/* Reference-only photo marker (no price, so nothing to book). */}
        {active && active.price == null && (
          <span className="absolute left-3 top-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-text-muted text-xs font-devanagari">
            संदर्भ तस्वीर
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="पिछला लुक"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-gold/30 text-champagne hover:text-gold flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="अगला लुक"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-gold/30 text-champagne hover:text-gold flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute right-3 bottom-3 px-2 py-0.5 rounded-full bg-black/60 text-champagne text-xs tabular-nums">
              {activeIndex + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {/* Per-look CTA for the active image */}
      {active && isBookableLook(active) && (
        <div className="mb-4">
          <Link
            href={buildBookingUrl({
              eventType: item.eventType,
              portfolioItemId: item.id,
              // The exact look — persisted as selected_portfolio_media_id.
              portfolioMediaId: active.id,
              price: active.price,
              variantLabel: active.variantLabel,
              sourceName: active.variantLabel
                ? `${item.title} — ${active.variantLabel}`
                : item.title,
            })}
            className="block w-full text-center px-6 py-3.5 rounded-xl bg-gold text-bg-void font-bold hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
          >
            इसी लुक जैसा बुक करें
            <span className="font-normal"> · {formatPrice(active.price!)}</span>
          </Link>
          <p className="text-text-muted text-xs text-center mt-2 font-devanagari">
            बुकिंग फॉर्म इसी लुक के साथ प्री-फिल होगा
          </p>
        </div>
      )}

      {/* Thumbnail strip — every look, with its price under it */}
      {images.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => {
            const bookable = isBookableLook(img)
            return (
              <button
                key={img.id ?? i}
                onClick={() => setActiveIndex(i)}
                aria-label={
                  img.variantLabel
                    ? `${img.variantLabel}${img.price != null ? ` — ${formatPrice(img.price)}` : ''}`
                    : `लुक ${i + 1}`
                }
                aria-current={i === activeIndex}
                className={`group text-left rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  i === activeIndex
                    ? 'border-gold'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:border-gold/40'
                }`}
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-bg-purple to-bg-burgundy">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                  {img.price != null && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-gold text-[10px] font-bold">
                      {formatPrice(img.price)}
                    </span>
                  )}
                </div>
                <div className="px-1.5 py-1 bg-bg-void/60">
                  <p className="text-[11px] text-champagne font-devanagari truncate">
                    {img.variantLabel || (bookable ? 'लुक' : 'संदर्भ')}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Explain the mix when some photos are reference-only. */}
      {pricedCount > 0 && pricedCount < item.images.length && (
        <p className="text-text-muted/80 text-xs mt-3 font-devanagari">
          कुछ तस्वीरें केवल संदर्भ के लिए हैं — उनकी अलग कीमत नहीं है।
        </p>
      )}
    </div>
  )
}

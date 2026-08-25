'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SectionFlourish } from '@/components/ui/SectionFlourish'
import { StatBadge } from '@/components/ui/StatBadge'
import { heroStats, businessSettings } from '@/lib/data'
import { buildWhatsAppUrl } from '@/utils/booking'

// Hero carousel images — swap URLs from portfolio manager without touching this component
const heroImages = [
  {
    url: '/images/hero/hero-1.jpg',
    alt: 'महादेव डेकोरेशन — बेगूसराय में शाही वेडिंग मंडप, फूलों की सजावट और गोल्डन लाइटिंग',
  },
  {
    url: '/images/hero/hero-2.jpg',
    alt: 'महादेव डेकोरेशन — भव्य स्टेज डेकोरेशन, LED बैकड्रॉप और फ्लोरल आर्रेंजमेंट',
  },
  {
    url: '/images/hero/hero-3.jpg',
    alt: 'महादेव डेकोरेशन — हल्दी सेरेमनी डेकोरेशन, मैरीगोल्ड और पारंपरिक सजावट',
  },
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const whatsappUrl = buildWhatsAppUrl(
    businessSettings.whatsapp,
    'नमस्ते! मुझे डेकोरेशन बुकिंग के बारे में जानकारी चाहिए।'
  )

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused])

  const prev = () => setCurrentSlide((s) => (s - 1 + heroImages.length) % heroImages.length)
  const next = () => setCurrentSlide((s) => (s + 1) % heroImages.length)

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-bg-void"
      aria-label="हीरो सेक्शन"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-void via-bg-purple to-bg-burgundy opacity-90" />

      {/* Decorative bokeh dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold opacity-5 animate-float-slow"
            style={{
              width: `${Math.random() * 80 + 20}px`,
              height: `${Math.random() * 80 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 4 + 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">

          {/* Left column — text content */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <SectionFlourish align="left" />
            </motion.div>

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="text-gold text-sm md:text-base font-medium font-devanagari tracking-wide"
            >
              {businessSettings.tagline}
            </motion.p>

            {/* Main heading */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            >
              <h1 className="font-display font-bold leading-none">
                <span className="block text-6xl md:text-7xl lg:text-8xl bg-gradient-to-r from-champagne via-gold to-champagne bg-clip-text text-transparent font-devanagari">
                  महादेव
                </span>
                <span className="block text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent font-devanagari">
                  डेकोरेशन
                </span>
              </h1>
            </motion.div>

            {/* Supporting text */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
              className="text-text-muted text-base md:text-lg leading-relaxed max-w-md font-devanagari"
            >
              वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार और हर खास अवसर के लिए शानदार सजावट।
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
              className="flex flex-wrap gap-3"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => (window.location.href = '/booking')}
                className="font-devanagari"
              >
                बुकिंग करें
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => (window.location.href = '/gallery')}
                className="font-devanagari"
              >
                हमारा काम देखें
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#25D366] text-white font-medium text-lg hover:bg-[#20BA5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void"
              >
                <MessageCircle size={20} />
                <span className="font-devanagari">WhatsApp करें</span>
              </a>
            </motion.div>
          </div>

          {/* Right column — hero image carousel */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="relative aspect-[4/3] lg:aspect-[3/2] rounded-2xl overflow-hidden border border-gold/20 shadow-card-lift"
            >
              {heroImages.map((img, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    i === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Gradient placeholder — real photo swappable from data layer */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: [
                        'linear-gradient(135deg, #1A0B2E 0%, #3D0F24 40%, #D4AF37 100%)',
                        'linear-gradient(135deg, #0A0710 0%, #1A0B2E 50%, #8B1E3F 100%)',
                        'linear-gradient(135deg, #3D0F24 0%, #D4AF37 30%, #1A0B2E 100%)',
                      ][i],
                    }}
                  />
                  {/* Decorative overlay pattern */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center opacity-30">
                      <div className="text-8xl mb-4">🌸</div>
                      <div className="text-gold text-sm font-devanagari">{img.alt.split('—')[1]?.trim()}</div>
                    </div>
                  </div>
                  {/* Actual image — will show when real photos are added */}
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    priority={i === 0}
                    onError={() => {}} // Silently fall back to gradient
                  />
                </div>
              ))}

              {/* Gold border glow */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-gold/30 pointer-events-none" />

              {/* Carousel controls */}
              <button
                onClick={prev}
                aria-label="पिछली तस्वीर"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-gold/30 text-champagne hover:text-gold hover:border-gold flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                aria-label="अगली तस्वीर"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-gold/30 text-champagne hover:text-gold hover:border-gold flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ChevronRight size={18} />
              </button>

              {/* Slide indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    aria-label={`स्लाइड ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      i === currentSlide ? 'w-6 bg-gold' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Far right — vertical stat rail */}
          <div className="hidden lg:flex lg:col-span-1 flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
              className="bg-black/40 backdrop-blur-sm border border-gold/20 rounded-2xl overflow-hidden"
            >
              {heroStats.map((stat, i) => (
                <StatBadge key={stat.id} stat={stat} variant="rail" index={i} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Mobile stat row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
          className="lg:hidden mt-8 grid grid-cols-3 gap-4"
        >
          {heroStats.map((stat, i) => (
            <StatBadge key={stat.id} stat={stat} variant="bar" index={i} />
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-void to-transparent pointer-events-none" />
    </section>
  )
}

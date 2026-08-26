'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatBadge } from '@/components/ui/StatBadge'
import { heroStats, businessSettings } from '@/lib/data'
import { buildWhatsAppUrl } from '@/utils/booking'

// ─── Hero images ──────────────────────────────────────────────────────────────
const heroImages = [
  {
    url: '/assets/car-decoration-hero.png',
    alt: 'महादेव डेकोरेशन — बेगूसराय में शाही कार डेकोरेशन, फूलों और गोल्डन लाइटिंग से सजाई गई विशेष कार',
  },
  {
    url: '/assets/flower-arch-hero.png',
    alt: 'महादेव डेकोरेशन — भव्य वेडिंग आर्क, फूलों की सजावट और गोल्डन लाइटिंग के साथ शानदार मंडप',
  },
  {
    url: '/assets/stage.png',
    alt: 'महादेव डेकोरेशन — स्टेज डेकोरेशन, LED बैकड्रॉप और फ्लोरल आर्रेंजमेंट के साथ शाही मंच',
  },
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const whatsappUrl = buildWhatsAppUrl(
    businessSettings.whatsapp,
    'नमस्ते! मुझे डेकोरेशन बुकिंग के बारे में जानकारी चाहिए।'
  )

  // Auto-advance
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [isPaused])

  const prev = () => setCurrentSlide((s) => (s - 1 + heroImages.length) % heroImages.length)
  const next = () => setCurrentSlide((s) => (s + 1) % heroImages.length)

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      aria-label="हीरो सेक्शन"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Layered background gradients (premium depth) ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-void via-bg-rich to-bg-deep-red opacity-95" />
      <div className="absolute inset-0 bg-gradient-to-tl from-gold/5 via-transparent to-rose/5 pointer-events-none" />

      {/* ── Deep radial glow behind hero image ── */}
      <div className="absolute -right-40 -top-40 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-40 bottom-20 w-[400px] h-[400px] rounded-full bg-burgundy/10 blur-3xl pointer-events-none" />

      {/* ── Decorative floating bokeh ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold animate-float-slow"
            style={{
              width: `${Math.random() * 60 + 10}px`,
              height: `${Math.random() * 60 + 10}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 6 + 5}s`,
            }}
          />
        ))}
      </div>

      {/* ── Rich scrolling grain overlay ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

          {/* ── Left column — text ── */}
          <div className="lg:col-span-5 flex flex-col gap-7">
            {/* Eyebrow — small gold flourish */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex items-center gap-3"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
              <Sparkles size={14} className="text-gold flex-shrink-0" />
              <p className="text-gold text-sm font-medium tracking-wider uppercase font-devanagari">
                {businessSettings.tagline}
              </p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
            </motion.div>

            {/* Main heading — dramatic gold gradient */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            >
              <h1 className="font-display font-bold leading-[0.92] tracking-tight">
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl bg-gradient-to-r from-champagne via-gold-bright to-champagne bg-clip-text text-transparent font-devanagari hero-text-sheen">
                  महादेव
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-gold-warm via-gold to-gold-bright bg-clip-text text-transparent font-devanagari">
                  डेकोरेशन
                </span>
              </h1>
            </motion.div>

            {/* Subtle decorative trishul between words */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="flex justify-center py-1"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gold">
                <path d="M12 22V8M12 8C12 8 8 6 8 3C8 1.5 9.5 1 12 1C14.5 1 16 1.5 16 3C16 6 12 8 12 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 8C8 8 5 7 5 4.5C5 3 6 2.5 8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 8C16 8 19 7 19 4.5C19 3 18 2.5 16 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12" y1="22" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </motion.div>

            {/* Supporting text */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
              className="text-text-muted text-base md:text-lg leading-relaxed max-w-md font-devanagari"
            >
              वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार और हर खास अवसर के लिए
              शानदार सजावट — बेगूसराय से पूरे बिहार तक।
            </motion.p>

            {/* CTA buttons — premium stack */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35, ease: 'easeOut' }}
              className="flex flex-wrap gap-3"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => (window.location.href = '/booking')}
                className="font-devanagari px-8 text-base"
              >
                बुकिंग करें <span className="text-bg-void text-sm font-normal">→</span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => (window.location.href = '/gallery')}
                className="font-devanagari px-8 text-base"
              >
                हमारा काम देखें <span className="text-gold-dim text-sm font-normal">↓</span>
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-base hover:bg-[#20BA5A] transition-all duration-200 shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void"
              >
                <MessageCircle size={18} />
                <span className="font-devanagari">WhatsApp करें</span>
              </a>
            </motion.div>
          </div>

          {/* ── Right column — hero image carousel ── */}
          <div className="lg:col-span-7 relative">
            {/* Card frame with premium border glow */}
            <div className="relative rounded-3xl border border-gold/20 shadow-card-lift overflow-hidden bg-bg-void/80">
              {/* Inner gold inset frame */}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-gold/20 pointer-events-none" />

              <AnimatePresence mode="wait">
                {heroImages.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: i === currentSlide ? 1 : 0, scale: i === currentSlide ? 1 : 0.96 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      i === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {/* Gradient layer under image for richness */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: [
                          'linear-gradient(135deg, #0D0815 0%, #1A0B2E 40%, #2D0B1C 100%)',
                          'linear-gradient(135deg, #0A0710 0%, #1A0B2E 50%, #3A0F24 100%)',
                          'linear-gradient(135deg, #1A0B2E 0%, #2D0B1C 40%, #0D0815 100%)',
                        ][i],
                      }}
                    />
                    {/* Image */}
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover transition-transform duration-700"
                      priority={i === 0}
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      onError={() => {}}
                    />
                    {/* Rich gradient overlay for text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-void/70 via-transparent to-bg-void/20 pointer-events-none" />
                    {/* Center decorative stamp */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center opacity-20 select-none">
                        <div className="text-7xl mb-2">🌸</div>
                        <p className="text-gold text-sm font-devanagari tracking-wide">
                          {img.alt.split('—')[1]?.trim() ?? ''}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Carousel controls — premium floating */}
              <button
                onClick={prev}
                aria-label="पिछली तस्वीर"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-bg-void/70 backdrop-blur-sm border border-gold/30 text-champagne hover:text-gold hover:border-gold hover:bg-bg-void/90 flex items-center justify-center transition-all duration-200 shadow-lg"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                aria-label="अगली तस्वीर"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-bg-void/70 backdrop-blur-sm border border-gold/30 text-champagne hover:text-gold hover:border-gold hover:bg-bg-void/90 flex items-center justify-center transition-all duration-200 shadow-lg"
              >
                <ChevronRight size={18} />
              </button>

              {/* Slide indicators — premium pill style */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    aria-label={`स्लाइड ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      i === currentSlide
                        ? 'w-8 bg-gold shadow-lg shadow-gold/30'
                        : 'w-1.5 bg-white/25 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Far right — vertical stat rail ── */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-end justify-center">
            <div className="bg-bg-void/80 backdrop-blur-sm border border-gold/15 rounded-2xl overflow-hidden shadow-lg">
              {heroStats.map((stat, i) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.12, ease: 'easeOut' }}
                  className="px-3 py-4 border-b border-gold/10 last:border-b-0"
                >
                  <StatBadge stat={stat} variant="rail" index={i} compact />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile stat row — more premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65, ease: 'easeOut' }}
          className="lg:hidden mt-8 grid grid-cols-3 gap-4"
        >
          {heroStats.map((stat, i) => (
            <StatBadge key={stat.id} stat={stat} variant="bar" index={i} />
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-void to-transparent pointer-events-none" />
    </section>
  )
}

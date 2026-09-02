'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ChevronDown, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatBadge } from '@/components/ui/StatBadge'
import { Magnetic, TextReveal, EASE_PREMIUM, useIsDesktopPointer } from '@/components/motion'
import { heroStats } from '@/lib/data'
import { useBusinessSettings, useContactAvailability } from '@/components/providers/BusinessSettingsProvider'
import { buildWhatsAppUrl } from '@/utils/booking'

// ─── Cinematic video hero ─────────────────────────────────────────────────────
// Full-bleed, muted, looping showreel of a real decorated stage sits behind the
// headline. The poster frame paints instantly (so nothing is ever blank), the
// video fades in once it can play, and a slow ambient zoom + mouse parallax
// keep it alive. Everything degrades gracefully: reduced-motion users get the
// still poster, mobile skips parallax/particles, and if the video fails the
// poster stays.

const HERO_VIDEO = '/video/hero.mp4'
const HERO_POSTER = '/video/hero-poster.jpg'

const PETAL_COUNT = 14

function FloatingPetals() {
  const reduce = useReducedMotion()
  const [petals, setPetals] = useState<
    Array<{ left: number; size: number; delay: number; duration: number; drift: number; opacity: number }>
  >([])

  // Randomise on the client only so SSR markup stays deterministic.
  useEffect(() => {
    setPetals(
      Array.from({ length: PETAL_COUNT }, () => ({
        left: Math.random() * 100,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 12,
        duration: 14 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 120,
        opacity: 0.35 + Math.random() * 0.4,
      })),
    )
  }, [])

  if (reduce || petals.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block" aria-hidden="true">
      {petals.map((p, i) => (
        <motion.span
          key={i}
          className="absolute -top-8 block rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.7,
            background:
              i % 3 === 0
                ? 'radial-gradient(circle at 30% 30%, #F5E8D0, #C9A84C)'
                : i % 3 === 1
                  ? 'radial-gradient(circle at 30% 30%, #FFD6E0, #E8A0B4)'
                  : 'radial-gradient(circle at 30% 30%, #FFE9A8, #D4AF37)',
            boxShadow: '0 0 10px rgba(212,175,55,0.35)',
            opacity: p.opacity,
          }}
          initial={{ y: -40, x: 0, rotate: 0 }}
          animate={{
            y: ['-5vh', '110vh'],
            x: [0, p.drift, -p.drift * 0.5, p.drift * 0.3],
            rotate: [0, 180, 360, 540],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.33, 0.66, 1],
          }}
        />
      ))}
    </div>
  )
}

export function HeroSection() {
  const reduce = useReducedMotion()
  const desktop = useIsDesktopPointer()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  const businessSettings = useBusinessSettings()
  const { whatsapp, hasWhatsapp } = useContactAvailability()
  const whatsappUrl = buildWhatsAppUrl(whatsapp, 'नमस्ते! मुझे डेकोरेशन बुकिंग के बारे में जानकारी चाहिए।')

  // ── Mouse parallax (desktop only) ──
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 40, damping: 20 })
  const py = useSpring(my, { stiffness: 40, damping: 20 })
  const bgX = useTransform(px, (v) => v * -18)
  const bgY = useTransform(py, (v) => v * -12)
  const fgX = useTransform(px, (v) => v * 10)
  const fgY = useTransform(py, (v) => v * 8)

  // ── Scroll parallax: video drifts slower than content, fades as you leave ──
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  useEffect(() => {
    if (!desktop || reduce) return
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [desktop, reduce, mx, my])

  // Autoplay is best-effort; the poster is always there underneath.
  useEffect(() => {
    const v = videoRef.current
    if (!v || reduce) return
    const tryPlay = () => v.play().catch(() => {})
    if (v.readyState >= 3) tryPlay()
    else v.addEventListener('canplay', tryPlay, { once: true })
    return () => v.removeEventListener('canplay', tryPlay)
  }, [reduce])

  const parallaxEnabled = desktop && !reduce

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-bg-void"
      aria-label="हीरो सेक्शन"
    >
      {/* ── Video / poster layer ── */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{
          y: reduce ? 0 : videoY,
          x: parallaxEnabled ? bgX : 0,
        }}
      >
        <motion.div
          className="absolute -inset-[6%]"
          initial={reduce ? false : { scale: 1.08 }}
          animate={reduce ? undefined : { scale: [1.08, 1.16, 1.08] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          style={{ y: parallaxEnabled ? bgY : 0 }}
        >
          {/* Poster paints instantly, video fades over it */}
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img so the poster paints before hydration, behind the video */}
          <img
            src={HERO_POSTER}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover hero-media"
            fetchPriority="high"
            decoding="async"
          />
          {!reduce && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 hero-media"
              style={{ opacity: videoReady ? 1 : 0 }}
              src={HERO_VIDEO}
              poster={HERO_POSTER}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              disablePictureInPicture
              onPlaying={() => setVideoReady(true)}
              onError={() => setVideoReady(false)}
              aria-hidden="true"
              tabIndex={-1}
            />
          )}
        </motion.div>

        {/* Cinematic grading — deliberately light so the decoration footage
            stays visible (especially on phones). Legibility comes from the
            soft scrim behind the copy, not from blacking out the whole frame. */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-void/70 via-bg-void/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void/85 via-transparent to-bg-void/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,4,12,0.35)_100%)]" />
        {/* Warm gold wash instead of a purple multiply — lifts, not dims */}
        <div className="absolute inset-0 mix-blend-soft-light bg-gradient-to-br from-gold/25 via-transparent to-floral-red/20" />

        {/* Fine grain */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          aria-hidden="true"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            backgroundSize: '220px',
          }}
        />
      </motion.div>

      {/* ── Drifting petals / light motes ── */}
      <FloatingPetals />

      {/* ── Gold light sweeps ── */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden="true"
            className="absolute -top-1/3 right-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-gold/10 blur-[120px] pointer-events-none"
            animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute -bottom-1/4 -left-[10%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full bg-floral-red/15 blur-[120px] pointer-events-none"
            animate={{ opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </>
      )}

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 w-full"
        style={{
          y: reduce ? 0 : contentY,
          opacity: reduce ? 1 : contentOpacity,
          x: parallaxEnabled ? fgX : 0,
        }}
      >
        <motion.div style={{ y: parallaxEnabled ? fgY : 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          {/* Left — headline. `hero-copy-scrim` adds a soft local shadow behind
              the text so it reads over bright footage without darkening the frame. */}
          <div className="lg:col-span-8 flex flex-col gap-6 hero-copy-scrim">
            {/* Eyebrow */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_PREMIUM }}
              className="flex items-center gap-3"
            >
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/70" />
              <Sparkles size={14} className="text-gold flex-shrink-0" />
              <p className="text-gold text-xs sm:text-sm font-medium tracking-[0.2em] uppercase font-devanagari">
                {businessSettings.tagline}
              </p>
            </motion.div>

            {/* Headline — word reveal */}
            <h1 className="font-display font-bold leading-[0.95] tracking-tight">
              <TextReveal
                as="span"
                immediate
                delay={0.15}
                stagger={0.12}
                text="महादेव डेकोरेशन"
                className="block text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] font-devanagari pb-2"
                wordClassName="bg-gradient-to-r from-champagne via-gold-bright to-champagne bg-clip-text text-transparent hero-text-sheen"
              />
              <TextReveal
                as="span"
                immediate
                delay={0.5}
                stagger={0.07}
                text="हर खुशी को बनाएं यादगार"
                className="block mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-champagne/90 font-devanagari font-semibold"
              />
            </h1>

            {/* Supporting text */}
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: EASE_PREMIUM }}
              className="text-text-muted text-base md:text-lg leading-relaxed max-w-xl font-devanagari"
            >
              वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार और हर खास अवसर के लिए
              शानदार सजावट — बेगूसराय से पूरे बिहार तक।
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.05, ease: EASE_PREMIUM }}
              className="flex flex-wrap gap-3 pt-1"
            >
              <Magnetic>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => (window.location.href = '/booking')}
                  className="font-devanagari px-8 text-base shadow-gold-glow"
                >
                  बुकिंग करें <span className="text-bg-void text-sm font-normal">→</span>
                </Button>
              </Magnetic>
              <Magnetic strength={0.18}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => (window.location.href = '/gallery')}
                  className="font-devanagari px-8 text-base backdrop-blur-md bg-bg-void/40"
                >
                  हमारा काम देखें <span className="text-gold-dim text-sm font-normal">↓</span>
                </Button>
              </Magnetic>
              {hasWhatsapp && (
                <Magnetic strength={0.18}>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-base hover:bg-[#20BA5A] transition-all duration-200 shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void"
                  >
                    <MessageCircle size={18} />
                    <span className="font-devanagari">WhatsApp करें</span>
                  </a>
                </Magnetic>
              )}
            </motion.div>
          </div>

          {/* Right — glass stat rail */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: EASE_PREMIUM }}
            className="hidden lg:flex lg:col-span-4 justify-end"
          >
            <div className="bg-bg-void/55 backdrop-blur-xl border border-gold/20 rounded-2xl overflow-hidden shadow-card-lift-lg w-full max-w-xs">
              <div className="h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              {heroStats.map((stat, i) => (
                <div key={stat.id} className="px-4 py-4 border-b border-gold/10 last:border-b-0">
                  <StatBadge stat={stat} variant="rail" index={i} compact />
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile stat row */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2, ease: EASE_PREMIUM }}
          className="lg:hidden mt-10 grid grid-cols-3 gap-3"
        >
          {heroStats.map((stat, i) => (
            <StatBadge key={stat.id} stat={stat} variant="bar" index={i} className="backdrop-blur-md" />
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll cue ── */}
      <motion.a
        href="#trust"
        aria-label="नीचे स्क्रॉल करें"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 text-gold/70 hover:text-gold transition-colors"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </motion.a>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-void via-bg-void/50 to-transparent pointer-events-none" />
    </section>
  )
}

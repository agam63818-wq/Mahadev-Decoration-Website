'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircle, ArrowRight, Sparkles, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Magnetic, Reveal, TextReveal } from '@/components/motion'
import { useBusinessSettings, useContactAvailability } from '@/components/providers/BusinessSettingsProvider'
import { buildWhatsAppUrl } from '@/utils/booking'

// Deterministic bokeh positions (no Math.random in render → no hydration mismatch)
const BOKEH = Array.from({ length: 10 }, (_, i) => {
  const t = (i * 137.508) % 360 // golden angle spread
  return {
    size: 24 + ((i * 37) % 70),
    left: (t / 360) * 100,
    top: ((i * 53) % 100),
    delay: (i % 5) * 1.1,
    duration: 7 + (i % 4) * 1.5,
  }
})

export function FinalCTASection() {
  const reduce = useReducedMotion()
  // Live from business_settings — one admin edit updates every CTA.
  const businessSettings = useBusinessSettings()
  const { phone, whatsapp, hasPhone, hasWhatsapp } = useContactAvailability()
  const whatsappUrl = buildWhatsAppUrl(
    whatsapp,
    'नमस्ते! मुझे अपने इवेंट के लिए डेकोरेशन बुक करनी है।'
  )

  return (
    <section
      className="relative py-20 md:py-32 overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Rich layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-void via-bg-purple to-bg-deep-red opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-tl from-gold/8 via-transparent to-rose/8 pointer-events-none" />

      {/* Deep radial glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] rounded-full bg-burgundy/10 blur-3xl pointer-events-none" />

      {/* Decorative floating bokeh */}
      {!reduce && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block" aria-hidden="true">
          {BOKEH.map((b, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gold opacity-[0.06] blur-[2px] animate-float-slow"
              style={{
                width: `${b.size}px`,
                height: `${b.size}px`,
                left: `${b.left}%`,
                top: `${b.top}%`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Marble texture accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '150px' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Rich gold divider — elegant */}
        <Reveal className="flex items-center justify-center gap-4 mb-8" y={10}>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-12 h-px origin-right bg-gradient-to-r from-transparent to-gold/60"
          />
          <motion.div
            animate={reduce ? undefined : { rotate: [0, 12, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-warm/30 to-bg-void/5 border border-gold/30 flex items-center justify-center shadow-gold-glow-sm"
          >
            <Sparkles size={16} className="text-gold" />
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-12 h-px origin-left bg-gradient-to-l from-transparent to-gold/60"
          />
        </Reveal>

        {/* Heading — premium gold gradient — large */}
        <h2
          id="final-cta-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold font-devanagari mb-4 leading-tight"
        >
          <TextReveal
            as="span"
            text="आपका अगला खास दिन"
            className="block"
            wordClassName="gradient-gold-text"
            stagger={0.08}
          />
          <TextReveal
            as="span"
            text="और भी खूबसूरत बनाते हैं।"
            className="block"
            wordClassName="gradient-gold-text"
            stagger={0.08}
            delay={0.35}
          />
        </h2>

        {/* Subtitle — elegant */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="text-text-muted text-base md:text-lg font-devanagari mb-8 max-w-2xl mx-auto"
        >
          <span className="text-champagne font-medium">{businessSettings.taglineSecondary}</span>
        </motion.p>

        {/* Action buttons — premium stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Magnetic strength={0.25}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => (window.location.href = '/booking')}
              className="font-devanagari text-lg px-10 gap-2 shadow-gold-glow hover:shadow-gold-glow-lg"
              glow
            >
              <span>बुकिंग शुरू करें</span>
              <span className="text-bg-void text-sm font-normal">→</span>
            </Button>
          </Magnetic>

          {hasWhatsapp && (
          <Magnetic strength={0.2}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold text-lg hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void group"
          >
            <span>
              <span className="flex items-center gap-2">
                <MessageCircle size={20} className="text-white/90 group-hover:text-white transition-colors" />
                <span className="font-devanagari">WhatsApp करें</span>
              </span>
              <span className="text-white/70 text-sm font-normal">(24/7)</span>
            </span>
            <ArrowRight
              size={18}
              className="text-white/70 group-hover:text-white transition-all group-hover:translate-x-1"
            />
          </a>
          </Magnetic>
          )}
        </motion.div>

        {/* Phone + Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-text-muted text-sm mt-6 font-devanagari flex items-center justify-center gap-2 flex-wrap"
        >
          {hasPhone && (
            <>
              <span className="flex items-center gap-1">
                <span className="text-gold">📞</span> {phone}
              </span>
              <span className="text-gold/40">|</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <Heart size={14} className="text-rose fill-rose/30" />
            100% ग्राहक संतुष्टि
          </span>
        </motion.p>
      </div>
    </section>
  )
}

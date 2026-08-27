'use client'

import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight, Sparkles, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useBusinessSettings, useContactAvailability } from '@/components/providers/BusinessSettingsProvider'
import { buildWhatsAppUrl } from '@/utils/booking'

export function FinalCTASection() {
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold opacity-5 animate-float-slow"
            style={{
              width: `${Math.random() * 80 + 20}px`,
              height: `${Math.random() * 80 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 5 + 6}s`,
            }}
          />
        ))}
      </div>

      {/* Marble texture accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '150px' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Rich gold divider — elegant */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/60" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-warm/30 to-bg-void/5 border border-gold/30 flex items-center justify-center shadow-lg shadow-gold/10">
            <Sparkles size={16} className="text-gold" />
          </div>
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/60" />
        </div>

        {/* Heading — premium gold gradient — large */}
        <motion.h2
          id="final-cta-heading"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold font-devanagari mb-4 leading-tight text-gradient-gold"
        >
          आपका अगला खास दिन
          <br />
          और भी खूबसूरत बनाते हैं।
        </motion.h2>

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
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => (window.location.href = '/booking')}
            className="font-devanagari text-lg px-10 gap-2"
            glow
          >
            <span>बुकिंग शुरू करें</span>
            <span className="text-bg-void text-sm font-normal">→</span>
          </Button>

          {hasWhatsapp && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold text-lg hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 shadow-lg shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void group"
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

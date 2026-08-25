'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { businessSettings } from '@/lib/data'
import { buildWhatsAppUrl } from '@/utils/booking'

export function FinalCTASection() {
  const whatsappUrl = buildWhatsAppUrl(
    businessSettings.whatsapp,
    'नमस्ते! मुझे अपने इवेंट के लिए डेकोरेशन बुक करनी है।'
  )

  return (
    <section
      className="relative py-20 md:py-32 overflow-hidden bg-bg-void"
      aria-labelledby="final-cta-heading"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-void via-bg-purple to-bg-burgundy opacity-80" />

      {/* Decorative bokeh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold opacity-5 animate-float-slow"
            style={{
              width: `${Math.random() * 100 + 30}px`,
              height: `${Math.random() * 100 + 30}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 4 + 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Gold rule */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold opacity-60" />
          <span className="text-gold text-2xl">🌸</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold opacity-60" />
        </div>

        <motion.h2
          id="final-cta-heading"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-3xl md:text-5xl font-bold font-devanagari mb-4 bg-gradient-to-r from-champagne via-gold to-champagne bg-clip-text text-transparent leading-tight"
        >
          आपका अगला खास दिन और भी खूबसूरत बनाते हैं।
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="text-text-muted text-lg font-devanagari mb-10"
        >
          {businessSettings.taglineSecondary}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => (window.location.href = '/booking')}
            className="font-devanagari text-lg px-10"
          >
            बुकिंग शुरू करें
          </Button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-lg hover:bg-[#20BA5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void"
          >
            <MessageCircle size={22} />
            <span className="font-devanagari">WhatsApp करें</span>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-text-muted text-sm mt-6 font-devanagari"
        >
          📞 {businessSettings.phone} · 24/7 उपलब्ध
        </motion.p>
      </div>
    </section>
  )
}

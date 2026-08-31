'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Clock, Globe, CheckCircle2 } from 'lucide-react'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import type { ServiceArea, BusinessSettings } from '@/types'

interface ServiceAreaCardProps {
  area: ServiceArea
  index: number
  isHomeBase: boolean
}

function ServiceAreaCard({ area, index, isHomeBase }: ServiceAreaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
      className={`relative group flex flex-col items-center p-5 md:p-6 rounded-2xl border transition-all duration-300 ${
        isHomeBase
          ? 'bg-gradient-to-br from-gold/10 via-bg-purple to-bg-rich border-gold/25 shadow-lg shadow-gold/5 hover:shadow-xl hover:shadow-gold/10 hover:scale-[1.02] cursor-default'
          : 'bg-bg-void/50 border-gold/10 hover:border-gold/20 hover:bg-bg-void/70 hover:shadow-md'
      }`}
    >
      {/* Pin icon — premium gold */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
        isHomeBase
          ? 'bg-gradient-to-br from-gold-warm/20 to-gold/10 border-2 border-gold/40 shadow-lg shadow-gold/10 group-hover:scale-110'
          : 'bg-bg-void/50 border border-gold/20 group-hover:border-gold/40 group-hover:bg-gold/5'
      }`}>
        <MapPin size={20} className="text-gold" />
      </div>

      {/* City name — elegant */}
      <h3 className={`text-champagne font-bold text-base md:text-lg font-devanagari mb-1 group-hover:text-gold-bright transition-colors duration-300 ${
        isHomeBase ? 'text-gold' : ''
      }`}>
        {area.name}
      </h3>
      <p className="text-text-muted text-xs font-devanagari">{area.nameEn}</p>

      {/* Home base badge */}
      {isHomeBase && (
        <div className="mt-3 px-3 py-1 rounded-full bg-gradient-to-r from-gold/5 to-gold/15 border border-gold/25 text-gold text-xs font-devanagari font-semibold flex items-center gap-1.5">
          <CheckCircle2 size={10} fill="currentColor" />
          हमारा मुख्य केंद्र
        </div>
      )}

      {/* Bottom accent */}
      {isHomeBase && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      )}
    </motion.div>
  )
}

interface ServiceAreaSectionProps {
  areas: ServiceArea[]
  business: BusinessSettings
}

export function ServiceAreaSection({ areas, business }: ServiceAreaSectionProps) {
  const homeBase = areas.find((a) => a.isHomeBase)
  const otherAreas = areas.filter((a) => !a.isHomeBase)

  return (
    <section className="relative py-16 md:py-24 bg-bg-void overflow-hidden" aria-labelledby="service-area-heading">
      {/* Background ornaments */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gold/3 blur-3xl pointer-events-none opacity-20" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-burgundy/5 blur-2xl pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.2) 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="service-area-heading"
          title="हमारे सेवा क्षेत्र"
          subtitle="बेगूसराय से शुरू — पूरे बिहार में आपके हर खास अवसर के लिए Premium डेकोरेशन"
          className="mb-12"
          align="left"
        />

        {/* Hero area — premium highlight */}
        {homeBase && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-10 px-6 py-5 md:px-8 md:py-6 rounded-2xl bg-gradient-to-br from-gold/5 via-bg-purple to-bg-rich border border-gold/20 shadow-xl shadow-gold/5"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              {/* Big pin */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-gold-warm/20 to-gold/10 border-2 border-gold/40 flex items-center justify-center shadow-lg shadow-gold/10">
                <MapPin size={24} className="text-gold" />
              </div>
              {/* Text */}
              <div className="flex-1">
                <h3 className="text-gold font-bold text-xl md:text-2xl font-display font-devanagari mb-1">
                  {homeBase.name}
                </h3>
                <p className="text-text-muted text-sm font-devanagari">{homeBase.nameEn} — हमारा प्रीमियम लोकेशन</p>
              </div>
              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  className="font-devanagari gap-1.5"
                  onClick={() => business.whatsapp && window.open(`https://wa.me/${business.whatsapp}`, '_blank')}
                >
                  <span className="text-emerald-400 text-sm">💬</span> WhatsApp करें
                </Button>
              </div>
            </div>
            {/* Detail chips — each one renders only when the admin has actually
                filled in that value, so nothing invented is ever shown. */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gold/10">
              {[
                business.phone ? { icon: Phone, label: `📞 ${business.phone}` } : null,
                { icon: Clock, label: `🕐 ${homeBase.name} — ${homeBase.nameEn}` },
                business.address.trim()
                  ? { icon: Globe, label: `🌐 ${business.address}` }
                  : null,
              ]
                .filter((chip): chip is { icon: typeof Phone; label: string } => chip !== null)
                .map(({ icon: Icn, label }) => (
                  <div key={label} className="flex items-center gap-2 text-text-muted text-sm font-devanagari">
                    <Icn size={14} className="text-gold/60" />
                    <span>{label}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Other areas grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {otherAreas.map((area, i) => (
            <ServiceAreaCard key={area.id} area={area} index={i} isHomeBase={false} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => (window.location.href = '/contact')}
            className="font-devanagari gap-1.5"
          >
            <span>अपने शहर में सेवा लें</span>
            <span className="text-gold-dim">↓</span>
          </Button>
          <p className="text-text-muted text-xs mt-2 font-devanagari">
            हाँ, हम आपके शहर में भी सेवा देते हैं — पूछें!
          </p>
        </div>
      </div>
    </section>
  )
}

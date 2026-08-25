'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { ServiceArea, BusinessSettings } from '@/types'

interface ServiceAreaSectionProps {
  areas: ServiceArea[]
  business: BusinessSettings
}

export function ServiceAreaSection({ areas, business }: ServiceAreaSectionProps) {
  const homeBase = areas.find((a) => a.isHomeBase)
  const otherAreas = areas.filter((a) => !a.isHomeBase)

  return (
    <section className="py-16 md:py-24 bg-bg-void" aria-labelledby="service-area-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="service-area-heading"
          title="हमारी सेवा क्षेत्र"
          subtitle="बेगूसराय और आसपास के 10+ शहरों में हमारी सर्विस उपलब्ध है"
          className="mb-12"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Map placeholder */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-gold/20 bg-bg-purple">
            {/* Map embed placeholder — real Google Maps in Part 2 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-bg-purple to-bg-void">
              <MapPin size={48} className="text-gold opacity-50" />
              <div className="text-center">
                <p className="text-champagne font-devanagari font-semibold">बेगूसराय, बिहार</p>
                <p className="text-text-muted text-sm mt-1">Google Maps — Part 2 में जुड़ेगा</p>
              </div>
            </div>
            {/* Actual embed — will work when API key is configured */}
            <iframe
              src={business.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="महादेव डेकोरेशन — बेगूसराय, बिहार का नक्शा"
              className="absolute inset-0"
            />
          </div>

          {/* Area list */}
          <div>
            {/* Home base */}
            {homeBase && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30 mb-4"
              >
                <MapPin size={20} className="text-gold flex-shrink-0" />
                <div>
                  <p className="text-gold font-bold font-devanagari">{homeBase.name}</p>
                  <p className="text-text-muted text-xs">मुख्य कार्यालय</p>
                </div>
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gold text-bg-void font-bold">
                  Home Base
                </span>
              </motion.div>
            )}

            {/* Other areas as chips */}
            <p className="text-text-muted text-sm mb-3 font-devanagari">हम इन शहरों में भी सर्विस देते हैं:</p>
            <div className="flex flex-wrap gap-2">
              {otherAreas.map((area, i) => (
                <motion.span
                  key={area.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/20 text-text-muted text-sm hover:border-gold hover:text-champagne transition-colors font-devanagari"
                >
                  <MapPin size={12} className="text-gold" />
                  {area.name}
                </motion.span>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-bg-purple border border-gold/10">
              <p className="text-champagne font-semibold font-devanagari mb-1">बाहर के शहरों के लिए?</p>
              <p className="text-text-muted text-sm font-devanagari">
                हम बिहार के किसी भी शहर में सर्विस दे सकते हैं। ट्रैवल चार्ज अलग से लागू होगा।
                WhatsApp या कॉल करके पूछें।
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

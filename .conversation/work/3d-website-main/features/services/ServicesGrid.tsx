'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Service } from '@/types'
import { formatPrice, buildBookingUrl } from '@/utils/booking'
import { getIcon } from '@/utils/icons'
import { useRouter } from 'next/navigation'

interface ServiceCardProps {
  service: Service
  index: number
}

function ServiceCard({ service, index }: ServiceCardProps) {
  const router = useRouter()
  const IconComponent = getIcon(service.icon)

  const handleBook = () => {
    router.push(buildBookingUrl({ eventType: service.eventType, sourceName: service.nameEn }))
  }

  return (
    <motion.article
      id={service.eventType}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: 'easeOut' }}
      className="group bg-bg-purple border border-gold/10 rounded-2xl overflow-hidden hover:border-gold/40 hover:shadow-card-lift transition-all duration-250"
    >
      {/* Image area */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-bg-void to-bg-burgundy">
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
          style={{
            background: [
              'linear-gradient(135deg, #1A0B2E, #3D0F24)',
              'linear-gradient(135deg, #0A0710, #1A0B2E)',
              'linear-gradient(135deg, #3D0F24, #8B1E3F)',
              'linear-gradient(135deg, #145A32, #1A0B2E)',
              'linear-gradient(135deg, #8B1E3F, #3D0F24)',
              'linear-gradient(135deg, #1A0B2E, #0A0710)',
            ][index % 6],
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          {IconComponent && <IconComponent size={56} className="text-gold" />}
        </div>
        {/* Featured badge */}
        {service.featured && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gold text-bg-void text-xs font-bold">
            Popular
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            {IconComponent && <IconComponent size={16} className="text-gold" />}
          </div>
          <div>
            <h2 className="text-champagne font-bold font-devanagari group-hover:text-gold transition-colors">
              {service.name}
            </h2>
            <p className="text-text-muted text-xs">{service.nameEn}</p>
          </div>
        </div>

        <p className="text-text-muted text-sm font-devanagari leading-relaxed mb-4">
          {service.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-gold font-semibold text-sm">
            Starting from {formatPrice(service.startingPrice)}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/gallery?type=${service.eventType}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-gold/30 text-text-muted hover:border-gold hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              Gallery
            </Link>
            <button
              onClick={handleBook}
              className="text-xs px-3 py-1.5 rounded-lg bg-gold text-bg-void font-semibold hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
            >
              बुकिंग करें
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

interface ServicesGridProps {
  services: Service[]
}

export function ServicesGrid({ services }: ServicesGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {services.map((service, i) => (
        <ServiceCard key={service.id} service={service} index={i} />
      ))}
    </div>
  )
}

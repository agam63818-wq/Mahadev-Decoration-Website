'use client'

import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { statsBar } from '@/lib/data'
import type { Occasion } from '@/types'
import { formatPrice } from '@/utils/booking'
import { getIcon } from '@/utils/icons'
import { useRouter } from 'next/navigation'

interface OccasionCardProps {
  occasion: Occasion
  index: number
}

function OccasionCard({ occasion, index }: OccasionCardProps) {
  const router = useRouter()
  const IconComponent = getIcon(occasion.icon)

  const handleView = () => {
    router.push(`/gallery?type=${occasion.eventType}`)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: 'easeOut' }}
      className="group relative bg-gradient-to-br from-bg-purple to-bg-rich border border-gold/10 rounded-2xl overflow-hidden cursor-pointer"
      style={{ perspective: '800px' }}
      whileHover={{
        y: -5,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.12)',
        borderColor: 'rgba(201,168,76,0.3)',
      }}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-bg-void to-bg-burgundy">
        {/* Rich gradient backdrop */}
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.07] will-change-transform"
          style={{
            background: [
              'linear-gradient(135deg, #1A0B2E 0%, #2D0B1C 50%, #0D0815 100%)',
              'linear-gradient(135deg, #0D0815 0%, #1A0B2E 40%, #3A0F24 100%)',
              'linear-gradient(135deg, #2D0B1C 0%, #3A0F24 40%, #1A0B2E 100%)',
              'linear-gradient(135deg, #145A32 0%, #1A0B2E 50%, #0D0815 100%)',
              'linear-gradient(135deg, #8B1E3F 0%, #3D0F24 50%, #1A0B2E 100%)',
              'linear-gradient(135deg, #1A0B2E 0%, #0D0815 50%, #3D0F24 100%)',
            ][index % 6],
          }}
        />
        {/* Decorative icon — subtle glow */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 group-hover:opacity-25 transition-opacity duration-300">
          {IconComponent && <IconComponent size={72} className="text-gold/40" />}
        </div>
        {/* Premium icon badge */}
        <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-gradient-to-br bg-gold/10 border border-gold/30 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-gold/10">
          {IconComponent && <IconComponent size={16} className="text-gold" />}
        </div>
        {/* Hover overlay — deep</div> */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-void/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4 bg-bg-void/60 backdrop-blur-sm border-t border-gold/10">
        {/* Title — rich gold on hover */}
        <h3 className="text-champagne font-bold text-base md:text-lg font-devanagari mb-1 group-hover:text-gold-bright transition-colors duration-300">
          {occasion.name}
        </h3>
        {/* Description */}
        <p className="text-text-muted text-xs md:text-sm mb-3 leading-relaxed font-devanagari line-clamp-2">
          {occasion.description}
        </p>
        {/* Price — gradient gold */}
        <p className="text-gold text-sm font-semibold mb-3 font-devanagari">
          <span className="text-text-muted text-xs font-normal">शुरुआती कीमत — </span>
          {formatPrice(occasion.startingPrice)}
        </p>
        {/* CTA — sleek */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleView}
          className="w-full text-xs font-devanagari gap-1.5"
        >
          <span>देखें डिजाइन</span>
          <span className="text-gold-dim">→</span>
        </Button>
      </div>

      {/* Premium corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gold/10 to-transparent pointer-events-none" />
    </motion.article>
  )
}

interface OccasionsSectionProps {
  occasions: Occasion[]
}

export function OccasionsSection({ occasions }: OccasionsSectionProps) {
  return (
    <section className="relative py-16 md:py-24 bg-bg-void overflow-hidden" aria-labelledby="occasions-heading">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-gold/3 blur-3xl pointer-events-none opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="occasions-heading"
          title="अपने अवसर को चुनें"
          subtitle="हर खास मौके के लिए हमारे पास परफेक्ट डेकोरेशन है — शाही वेडिंग से लेकर कस्टम पार्टी तक"
          className="mb-12"
          align="left"
        />

        {/* 6-card grid — premium cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {occasions.map((occasion, i) => (
            <OccasionCard key={occasion.id} occasion={occasion} index={i} />
          ))}
        </div>

        {/* Stats bar — premium refined */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-gold/10">
          {statsBar.map((stat) => (
            <div key={stat.id} className="flex items-center gap-2 group hover:gap-3 transition-all duration-300">
              <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/40 group-hover:bg-gold/20 transition-all duration-300">
                <span className="text-gold text-sm">
                  {stat.icon === 'Trophy' ? '🏅' :
                   stat.icon === 'Users' ? '👥' :
                   stat.icon === 'MapPin' ? '📍' : '★'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-gold font-bold text-sm font-devanagari group-hover:text-gold-bright transition-colors">
                  {stat.value}
                </p>
                <p className="text-text-muted text-xs font-devanagari truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

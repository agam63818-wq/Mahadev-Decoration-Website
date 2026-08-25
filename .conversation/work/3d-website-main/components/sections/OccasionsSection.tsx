'use client'

import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatBadge } from '@/components/ui/StatBadge'
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="group relative bg-bg-purple border border-gold/10 rounded-2xl overflow-hidden cursor-pointer"
      style={{ perspective: '1000px' }}
      whileHover={{
        y: -6,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.15)',
        borderColor: 'rgba(212,175,55,0.4)',
        transition: { duration: 0.25 },
      }}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-bg-void to-bg-burgundy">
        {/* Gradient placeholder */}
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]"
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
        {/* Decorative icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
          {IconComponent && <IconComponent size={64} className="text-gold" />}
        </div>

        {/* Icon badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center backdrop-blur-sm">
          {IconComponent && <IconComponent size={14} className="text-gold" />}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-champagne font-bold text-lg font-devanagari mb-1 group-hover:text-gold transition-colors">
          {occasion.name}
        </h3>
        <p className="text-text-muted text-xs mb-2 font-devanagari leading-relaxed">
          {occasion.description}
        </p>
        <p className="text-gold text-sm font-semibold mb-3">
          Starting from {formatPrice(occasion.startingPrice)}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleView}
          className="w-full text-xs font-devanagari"
        >
          देखें डिजाइन
        </Button>
      </div>
    </motion.article>
  )
}

interface OccasionsSectionProps {
  occasions: Occasion[]
}

export function OccasionsSection({ occasions }: OccasionsSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-bg-void" aria-labelledby="occasions-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="occasions-heading"
          title="अपने अवसर को चुनें"
          subtitle="हर खास मौके के लिए हमारे पास परफेक्ट डेकोरेशन है"
          className="mb-12"
        />

        {/* 6-card grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {occasions.map((occasion, i) => (
            <OccasionCard key={occasion.id} occasion={occasion} index={i} />
          ))}
        </div>

        {/* 4-stat bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-t border-gold/10">
          {statsBar.map((stat, i) => (
            <StatBadge key={stat.id} stat={stat} variant="bar" index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

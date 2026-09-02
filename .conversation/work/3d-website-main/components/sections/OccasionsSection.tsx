'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Counter, Stagger, StaggerItem, TiltCard } from '@/components/motion'
import { statsBar } from '@/lib/data'
import type { Occasion } from '@/types'
import { formatPrice } from '@/utils/booking'
import { getIcon } from '@/utils/icons'

interface OccasionCardProps {
  occasion: Occasion
  index: number
}

const FALLBACK_IMAGE = '/assets/flower-arch-hero.png'

function OccasionCard({ occasion, index }: OccasionCardProps) {
  const router = useRouter()
  const IconComponent = getIcon(occasion.icon)
  const imageSrc = occasion.imageUrl || FALLBACK_IMAGE

  const handleView = () => {
    router.push(`/gallery?type=${occasion.eventType}`)
  }

  return (
    <StaggerItem className="group h-full">
      <TiltCard
        maxTilt={5}
        lift={6}
        className={[
          'h-full flex flex-col overflow-hidden rounded-2xl cursor-pointer',
          'bg-gradient-to-br from-bg-purple to-bg-rich',
          'border border-gold/10 hover:border-gold/40',
          'shadow-card-lift hover:shadow-gold-glow-sm',
          'transition-[border-color,box-shadow] duration-300',
        ].join(' ')}
        onClick={handleView}
      >
        <article className="flex h-full flex-col">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-bg-void">
            <Image
              src={imageSrc}
              alt={occasion.imageAlt || occasion.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              priority={index < 2}
              className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] will-change-transform"
            />
            {/* Warm grade + bottom fade so title sits comfortably */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-void/90 via-bg-void/20 to-transparent" />
            <div className="absolute inset-0 bg-bg-purple/20 mix-blend-multiply" />

            {/* Icon badge */}
            <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-bg-void/60 border border-gold/30 flex items-center justify-center backdrop-blur-md shadow-lg shadow-black/30 transition-colors duration-300 group-hover:bg-gold/20 group-hover:border-gold/60">
              {IconComponent && <IconComponent size={16} className="text-gold" />}
            </div>

            {/* Price chip */}
            <div className="absolute top-3 right-3 rounded-full bg-bg-void/70 border border-gold/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-devanagari text-gold-light">
              {formatPrice(occasion.startingPrice)}+
            </div>

            {/* Title on image */}
            <h3 className="absolute bottom-3 left-3 right-3 text-champagne font-bold text-base md:text-lg font-devanagari leading-snug drop-shadow-lg group-hover:text-gold-bright transition-colors duration-300">
              {occasion.name}
            </h3>

            {/* Gold sheen sweep on hover */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] opacity-0 group-hover:opacity-100 group-hover:translate-x-[300%] transition-[transform,opacity] duration-700 ease-out"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-4 bg-bg-void/60 backdrop-blur-sm border-t border-gold/10">
            <p className="text-text-muted text-xs md:text-sm mb-3 leading-relaxed font-devanagari line-clamp-2 flex-1">
              {occasion.description}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleView()
              }}
              className="w-full text-xs font-devanagari gap-1.5 group-hover:border-gold/60"
            >
              <span>देखें डिजाइन</span>
              <span className="text-gold-dim transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Button>
          </div>
        </article>
      </TiltCard>
    </StaggerItem>
  )
}

interface OccasionsSectionProps {
  occasions: Occasion[]
}

const statEmoji: Record<string, string> = {
  Trophy: '🏅',
  Users: '👥',
  MapPin: '📍',
}

export function OccasionsSection({ occasions }: OccasionsSectionProps) {
  return (
    <section
      id="occasions"
      className="relative py-16 md:py-24 bg-bg-void overflow-hidden"
      aria-labelledby="occasions-heading"
    >
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl pointer-events-none opacity-40" />
      <div className="absolute -bottom-24 right-0 w-[400px] h-[400px] rounded-full bg-floral-red/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="occasions-heading"
          title="अपने अवसर को चुनें"
          subtitle="हर खास मौके के लिए हमारे पास परफेक्ट डेकोरेशन है — शाही वेडिंग से लेकर कस्टम पार्टी तक"
          className="mb-12"
          align="left"
        />

        {/* 6-card grid */}
        <Stagger
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
          stagger={0.08}
        >
          {occasions.map((occasion, i) => (
            <OccasionCard key={occasion.id} occasion={occasion} index={i} />
          ))}
        </Stagger>

        {/* Stats bar */}
        <Stagger
          className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-gold/10"
          stagger={0.1}
        >
          {statsBar.map((stat) => (
            <StaggerItem key={stat.id}>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/50 group-hover:bg-gold/20 group-hover:shadow-gold-glow-sm transition-all duration-300">
                  <span className="text-gold text-sm">{statEmoji[stat.icon] ?? '★'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-gold font-bold text-base md:text-lg font-devanagari group-hover:text-gold-bright transition-colors tabular-nums">
                    <Counter value={stat.value} />
                  </p>
                  <p className="text-text-muted text-xs font-devanagari truncate">{stat.label}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Stagger, StaggerItem, TiltCard } from '@/components/motion'
import { getIcon } from '@/utils/icons'
import type { WhyChooseFeature } from '@/types'

interface FeatureCardProps {
  feature: WhyChooseFeature
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const IconComponent = getIcon(feature.icon)

  return (
    <StaggerItem className="group h-full">
      <TiltCard
        maxTilt={4}
        lift={6}
        className={[
          'h-full flex flex-col items-center text-center p-6 md:p-8 rounded-2xl',
          'border border-gold/10 bg-gradient-to-br from-bg-purple/40 to-bg-rich/60',
          'hover:border-gold/40 shadow-card-lift hover:shadow-gold-glow-sm',
          'transition-[border-color,box-shadow] duration-300',
        ].join(' ')}
      >
        {/* Number watermark */}
        <span
          aria-hidden="true"
          className="absolute top-3 right-4 text-5xl font-display font-bold text-gold/[0.06] group-hover:text-gold/[0.12] transition-colors duration-500 select-none tabular-nums"
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Icon badge */}
        <motion.div
          whileHover={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.5 }}
          className="relative w-14 h-14 md:w-16 md:h-16 rounded-full border border-gold/20 bg-gradient-to-br from-gold/10 to-bg-void/20 flex items-center justify-center mb-4 group-hover:border-gold/60 group-hover:bg-gold/15 group-hover:shadow-gold-glow-sm transition-all duration-300"
        >
          <div className="absolute inset-0 rounded-full border-2 border-gold/10 group-hover:border-gold/30 group-hover:scale-110 transition-all duration-300" />
          {IconComponent && <IconComponent size={24} className="text-gold relative z-10" />}
        </motion.div>

        <h3 className="text-champagne font-bold text-base md:text-lg font-devanagari mb-2.5 group-hover:text-gold-bright transition-colors duration-300">
          {feature.title}
        </h3>

        <p className="text-text-muted text-sm leading-relaxed font-devanagari max-w-[240px]">
          {feature.description}
        </p>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 group-hover:w-2/3 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent transition-all duration-500" />
      </TiltCard>
    </StaggerItem>
  )
}

interface WhyChooseSectionProps {
  features: WhyChooseFeature[]
}

export function WhyChooseSection({ features }: WhyChooseSectionProps) {
  return (
    <section
      id="why-choose"
      className="relative py-16 md:py-24 bg-bg-void overflow-hidden"
      aria-labelledby="why-choose-heading"
    >
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-gold/5 blur-3xl pointer-events-none opacity-30" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-bg-burgundy/40 blur-2xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="why-choose-heading"
          title="क्यों चुनें हमें"
          subtitle="5+ वर्षों का अनुभव, 1500+ सफल इवेंट्स — हम सिर्फ सजावट नहीं, यादें बनाते हैं"
          className="mb-14"
          align="left"
        />

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" stagger={0.09}>
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </Stagger>
      </div>
    </section>
  )
}

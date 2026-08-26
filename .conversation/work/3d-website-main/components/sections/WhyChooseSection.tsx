'use client'

import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getIcon } from '@/utils/icons'
import type { WhyChooseFeature } from '@/types'

interface FeatureCardProps {
  feature: WhyChooseFeature
  index: number
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const IconComponent = getIcon(feature.icon)

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay: index * 0.09, ease: 'easeOut' }}
      className="group relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl border border-gold/10 bg-gradient-to-br from-bg-purple/40 to-bg-rich/60 hover:bg-gradient-to-br from-bg-purple/60 to-bg-rich/80 hover:border-gold/20 hover:shadow-xl hover:shadow-gold/5 transition-all duration-300"
    >
      {/* Feature icon — premium circular badge */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full border border-gold/20 bg-gradient-to-br from-gold/5 to-bg-void/5 flex items-center justify-center mb-4 group-hover:border-gold/40 group-hover:bg-gold/10 group-hover:shadow-lg group-hover:shadow-gold/10 transition-all duration-300">
        {/* Outer ring glow */}
        <div className="absolute inset-0 rounded-full border-2 border-gold/10 group-hover:border-gold/30 transition-all duration-300" />
        {IconComponent && <IconComponent size={24} className="text-gold relative z-10" />}
      </div>

      {/* Title — gold on hover */}
      <h3 className="text-champagne font-bold text-base md:text-lg font-devanagari mb-2.5 group-hover:text-gold-bright transition-colors duration-300">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-text-muted text-sm leading-relaxed font-devanagari max-w-[220px]">
        {feature.description}
      </p>

      {/* Premium bottom accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </motion.div>
  )
}

interface WhyChooseSectionProps {
  features: WhyChooseFeature[]
}

export function WhyChooseSection({ features }: WhyChooseSectionProps) {
  return (
    <section className="relative py-16 md:py-24 bg-bg-void overflow-hidden" aria-labelledby="why-choose-heading">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-gold/3 blur-3xl pointer-events-none opacity-20" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-burgundy/8 blur-2xl pointer-events-none" />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="why-choose-heading"
          title="क्यों चुनें हमें"
          subtitle="5+ वर्षों का अनुभव, 1500+ सफल इवेंट्स — हम सिर्फ सजावट नहीं, यादें बनाते हैं"
          className="mb-14"
          align="left"
        />

        {/* Features grid — premium cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

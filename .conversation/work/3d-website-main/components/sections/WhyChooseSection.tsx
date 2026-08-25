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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="group flex flex-col items-center text-center p-6 rounded-2xl border border-gold/10 hover:border-gold/30 bg-bg-purple/40 hover:bg-bg-purple/60 transition-all duration-250"
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center mb-4 group-hover:border-gold group-hover:bg-gold/10 transition-all duration-250">
        {IconComponent && <IconComponent size={24} className="text-gold" />}
      </div>

      <h3 className="text-champagne font-bold text-base font-devanagari mb-2 group-hover:text-gold transition-colors">
        {feature.title}
      </h3>
      <p className="text-text-muted text-sm leading-relaxed font-devanagari">
        {feature.description}
      </p>
    </motion.div>
  )
}

interface WhyChooseSectionProps {
  features: WhyChooseFeature[]
}

export function WhyChooseSection({ features }: WhyChooseSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-bg-void" aria-labelledby="why-choose-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="why-choose-heading"
          title="क्यों चुनें हमें"
          subtitle="5+ वर्षों का अनुभव, 1500+ सफल इवेंट्स — हम सिर्फ सजावट नहीं, यादें बनाते हैं"
          className="mb-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

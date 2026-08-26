'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getIcon } from '@/utils/icons'
import type { ProcessStep } from '@/types'

interface ProcessStepCardProps {
  step: ProcessStep
  index: number
  isLast: boolean
  inView: boolean
}

function ProcessStepCard({ step, index, isLast, inView }: ProcessStepCardProps) {
  const IconComponent = getIcon(step.icon)
  const delay = index * 0.2

  return (
    <div className="flex flex-col items-center relative">
      {/* Step node — premium circle with icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Outer ring glow */}
        <div className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full border-2 bg-gradient-to-br from-gold/10 via-gold/5 to-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Main circle */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gold/30 bg-gradient-to-br from-bg-purple to-bg-void flex items-center justify-center shadow-lg shadow-gold/5 group-hover:border-gold group-hover:shadow-xl group-hover:shadow-gold/10 transition-all duration-300">
          {/* Step number badge */}
          <span className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-gold-warm to-gold text-bg-void text-xs font-bold flex items-center justify-center tabular-nums shadow-md shadow-gold/20 group-hover:scale-110 transition-transform duration-300">
            {step.stepNumber}
          </span>
          {IconComponent && <IconComponent size={28} className="text-gold" />}
        </div>

        {/* Caption */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + 0.15, ease: 'easeOut' }}
          className="mt-4 text-center max-w-[140px]"
        >
          <h3 className="text-champagne font-semibold text-sm md:text-base font-devanagari leading-tight mb-1 group-hover:text-gold-bright transition-colors duration-300">
            {step.title}
          </h3>
          <p className="text-text-muted text-xs md:text-sm font-devanagari leading-relaxed">
            {step.description}
          </p>
        </motion.div>
      </motion.div>

      {/* Connecting arrow — elegant gold gradient */}
      {!isLast && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: delay + 0.3, ease: 'easeOut' }}
          className="hidden md:block absolute top-8 md:top-10 left-[calc(50%+40px)] md:left-[calc(50%+50px)] right-0 h-px origin-left"
          style={{
            background: 'linear-gradient(90deg, rgba(201,168,76,0.6) 0%, rgba(201,168,76,0.2) 100%)',
          }}
          aria-hidden="true"
        >
          {/* Arrow head — decorative */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[7px] border-transparent border-l-gold/50" />
        </motion.div>
      )}
    </div>
  )
}

// Mobile vertical stepper
function MobileProcessStepper({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="md:hidden flex flex-col gap-4">
      {steps.map((step, i) => {
        const IconComponent = getIcon(step.icon)
        const isLast = i === steps.length - 1

        return (
          <div key={step.id} className="flex gap-4 group">
            {/* Circle + line */}
            <div className="flex flex-col items-center">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full border-2 border-gold/30 bg-gradient-to-br from-bg-purple to-bg-void flex items-center justify-center shadow-md shadow-gold/5 group-hover:border-gold group-hover:shadow-lg group-hover:shadow-gold/10 transition-all duration-300">
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-gold-warm to-gold text-bg-void text-xs font-bold flex items-center justify-center">
                    {step.stepNumber}
                  </span>
                  {IconComponent && <IconComponent size={20} className="text-gold" />}
                </div>
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-gradient-to-b from-gold/30 to-transparent my-2" />
              )}
            </div>
            {/* Text */}
            <div className="flex-1 pb-6">
              <h3 className="text-champagne font-semibold font-devanagari mb-1 group-hover:text-gold-bright transition-colors">
                {step.title}
              </h3>
              <p className="text-text-muted text-sm font-devanagari leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ProcessSectionProps {
  steps: ProcessStep[]
}

export function ProcessSection({ steps }: ProcessSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-16 md:py-24 bg-bg-void overflow-hidden" aria-labelledby="process-heading">
      {/* Background glow */}
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-gold/3 blur-3xl pointer-events-none opacity-20" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-burgundy/5 blur-2xl pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.2) 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="process-heading"
          title="हमारा काम करने का तरीका"
          subtitle="बुकिंग से लेकर इवेंट तक — हर कदम पर हम आपके साथ, हर पल आपकी जिम्मेदारी"
          className="mb-16"
          align="left"
        />

        {/* Desktop horizontal stepper */}
        <div
          ref={ref}
          className="hidden md:grid gap-6"
          style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
        >
          {steps.map((step, i) => (
            <ProcessStepCard
              key={step.id}
              step={step}
              index={i}
              isLast={i === steps.length - 1}
              inView={inView}
            />
          ))}
        </div>

        {/* Mobile vertical stepper */}
        <MobileProcessStepper steps={steps} />
      </div>
    </section>
  )
}

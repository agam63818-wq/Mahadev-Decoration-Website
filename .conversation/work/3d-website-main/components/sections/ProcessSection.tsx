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
      {/* Step node */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Circle */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gold/40 bg-bg-purple flex items-center justify-center shadow-gold-glow-sm group-hover:border-gold transition-colors">
          {/* Step number badge */}
          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold text-bg-void text-xs font-bold flex items-center justify-center tabular-nums">
            {step.stepNumber}
          </span>
          {IconComponent && <IconComponent size={28} className="text-gold" />}
        </div>

        {/* Caption */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + 0.15, ease: 'easeOut' }}
          className="mt-4 text-center max-w-[120px]"
        >
          <h3 className="text-champagne font-semibold text-sm font-devanagari leading-tight mb-1">
            {step.title}
          </h3>
          <p className="text-text-muted text-xs font-devanagari leading-relaxed">
            {step.description}
          </p>
        </motion.div>
      </motion.div>

      {/* Connecting arrow (not on last step) */}
      {!isLast && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: delay + 0.3, ease: 'easeOut' }}
          className="hidden md:block absolute top-8 md:top-10 left-[calc(50%+40px)] md:left-[calc(50%+50px)] right-0 h-px origin-left"
          style={{
            background: 'linear-gradient(90deg, #D4AF37 0%, rgba(212,175,55,0.3) 100%)',
          }}
          aria-hidden="true"
        >
          {/* Arrow head */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gold/60" />
        </motion.div>
      )}
    </div>
  )
}

// Mobile vertical stepper
function MobileProcessStepper({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="md:hidden flex flex-col gap-0">
      {steps.map((step, i) => {
        const IconComponent = getIcon(step.icon)
        const isLast = i === steps.length - 1

        return (
          <div key={step.id} className="flex gap-4">
            {/* Left: circle + vertical line */}
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 rounded-full border-2 border-gold/40 bg-bg-purple flex items-center justify-center flex-shrink-0">
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold text-bg-void text-xs font-bold flex items-center justify-center">
                  {step.stepNumber}
                </span>
                {IconComponent && <IconComponent size={20} className="text-gold" />}
              </div>
              {!isLast && <div className="w-px flex-1 bg-gradient-to-b from-gold/40 to-transparent my-2" />}
            </div>
            {/* Right: text */}
            <div className={`pb-6 ${isLast ? '' : ''}`}>
              <h3 className="text-champagne font-semibold font-devanagari mb-1">{step.title}</h3>
              <p className="text-text-muted text-sm font-devanagari leading-relaxed">{step.description}</p>
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
    <section className="py-16 md:py-24 bg-bg-void" aria-labelledby="process-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="process-heading"
          title="हमारा काम करने का तरीका"
          subtitle="बुकिंग से लेकर इवेंट तक — हर कदम पर हम आपके साथ"
          className="mb-16"
        />

        {/* Desktop horizontal stepper */}
        <div
          ref={ref}
          className="hidden md:grid gap-4"
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

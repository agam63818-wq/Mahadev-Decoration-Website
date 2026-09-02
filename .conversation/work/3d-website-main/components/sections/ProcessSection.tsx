'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EASE_PREMIUM } from '@/components/motion'
import { getIcon } from '@/utils/icons'
import type { ProcessStep } from '@/types'

// Timing model: each step "owns" a beat. Node pops in at the start of its beat,
// the connector to the next step draws across the rest of it, then the next
// node pops in — so the line visibly travels from step 1 to the last step.
const BEAT = 0.55
const NODE_DUR = 0.45
const LINE_DUR = BEAT

interface ProcessStepCardProps {
  step: ProcessStep
  index: number
  isLast: boolean
  inView: boolean
  reduce: boolean
}

function ProcessStepCard({ step, index, isLast, inView, reduce }: ProcessStepCardProps) {
  const IconComponent = getIcon(step.icon)
  const start = index * BEAT
  const show = reduce ? true : inView

  return (
    <div className="flex flex-col items-center relative group">
      {/* Node */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.4 }}
        animate={show ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: NODE_DUR, delay: reduce ? 0 : start, ease: EASE_PREMIUM }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Pulse ring — fires once when the node lands */}
        {!reduce && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={show ? { opacity: [0, 0.7, 0], scale: [0.8, 1.6, 1.9] } : {}}
            transition={{ duration: 1.1, delay: start + 0.1, ease: 'easeOut' }}
            className="absolute top-0 w-16 h-16 md:w-20 md:h-20 rounded-full border border-gold/60"
          />
        )}

        {/* Main circle */}
        <motion.div
          initial={false}
          animate={
            show
              ? {
                  borderColor: ['rgba(201,168,76,0.3)', 'rgba(201,168,76,1)', 'rgba(201,168,76,0.45)'],
                  boxShadow: [
                    '0 0 0 rgba(201,168,76,0)',
                    '0 0 32px rgba(201,168,76,0.45)',
                    '0 0 14px rgba(201,168,76,0.12)',
                  ],
                }
              : {}
          }
          transition={{ duration: 1.2, delay: reduce ? 0 : start + 0.05, times: [0, 0.35, 1] }}
          className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gold/30 bg-gradient-to-br from-bg-purple to-bg-void flex items-center justify-center group-hover:!border-gold group-hover:!shadow-gold-glow transition-[border-color,box-shadow] duration-300"
        >
          <span className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-gold-warm to-gold text-bg-void text-xs font-bold flex items-center justify-center tabular-nums shadow-md shadow-gold/20 group-hover:scale-110 transition-transform duration-300">
            {step.stepNumber}
          </span>
          {IconComponent && (
            <IconComponent
              size={28}
              className="text-gold transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
            />
          )}
        </motion.div>

        {/* Caption */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: reduce ? 0 : start + 0.15, ease: EASE_PREMIUM }}
          className="mt-4 text-center max-w-[150px]"
        >
          <h3 className="text-champagne font-semibold text-sm md:text-base font-devanagari leading-tight mb-1 group-hover:text-gold-bright transition-colors duration-300">
            {step.title}
          </h3>
          <p className="text-text-muted text-xs md:text-sm font-devanagari leading-relaxed">
            {step.description}
          </p>
        </motion.div>
      </motion.div>

      {/* Connector — draws toward the next step */}
      {!isLast && (
        <div
          className="hidden md:block absolute top-8 md:top-10 left-[calc(50%+40px)] md:left-[calc(50%+48px)] right-[calc(-50%+48px)] h-px"
          aria-hidden="true"
        >
          {/* faint track */}
          <div className="absolute inset-0 bg-gold/10" />
          {/* drawn line */}
          <motion.div
            initial={reduce ? false : { scaleX: 0 }}
            animate={show ? { scaleX: 1 } : {}}
            transition={{ duration: LINE_DUR, delay: reduce ? 0 : start + NODE_DUR * 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 origin-left"
            style={{
              background:
                'linear-gradient(90deg, rgba(201,168,76,0.9) 0%, rgba(232,200,88,0.7) 60%, rgba(201,168,76,0.35) 100%)',
              boxShadow: '0 0 10px rgba(201,168,76,0.35)',
            }}
          />
          {/* travelling spark */}
          {!reduce && (
            <motion.div
              initial={{ left: '0%', opacity: 0 }}
              animate={show ? { left: ['0%', '100%'], opacity: [0, 1, 1, 0] } : {}}
              transition={{ duration: LINE_DUR, delay: start + NODE_DUR * 0.5, ease: 'easeInOut' }}
              className="absolute top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 rounded-full bg-gold-bright shadow-[0_0_12px_4px_rgba(232,200,88,0.6)]"
            />
          )}
        </div>
      )}
    </div>
  )
}

// Mobile vertical stepper — one continuous line drawing downward
function MobileProcessStepper({ steps }: { steps: ProcessStep[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion() ?? false
  const show = reduce ? true : inView
  const beat = 0.35

  return (
    <div ref={ref} className="md:hidden relative">
      {/* Track + drawn line */}
      <div className="absolute left-6 top-6 bottom-6 w-px bg-gold/10" aria-hidden="true">
        <motion.div
          initial={reduce ? false : { scaleY: 0 }}
          animate={show ? { scaleY: 1 } : {}}
          transition={{ duration: steps.length * beat, ease: 'easeInOut' }}
          className="absolute inset-0 origin-top bg-gradient-to-b from-gold via-gold-bright/80 to-gold/30 shadow-[0_0_8px_rgba(201,168,76,0.4)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const IconComponent = getIcon(step.icon)
          const start = i * beat
          return (
            <motion.div
              key={step.id}
              initial={reduce ? false : { opacity: 0, x: -14 }}
              animate={show ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: reduce ? 0 : start, ease: EASE_PREMIUM }}
              className="flex gap-4 group relative"
            >
              <div className="relative z-10 flex-shrink-0">
                <motion.div
                  initial={reduce ? false : { scale: 0.5 }}
                  animate={show ? { scale: 1 } : {}}
                  transition={{ duration: 0.45, delay: reduce ? 0 : start, ease: EASE_PREMIUM }}
                  className="w-12 h-12 rounded-full border-2 border-gold/40 bg-gradient-to-br from-bg-purple to-bg-void flex items-center justify-center shadow-md shadow-gold/10"
                >
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-gold-warm to-gold text-bg-void text-xs font-bold flex items-center justify-center">
                    {step.stepNumber}
                  </span>
                  {IconComponent && <IconComponent size={20} className="text-gold" />}
                </motion.div>
              </div>
              <div className="flex-1 pb-6 pt-1">
                <h3 className="text-champagne font-semibold font-devanagari mb-1">{step.title}</h3>
                <p className="text-text-muted text-sm font-devanagari leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

interface ProcessSectionProps {
  steps: ProcessStep[]
}

export function ProcessSection({ steps }: ProcessSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const reduce = useReducedMotion() ?? false

  return (
    <section
      id="process"
      className="relative py-16 md:py-24 bg-bg-void overflow-hidden"
      aria-labelledby="process-heading"
    >
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-gold/5 blur-3xl pointer-events-none opacity-30" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-bg-burgundy/40 blur-2xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.3) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
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
              reduce={reduce}
            />
          ))}
        </div>

        <MobileProcessStepper steps={steps} />
      </div>
    </section>
  )
}

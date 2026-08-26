'use client'

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { SectionFlourish } from './SectionFlourish'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center' | 'right'
  className?: string
  showFlourish?: boolean
  titleClassName?: string
  id?: string
  subtitleClassName?: string
}

export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  className,
  showFlourish = true,
  titleClassName,
  id,
  subtitleClassName,
}: SectionHeadingProps) {
  const alignClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align]

  return (
    <div className={cn('flex flex-col gap-3 w-full', alignClass, className)}>
      {/* Premium flourish divider */}
      {showFlourish && <SectionFlourish align={align} />}

      {/* Title — big gold gradient */}
      <motion.h2
        id={id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight',
          'bg-gradient-to-r from-champagne via-gold to-champagne bg-clip-text text-transparent',
          titleClassName
        )}
      >
        {title}
      </motion.h2>

      {/* Subtitle — muted but elegant */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.12, ease: 'easeOut' }}
          className={cn(
            'text-text-muted text-base md:text-lg max-w-2xl font-devanagari leading-relaxed',
            subtitleClassName
          )}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

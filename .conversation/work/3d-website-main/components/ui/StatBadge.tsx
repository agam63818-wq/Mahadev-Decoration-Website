'use client'

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { getIcon } from '@/utils/icons'
import type { Stat } from '@/types'

interface StatBadgeProps {
  stat: Stat
  variant?: 'rail' | 'bar'
  className?: string
  index?: number
}

export function StatBadge({ stat, variant = 'bar', className, index = 0 }: StatBadgeProps) {
  const IconComponent = getIcon(stat.icon)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className={cn(
        variant === 'rail'
          ? 'flex flex-col items-center gap-2 py-4 px-3 border-b border-gold/10 last:border-b-0'
          : 'flex flex-col items-center gap-1',
        className
      )}
    >
      {IconComponent && (
        <IconComponent size={variant === 'rail' ? 20 : 24} className="text-gold" />
      )}
      <span
        className={cn(
          'font-bold tabular-nums text-champagne',
          variant === 'rail' ? 'text-2xl' : 'text-3xl md:text-4xl'
        )}
      >
        {stat.value}
      </span>
      <span className={cn('text-text-muted text-center', variant === 'rail' ? 'text-xs' : 'text-sm')}>
        {stat.label}
      </span>
    </motion.div>
  )
}

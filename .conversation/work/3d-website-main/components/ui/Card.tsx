'use client'

import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

type CardVariant = 'default' | 'outline' | 'elevated' | 'glass' | 'premium' | 'border-glow'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: CardVariant
  as?: 'div' | 'article' | 'section'
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
  glow?: boolean
}

const variantClasses: Record<CardVariant, string> = {
  default:     'bg-bg-void/90 border border-gold/10 shadow-card',
  outline:     'bg-bg-void/40 border border-gold/20',
  elevated:    'bg-bg-void border-gold/20 shadow-xl shadow-black/20',
  glass:       'bg-bg-void/60 backdrop-blur-md border border-gold/10 shadow-lg',
  premium:     'bg-gradient-to-br from-bg-rich to-bg-void/95 border border-gold/15 shadow-xl shadow-gold/5 hover:shadow-2xl hover:shadow-gold/12',
  'border-glow': 'bg-bg-void border border-gold/10 shadow-card hover:border-gold/30 hover:shadow-xl hover:shadow-gold/8',
}

const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({
  children,
  className,
  variant = 'default',
  as: Component = 'div',
  hover = false,
  onClick,
  padding: pad = 'md',
  glow = false,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const classes = cn(
    'relative rounded-2xl overflow-hidden',
    'transition-all duration-300 ease-premium',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void',
    variantClasses[variant],
    paddingMap[pad],
    hover ? 'cursor-pointer' : '',
    glow ? 'animate-pulse-gold' : '',
    className
  )

  const content = (
    <Component
      className={classes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      {/* Premium hover lift effect */}
      <AnimatePresence>
        {hover && (
          <motion.div
            key="hover-shadow"
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ y: 0, boxShadow: 'none' }}
            animate={isHovered ? { y: -2, boxShadow: '0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.12)' } : { y: 0, boxShadow: 'none' }}
            exit={{ y: 0, boxShadow: 'none' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Optional gold glow overlay */}
      {glow && (
        <AnimatePresence>
          {isHovered && (
            <motion.div
              key="glow-overlay"
              className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>
      )}

      {children}
    </Component>
  )

  return content
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-gold/10 bg-bg-void/40 p-8 flex items-center justify-center', className)}>
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <p className="text-lg font-display font-semibold text-gold font-devanagari mb-2">{title}</p>
      {description && <p className="text-sm text-text-muted font-devanagari max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-400/10 border border-rose-400/20 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-rose-400">
          <path d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm text-text-muted font-devanagari max-w-sm">{message}</p>
      {onRetry && (
        <button className="mt-4 px-4 py-2 rounded-lg text-sm text-gold hover:bg-gold/10 transition-colors" onClick={onRetry}>
          पुनः प्रयास करें
        </button>
      )}
    </div>
  )
}

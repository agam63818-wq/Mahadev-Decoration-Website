'use client'

import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'outline' | 'gold-outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  href?: string
  loading?: boolean
  glow?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-gold-warm via-gold to-gold-bright text-bg-void font-semibold shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 hover:from-gold-bright hover:via-gold hover:to-gold-warm transition-all duration-300 active:scale-[0.98]',
  secondary:
    'border border-gold/40 text-gold bg-bg-void/50 hover:bg-gold/10 hover:border-gold/60 transition-all duration-300 active:scale-[0.98]',
  ghost:
    'text-champagne hover:text-gold hover:bg-gold/10 transition-all duration-200 active:scale-[0.98]',
  whatsapp:
    'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 active:scale-[0.98]',
  outline:
    'border border-text-muted/30 text-text-primary hover:border-gold/50 hover:text-gold hover:bg-gold/5 transition-all duration-200 active:scale-[0.98]',
  'gold-outline':
    'border-2 border-gold/30 text-gold hover:border-gold hover:bg-gold/10 transition-all duration-200 active:scale-[0.98]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
}

const ShineSweep = () => (
  <span
    aria-hidden="true"
    className="absolute inset-0 animate-shine pointer-events-none"
    style={{
      background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
      WebkitMask: 'linear-gradient(to right, transparent 0%, #fff 50%, transparent 100%)',
      mask: 'linear-gradient(to right, transparent 0%, #fff 50%, transparent 100%)',
    }}
  />
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, loading, disabled, glow, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium relative overflow-hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          variantClasses[variant],
          sizeClasses[size],
          // Premium inner glow if requested
          glow
            ? 'after:absolute after:inset-0 after:-z-10 after:bg-gradient-to-r after:from-gold/20 after:via-transparent after:to-gold/20 after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300'
            : '',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
        {/* Shine sweep effect on primary variant */}
        {variant === 'primary' && !loading && (
          <ShineSweep />
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

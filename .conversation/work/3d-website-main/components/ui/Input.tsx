'use client'

import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl bg-bg-void/50 border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all duration-200 text-sm font-devanagari',
        error
          ? 'border-rose-400/50 focus:border-rose-400 focus:ring-rose-400/30'
          : 'border-gold/20 focus:border-gold focus:ring-gold/50',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

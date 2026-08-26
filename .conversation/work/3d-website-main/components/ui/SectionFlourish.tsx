'use client'

import { cn } from '@/utils/cn'

interface SectionFlourishProps {
  align?: 'left' | 'center' | 'right'
  className?: string
}

// Premium trishul icon flanked by gold gradient rules
export function SectionFlourish({ align = 'center', className }: SectionFlourishProps) {
  const justifyClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align]

  return (
    <div
      className={cn(
        'flex items-center gap-3 my-3',
        justifyClass,
        className
      )}
    >
      {/* Left rule — gradient fade */}
      <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold/50" />

      {/* Trishul icon — elegant gold line icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="text-gold flex-shrink-0"
      >
        {/* Central staff */}
        <line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Top trishul prongs */}
        <path
          d="M12 7C12 7 8 5 8 2.5C8 1 9.5 0.3 12 0.3C14.5 0.3 16 1 16 2.5C16 5 12 7 12 7Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 7C8 7 5 6 5 4C5 2.5 6 2 8 2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 7C16 7 19 6 19 4C19 2.5 18 2 16 2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Small decorative leaves */}
        <circle cx="12" cy="13" r="1.5" fill="currentColor" />
        <circle cx="9" cy="14" r="0.8" fill="currentColor" />
        <circle cx="15" cy="14" r="0.8" fill="currentColor" />
      </svg>

      {/* Right rule — gradient fade */}
      <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold/50" />
    </div>
  )
}

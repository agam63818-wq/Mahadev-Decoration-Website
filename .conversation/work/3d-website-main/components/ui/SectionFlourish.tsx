'use client'

import { cn } from '@/utils/cn'

interface SectionFlourishProps {
  align?: 'left' | 'center' | 'right'
  className?: string
}

// Reusable decorative flourish — trishul icon flanked by gold rule lines.
// Appears above section headings throughout the site.
export function SectionFlourish({ align = 'center', className }: SectionFlourishProps) {
  const justifyClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align]

  return (
    <div className={cn('flex items-center gap-3', justifyClass, className)}>
      {/* Left rule */}
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold opacity-70" />
      {/* Trishul SVG icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="text-gold flex-shrink-0"
      >
        {/* Simplified trishul (त्रिशूल) line icon */}
        <path
          d="M12 22V8M12 8C12 8 8 6 8 3C8 1.5 9.5 1 12 1C14.5 1 16 1.5 16 3C16 6 12 8 12 8Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 8C8 8 5 7 5 4.5C5 3 6 2.5 8 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 8C16 8 19 7 19 4.5C19 3 18 2.5 16 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line x1="12" y1="22" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {/* Right rule */}
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold opacity-70" />
    </div>
  )
}

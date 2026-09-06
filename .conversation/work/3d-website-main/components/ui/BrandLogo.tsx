import Link from 'next/link'
import { cn } from '@/utils/cn'

/** Shared, crisp vector mark: a trishul inside an architectural arch. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('brand-logo', className)} aria-label="महादेव डेकोरेशन — होम">
      <svg className="brand-mark" width="44" height="52" viewBox="0 0 44 52" fill="none" aria-hidden="true">
        <path d="M3 48V23C3 12 11 4 22 2C33 4 41 12 41 23V48H3Z" stroke="currentColor" strokeWidth="1" />
        <path d="M22 40V13M13 17V22C13 27 17 29 22 29C27 29 31 27 31 22V17M19 17L22 12L25 17M10 20L13 16L16 20M28 20L31 16L34 20M18 36H26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22" cy="45" r="1" fill="currentColor" />
      </svg>
      <span className="brand-wordmark">
        <span className="brand-name">महादेव</span>
        <span className="brand-caption">DECORATION</span>
      </span>
    </Link>
  )
}

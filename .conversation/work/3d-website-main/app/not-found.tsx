import Link from 'next/link'
import { SectionFlourish } from '@/components/ui/SectionFlourish'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-void flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <SectionFlourish className="mb-6" />
        <h1 className="text-8xl font-bold text-gold tabular-nums mb-4">404</h1>
        <h2 className="text-2xl font-bold text-champagne font-devanagari mb-4">
          पेज नहीं मिला
        </h2>
        <p className="text-text-muted font-devanagari mb-8">
          यह पेज मौजूद नहीं है या हटा दिया गया है।
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gold text-bg-void font-bold hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
        >
          होम पर जाएं
        </Link>
      </div>
    </div>
  )
}

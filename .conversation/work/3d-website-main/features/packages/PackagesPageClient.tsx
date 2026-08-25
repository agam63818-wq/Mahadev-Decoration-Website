'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, Maximize2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Package, EventType } from '@/types'
import { buildBookingUrl, formatPrice } from '@/utils/booking'
import { Button } from '@/components/ui/Button'

const eventTypeLabels: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'सभी' },
  { value: 'wedding', label: 'वेडिंग' },
  { value: 'birthday', label: 'बर्थडे' },
  { value: 'haldi', label: 'हल्दी' },
  { value: 'mehendi', label: 'मेहंदी' },
  { value: 'stage', label: 'स्टेज' },
  { value: 'anniversary', label: 'एनिवर्सरी' },
]

interface PackagesPageClientProps {
  packages: Package[]
}

export function PackagesPageClient({ packages }: PackagesPageClientProps) {
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all')
  const router = useRouter()

  const filtered = activeFilter === 'all' ? packages : packages.filter((p) => p.eventType === activeFilter)

  return (
    <>
      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="पैकेज फिल्टर">
        {eventTypeLabels.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            aria-pressed={activeFilter === f.value}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari ${
              activeFilter === f.value
                ? 'bg-gold text-bg-void shadow-gold-glow-sm'
                : 'border border-gold/30 text-text-muted hover:border-gold hover:text-champagne'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((pkg, i) => (
          <motion.article
            key={pkg.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            className={`relative flex flex-col bg-bg-purple border rounded-2xl overflow-hidden transition-all duration-250 hover:shadow-card-lift ${
              pkg.popular ? 'border-gold shadow-gold-glow-sm' : 'border-gold/20 hover:border-gold/40'
            }`}
          >
            {pkg.popular && (
              <div className="bg-gold text-bg-void text-xs font-bold text-center py-1 font-devanagari">
                ⭐ सबसे लोकप्रिय
              </div>
            )}

            <div className={`p-6 flex flex-col flex-1 ${pkg.popular ? '' : ''}`}>
              <h2 className="text-champagne font-bold text-xl font-devanagari mb-1">{pkg.name}</h2>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-4">{pkg.nameEn}</p>

              <div className="mb-4">
                <span className="text-text-muted text-sm">Starting from </span>
                <div className="text-3xl font-bold text-gold tabular-nums">{formatPrice(pkg.startingPrice)}</div>
                {pkg.priceRange && <p className="text-text-muted text-xs mt-0.5">{pkg.priceRange}</p>}
              </div>

              <div className="flex gap-4 mb-4 text-xs text-text-muted">
                <span className="flex items-center gap-1"><Clock size={12} className="text-gold" />{pkg.estimatedSetupTime}</span>
                <span className="flex items-center gap-1"><Maximize2 size={12} className="text-gold" />{pkg.decorationArea}</span>
              </div>

              <ul className="space-y-2 mb-5 flex-1">
                {pkg.inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                    <Check size={14} className="text-gold flex-shrink-0 mt-0.5" />
                    <span className="font-devanagari">{item}</span>
                  </li>
                ))}
              </ul>

              {pkg.customizationAvailable && (
                <div className="mb-4 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs text-center font-devanagari">
                  ✨ कस्टमाइजेशन उपलब्ध
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push(buildBookingUrl({ eventType: pkg.eventType, packageId: pkg.id, sourceName: pkg.nameEn }))}
                  className="w-full py-3 rounded-xl bg-gold text-bg-void font-bold hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Customize Package
                </button>
                <Link
                  href={`/packages/${pkg.slug}`}
                  className="w-full py-3 rounded-xl border border-gold/30 text-text-muted hover:border-gold hover:text-gold transition-colors text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  View Details
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </>
  )
}

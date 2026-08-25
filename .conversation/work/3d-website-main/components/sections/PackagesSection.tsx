'use client'

import { motion } from 'framer-motion'
import { Check, Clock, Maximize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import type { Package } from '@/types'
import { buildBookingUrl, formatPrice } from '@/utils/booking'

interface PackageCardProps {
  pkg: Package
  index: number
}

function PackageCard({ pkg, index }: PackageCardProps) {
  const router = useRouter()

  const handleCustomize = () => {
    const url = buildBookingUrl({
      eventType: pkg.eventType,
      packageId: pkg.id,
      sourceName: pkg.nameEn,
    })
    router.push(url)
  }

  const handleViewDetails = () => {
    router.push(`/packages/${pkg.slug}`)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className={`relative flex flex-col bg-bg-purple border rounded-2xl overflow-hidden transition-all duration-250 hover:shadow-card-lift ${
        pkg.popular
          ? 'border-gold shadow-gold-glow-sm'
          : 'border-gold/20 hover:border-gold/40'
      }`}
    >
      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute top-0 left-0 right-0 bg-gold text-bg-void text-xs font-bold text-center py-1 font-devanagari">
          ⭐ सबसे लोकप्रिय
        </div>
      )}

      <div className={`p-6 flex flex-col flex-1 ${pkg.popular ? 'pt-8' : ''}`}>
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-champagne font-bold text-xl font-devanagari mb-1">{pkg.name}</h3>
          <p className="text-text-muted text-xs uppercase tracking-wider">{pkg.nameEn}</p>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-text-muted text-sm">Starting from</span>
          </div>
          <div className="text-3xl font-bold text-gold tabular-nums">
            {formatPrice(pkg.startingPrice)}
          </div>
          {pkg.priceRange && (
            <p className="text-text-muted text-xs mt-0.5">{pkg.priceRange}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex gap-4 mb-5 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-gold" />
            {pkg.estimatedSetupTime}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 size={12} className="text-gold" />
            {pkg.decorationArea}
          </span>
        </div>

        {/* Inclusions */}
        <ul className="space-y-2 mb-6 flex-1">
          {pkg.inclusions.slice(0, 6).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
              <Check size={14} className="text-gold flex-shrink-0 mt-0.5" />
              <span className="font-devanagari">{item}</span>
            </li>
          ))}
          {pkg.inclusions.length > 6 && (
            <li className="text-xs text-gold pl-5">+{pkg.inclusions.length - 6} और सर्विसेज</li>
          )}
        </ul>

        {/* Customization badge */}
        {pkg.customizationAvailable && (
          <div className="mb-4 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs text-center font-devanagari">
            ✨ कस्टमाइजेशन उपलब्ध
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleCustomize}
            className="w-full font-devanagari"
          >
            Customize Package
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleViewDetails}
            className="w-full"
          >
            View Details
          </Button>
        </div>
      </div>
    </motion.article>
  )
}

interface PackagesSectionProps {
  packages: Package[]
}

export function PackagesSection({ packages }: PackagesSectionProps) {
  const router = useRouter()

  return (
    <section className="py-16 md:py-24 bg-bg-purple/20" aria-labelledby="packages-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="packages-heading"
          title="हमारे पैकेज"
          subtitle="आपके बजट और जरूरत के अनुसार — हर पैकेज कस्टमाइज होता है"
          className="mb-12"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {packages.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} index={i} />
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/packages')}
            className="font-devanagari"
          >
            सभी पैकेज देखें
          </Button>
        </div>
      </div>
    </section>
  )
}

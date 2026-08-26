'use client'

import { motion } from 'framer-motion'
import { Check, Clock, Maximize2, Star, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
      sourceName: pkg.nameEn ?? pkg.name,
    })
    router.push(url)
  }

  const handleViewDetails = () => {
    router.push(`/packages/${pkg.slug}`)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: 'easeOut' }}
      className={`relative flex flex-col bg-gradient-to-br from-bg-purple to-bg-rich border rounded-2xl overflow-hidden transition-all duration-300 ${
        pkg.popular
          ? 'border-gold shadow-xl shadow-gold/15 hover:shadow-2xl hover:shadow-gold/20'
          : 'border-gold/15 hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5'
      }`}
    >
      {/* Top gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-gold-warm/20 to-gold/10 border border-gold/30 rounded-full px-3 py-1 text-gold text-xs font-bold font-devanagari flex items-center gap-1.5 shadow-lg shadow-gold/10 backdrop-blur-sm">
          <Star size={12} fill="currentColor" className="text-gold" />
          सबसे लोकप्रिय
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 mt-8">
        {/* Header — premium typography */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="text-champagne font-bold text-xl font-devanagari group-hover:text-gold-bright transition-colors">
              {pkg.name}
            </h3>
            {pkg.featured && (
              <span className="flex-shrink-0 flex items-center gap-1 text-gold text-xs font-devanagari bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5">
                <Star size={10} fill="currentColor" />
                featured
              </span>
            )}
          </div>
          <p className="text-text-muted text-xs uppercase tracking-wider font-devanagari">{pkg.nameEn}</p>
        </div>

        {/* Price — premium gold gradient */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-text-muted text-xs font-devanagari">शुरुआती कीमत</span>
          </div>
          <div className="bg-gradient-to-r from-gold-warm via-gold to-gold-bright bg-clip-text text-transparent">
            <span className="text-3xl font-bold font-devanagari tabular-nums">
              {formatPrice(pkg.startingPrice)}
            </span>
          </div>
          {pkg.priceRange && (
            <p className="text-text-muted text-xs mt-1 font-devanagari">{pkg.priceRange}</p>
          )}
        </div>

        {/* Meta strip — elegant gold icons */}
        <div className="flex gap-4 mb-5 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Clock size={12} className="text-gold" />
            </div>
            <span>{pkg.estimatedSetupTime}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Maximize2 size={12} className="text-gold" />
            </div>
            <span>{pkg.decorationArea}</span>
          </span>
        </div>

        {/* Inclusions — premium checklist */}
        <ul className="space-y-2.5 mb-6 flex-1">
          {pkg.inclusions.slice(0, 6).map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-gold-warm/20 to-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={10} className="text-gold" strokeWidth={3} />
              </div>
              <span className="font-devanagari leading-relaxed">{item}</span>
            </li>
          ))}
          {pkg.inclusions.length > 6 && (
            <li className="text-xs text-gold flex items-center gap-1.5 pl-7">
              <Sparkles size={10} />
              +{pkg.inclusions.length - 6} और सेवाएं
            </li>
          )}
        </ul>

        {/* Customization badge */}
        {pkg.customizationAvailable && (
          <div className="mb-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-gold/5 to-gold/10 border border-gold/20 text-gold text-xs text-center font-devanagari flex items-center justify-center gap-1.5">
            <Sparkles size={10} />
            ✨ कस्टमाइजेशन उपलब्ध
          </div>
        )}

        {/* Divider */}
        <div className="my-3 h-px bg-gradient-to-r from-gold/10 via-transparent to-gold/10" />

        {/* Actions — premium footer */}
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={handleCustomize}
            className="w-full font-devanagari gap-1.5"
          >
            Customize Package <span className="text-bg-void text-sm">→</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleViewDetails}
            className="w-full text-text-muted hover:text-gold"
          >
            विवरण देखें
          </Button>
        </div>
      </div>

      {/* Bottom gold accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20" />
    </motion.article>
  )
}

interface PackagesSectionProps {
  packages: Package[]
}

export function PackagesSection({ packages }: PackagesSectionProps) {
  return (
    <section className="relative py-16 md:py-24 bg-bg-purple/20 overflow-hidden" aria-labelledby="packages-heading">
      {/* Background ornaments */}
      <div className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full bg-gold/3 blur-3xl pointer-events-none opacity-30" />
      <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] rounded-full bg-burgundy/5 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          id="packages-heading"
          title="हमारे प्रीमियम पैकेज"
          subtitle="आपके बजट और जरूरत के अनुसार — हर पैकेज कस्टमाइज होता है, हर फैंसी अवसर के लिए तैयार"
          className="mb-12"
          align="left"
        />

        {/* Packages grid — premium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {packages.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} index={i} />
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/packages')}
            className="font-devanagari gap-1.5"
          >
            <span>सभी पैकेज देखें</span>
            <span className="text-gold-dim">↓</span>
          </Button>
        </div>
      </div>
    </section>
  )
}

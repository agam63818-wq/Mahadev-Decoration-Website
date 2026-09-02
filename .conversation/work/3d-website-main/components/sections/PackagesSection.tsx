'use client'

import Link from 'next/link'

import { motion } from 'framer-motion'
import { Check, Clock, Maximize2, Star, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'
import { Counter, Magnetic, Reveal, Stagger, StaggerItem, TiltCard } from '@/components/motion'
import type { Package } from '@/types'
import { buildBookingUrl, formatPrice } from '@/utils/booking'

interface PackageCardProps {
  pkg: Package
  index: number
}

function PackageCard({ pkg }: PackageCardProps) {
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
    <StaggerItem className={`group h-full ${pkg.popular ? 'lg:-mt-3' : ''}`}>
    <TiltCard
      maxTilt={3}
      lift={7}
      className={`h-full bg-gradient-to-br from-bg-purple to-bg-rich border rounded-2xl overflow-hidden transition-[border-color,box-shadow] duration-300 ${
        pkg.popular
          ? 'border-gold shadow-gold-glow hover:shadow-gold-glow-lg'
          : 'border-gold/15 hover:border-gold/40 shadow-card-lift hover:shadow-gold-glow-sm'
      }`}
    >
    <article className="relative flex flex-col h-full">
      {/* Top gold accent line */}
      <div className={`h-px bg-gradient-to-r from-transparent to-transparent ${pkg.popular ? 'via-gold animate-shine' : 'via-gold/50'}`} />

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
              <Counter value={formatPrice(pkg.startingPrice)} duration={1.2} />
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
          {pkg.inclusions.slice(0, 6).map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.06 }}
              className="flex items-start gap-2.5 text-sm text-text-muted"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-gold-warm/20 to-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={10} className="text-gold" strokeWidth={3} />
              </div>
              <span className="font-devanagari leading-relaxed">{item}</span>
            </motion.li>
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
          <Magnetic strength={0.15} className="w-full">
            <Button
              variant="primary"
              size="md"
              onClick={handleCustomize}
              className="w-full font-devanagari gap-1.5"
            >
              पैकेज कस्टमाइज करें <span className="text-bg-void text-sm">→</span>
            </Button>
          </Magnetic>
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
    </article>
    </TiltCard>
    </StaggerItem>
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
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 lg:pt-3" stagger={0.12}>
          {packages.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} index={i} />
          ))}
        </Stagger>

        {/* View all CTA */}
        <Reveal className="text-center">
          <Magnetic strength={0.2}>
            <Link
              href="/packages"
              className="group/cta inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gold/40 text-gold font-semibold hover:bg-gold/10 hover:border-gold hover:shadow-gold-glow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
            >
              <span>सभी पैकेज देखें</span>
              <span className="transition-transform duration-300 group-hover/cta:translate-x-1">→</span>
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  )
}

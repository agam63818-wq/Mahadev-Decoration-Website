import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Clock, Maximize2, Sparkles } from 'lucide-react'
import { getPackageBySlug } from '@/services/packages'
import { buildBookingUrl, buildWhatsAppUrl, formatPrice } from '@/utils/booking'
import { getBusinessSettings } from '@/services/business'
import { SectionFlourish } from '@/components/ui/SectionFlourish'
import { RetryableErrorState } from '@/components/ui/RetryableErrorState'

interface Props {
  params: { slug: string }
}

// Packages are admin-editable at /admin/packages — render on every request so
// admin changes appear immediately and newly created packages resolve without
// a redeploy (no generateStaticParams).
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getPackageBySlug(params.slug)
  // A failed query is NOT a 404 — don't emit "Not Found" metadata for a page
  // that is about to render a retryable error state.
  if (!result.ok) return { title: 'पैकेज | महादेव डेकोरेशन' }
  const pkg = result.data
  if (!pkg) return { title: 'Not Found' }

  return {
    title: `${pkg.name} — ${formatPrice(pkg.startingPrice)} से शुरू`,
    description: `${pkg.name} पैकेज में शामिल: ${pkg.inclusions.slice(0, 3).join(', ')} और भी बहुत कुछ। ${pkg.decorationArea}।`,
    openGraph: {
      title: `${pkg.name} | महादेव डेकोरेशन`,
      description: `${formatPrice(pkg.startingPrice)} से शुरू — ${pkg.inclusions.length} सर्विसेज शामिल`,
    },
  }
}

export default async function PackageDetailPage({ params }: Props) {
  const result = await getPackageBySlug(params.slug)

  // Distinguish "database unreachable" from "this package does not exist".
  // The old seed fallback conflated the two and could show a stale static
  // package for a slug the owner had already deleted.
  if (!result.ok) {
    return (
      <div className="min-h-screen bg-bg-void pt-20">
        <RetryableErrorState />
      </div>
    )
  }

  const pkg = result.data
  if (!pkg) notFound()

  const bookingUrl = buildBookingUrl({
    eventType: pkg.eventType,
    packageId: pkg.id,
    sourceName: pkg.nameEn,
  })

  // WhatsApp number comes from business_settings, never hardcoded.
  const business = await getBusinessSettings()
  const whatsappUrl = business.whatsapp
    ? buildWhatsAppUrl(business.whatsapp, `नमस्ते! मुझे ${pkg.name} पैकेज के बारे में जानकारी चाहिए।`)
    : ''

  return (
    <div className="min-h-screen bg-bg-void pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/packages"
          className="inline-flex items-center gap-2 text-text-muted hover:text-gold transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          <ArrowLeft size={16} />
          <span>पैकेज पर वापस जाएं</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Package image placeholder */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gold/20 bg-gradient-to-br from-bg-purple to-bg-burgundy">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Sparkles size={48} className="text-gold opacity-40" />
              <div className="text-center">
                <p className="text-champagne font-devanagari font-bold text-xl">{pkg.name}</p>
                <p className="text-gold font-bold text-2xl mt-1">{formatPrice(pkg.startingPrice)} से</p>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div>
            <SectionFlourish align="left" className="mb-4" />
            <h1 className="text-3xl font-bold text-champagne font-devanagari mb-1">{pkg.name}</h1>
            <p className="text-text-muted text-sm uppercase tracking-wider mb-4">{pkg.nameEn}</p>

            <div className="mb-5">
              <span className="text-text-muted text-sm">Starting from </span>
              <div className="text-4xl font-bold text-gold tabular-nums">{formatPrice(pkg.startingPrice)}</div>
              {pkg.priceRange && <p className="text-text-muted text-sm mt-1">{pkg.priceRange}</p>}
            </div>

            <div className="flex gap-6 mb-6 text-sm text-text-muted">
              <span className="flex items-center gap-2"><Clock size={16} className="text-gold" />{pkg.estimatedSetupTime}</span>
              <span className="flex items-center gap-2"><Maximize2 size={16} className="text-gold" />{pkg.decorationArea}</span>
            </div>

            {pkg.customizationAvailable && (
              <div className="mb-5 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm inline-flex items-center gap-2 font-devanagari">
                <Sparkles size={14} />
                कस्टमाइजेशन उपलब्ध
              </div>
            )}

            <h2 className="text-champagne font-semibold mb-3 text-sm uppercase tracking-wider">शामिल सर्विसेज</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {pkg.inclusions.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                  <Check size={14} className="text-gold flex-shrink-0 mt-0.5" />
                  <span className="font-devanagari">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3">
              <Link
                href={bookingUrl}
                className="block w-full text-center py-4 rounded-xl bg-gold text-bg-void font-bold text-lg hover:bg-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Customize Package
              </Link>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-4 rounded-xl border border-gold/30 text-text-muted hover:border-gold hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold font-devanagari"
                >
                  WhatsApp पर पूछें
                </a>
              )}
            </div>
          </div>
        </div>

        {/* FAQ */}
        {pkg.faq && pkg.faq.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-champagne font-devanagari mb-6">अक्सर पूछे जाने वाले सवाल</h2>
            <div className="space-y-4">
              {pkg.faq.map((item, i) => (
                <div key={i} className="bg-bg-purple border border-gold/10 rounded-xl p-5">
                  <h3 className="text-champagne font-semibold font-devanagari mb-2">{item.question}</h3>
                  <p className="text-text-muted text-sm font-devanagari leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections/HeroSection'
import { TrustStrip } from '@/components/sections/TrustStrip'
import { OccasionsSection } from '@/components/sections/OccasionsSection'
import { FeaturedGallerySection } from '@/components/sections/FeaturedGallerySection'
import { ProcessSection } from '@/components/sections/ProcessSection'
import { PackagesSection } from '@/components/sections/PackagesSection'
import { WhyChooseSection } from '@/components/sections/WhyChooseSection'
import { ReviewsSection } from '@/components/sections/ReviewsSection'
import { ServiceAreaSection } from '@/components/sections/ServiceAreaSection'
import { FinalCTASection } from '@/components/sections/FinalCTASection'
import { getOccasions } from '@/services/services'
import { getFeaturedPortfolioItems } from '@/services/portfolio'
import { getFeaturedPackages } from '@/services/packages'
import { getFeaturedReviews } from '@/services/reviews'
import { getProcessSteps, getWhyChooseFeatures, getServiceAreas, getBusinessSettings } from '@/services/business'
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema'

export const metadata: Metadata = {
  title: 'महादेव डेकोरेशन — बेगूसराय में प्रीमियम डेकोरेशन सर्विस',
  description:
    'बेगूसराय में प्रीमियम डेकोरेशन सर्विस — वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार और हर खास अवसर के लिए शानदार सजावट। 1000+ खुश ग्राहक, 5+ वर्ष का अनुभव।',
  openGraph: {
    title: 'महादेव डेकोरेशन — बेगूसराय में प्रीमियम डेकोरेशन सर्विस',
    description: 'हर खुशी को बनाएं यादगार — वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार डेकोरेशन',
    type: 'website',
  },
}

// The home page shows admin-managed occasions, gallery, packages and reviews,
// so it must render per-request rather than being cached at build time.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Every business-record query now returns DataResult. A section whose query
  // FAILED is hidden rather than being filled with static sample content — the
  // relevant page (/gallery, /packages, /reviews) shows the real error state
  // with a Retry, so the failure is visible without wrecking the home page.
  const [
    occasionsResult,
    portfolioResult,
    packagesResult,
    reviewsResult,
    processSteps,
    whyChooseFeatures,
    serviceAreas,
    business,
  ] = await Promise.all([
    getOccasions(),
    getFeaturedPortfolioItems(),
    getFeaturedPackages(),
    getFeaturedReviews(),
    getProcessSteps(),
    getWhyChooseFeatures(),
    getServiceAreas(),
    getBusinessSettings(),
  ])

  const occasions = occasionsResult.ok ? occasionsResult.data : []
  const portfolioItems = portfolioResult.ok ? portfolioResult.data : []
  const packages = packagesResult.ok ? packagesResult.data : []
  const reviews = reviewsResult.ok ? reviewsResult.data : []

  return (
    <>
      <LocalBusinessSchema business={business} />

      {/* Section 1: Hero */}
      <HeroSection />

      {/* Section 2: Trust Strip */}
      <TrustStrip />

      {/* Section 3: Occasions — hidden entirely when there is no data, so the
          page never renders a heading above an empty grid. */}
      {occasions.length > 0 && <OccasionsSection occasions={occasions} />}

      {/* Section 4: Featured Gallery */}
      {portfolioItems.length > 0 && <FeaturedGallerySection items={portfolioItems} />}

      {/* Section 5: How It Works — static brand copy, always available */}
      <ProcessSection steps={processSteps} />

      {/* Section 6: Featured Packages */}
      {packages.length > 0 && <PackagesSection packages={packages} />}

      {/* Section 7: Why Choose Us — static brand copy, always available */}
      <WhyChooseSection features={whyChooseFeatures} />

      {/* Section 8: Reviews */}
      {reviews.length > 0 && <ReviewsSection reviews={reviews} />}

      {/* Section 9: Service Area */}
      <ServiceAreaSection areas={serviceAreas} business={business} />

      {/* Section 10: Final CTA */}
      <FinalCTASection />
    </>
  )
}

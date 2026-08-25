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

export default async function HomePage() {
  // All data fetched server-side — Part 2 will swap these for Supabase queries
  const [occasions, portfolioItems, packages, reviews, processSteps, whyChooseFeatures, serviceAreas, business] =
    await Promise.all([
      getOccasions(),
      getFeaturedPortfolioItems(),
      getFeaturedPackages(),
      getFeaturedReviews(),
      getProcessSteps(),
      getWhyChooseFeatures(),
      getServiceAreas(),
      getBusinessSettings(),
    ])

  return (
    <>
      <LocalBusinessSchema business={business} />

      {/* Section 1: Hero */}
      <HeroSection />

      {/* Section 2: Trust Strip */}
      <TrustStrip />

      {/* Section 3: Occasions */}
      <OccasionsSection occasions={occasions} />

      {/* Section 4: Featured Gallery */}
      <FeaturedGallerySection items={portfolioItems} />

      {/* Section 5: How It Works */}
      <ProcessSection steps={processSteps} />

      {/* Section 6: Featured Packages */}
      <PackagesSection packages={packages} />

      {/* Section 7: Why Choose Us */}
      <WhyChooseSection features={whyChooseFeatures} />

      {/* Section 8: Reviews */}
      <ReviewsSection reviews={reviews} />

      {/* Section 9: Service Area */}
      <ServiceAreaSection areas={serviceAreas} business={business} />

      {/* Section 10: Final CTA */}
      <FinalCTASection />
    </>
  )
}

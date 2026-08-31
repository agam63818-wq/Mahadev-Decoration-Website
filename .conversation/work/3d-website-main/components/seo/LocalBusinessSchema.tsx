import type { BusinessSettings } from '@/types'
import { serviceAreas } from '@/lib/data'

interface LocalBusinessSchemaProps {
  business: BusinessSettings
}

export function LocalBusinessSchema({ business }: LocalBusinessSchemaProps) {
  const address = business.address.trim()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://mahadevdecoration.com/#business',
    name: business.businessName,
    alternateName: business.businessNameHindi,
    description:
      'Premium decoration services — Wedding, Birthday, Haldi, Mehendi, Stage, Car decoration and more.',
    url: 'https://mahadevdecoration.com',
    // Only emitted when the admin has filled it in — schema.org never sees an
    // empty or invented phone number / address.
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
    ...(address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: address,
            addressCountry: 'IN',
          },
        }
      : {}),
    openingHoursSpecification: business.businessHours
      .filter((h) => !h.isClosed && h.open && h.close)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.day,
        opens: h.open,
        closes: h.close,
      })),
    // Open platform map — every link the admin adds shows up in sameAs.
    sameAs: Object.values(business.socialLinks ?? {}).filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    ),
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Bank Transfer',
    areaServed: serviceAreas.map((a) => ({ '@type': 'City', name: a.nameEn })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Decoration Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wedding Decoration' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Birthday Decoration' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Stage Decoration' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Car Decoration' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Haldi Decoration' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mehendi Decoration' } },
      ],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

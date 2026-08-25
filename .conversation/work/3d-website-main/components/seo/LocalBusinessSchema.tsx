import type { BusinessSettings } from '@/types'

interface LocalBusinessSchemaProps {
  business: BusinessSettings
}

export function LocalBusinessSchema({ business }: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://mahadevdecoration.com/#business',
    name: business.businessName,
    alternateName: business.businessNameHindi,
    description:
      'Premium decoration services in Begusarai, Bihar — Wedding, Birthday, Haldi, Mehendi, Stage, Car decoration and more.',
    url: 'https://mahadevdecoration.com',
    telephone: business.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: business.state,
      postalCode: business.pincode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 25.4182,
      longitude: 86.1272,
    },
    openingHoursSpecification: business.businessHours
      .filter((h) => !h.isClosed)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.day,
        opens: h.open,
        closes: h.close,
      })),
    sameAs: [
      business.socialLinks.instagram,
      business.socialLinks.facebook,
      business.socialLinks.youtube,
    ].filter(Boolean),
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Bank Transfer',
    areaServed: [
      { '@type': 'City', name: 'Begusarai' },
      { '@type': 'City', name: 'Patna' },
      { '@type': 'City', name: 'Muzaffarpur' },
      { '@type': 'City', name: 'Darbhanga' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Decoration Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wedding Decoration Begusarai' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Birthday Decoration Begusarai' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Stage Decoration Begusarai' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Car Decoration Begusarai' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Haldi Decoration Begusarai' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mehendi Decoration Begusarai' } },
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

import type { Metadata } from 'next'

const SITE_NAME = 'महादेव डेकोरेशन'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mahadevdecoration.com'
const DEFAULT_DESCRIPTION =
  'बेगूसराय में प्रीमियम डेकोरेशन सर्विस — वेडिंग, बर्थडे, हल्दी, मेहंदी, स्टेज, कार और हर खास अवसर के लिए शानदार सजावट। 1000+ खुश ग्राहक, 5+ वर्ष का अनुभव।'

export function buildMetadata({
  title,
  description,
  path = '',
  image,
}: {
  title: string
  description?: string
  path?: string
  image?: string
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`
  const desc = description ?? DEFAULT_DESCRIPTION
  const url = `${SITE_URL}${path}`
  const ogImage = image ?? `${SITE_URL}/og-default.jpg`

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      locale: 'hi_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [ogImage],
    },
  }
}

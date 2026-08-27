import type { BookingPrefillContext } from '@/types'

// ─── Booking URL helpers ───────────────────────────────────────────────────────
// These build the /booking URL with prefill context in query params.
// Part 2 will consume these params in the booking wizard.

export function buildBookingUrl(context: BookingPrefillContext): string {
  const params = new URLSearchParams()
  if (context.eventType) params.set('eventType', context.eventType)
  if (context.packageId) params.set('packageId', context.packageId)
  if (context.portfolioItemId) params.set('portfolioItemId', context.portfolioItemId)
  // The exact look the customer clicked, so the booking records which one it was.
  if (context.portfolioMediaId) params.set('portfolioMediaId', context.portfolioMediaId)
  if (context.price != null) params.set('price', String(context.price))
  if (context.variantLabel) params.set('variantLabel', context.variantLabel)
  if (context.style) params.set('style', context.style)
  if (context.sourceName) params.set('sourceName', context.sourceName)
  const qs = params.toString()
  return `/booking${qs ? `?${qs}` : ''}`
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const encoded = message ? encodeURIComponent(message) : ''
  return `https://wa.me/${phone}${encoded ? `?text=${encoded}` : ''}`
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

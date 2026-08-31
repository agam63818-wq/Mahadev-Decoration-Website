// ─── Business / Domain Types ──────────────────────────────────────────────────
// These mirror the Supabase schema that Part 2 will introduce.
// Part 2 will swap the static data layer for Supabase queries without
// changing any component props.

export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'haldi'
  | 'mehendi'
  | 'car'
  | 'stage'
  | 'mandap'
  | 'home'
  | 'flower'
  | 'lighting'
  | 'custom'

export type DecorationStyle =
  | 'royal'
  | 'floral'
  | 'minimal'
  | 'traditional'
  | 'modern'
  | 'luxury'
  | 'custom'

// ─── Service ──────────────────────────────────────────────────────────────────
export interface Service {
  id: string
  slug: string
  name: string          // Hindi name
  nameEn: string        // English name
  description: string   // Hindi description
  descriptionEn: string
  icon: string          // Lucide icon name
  eventType: EventType
  startingPrice: number
  imageUrl: string
  imageAlt: string
  featured: boolean
  sortOrder: number
}

// ─── Occasion (homepage cards — subset of services) ───────────────────────────
export interface Occasion {
  id: string
  slug: string
  name: string          // Hindi
  nameEn: string
  description: string   // Hindi, one line
  eventType: EventType
  startingPrice: number
  imageUrl: string
  imageAlt: string
  icon: string
}

// ─── Portfolio / Gallery ──────────────────────────────────────────────────────
export interface PortfolioItem {
  id: string
  /** Live table has no slug column — this carries the item id (URL identifier). */
  slug: string
  title: string         // Hindi/English
  /** portfolio_categories.id — drives the public gallery filter pills. */
  categoryId?: string | null
  eventType: EventType
  location: string
  priceRange: string    // e.g. "₹15,000 – ₹25,000"
  description: string
  servicesIncluded: string[]
  images: PortfolioImage[]
  featured: boolean
  tags: string[]
}

/**
 * A single image inside a portfolio item — one "look" of that design.
 *
 * Pricing is per-image, not per-item: the same mandap design can be offered as
 * several looks at different price points, and the customer books the exact
 * look they picked. Maps to public.portfolio_media.
 */
export interface PortfolioImage {
  /** portfolio_media.id — carried into the booking as selected_portfolio_media_id. */
  id: string
  url: string
  alt: string
  width: number
  height: number
  /** Cover image shown on the gallery card. Mirrors is_cover / is_primary. */
  isPrimary?: boolean
  /**
   * Admin-defined label for this look, e.g. "बेसिक लुक" / "प्रीमियम लुक".
   * Never hardcode a fixed set — whatever the admin types is what shows.
   */
  variantLabel?: string | null
  /** Price for this specific look. null ⇒ plain reference photo, no price badge. */
  price?: number | null
  /** Admin can hide the book button for a look that is not currently offered. */
  isBookable?: boolean
  sortOrder?: number
}

/** A look is bookable only when the admin both priced it and left it bookable. */
export function isBookableLook(image: PortfolioImage): boolean {
  return image.isBookable !== false && image.price != null && image.price > 0
}

// ─── Package ──────────────────────────────────────────────────────────────────
export interface Package {
  id: string
  slug: string
  name: string          // Hindi/English
  nameEn: string
  eventType: EventType
  startingPrice: number
  priceRange?: string   // e.g. "₹5,000 – ₹10,000"
  inclusions: string[]
  estimatedSetupTime: string
  decorationArea: string
  customizationAvailable: boolean
  imageUrl: string
  imageAlt: string
  featured: boolean
  popular?: boolean
  faq?: PackageFAQ[]
}

export interface PackageFAQ {
  question: string
  answer: string
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string
  customerName: string
  customerLocation: string
  eventType: EventType
  rating: number        // 1–5
  reviewText: string
  eventPhotoUrl?: string
  eventPhotoAlt?: string
  customerPhotoUrl?: string
  customerPhotoAlt?: string
  date: string          // ISO date string
  featured: boolean
  approved: boolean     // Only approved reviews shown publicly
}

// ─── Stat ─────────────────────────────────────────────────────────────────────
export interface Stat {
  id: string
  icon: string          // Lucide icon name
  value: string         // e.g. "1000+"
  label: string         // Hindi label
  labelEn: string
}

// ─── Service Area ─────────────────────────────────────────────────────────────
export interface ServiceArea {
  id: string
  name: string
  nameEn: string
  isHomeBase: boolean
  lat?: number
  lng?: number
}

// ─── Business Settings ────────────────────────────────────────────────────────
export interface BusinessSettings {
  businessName: string
  businessNameHindi: string
  tagline: string
  taglineSecondary: string
  phone: string
  whatsapp: string
  email: string
  /**
   * Full free-text address — the single address field in business_settings.
   * Empty until the admin fills it in; every surface hides itself until then.
   */
  address: string
  businessHours: BusinessHours[]
  socialLinks: SocialLinks
}

export interface BusinessHours {
  day: string
  dayHindi: string
  open: string
  close: string
  isClosed: boolean
}

/**
 * Open key-value map of social platforms, mirroring business_settings.social_links
 * (jsonb). The named keys below are conveniences for existing call sites — new
 * platforms can be added by the admin without a code change.
 */
export interface SocialLinks {
  instagram?: string
  facebook?: string
  youtube?: string
  whatsapp?: string
  [platform: string]: string | undefined
}

// ─── Booking Prefill Context (seam for Part 2) ────────────────────────────────
// This is the typed context that gallery/package CTAs pass to /booking
// via URL query params. Part 2 will consume this directly.
export interface BookingPrefillContext {
  eventType?: EventType
  packageId?: string
  portfolioItemId?: string
  /** The exact look the customer clicked — persisted as selected_portfolio_media_id. */
  portfolioMediaId?: string
  /** Price of that look, for the booking summary. */
  price?: number | null
  /** Label of that look, for the booking summary. */
  variantLabel?: string | null
  style?: DecorationStyle
  sourceName?: string   // Human-readable label for the prefill chip
}

// ─── Team Member ──────────────────────────────────────────────────────────────
export interface TeamMember {
  id: string
  name: string
  role: string
  roleHindi: string
  bio: string
  photoUrl: string
  photoAlt: string
  yearsExperience: number
}

// ─── Process Step ─────────────────────────────────────────────────────────────
export interface ProcessStep {
  id: string
  stepNumber: string    // "01", "02", etc.
  title: string         // Hindi
  titleEn: string
  description: string
  icon: string          // Lucide icon name
}

// ─── Why Choose Us Feature ────────────────────────────────────────────────────
export interface WhyChooseFeature {
  id: string
  icon: string
  title: string
  titleEn: string
  description: string
}

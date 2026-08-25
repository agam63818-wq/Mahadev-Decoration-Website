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
  slug: string
  title: string         // Hindi/English
  eventType: EventType
  location: string
  priceRange: string    // e.g. "₹15,000 – ₹25,000"
  description: string
  servicesIncluded: string[]
  images: PortfolioImage[]
  featured: boolean
  tags: string[]
}

export interface PortfolioImage {
  url: string
  alt: string
  width: number
  height: number
  isPrimary?: boolean
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
  address: string
  addressHindi: string
  city: string
  state: string
  pincode: string
  businessHours: BusinessHours[]
  socialLinks: SocialLinks
  mapEmbedUrl: string
}

export interface BusinessHours {
  day: string
  dayHindi: string
  open: string
  close: string
  isClosed: boolean
}

export interface SocialLinks {
  instagram?: string
  facebook?: string
  youtube?: string
  whatsapp: string
}

// ─── Booking Prefill Context (seam for Part 2) ────────────────────────────────
// This is the typed context that gallery/package CTAs pass to /booking
// via URL query params. Part 2 will consume this directly.
export interface BookingPrefillContext {
  eventType?: EventType
  packageId?: string
  portfolioItemId?: string
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

import { getSupabaseReadClient } from '@/lib/supabase/server'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import type { BookingRequestRow } from '@/lib/supabase/database.types'

/**
 * The gallery look a customer tapped "इसी लुक जैसा बुक करें" on.
 * `null` on a booking means no design was picked — the admin UI must then omit
 * the selected-design block entirely rather than render an empty placeholder.
 */
export interface SelectedLook {
  mediaId: string
  url: string
  alt: string
  variantLabel: string | null
  price: number | null
  portfolioItemId: string | null
  portfolioItemTitle: string | null
  portfolioItemSlug: string | null
}

export interface AdminBookingRequest {
  id: string
  reference: string
  status: string
  eventType: string
  eventDate: string
  location: string
  venueName: string
  budget: string
  guestCount: number | null
  venueType: string
  setting: string
  style: string[]
  requirements: string
  contactName: string
  contactPhone: string
  contactWhatsapp: string
  contactEmail: string | null
  createdAt: string
  selectedLook: SelectedLook | null
}

const REQUEST_COLUMNS = [
  'id',
  'reference_number',
  'status',
  'event_type',
  'event_date',
  'city',
  'area',
  'address',
  'venue_name',
  'budget',
  'custom_budget',
  'style',
  'guest_count',
  'venue_type',
  'setting',
  'requirements',
  'contact_name',
  'contact_phone',
  'contact_whatsapp',
  'contact_email',
  'selected_portfolio_media_id',
  'created_at',
].join(', ')

type MediaJoin = {
  id: string
  url: string | null
  alt_text: string | null
  variant_label: string | null
  price: number | null
  portfolio_item_id: string | null
  portfolio_items: { id: string; title: string | null; slug: string | null } | null
}

function mapSelectedLook(media: MediaJoin | null): SelectedLook | null {
  if (!media) return null
  return {
    mediaId: media.id,
    url: portfolioPublicUrl(media.url ?? ''),
    alt: media.alt_text ?? 'चुना हुआ डिज़ाइन',
    variantLabel: media.variant_label,
    // A number only when the admin actually priced this look.
    price: typeof media.price === 'number' && Number.isFinite(media.price) ? media.price : null,
    portfolioItemId: media.portfolio_items?.id ?? media.portfolio_item_id ?? null,
    portfolioItemTitle: media.portfolio_items?.title ?? null,
    portfolioItemSlug: media.portfolio_items?.slug ?? null,
  }
}

function joinLocation(row: BookingRequestRow): string {
  return [row.area, row.city].filter((part) => part && part.trim()).join(', ')
}

/**
 * Loads booking requests for the admin console together with the specific
 * priced look each customer selected, in a single round trip.
 *
 * Returns an empty list (not an error) when Supabase is not configured, so the
 * admin console still renders during local setup instead of crashing.
 */
export async function getAdminBookingRequests(): Promise<AdminBookingRequest[]> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('booking_requests')
    .select(
      `${REQUEST_COLUMNS}, portfolio_media:selected_portfolio_media_id (id, url, alt_text, variant_label, price, portfolio_item_id, portfolio_items(id, title, slug))`
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) return []

  const rows = data as unknown as (BookingRequestRow & { portfolio_media: MediaJoin | null })[]

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference_number ?? row.id.slice(0, 8).toUpperCase(),
    status: row.status ?? 'pending_review',
    eventType: row.event_type ?? '—',
    eventDate: row.event_date ?? '',
    location: joinLocation(row) || (row.address ?? ''),
    venueName: row.venue_name ?? '',
    budget: row.budget ?? (row.custom_budget != null ? `₹${row.custom_budget}` : ''),
    guestCount: row.guest_count,
    venueType: row.venue_type ?? '',
    setting: row.setting ?? '',
    style: Array.isArray(row.style) ? row.style : [],
    requirements: row.requirements ?? '',
    contactName: row.contact_name ?? 'नाम नहीं दिया',
    contactPhone: row.contact_phone ?? '',
    contactWhatsapp: row.contact_whatsapp ?? '',
    contactEmail: row.contact_email,
    createdAt: row.created_at,
    selectedLook: mapSelectedLook(row.portfolio_media ?? null),
  }))
}

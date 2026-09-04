import { getSupabaseReadClient } from '@/lib/supabase/server'
import { portfolioPublicUrl } from '@/lib/supabase/config'
import type { BookingRequestRow } from '@/lib/supabase/database.types'

/**
 * The gallery look a customer tapped "इसी लुक जैसा बुक करें" on.
 * `null` on a booking means no design was picked — the admin UI must then omit
 * the selected-design block entirely rather than render an empty placeholder.
 */
export interface SelectedLook {
  mediaId: string | null
  url: string
  alt: string
  variantLabel: string | null
  price: number | null
  portfolioItemId: string | null
  portfolioItemTitle: string | null
  portfolioItemSlug: string | null
  /**
   * PART 3 §5: true when price/label/image came from the booking's OWN
   * snapshot columns (migration 0011) and are therefore the real historical
   * values. False means this booking predates 0011 and the figures shown are
   * the CURRENT catalog values — the admin UI must say so rather than present
   * today's price as what the customer was quoted.
   */
  priceIsHistorical: boolean
  /**
   * True when the catalog row this booking pointed at is gone (photo deleted,
   * FK nulled by `on delete set null`). §11/§6: the snapshot still renders, but
   * "open the design" must not be offered.
   */
  catalogRowMissing: boolean
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
  // §3: the frozen historical record. Read these FIRST — they are what the
  // customer actually saw and agreed to.
  'selected_variant_label_snapshot',
  'selected_price_snapshot',
  'selected_image_url_snapshot',
  'selected_item_title_snapshot',
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

/**
 * Builds the admin's view of the chosen look, preferring the booking's own
 * snapshot over the live catalog row.
 *
 * THE POINT OF THIS FUNCTION (§5/§6): the previous version read price, label
 * and image straight off the joined `portfolio_media` row. That made booking
 * history mutable — re-pricing a look in /admin/portfolio silently rewrote
 * what every past booking of that look appeared to cost, and replacing the
 * photo changed the picture attached to a completed job.
 *
 * Now the join is used only for things that are legitimately "current":
 * the slug used to open the design page, and a best-effort fallback for
 * pre-0011 bookings that have no snapshot of their own.
 */
function mapSelectedLook(
  row: Pick<
    BookingRequestRow,
    | 'selected_portfolio_media_id'
    | 'selected_variant_label_snapshot'
    | 'selected_price_snapshot'
    | 'selected_image_url_snapshot'
    | 'selected_item_title_snapshot'
  >,
  media: MediaJoin | null,
): SelectedLook | null {
  const snapshotPrice =
    row.selected_price_snapshot == null ? null : Number(row.selected_price_snapshot)
  const hasSnapshot =
    (snapshotPrice != null && Number.isFinite(snapshotPrice)) ||
    Boolean(row.selected_image_url_snapshot) ||
    Boolean(row.selected_variant_label_snapshot) ||
    Boolean(row.selected_item_title_snapshot)

  // No design was ever chosen, and nothing was frozen — omit the block.
  if (!media && !hasSnapshot) return null

  const livePrice =
    typeof media?.price === 'number' && Number.isFinite(media.price) ? media.price : null

  return {
    mediaId: row.selected_portfolio_media_id ?? media?.id ?? null,
    // Snapshot image wins. Falls back to the live URL only for old bookings.
    url: portfolioPublicUrl(row.selected_image_url_snapshot ?? media?.url ?? ''),
    alt: media?.alt_text ?? row.selected_item_title_snapshot ?? 'चुना हुआ डिज़ाइन',
    variantLabel: row.selected_variant_label_snapshot ?? media?.variant_label ?? null,
    // Historical price wins outright. `?? livePrice` only ever applies to
    // bookings created before migration 0011.
    price: snapshotPrice != null && Number.isFinite(snapshotPrice) ? snapshotPrice : livePrice,
    portfolioItemId: media?.portfolio_items?.id ?? media?.portfolio_item_id ?? null,
    portfolioItemTitle: row.selected_item_title_snapshot ?? media?.portfolio_items?.title ?? null,
    // Slug is intentionally live: it is a NAVIGATION target, not history. A
    // stale slug would 404.
    portfolioItemSlug: media?.portfolio_items?.slug ?? null,
    priceIsHistorical: hasSnapshot,
    // The booking references a design that no longer exists in the catalog.
    catalogRowMissing: !media && hasSnapshot,
  }
}

function joinLocation(row: BookingRequestRow): string {
  return [row.area, row.city].filter((part) => part && part.trim()).join(', ')
}

/**
 * Loads booking requests for the admin console together with the specific
 * priced look each customer selected, in a single round trip.
 *
 * §24: reports `failed` separately from an empty list. The previous version
 * returned [] for BOTH a broken query and a genuinely empty table, so a
 * network blip rendered "अभी कोई बुकिंग रिक्वेस्ट नहीं" — which for a
 * booking list is a genuinely alarming lie.
 */
export async function getAdminBookingRequests(): Promise<{
  bookings: AdminBookingRequest[]
  failed: boolean
}> {
  const supabase = getSupabaseReadClient()
  if (!supabase) return { bookings: [], failed: true }

  const { data, error } = await supabase
    .from('booking_requests')
    .select(
      `${REQUEST_COLUMNS}, portfolio_media:selected_portfolio_media_id (id, url, alt_text, variant_label, price, portfolio_item_id, portfolio_items(id, title, slug))`
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) {
    if (error) console.error('[admin/bookings] load failed:', error.message)
    return { bookings: [], failed: true }
  }

  const rows = data as unknown as (BookingRequestRow & { portfolio_media: MediaJoin | null })[]

  const bookings = rows.map((row) => ({
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
    selectedLook: mapSelectedLook(row, row.portfolio_media ?? null),
  }))

  return { bookings, failed: false }
}

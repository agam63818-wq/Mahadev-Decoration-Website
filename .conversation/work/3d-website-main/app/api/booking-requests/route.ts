import { NextResponse } from 'next/server'
import { z } from 'zod'

/*
 * PART 3 §4–§8. Two problems this route had:
 *
 *  1. It accepted `selectedVariantLabel` and `selectedPrice` from the browser,
 *     validated them, and then NEVER WROTE THEM. The booked price was silently
 *     discarded, and the admin console had to re-derive it from the current
 *     catalog — so re-pricing a look rewrote every past booking of it.
 *
 *  2. Even if those fields had been stored, taking a PRICE from the client is
 *     unsafe: the value arrived via a URL query parameter, so anyone could
 *     book a ₹40,000 look at ₹1 by editing the address bar.
 *
 * Both are fixed by reading the snapshot values SERVER-SIDE out of
 * portfolio_media, keyed by the media id, immediately before the insert. The
 * client's price is now ignored entirely.
 */

const requestSchema = z.object({
  eventType: z.string().min(1), eventDate: z.string().date(),
  city: z.string().min(2), area: z.string().min(2), address: z.string().min(8),
  venueName: z.string().optional(), budget: z.string().optional(), customBudget: z.string().optional(),
  style: z.array(z.string()).min(1), guestCount: z.coerce.number().int().positive(),
  venueType: z.string().min(1), setting: z.string().min(1), requirements: z.string().max(3000),
  name: z.string().min(2).max(100), phone: z.string().regex(/^[0-9+\-\s()]{10,20}$/),
  whatsapp: z.string().optional(), email: z.string().email().optional().or(z.literal('')),
  referenceFiles: z.array(z.string()).max(10).optional(),
  // PART A: the specific priced gallery look the customer chose. A uuid so a
  // hand-crafted payload can't smuggle arbitrary text into the FK column.
  selectedPortfolioMediaId: z.string().uuid().optional(),
  portfolioItemId: z.string().optional(),
  /*
   * Still ACCEPTED so existing clients don't start failing validation, but
   * deliberately NOT TRUSTED: the label and price actually stored come from
   * the database lookup below. Keeping them in the schema documents that the
   * server knows about them and chooses to ignore them.
   */
  selectedVariantLabel: z.string().max(120).optional(),
  selectedPrice: z.coerce.number().nonnegative().optional(),
})

function supabaseConfig() {
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
}

/** Shape of the one portfolio_media row a booking may point at. */
interface LookSnapshot {
  variantLabel: string | null
  price: number | null
  imageUrl: string | null
  itemTitle: string | null
}

/**
 * Reads the chosen look's CURRENT values so they can be frozen onto the
 * booking. This is the only moment the catalog is consulted — after this the
 * booking carries its own copy (§4).
 *
 * A failure here must NOT block the booking: losing a customer enquiry is far
 * worse than losing the snapshot detail, so this returns nulls and the booking
 * proceeds. The admin UI then falls back to the live join and says so.
 */
async function loadLookSnapshot(
  url: string,
  key: string,
  mediaId: string,
): Promise<LookSnapshot | null> {
  try {
    const query =
      `${url}/rest/v1/portfolio_media` +
      `?id=eq.${encodeURIComponent(mediaId)}` +
      `&select=url,variant_label,price,portfolio_items(title)` +
      `&limit=1`

    const response = await fetch(query, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!response.ok) return null

    const rows = (await response.json()) as Array<{
      url: string | null
      variant_label: string | null
      price: number | string | null
      portfolio_items: { title: string | null } | null
    }>
    const row = rows?.[0]
    if (!row) return null

    const priceNumber = row.price == null ? null : Number(row.price)

    return {
      variantLabel: row.variant_label,
      // An unpriced "reference only" look stays null — never 0, which would
      // read as a free booking.
      price: priceNumber != null && Number.isFinite(priceNumber) ? priceNumber : null,
      imageUrl: row.url,
      itemTitle: row.portfolio_items?.title ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Creates the single admin notification for a new booking request (§8).
 *
 * IDEMPOTENCY is enforced by the database, not by this function: migration
 * 0011 puts a UNIQUE index on (booking_request_id, type). A duplicate insert
 * therefore fails with Postgres 23505, which we treat as SUCCESS — the
 * notification already exists, which is exactly the state we wanted. A
 * "select then insert" check here would be race-prone (§8 forbids relying on
 * it), because two concurrent submits can both read "not there yet".
 *
 * Never throws: a booking must not be reported as failed just because the
 * bell row could not be written.
 */
async function createBookingNotification(
  url: string,
  key: string,
  input: {
    bookingRequestId: string
    reference: string
    contactName: string
    eventType: string
    eventDate: string
    price: number | null
    imageUrl: string | null
    lookTitle: string | null
  },
): Promise<{ ok: boolean; duplicate: boolean }> {
  // Message intentionally carries the customer NAME (the owner needs to know
  // who to call) but not the phone/email — §8 says avoid unnecessary sensitive
  // detail in the notification body; the full contact sits behind the
  // RLS-protected booking detail one tap away.
  const priceText = input.price != null ? ` · ₹${input.price.toLocaleString('en-IN')}` : ''
  const lookText = input.lookTitle ? ` · ${input.lookTitle}` : ''

  try {
    const response = await fetch(`${url}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        type: 'booking_request',
        booking_request_id: input.bookingRequestId,
        title: `नई बुकिंग रिक्वेस्ट — ${input.contactName}`,
        message: `${input.eventType} · ${input.eventDate}${lookText}${priceText} · ${input.reference}`,
        image_url_snapshot: input.imageUrl,
        is_read: false,
      }),
    })

    if (response.ok) return { ok: true, duplicate: false }

    // 409 + 23505 = the unique index did its job. Desired end state reached.
    const body = await response.text().catch(() => '')
    if (response.status === 409 || body.includes('23505')) {
      return { ok: true, duplicate: true }
    }

    console.error('[booking-requests] notification insert failed:', response.status, body)
    return { ok: false, duplicate: false }
  } catch (error) {
    console.error('[booking-requests] notification insert threw:', error)
    return { ok: false, duplicate: false }
  }
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'कृपया सभी जरूरी जानकारी सही तरीके से भरें।', issues: parsed.error.flatten() }, { status: 400 })
  const { url, key } = supabaseConfig()
  if (!url || !key) return NextResponse.json({ error: 'Booking backend अभी configure नहीं है। Supabase URL और server key जोड़कर फिर प्रयास करें।' }, { status: 503 })

  const mediaId = parsed.data.selectedPortfolioMediaId ?? null

  // §4: snapshot values are resolved from the DATABASE, not the request body.
  const look = mediaId ? await loadLookSnapshot(url, key, mediaId) : null

  const reference = `MD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const payload = {
    reference_number: reference, status: 'pending_review',
    event_type: parsed.data.eventType, event_date: parsed.data.eventDate,
    city: parsed.data.city, area: parsed.data.area, address: parsed.data.address,
    venue_name: parsed.data.venueName, budget: parsed.data.budget,
    custom_budget: parsed.data.customBudget ? Number(parsed.data.customBudget) : null,
    style: parsed.data.style, guest_count: parsed.data.guestCount,
    venue_type: parsed.data.venueType, setting: parsed.data.setting,
    requirements: parsed.data.requirements, reference_files: parsed.data.referenceFiles ?? [],
    contact_name: parsed.data.name, contact_phone: parsed.data.phone,
    contact_whatsapp: parsed.data.whatsapp, contact_email: parsed.data.email || null,
    // Null (not omitted) when no design was picked, so the admin UI can simply
    // check for a value and hide the "selected design" block entirely.
    selected_portfolio_media_id: mediaId,
    // §3–§6: frozen history. Nulls when no look was chosen, or when the
    // lookup failed — an honest "unknown", never a guess.
    selected_variant_label_snapshot: look?.variantLabel ?? null,
    selected_price_snapshot: look?.price ?? null,
    selected_image_url_snapshot: look?.imageUrl ?? null,
    selected_item_title_snapshot: look?.itemTitle ?? null,
  }

  // `return=representation` so we get the new row's id back and can attach the
  // notification to it. Previously this was `return=minimal`.
  const response = await fetch(`${url}/rest/v1/booking_requests`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) return NextResponse.json({ error: 'रिक्वेस्ट सेव नहीं हो पाई। कृपया कुछ देर बाद दोबारा प्रयास करें।' }, { status: 502 })

  const created = (await response.json().catch(() => null)) as Array<{ id: string }> | null
  const bookingRequestId = created?.[0]?.id ?? null

  /*
   * §21: this is NOT atomic, and it is not claimed to be. The booking row and
   * the notification row are two separate PostgREST calls, so a crash between
   * them leaves a booking with no bell entry.
   *
   * That partial failure is chosen deliberately as the safe direction: the
   * booking (the thing the business cannot afford to lose) is already durably
   * committed, and the owner still sees it in /admin/bookings — he just does
   * not get a bell for it. The reverse ordering, or failing the request when
   * the notification fails, would risk losing a real customer enquiry over a
   * cosmetic row.
   *
   * A single atomic operation would need a Postgres function; that is a
   * documented limitation rather than a false claim of atomicity.
   */
  if (bookingRequestId) {
    await createBookingNotification(url, key, {
      bookingRequestId,
      reference,
      contactName: parsed.data.name,
      eventType: parsed.data.eventType,
      eventDate: parsed.data.eventDate,
      price: look?.price ?? null,
      imageUrl: look?.imageUrl ?? null,
      lookTitle: look?.itemTitle ?? null,
    })
  }

  return NextResponse.json({ reference })
}

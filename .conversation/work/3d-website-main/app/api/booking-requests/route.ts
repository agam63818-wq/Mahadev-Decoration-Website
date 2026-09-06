import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  eventType: z.string().min(1),
  eventDate: z.string().date(),
  city: z.string().min(2),
  area: z.string().min(2),
  address: z.string().min(8),
  venueName: z.string().optional(),
  budget: z.string().optional(),
  customBudget: z.string().optional(),
  style: z.array(z.string()).min(1),
  guestCount: z.coerce.number().int().positive(),
  venueType: z.string().min(1),
  setting: z.string().min(1),
  requirements: z.string().max(3000),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[0-9+\-\s()]{10,20}$/),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  referenceFiles: z.array(z.string()).max(10).optional(),
  selectedPortfolioMediaId: z.string().uuid().optional(),
  selectedPortfolioItemId: z.string().uuid().optional(),
  selectedServiceId: z.string().uuid().optional(),
  selectedPackageId: z.string().uuid().optional(),
  // Legacy client fields are accepted for compatibility but never trusted for pricing.
  selectedVariantLabel: z.string().max(120).optional(),
  selectedPrice: z.coerce.number().nonnegative().optional(),
})

function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

interface LookSnapshot {
  variantLabel: string | null
  price: number | null
  imageUrl: string | null
  itemTitle: string | null
  portfolioItemId: string | null
}

interface ServiceSnapshot {
  name: string | null
  startingPrice: number | null
}

interface PackageSnapshot {
  name: string | null
  startingPrice: number | null
  priceMax: number | null
}

async function loadJson<T>(url: string, key: string, endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${url}/rest/v1/${endpoint}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const rows = (await response.json()) as T[]
    return rows?.[0] ?? null
  } catch {
    return null
  }
}

async function loadLookSnapshot(url: string, key: string, mediaId: string): Promise<LookSnapshot | null> {
  const row = await loadJson<{
    id: string
    url: string | null
    variant_label: string | null
    price: number | string | null
    is_bookable: boolean
    portfolio_item_id: string
    portfolio_items: { title: string | null } | null
  }>(
    url,
    key,
    `portfolio_media?id=eq.${encodeURIComponent(mediaId)}&select=id,url,variant_label,price,is_bookable,portfolio_item_id,portfolio_items(title)&limit=1`,
  )

  if (!row || row.is_bookable === false) return null
  const price = row.price == null ? null : Number(row.price)
  return {
    variantLabel: row.variant_label,
    price: price != null && Number.isFinite(price) ? price : null,
    imageUrl: row.url,
    itemTitle: row.portfolio_items?.title ?? null,
    portfolioItemId: row.portfolio_item_id,
  }
}

async function loadServiceSnapshot(url: string, key: string, serviceId: string): Promise<ServiceSnapshot | null> {
  const row = await loadJson<{ name: string; starting_price: number | string | null; is_active: boolean }>(
    url,
    key,
    `services?id=eq.${encodeURIComponent(serviceId)}&select=name,starting_price,is_active&limit=1`,
  )
  if (!row || row.is_active === false) return null
  const price = row.starting_price == null ? null : Number(row.starting_price)
  return { name: row.name, startingPrice: Number.isFinite(price) ? price : null }
}

async function loadPackageSnapshot(url: string, key: string, packageId: string): Promise<PackageSnapshot | null> {
  const row = await loadJson<{
    name: string
    starting_price: number | string | null
    price_max: number | string | null
    is_active: boolean
  }>(
    url,
    key,
    `packages?id=eq.${encodeURIComponent(packageId)}&select=name,starting_price,price_max,is_active&limit=1`,
  )
  if (!row || row.is_active === false) return null
  const startingPrice = row.starting_price == null ? null : Number(row.starting_price)
  const priceMax = row.price_max == null ? null : Number(row.price_max)
  return {
    name: row.name,
    startingPrice: Number.isFinite(startingPrice) ? startingPrice : null,
    priceMax: Number.isFinite(priceMax) ? priceMax : null,
  }
}

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
) {
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

    if (response.ok) return true
    const body = await response.text().catch(() => '')
    if (response.status === 409 || body.includes('23505')) return true
    console.error('[booking-requests] notification insert failed:', response.status, body)
  } catch (error) {
    console.error('[booking-requests] notification insert threw:', error)
  }
  return false
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'कृपया सभी जरूरी जानकारी सही तरीके से भरें।', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { url, key } = supabaseConfig()
  if (!url || !key) {
    return NextResponse.json({ error: 'Booking backend अभी configure नहीं है।' }, { status: 503 })
  }

  const mediaId = parsed.data.selectedPortfolioMediaId ?? null
  const serviceId = parsed.data.selectedServiceId ?? null
  const packageId = parsed.data.selectedPackageId ?? null

  // All catalog facts are resolved server-side. Browser-supplied price/label values are ignored.
  const [look, service, pkg] = await Promise.all([
    mediaId ? loadLookSnapshot(url, key, mediaId) : Promise.resolve(null),
    serviceId ? loadServiceSnapshot(url, key, serviceId) : Promise.resolve(null),
    packageId ? loadPackageSnapshot(url, key, packageId) : Promise.resolve(null),
  ])

  if (mediaId && !look) {
    return NextResponse.json({ error: 'चुना हुआ डिज़ाइन अब उपलब्ध नहीं है। कृपया दूसरा डिज़ाइन चुनें।' }, { status: 409 })
  }
  if (serviceId && !service) {
    return NextResponse.json({ error: 'चुनी हुई सेवा अब उपलब्ध नहीं है। कृपया दोबारा चुनें।' }, { status: 409 })
  }
  if (packageId && !pkg) {
    return NextResponse.json({ error: 'चुना हुआ पैकेज अब उपलब्ध नहीं है। कृपया दोबारा चुनें।' }, { status: 409 })
  }

  const reference = `MD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const customBudget = parsed.data.customBudget?.trim() ? Number(parsed.data.customBudget) : null

  const payload = {
    reference_number: reference,
    // Keep both the new admin-facing fields and the legacy columns populated.
    customer_name: parsed.data.name,
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    event_type: parsed.data.eventType,
    event_date: parsed.data.eventDate,
    city: parsed.data.city,
    area: parsed.data.area,
    address: parsed.data.address,
    venue_name: parsed.data.venueName || null,
    budget: parsed.data.budget || null,
    budget_range: parsed.data.budget || null,
    custom_budget: customBudget != null && Number.isFinite(customBudget) ? customBudget : null,
    style: parsed.data.style,
    decoration_styles: parsed.data.style,
    guest_count: parsed.data.guestCount,
    venue_type: parsed.data.venueType,
    setting: parsed.data.setting,
    is_indoor: parsed.data.setting === 'Indoor',
    requirements: parsed.data.requirements,
    special_requirements: parsed.data.requirements,
    reference_files: parsed.data.referenceFiles ?? [],
    reference_images: parsed.data.referenceFiles ?? [],
    contact_name: parsed.data.name,
    contact_phone: parsed.data.phone,
    contact_whatsapp: parsed.data.whatsapp || null,
    contact_email: parsed.data.email || null,
    selected_portfolio_media_id: mediaId,
    selected_service_id: serviceId,
    selected_package_id: packageId,
    selected_variant_label_snapshot: look?.variantLabel ?? null,
    selected_price_snapshot: look?.price ?? pkg?.startingPrice ?? service?.startingPrice ?? null,
    selected_image_url_snapshot: look?.imageUrl ?? null,
    selected_item_title_snapshot: look?.itemTitle ?? null,
    selected_service_name_snapshot: service?.name ?? null,
    selected_package_name_snapshot: pkg?.name ?? null,
    source_portfolio_item_id: look?.portfolioItemId ?? parsed.data.selectedPortfolioItemId ?? null,
    status: 'pending_review',
  }

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

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    console.error('[booking-requests] booking insert failed:', response.status, body)
    return NextResponse.json({ error: 'रिक्वेस्ट सेव नहीं हो पाई। कृपया कुछ देर बाद दोबारा प्रयास करें।' }, { status: 502 })
  }

  const created = (await response.json().catch(() => null)) as Array<{ id: string }> | null
  const bookingRequestId = created?.[0]?.id ?? null

  if (bookingRequestId) {
    await createBookingNotification(url, key, {
      bookingRequestId,
      reference,
      contactName: parsed.data.name,
      eventType: parsed.data.eventType,
      eventDate: parsed.data.eventDate,
      price: look?.price ?? pkg?.startingPrice ?? service?.startingPrice ?? null,
      imageUrl: look?.imageUrl ?? null,
      lookTitle: look?.itemTitle ?? null,
    })
  }

  return NextResponse.json({ reference })
}

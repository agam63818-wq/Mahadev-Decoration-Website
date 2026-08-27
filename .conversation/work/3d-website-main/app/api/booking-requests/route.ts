import { NextResponse } from 'next/server'
import { z } from 'zod'

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
  selectedVariantLabel: z.string().max(120).optional(),
  selectedPrice: z.coerce.number().nonnegative().optional(),
})

function supabaseConfig() {
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'कृपया सभी जरूरी जानकारी सही तरीके से भरें।', issues: parsed.error.flatten() }, { status: 400 })
  const { url, key } = supabaseConfig()
  if (!url || !key) return NextResponse.json({ error: 'Booking backend अभी configure नहीं है। Supabase URL और server key जोड़कर फिर प्रयास करें।' }, { status: 503 })

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
    selected_portfolio_media_id: parsed.data.selectedPortfolioMediaId ?? null,
  }
  const response = await fetch(`${url}/rest/v1/booking_requests`, {
    method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) return NextResponse.json({ error: 'रिक्वेस्ट सेव नहीं हो पाई। कृपया कुछ देर बाद दोबारा प्रयास करें।' }, { status: 502 })
  return NextResponse.json({ reference })
}
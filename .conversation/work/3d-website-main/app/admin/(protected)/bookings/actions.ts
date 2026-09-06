'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/session'
import { getSupabaseWriteClient } from '@/lib/supabase/server'

export type BookingWorkflowResult = { ok: boolean; error?: string; bookingId?: string }

const requestIdSchema = z.string().uuid('बुकिंग रिक्वेस्ट की पहचान अमान्य है')
const priceSchema = z.number({ invalid_type_error: 'कुल कीमत अंकों में डालें' }).finite().min(0, 'कुल कीमत 0 से कम नहीं हो सकती').max(100000000, 'कुल कीमत बहुत ज़्यादा है')
const statusSchema = z.enum([
  'inquiry', 'pending_review', 'quote_sent', 'awaiting_customer_approval', 'advance_pending',
  'confirmed', 'in_preparation', 'team_assigned', 'in_progress', 'completed',
  'remaining_payment_pending', 'closed', 'cancelled',
])

async function requireAdmin() {
  const admin = await getAdminUser()
  if (!admin) return { supabase: null, error: 'अनुमति नहीं है। कृपया दोबारा लॉगिन करें।' }
  const supabase = getSupabaseWriteClient()
  if (!supabase) return { supabase: null, error: 'Supabase कॉन्फ़िगर नहीं है।' }
  return { supabase, error: null }
}

function revalidateBookingWorkflow() {
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/calendar')
  revalidatePath('/admin/customers')
  revalidatePath('/admin')
}

/** Atomic/idempotent database conversion; payment is intentionally untouched. */
export async function convertBookingRequest(input: unknown): Promise<BookingWorkflowResult> {
  const parsed = z.object({ requestId: requestIdSchema, totalPrice: priceSchema }).safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य जानकारी' }

  const { supabase, error: authError } = await requireAdmin()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string; code?: string; hint?: string } | null }>

  const { data, error } = await rpc('convert_booking_request_to_booking', {
    p_request_id: parsed.data.requestId,
    p_total_price: parsed.data.totalPrice,
  })

  if (error) {
    console.error('[admin/bookings] conversion failed:', error.message)
    if (error.code === '23P01' || error.message === 'booking_date_conflict') {
      return { ok: false, error: 'इस तारीख पर पहले से एक कन्फर्म/सक्रिय बुकिंग है। दूसरी बुकिंग कन्फर्म करने से पहले तारीख बदलें या पुरानी बुकिंग की स्थिति जाँचें।' }
    }
    return { ok: false, error: 'बुकिंग बन नहीं सकी। कृपया फिर कोशिश करें।' }
  }

  revalidateBookingWorkflow()
  return { ok: true, bookingId: String(data) }
}

/** Update the inbound request and, when it has already been converted,
 * keep the real booking status in sync with it. */
export async function updateBookingRequestStatus(input: unknown): Promise<BookingWorkflowResult> {
  const parsed = z.object({ requestId: requestIdSchema, status: statusSchema }).safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य स्थिति' }

  const { supabase, error: authError } = await requireAdmin()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const patch = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  } as never

  const { data, error } = await supabase
    .from('booking_requests')
    .update(patch)
    .eq('id', parsed.data.requestId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin/bookings] request status update failed:', error.message)
    return { ok: false, error: 'स्थिति अपडेट नहीं हो सकी। कृपया फिर कोशिश करें।' }
  }
  if (!data) return { ok: false, error: 'बुकिंग रिक्वेस्ट नहीं मिली।' }

  // PR #12 creates the real booking with booking_request_id. If it exists,
  // mirror the workflow status there too. The cast is intentionally narrow
  // because the generated client types lag behind the live schema.
  const bookingPatch = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  } as never
  const { error: bookingError } = await supabase
    .from('bookings')
    .update(bookingPatch)
    .eq('booking_request_id', parsed.data.requestId)

  if (bookingError) {
    console.error('[admin/bookings] converted booking status sync failed:', bookingError.message)
    return { ok: false, error: 'रिक्वेस्ट अपडेट हो गई, लेकिन वास्तविक बुकिंग की स्थिति अपडेट नहीं हो सकी।' }
  }

  revalidateBookingWorkflow()
  return { ok: true, bookingId: parsed.data.requestId }
}

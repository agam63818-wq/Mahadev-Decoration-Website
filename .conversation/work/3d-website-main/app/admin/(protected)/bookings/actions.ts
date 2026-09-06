'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAdminUser } from '@/lib/auth/session'
import { getSupabaseWriteClient } from '@/lib/supabase/server'

export type BookingWorkflowResult = {
  ok: boolean
  error?: string
  bookingId?: string
}

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

  // The live database migration is deliberately the source of truth for this
  // RPC. The generated local type file predates the function, so keep this
  // narrow escape hatch local to the call rather than weakening the whole
  // Supabase client type.
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>

  const { data, error } = await rpc('convert_booking_request_to_booking', {
    p_request_id: parsed.data.requestId,
    p_total_price: parsed.data.totalPrice,
  })

  if (error) {
    console.error('[admin/bookings] conversion failed:', error.message)
    return { ok: false, error: 'बुकिंग बन नहीं सकी। कृपया फिर कोशिश करें।' }
  }

  revalidateBookingWorkflow()
  return { ok: true, bookingId: String(data) }
}

/** Change only the request status; it never rewrites customer/event data. */
export async function updateBookingRequestStatus(input: unknown): Promise<BookingWorkflowResult> {
  const parsed = z.object({ requestId: requestIdSchema, status: statusSchema }).safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'अमान्य स्थिति' }

  const { supabase, error: authError } = await requireAdmin()
  if (authError || !supabase) return { ok: false, error: authError ?? 'Unavailable' }

  const { data, error } = await supabase
    .from('booking_requests')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.requestId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin/bookings] status update failed:', error.message)
    return { ok: false, error: 'स्थिति अपडेट नहीं हो सकी। कृपया फिर कोशिश करें।' }
  }
  if (!data) return { ok: false, error: 'बुकिंग रिक्वेस्ट नहीं मिली।' }

  revalidateBookingWorkflow()
  return { ok: true, bookingId: parsed.data.requestId }
}

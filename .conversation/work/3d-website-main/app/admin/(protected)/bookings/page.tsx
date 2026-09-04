import { Suspense } from 'react'
import { getAdminBookingRequests } from '@/services/bookings'
import { BookingsManager } from './BookingsManager'

// Bookings change constantly and the list is admin-only, so never cache it.
export const dynamic = 'force-dynamic'

export default async function AdminBookingsPage() {
  const { bookings, failed } = await getAdminBookingRequests()
  // §24: `failed` is forwarded so the manager can show an error + Retry
  // instead of an empty state. An empty booking list and a broken query look
  // identical to the owner otherwise, and the wrong one is very alarming.
  //
  // §11: BookingsManager reads `?ref=` (the notification deep link) via
  // useSearchParams, which Next requires to sit inside a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <BookingsManager bookings={bookings} loadFailed={failed} />
    </Suspense>
  )
}

import { getAdminBookingRequests } from '@/services/bookings'
import { BookingsManager } from './BookingsManager'

// Bookings change constantly and the list is admin-only, so never cache it.
export const dynamic = 'force-dynamic'

export default async function AdminBookingsPage() {
  const bookings = await getAdminBookingRequests()
  return <BookingsManager bookings={bookings} />
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BookingPlaceholder } from '@/features/booking/BookingPlaceholder'

export const metadata: Metadata = {
  title: 'बुकिंग — डेकोरेशन बुक करें',
  description: 'महादेव डेकोरेशन के साथ अपना इवेंट बुक करें। बुकिंग फ्लो Part 2 में आएगा।',
  robots: { index: false, follow: false },
}

export default function BookingPage() {
  return (
    <Suspense>
      <BookingPlaceholder />
    </Suspense>
  )
}

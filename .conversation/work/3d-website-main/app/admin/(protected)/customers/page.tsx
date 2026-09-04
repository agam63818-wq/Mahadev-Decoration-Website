import { getAdminCustomers } from '@/services/admin-reporting'
import { CustomersClient } from './CustomersClient'

export const dynamic = 'force-dynamic'

/**
 * §2 — Customer management.
 *
 * Previously `sampleCustomers`: eight invented people with invented phone
 * numbers, invented spend and a hardcoded "नया ग्राहक (इस माह) = 12" that had
 * no relationship to any of them.
 *
 * Now every row is a real `public.customers` record, with booking counts and
 * spend rolled up from real bookings/payments (cancelled bookings excluded,
 * refunds subtracted) by `getAdminCustomers()`.
 */
export default async function AdminCustomersPage() {
  const result = await getAdminCustomers()

  return (
    <CustomersClient
      customers={result.ok ? result.data.customers : []}
      newThisMonth={result.ok ? result.data.newThisMonth : 0}
      hasError={!result.ok}
    />
  )
}

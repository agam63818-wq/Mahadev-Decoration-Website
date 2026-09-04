import { getAdminPayments } from '@/services/admin-reporting'
import { PaymentsClient } from './PaymentsClient'

// Payments must always reflect the live ledger — never a cached snapshot.
export const dynamic = 'force-dynamic'

/**
 * §4 — Payment management.
 *
 * This screen previously rendered `samplePayments`: eight invented transactions
 * with invented customer names and invented TXN ids, plus stat cards summing
 * those invented rows. Every figure below now comes from `public.payments`.
 *
 * The received / pending / failed / refunded split is computed by
 * `lib/admin/payment-status.ts`, the SAME module the dashboard uses, so the
 * "प्राप्त" figure here can never disagree with the dashboard's revenue.
 */
export default async function AdminPaymentsPage() {
  const result = await getAdminPayments()

  return (
    <PaymentsClient
      payments={result.ok ? result.data.payments : []}
      totals={result.ok ? result.data.totals : null}
      hasError={!result.ok}
    />
  )
}

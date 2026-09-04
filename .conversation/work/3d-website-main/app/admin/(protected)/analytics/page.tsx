import { getAnalytics } from '@/services/admin-reporting'
import { AnalyticsClient } from './AnalyticsClient'

export const dynamic = 'force-dynamic'

/**
 * §2/§3 — Analytics dashboard.
 *
 * This screen was entirely fabricated: eight months of invented booking counts,
 * eight months of invented revenue, an invented category split that summed to a
 * suspiciously tidy 100%, four invented "key metrics" (78% / 22% / 4.7 / 12%)
 * and four invented trend badges (+15% / +12% / +8% / ±5%). It even carried a
 * footer note admitting the numbers were samples.
 *
 * Everything now comes from `getAnalytics()`, which reads real bookings,
 * payments, requests and reviews. Where a figure cannot be derived honestly the
 * page shows "डेटा पर्याप्त नहीं" instead of inventing one.
 */
export default async function AdminAnalyticsPage() {
  const result = await getAnalytics(6)

  return <AnalyticsClient data={result.ok ? result.data : null} hasError={!result.ok} />
}

import { getDashboardMetrics, getRecentBookings } from '@/services/admin-reporting'
import { DashboardClient } from './DashboardClient'

// Every figure here is a live aggregate, so the page must never be cached.
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [metricsResult, recentResult] = await Promise.all([
    getDashboardMetrics(),
    getRecentBookings(5),
  ])

  return (
    <DashboardClient
      metrics={metricsResult.ok ? metricsResult.data : null}
      metricsError={!metricsResult.ok}
      recent={recentResult.ok ? recentResult.data : []}
      recentError={!recentResult.ok}
    />
  )
}

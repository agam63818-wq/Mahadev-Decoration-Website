import { getCalendarEvents } from '@/services/admin-reporting'
import { CalendarClient } from './CalendarClient'

export const dynamic = 'force-dynamic'

/**
 * §2 — Event calendar.
 *
 * Previously `sampleEvents`: eight invented jobs with invented customer names,
 * invented Bihar locations and invented decoration areas, hardcoded to October
 * and November 2024. The "today" highlight was literally
 * `dateStr === '2024-10-15'`, so the calendar highlighted the wrong day on
 * every real date.
 *
 * Now every pill comes from real bookings plus real unconverted booking
 * requests, and "today" is the actual current date.
 */
export default async function AdminCalendarPage() {
  const result = await getCalendarEvents()

  return (
    <CalendarClient events={result.ok ? result.data : []} hasError={!result.ok} />
  )
}

import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { dispatchBookingPush } from '@/lib/push/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret ?? ''}`)
  const candidate = Buffer.from(supplied)
  if (!secret || secret.length < 32 || candidate.length !== expected.length ||
    !timingSafeEqual(candidate, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // No client-supplied booking IDs, payloads or destinations are accepted.
  try {
    return NextResponse.json(await dispatchBookingPush(), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('[booking-push] worker failed; inspect configuration/database/queue health')
    return NextResponse.json({ error: 'Notification worker unavailable' }, { status: 503 })
  }
}

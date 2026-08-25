import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function POST(request: Request) {
  const parsed = z.object({ phone: z.string().regex(/^[0-9+\-\s()]{10,20}$/) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'सही मोबाइल नंबर डालें।' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Auth backend अभी configure नहीं है। Supabase keys जोड़ें।' }, { status: 503 })
  const response = await fetch(`${url}/auth/v1/otp`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: parsed.data.phone }) })
  if (!response.ok) return NextResponse.json({ error: 'OTP भेजा नहीं जा सका। Supabase में phone provider enable है या नहीं जांचें।' }, { status: 502 })
  return NextResponse.json({ message: 'OTP भेज दिया गया है। अपने फोन पर आया कोड दर्ज करें।' })
}
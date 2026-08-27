'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ADMIN_ROLES } from '@/lib/auth/roles'

interface AdminLoginFormProps {
  redirectTo: string
  reason?: string
  signedInAsNonAdmin?: boolean
  signedInEmail?: string | null
}

/**
 * Reasons the middleware guard can bounce someone back here. Kept as plain
 * Hindi copy so the admin understands *why* they are looking at a login box.
 */
const reasonMessages: Record<string, string> = {
  'not-admin':
    'इस खाते के पास एडमिन एक्सेस नहीं है। कृपया अपने एडमिन खाते से लॉगिन करें।',
  'auth-unconfigured':
    'सर्वर पर Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है, इसलिए एडमिन पैनल सुरक्षा कारणों से बंद है।',
  'session-expired':
    'आपका सेशन समाप्त हो गया है। कृपया दोबारा लॉगिन करें।',
  'not-authenticated': 'जारी रखने के लिए कृपया लॉगिन करें।',
}

export function AdminLoginForm({
  redirectTo,
  reason,
  signedInAsNonAdmin = false,
  signedInEmail = null,
}: AdminLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    reason ? (reasonMessages[reason] ?? null) : null,
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError(reasonMessages['auth-unconfigured'])
      return
    }

    setLoading(true)
    try {
      // 1. Real credential check against Supabase Auth.
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError || !data.user) {
        setError('ईमेल या पासवर्ड ग़लत है। कृपया दोबारा कोशिश करें।')
        return
      }

      // 2. Authentication is not authorization — confirm the staff role.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      const role = (profile as { role?: string } | null)?.role
      if (profileError || !role || !ADMIN_ROLES.includes(role as never)) {
        // Do not leave a half-privileged session lying around in cookies.
        await supabase.auth.signOut()
        setError(reasonMessages['not-admin'])
        return
      }

      // 3. Session cookies are set — refresh so the server guard sees them.
      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError('लॉगिन नहीं हो सका। कृपया कुछ देर बाद दोबारा कोशिश करें।')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-bg-void flex items-center justify-center px-4 py-16">
      {/* Ambient brand glow — matches the existing dark royal theme. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-bg-purple/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-bg-burgundy/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-gold/20 bg-bg-purple/40 p-8 shadow-gold-glow-sm backdrop-blur-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-bg-void/60">
              <Lock className="h-6 w-6 text-gold" />
            </div>
            <h1 className="font-devanagari text-2xl font-bold text-champagne">
              एडमिन लॉगिन
            </h1>
            <p className="font-devanagari mt-2 text-sm text-text-muted">
              महादेव डेकोरेशन प्रबंधन पैनल
            </p>
          </div>

          {/* Signed in, but not staff */}
          {signedInAsNonAdmin && (
            <div className="mb-6 flex gap-3 rounded-xl border border-gold/25 bg-bg-void/50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div className="space-y-2">
                <p className="font-devanagari text-sm text-text-primary">
                  आप{signedInEmail ? ` ${signedInEmail}` : ''} के रूप में लॉगिन हैं,
                  लेकिन इस खाते के पास एडमिन एक्सेस नहीं है।
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-devanagari text-sm font-semibold text-gold underline decoration-gold/40 underline-offset-4 transition hover:text-gold-warm"
                >
                  लॉग आउट करें और दूसरे खाते से लॉगिन करें
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex gap-3 rounded-xl border border-red-500/30 bg-red-950/30 p-4"
            >
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <p className="font-devanagari text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-email"
                className="font-devanagari mb-2 block text-sm font-medium text-text-primary"
              >
                ईमेल
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-gold/20 bg-bg-void/60 px-4 py-3 text-text-primary placeholder:text-text-muted/60 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="font-devanagari mb-2 block text-sm font-medium text-text-primary"
              >
                पासवर्ड
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gold/20 bg-bg-void/60 px-4 py-3 pr-12 text-text-primary placeholder:text-text-muted/60 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'पासवर्ड छिपाएँ' : 'पासवर्ड दिखाएँ'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-gold"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="font-devanagari flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/90 to-gold-warm px-6 py-3 font-semibold text-bg-void shadow-gold-glow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  लॉगिन हो रहा है…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  लॉगिन करें
                </>
              )}
            </button>
          </form>

          {/* No self sign-up: admin accounts are provisioned in Supabase only. */}
          <p className="font-devanagari mt-6 border-t border-gold/10 pt-5 text-center text-xs leading-relaxed text-text-muted">
            एडमिन खाते केवल Supabase में सीधे बनाए जाते हैं
            <span className="text-text-muted/70">
              {' '}
              (profiles.role = admin / team)
            </span>
            । यहाँ से नया खाता रजिस्टर नहीं किया जा सकता।
          </p>
        </div>

        <p className="font-devanagari mt-6 text-center text-xs text-text-muted/70">
          यह पृष्ठ प्रतिबंधित है — केवल अधिकृत टीम सदस्यों के लिए।
        </p>
      </div>
    </main>
  )
}

export default AdminLoginForm

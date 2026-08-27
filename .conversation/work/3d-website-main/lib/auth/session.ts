import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isAdminRole, type SessionUser, type UserRole } from './roles'

// ─── Server-side session helpers ──────────────────────────────────────────────
// These run on the server only. They are the authority for route admission —
// never gate an admin route from client-side state alone.

/**
 * Resolve the current visitor from the request cookies, including their
 * profiles.role. Returns null when there is no valid session.
 *
 * Uses getUser() (not getSession()) so the JWT is verified against the
 * Supabase auth server rather than trusted straight from the cookie.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return null

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const profile = data as { role: string | null; display_name: string | null } | null

  return {
    id: user.id,
    email: user.email ?? null,
    // Default to the least-privileged role: a missing profile row must never
    // be treated as an admin.
    role: (profile?.role as UserRole | null) ?? 'customer',
    displayName: profile?.display_name ?? null,
  }
}

/** True when the current visitor may enter /admin/*. */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user || !isAdminRole(user.role)) return null
  return user
}

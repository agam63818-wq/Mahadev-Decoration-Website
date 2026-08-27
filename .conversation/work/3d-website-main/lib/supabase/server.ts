import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

// ─── Server Supabase clients ──────────────────────────────────────────────────

/**
 * Request-scoped client that reads the caller's session from cookies.
 * Use in Server Components, Route Handlers and Server Actions so that RLS
 * applies as the logged-in user.
 */
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null
  const cookieStore = cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Called from a Server Component render pass, where cookies are
          // read-only. Middleware already refreshes the session cookie, so
          // this is safe to ignore.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // See above.
        }
      },
    },
  })
}

/**
 * Service-role client. Bypasses RLS — SERVER ONLY, never import into a
 * component that ships to the browser. Used for privileged admin writes and
 * for reading public content without a session.
 */
export function getSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !serviceRoleKey) return null

  return createClient<Database>(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Best client available for reading *public* content on the server:
 * prefers the service-role client, falls back to the anon client.
 *
 * The return type is pinned to the anon-client type because the two clients are
 * structurally identical for query purposes; without this, the union of the two
 * generic instantiations makes `.from(...)` non-callable for TypeScript.
 */
export function getSupabaseReadClient(): ReturnType<typeof getSupabaseServerClient> {
  const admin = getSupabaseAdminClient()
  if (admin) return admin as unknown as ReturnType<typeof getSupabaseServerClient>
  return getSupabaseServerClient()
}

/**
 * Client for privileged admin writes from Server Actions.
 *
 * Identical resolution to getSupabaseReadClient, but named separately so intent
 * is obvious at the call site: callers MUST have already verified the caller is
 * an admin (see getAdminUser) before using this, because the service-role key
 * bypasses RLS.
 */
export function getSupabaseWriteClient(): ReturnType<typeof getSupabaseServerClient> {
  return getSupabaseReadClient()
}

export { isSupabaseConfigured }

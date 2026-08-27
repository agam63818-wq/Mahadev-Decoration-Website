'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

// ─── Browser Supabase client ──────────────────────────────────────────────────
// Session persistence is ON (the Supabase default — `persistSession: true`),
// so an admin who logs in stays logged in across page refreshes and browser
// restarts. They only need to log in again after an explicit logout, natural
// expiry, or a failed token refresh.
//
// Storage medium: cookies (via @supabase/ssr) rather than localStorage.
// This is deliberate and required — the /admin/* and /dashboard/* route guards
// run in middleware on the server, *before* the page renders. The server can
// only see cookies, never localStorage. Cookie storage gives us the same
// "stay logged in" persistence while making a true server-side gate possible
// (no flash-of-admin-content then redirect).

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return browserClient
}

export { isSupabaseConfigured }

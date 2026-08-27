// ─── Supabase configuration ───────────────────────────────────────────────────
// Single source of truth for whether the backend is wired up. Every data
// service degrades gracefully to the static seed data in lib/data/ when it
// isn't, so the site keeps rendering in local/preview environments.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** True when the public (browser-safe) Supabase credentials are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

/** True when the server-only service-role key is also present. */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/** Public storage URL for an object in the `portfolio` bucket. */
export function portfolioPublicUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`
}

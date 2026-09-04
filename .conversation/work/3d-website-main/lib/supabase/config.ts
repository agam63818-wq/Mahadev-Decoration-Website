// ─── Supabase configuration ───────────────────────────────────────────────────
// Single source of truth for whether the backend is wired up.
//
// Fallback policy (deliberate, see the Part 1 upgrade brief):
// - BRAND CONSTANTS (business name, tagline, hero copy, process steps, "why
//   choose us" bullets) may still fall back to lib/data/ — they are static
//   marketing copy, not business records.
// - BUSINESS RECORDS (services, team members, reviews, packages, occasions,
//   portfolio, bookings, payments, customers) must NEVER fall back to static
//   arrays at runtime. Those tables are seeded by migration; if a query fails
//   the caller returns an explicit error state so the failure is visible
//   instead of being masked by plausible-looking sample content.

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
  return publicStorageUrl(PORTFOLIO_BUCKET, path)
}

/** Storage bucket holding gallery / portfolio media (created in migration 0002). */
export const PORTFOLIO_BUCKET = 'portfolio'

/**
 * Storage bucket holding catalogue CARD artwork — service cards, team photos,
 * package cards (created in migration 0007: public read, admin-only write).
 *
 * PART 2 UPLOAD LOCATION MARKER
 * The admin image picker / upload UI that Part 2 will add must upload into
 * exactly this bucket via the SERVER-side service-role client, never from the
 * browser, and must follow the safety rules documented in
 * supabase/migrations/0007_card_images.sql:
 *   1. validate MIME against an allow-list before uploading
 *   2. enforce a maximum byte size
 *   3. generate the object path server-side as `<entity>/<row-id>/<ts>.<ext>`
 *      — never trust the client filename
 *   4. upload with `upsert: false`
 *   5. write image_url to the row ONLY after the upload succeeds
 *   6. remove the uploaded object if the row write then fails (no orphans)
 *   7. only delete previous objects that are bucket-relative paths
 *   8. never expose SUPABASE_SERVICE_ROLE_KEY to the client
 */
export const CARD_IMAGES_BUCKET = 'card-images'

/** Public storage URL for an object in the `card-images` bucket. */
export function cardImagePublicUrl(path: string): string {
  return publicStorageUrl(CARD_IMAGES_BUCKET, path)
}

/**
 * Resolve a stored image reference to something an `<Image>` can render.
 *
 * Accepts three shapes, because rows can legitimately hold any of them:
 * - an absolute `http(s)://` URL      → returned as-is
 * - a `/`-prefixed local public path  → returned as-is (e.g. /assets/hero.png)
 * - a bucket-relative object path     → expanded to the public storage URL
 *
 * Returns '' for empty input so callers can treat "no image" as a single
 * falsy check and fall back to the icon instead of rendering a broken image.
 */
function publicStorageUrl(bucket: string, path: string): string {
  if (!path) return ''
  const trimmed = path.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  if (!SUPABASE_URL) return ''
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${trimmed}`
}

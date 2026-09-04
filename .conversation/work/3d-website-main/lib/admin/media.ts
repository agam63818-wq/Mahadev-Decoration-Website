// ─── Shared admin image validation & object-path rules ────────────────────────
//
// PART 2 §3. This module is deliberately dependency-free and framework-free so
// that the SAME rules run in two places:
//
//   * in the browser, to reject a bad file BEFORE it is uploaded (instant
//     feedback, no wasted bandwidth on the owner's mobile data), and
//   * inside the Server Action, which is the only place that actually matters
//     — a browser check is UI convenience, never a security boundary.
//
// It must NOT import next/headers, the Supabase client, or React. Anything
// server-only here would make the client bundle fail to build.

/**
 * Accepted image MIME types.
 *
 * Deliberately an allow-list, not a `image/*` prefix test: `image/svg+xml`
 * passes a prefix test and SVG can carry script, so it stays out. GIF is out
 * because a decoration card never needs animation and GIFs are large.
 */
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number]

/** Hard upload ceiling. Phone cameras routinely produce 4-6MB JPEGs. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

/** Human-readable limit for UI copy, so the number is never written twice. */
export const MAX_IMAGE_LABEL = '8MB'

/** `accept` attribute for <input type="file">, derived from the allow-list. */
export const IMAGE_ACCEPT_ATTR = ALLOWED_IMAGE_MIME.join(',')

/**
 * Extension used for the generated object path, chosen from the *MIME type* —
 * never from the uploaded filename. A client can call a PHP file "cake.jpg";
 * it cannot lie about the sniffed content type as easily, and even if it does,
 * the stored extension then matches what we validated rather than what the
 * client claimed.
 */
const EXT_BY_MIME: Record<AllowedImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type ImageValidationResult =
  | { ok: true; mime: AllowedImageMime; ext: string }
  | { ok: false; error: string }

/**
 * Validate a picked file. Errors are owner-facing Hindi, because they are
 * shown directly in a toast — the owner is not going to read "unsupported
 * MIME type".
 */
export function validateImageFile(file: unknown): ImageValidationResult {
  if (typeof File === 'undefined' || !(file instanceof File)) {
    return { ok: false, error: 'फ़ाइल नहीं मिली। फिर से चुनें।' }
  }
  if (file.size === 0) {
    return { ok: false, error: 'फ़ाइल खाली है। दूसरी फोटो चुनें।' }
  }
  if (!ALLOWED_IMAGE_MIME.includes(file.type as AllowedImageMime)) {
    return { ok: false, error: 'सिर्फ़ JPG, PNG या WebP फोटो चलेगी।' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `फोटो ${MAX_IMAGE_LABEL} से छोटी होनी चाहिए।` }
  }
  const mime = file.type as AllowedImageMime
  return { ok: true, mime, ext: EXT_BY_MIME[mime] }
}

/** Entity folders inside the `card-images` bucket. */
export type CardImageEntity = 'services' | 'occasions' | 'packages' | 'team'

const SAFE_ID = /^[a-zA-Z0-9-]{1,64}$/

/**
 * Build the storage object path: `<entity>/<row-id>/<timestamp>-<rand>.<ext>`.
 *
 * - The entity segment comes from a closed union, so it can never be traversal.
 * - The row id is asserted to be uuid-ish before use; anything else throws
 *   rather than being sanitised into a *different* valid path, because a
 *   silently-rewritten path would attach the image to the wrong folder.
 * - The timestamp+random suffix makes collisions effectively impossible, which
 *   is what lets the upload use `upsert: false` (an existing object is then a
 *   genuine error, not a routine overwrite).
 */
export function buildCardImagePath(entity: CardImageEntity, rowId: string, ext: string): string {
  if (!SAFE_ID.test(rowId)) {
    throw new Error(`Refusing to build a storage path for an unsafe row id: ${rowId}`)
  }
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const rand = Math.random().toString(36).slice(2, 8)
  return `${entity}/${rowId}/${Date.now()}-${rand}.${safeExt}`
}

/**
 * True when a stored `image_url` is an object we own inside our bucket and may
 * therefore delete after a successful replacement.
 *
 * Absolute `http(s)://` URLs and `/assets/...` site paths are NOT ours: the
 * first could be any third-party URL, the second is a file committed to the
 * repo. Deleting either would be destructive and pointless, so replacement
 * simply orphans nothing and leaves them alone.
 */
export function isManagedBucketPath(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false
  const trimmed = imageUrl.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false
  if (trimmed.startsWith('/')) return false
  if (trimmed.includes('..')) return false
  // Must look like `<entity>/<id>/<file>` — our own generated shape.
  return /^(services|occasions|packages|team)\/[a-zA-Z0-9-]+\/[^/]+$/.test(trimmed)
}

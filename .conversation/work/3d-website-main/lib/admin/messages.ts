// ─── Owner-facing admin copy (PART 2 §16) ─────────────────────────────────────
//
// One place for every save/error string so the wording cannot drift between
// the services grid, the occasions grid and the packages grid.
//
// These are written for a decoration-business owner reading on a phone, not for
// a developer: no table names, no error codes, and always a next action. Raw
// Postgres / PostgREST messages ("duplicate key value violates unique
// constraint …") are never surfaced — `friendlyError()` swallows them.

export const ADMIN_MSG = {
  saved: 'सफलतापूर्वक सेव हो गया',
  saveFailed: 'सेव नहीं हो सका। फिर कोशिश करें।',
  imageFailed: 'इमेज अपलोड नहीं हो सकी।',
  validation: 'कृपया सभी जरूरी जानकारी भरें।',
  deleted: 'हटा दिया गया',
  deleteFailed: 'हटाया नहीं जा सका। फिर कोशिश करें।',
  imageSaved: 'फोटो बदल दी गई',
  orderSaved: 'क्रम बदल दिया गया',
  orderFailed: 'क्रम नहीं बदला जा सका।',
  loadFailed: 'जानकारी लोड नहीं हो सकी।',
} as const

/**
 * A short, safe list of error strings we are willing to echo back verbatim —
 * those are the ones OUR OWN Server Actions produce (already Hindi, already
 * owner-appropriate). Anything else is replaced with a generic message.
 *
 * The heuristic: our messages are short and contain Devanagari; database driver
 * messages are long, English, and mention SQL internals.
 */
const DEVANAGARI = /[\u0900-\u097F]/

export function friendlyError(
  raw: string | undefined | null,
  // Typed as plain `string`, not inferred from the default: the default would
  // otherwise narrow the parameter to that one literal and reject every other
  // ADMIN_MSG constant callers legitimately pass.
  fallback: string = ADMIN_MSG.saveFailed,
): string {
  if (!raw) return fallback
  const text = raw.trim()
  if (!text) return fallback
  // Our own action errors are Hindi and short — safe to show as-is.
  if (DEVANAGARI.test(text) && text.length <= 160) return text
  return fallback
}

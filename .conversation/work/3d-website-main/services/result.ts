// ─── Data-access result type ──────────────────────────────────────────────────
// Part 1 of the admin upgrade removed every silent static fallback from the
// business-record data services. A failed Supabase query is no longer papered
// over with sample data — it is returned as an explicit failure so the page can
// render a real error state with a Retry action (§2, §8, §13).
//
// This mirrors the `{ ok: true } | { ok: false, error }` shape the existing
// admin Server Actions already use (app/admin/(protected)/*/actions.ts), so
// there is one convention across the codebase rather than two.

export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function dataOk<T>(data: T): DataResult<T> {
  return { ok: true, data }
}

export function dataError<T>(error: string): DataResult<T> {
  return { ok: false, error }
}

/** Hindi copy shown to visitors/admins when a query fails. */
export const LOAD_FAILED = 'डेटा लोड नहीं हो सका'
export const LOAD_FAILED_HINT = 'कृपया फिर कोशिश करें'

/**
 * True when a PostgREST error means "this table/column does not exist yet",
 * i.e. the migration has not been run. Worth distinguishing in logs: it is an
 * operator task, not a bug. Either way the caller still surfaces an error —
 * it never falls back to fake data.
 */
export function isMissingRelation(message: string): boolean {
  return /schema cache|does not exist|relation .* does not exist/i.test(message)
}

/**
 * Normalise a Supabase error into the message we log server-side. The visitor
 * only ever sees LOAD_FAILED — raw Postgres text is not leaked to the UI.
 */
export function logQueryFailure(scope: string, message: string): void {
  if (isMissingRelation(message)) {
    console.warn(`[${scope}] table/column missing — run the pending migration:`, message)
  } else {
    console.error(`[${scope}] query failed:`, message)
  }
}

/** The message logged when the Supabase client itself could not be created. */
export const SUPABASE_UNCONFIGURED =
  'Supabase credentials missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'

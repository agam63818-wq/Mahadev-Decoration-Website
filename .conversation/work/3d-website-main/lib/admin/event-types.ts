// ─── Event type vocabulary ────────────────────────────────────────────────────
//
// The same twelve `event_type` values are used by services, occasions,
// portfolio items and booking requests. They were previously re-declared inside
// PortfolioManager.tsx; the new services and occasions editors need the exact
// same list, so it lives here once. Adding a thirteenth type must not require
// remembering four files.
//
// NOTE: these are the values that already exist in the database (migrations
// 0004/0005 seed them). This module does not invent new ones.

export const EVENT_TYPES = [
  'wedding',
  'birthday',
  'anniversary',
  'haldi',
  'mehendi',
  'car',
  'stage',
  'mandap',
  'home',
  'flower',
  'lighting',
  'custom',
] as const

export type KnownEventType = (typeof EVENT_TYPES)[number]

export const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'वेडिंग',
  birthday: 'बर्थडे',
  anniversary: 'एनिवर्सरी',
  haldi: 'हल्दी',
  mehendi: 'मेहंदी',
  car: 'कार',
  stage: 'स्टेज',
  mandap: 'मंडप',
  home: 'होम',
  flower: 'फूल सजावट',
  lighting: 'लाइटिंग',
  custom: 'कस्टम',
}

/** Label for display. Unknown values are shown verbatim, never as "undefined". */
export function eventTypeLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return EVENT_TYPE_LABELS[value] ?? value
}

/**
 * `<select>` options. Built from the canonical list, plus the row's own value
 * if the database holds something not in the list — otherwise opening the
 * editor would silently change the event type just by rendering.
 */
export function eventTypeOptions(current?: string | null): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = EVENT_TYPES.map((value) => ({
    // Widened to `string` so the row's own out-of-list value can be prepended.
    value: value as string,
    label: EVENT_TYPE_LABELS[value] ?? value,
  }))
  if (current && !EVENT_TYPES.includes(current as KnownEventType)) {
    options.unshift({ value: current, label: current })
  }
  return options
}

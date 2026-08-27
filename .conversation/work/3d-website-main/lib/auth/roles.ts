// ─── Roles ────────────────────────────────────────────────────────────────────
// Mirrors the public.user_role enum in Supabase.
// Admin accounts are provisioned directly in Supabase by setting
// profiles.role — they can never be self-registered from a login screen.

export type UserRole = 'customer' | 'admin' | 'team'

/** Roles allowed through the /admin/* route guard. */
export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'team'] as const

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'team'
}

/** Full admin (not the limited 'team' access level). */
export function isFullAdmin(role: string | null | undefined): boolean {
  return role === 'admin'
}

export interface SessionUser {
  id: string
  email: string | null
  role: UserRole
  displayName: string | null
}

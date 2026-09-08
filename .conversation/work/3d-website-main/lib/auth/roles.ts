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

/** Preserve trusted admin deep links across login, never an external redirect. */
export function safeAdminRedirect(target?: string): string {
  if (!target || !target.startsWith('/') || target.includes('\\')) return '/admin'
  try {
    const url = new URL(target, 'https://internal.invalid')
    if (url.origin !== 'https://internal.invalid' || url.pathname === '/admin/login' ||
      !(url.pathname === '/admin' || url.pathname.startsWith('/admin/'))) return '/admin'
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return '/admin' }
}

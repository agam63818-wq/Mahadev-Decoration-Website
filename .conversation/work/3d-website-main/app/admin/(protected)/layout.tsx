import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/layout/AdminShell'
import { getSessionUser } from '@/lib/auth/session'
import { isAdminRole } from '@/lib/auth/roles'

// This layout reads auth cookies, so it can never be statically cached.
export const dynamic = 'force-dynamic'

/**
 * Server-side auth gate for every /admin/* page (except /admin/login).
 *
 * Defence in depth: middleware.ts already blocks these routes at the edge
 * before any React renders. This layout is the second, independent check — if
 * middleware were ever mis-matched, reordered, or bypassed, the protected pages
 * still refuse to render. Because this runs on the server during the render
 * pass, an unauthorised visitor never receives dashboard markup at all — there
 * is no "flash of content, then redirect".
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()

  if (!user) {
    redirect('/admin/login?reason=not-authenticated')
  }

  if (!isAdminRole(user.role)) {
    redirect('/admin/login?reason=not-admin')
  }

  return (
    <AdminShell
      userEmail={user.email}
      displayName={user.displayName}
      role={user.role}
    >
      {children}
    </AdminShell>
  )
}

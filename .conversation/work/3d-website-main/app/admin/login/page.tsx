import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSessionUser } from '@/lib/auth/session'
import { isAdminRole } from '@/lib/auth/roles'
import { AdminLoginForm } from '@/features/admin-auth/AdminLoginForm'

export const metadata: Metadata = {
  title: 'एडमिन लॉगिन | महादेव डेकोरेशन',
  description: 'महादेव डेकोरेशन प्रबंधन पैनल — प्रतिबंधित एक्सेस',
  robots: { index: false, follow: false },
}

// Never cache this page — it depends on the session cookie.
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { redirectTo?: string; reason?: string }
}

export default async function AdminLoginPage({ searchParams }: Props) {
  // Already signed in as staff? Skip the form.
  const user = await getSessionUser()
  if (user && isAdminRole(user.role)) {
    redirect(safeRedirect(searchParams.redirectTo))
  }

  return (
    <Suspense>
      <AdminLoginForm
        redirectTo={safeRedirect(searchParams.redirectTo)}
        reason={searchParams.reason}
        signedInAsNonAdmin={Boolean(user) && !isAdminRole(user?.role)}
        signedInEmail={user?.email ?? null}
      />
    </Suspense>
  )
}

/**
 * Only ever redirect to an internal /admin path — blocks open-redirect abuse
 * via a crafted ?redirectTo=https://evil.example link.
 */
function safeRedirect(target?: string): string {
  if (!target) return '/admin'
  if (!target.startsWith('/admin')) return '/admin'
  if (target.startsWith('//')) return '/admin'
  if (target === '/admin/login') return '/admin'
  return target
}

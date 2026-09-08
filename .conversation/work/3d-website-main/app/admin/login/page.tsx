import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSessionUser } from '@/lib/auth/session'
import { isAdminRole, safeAdminRedirect } from '@/lib/auth/roles'
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
    redirect(safeAdminRedirect(searchParams.redirectTo))
  }

  return (
    <Suspense>
      <AdminLoginForm
        redirectTo={safeAdminRedirect(searchParams.redirectTo)}
        reason={searchParams.reason}
        signedInAsNonAdmin={Boolean(user) && !isAdminRole(user?.role)}
        signedInEmail={user?.email ?? null}
      />
    </Suspense>
  )
}

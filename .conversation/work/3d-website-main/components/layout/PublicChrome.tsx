'use client'

import { usePathname } from 'next/navigation'

/**
 * Renders its children only on public (non-admin) routes.
 *
 * The root layout is shared by the marketing site and the admin panel, so
 * without this the public Navbar, Footer, floating WhatsApp/Call pills and
 * the mobile bottom action bar all leaked into /admin — on phones they sat on
 * top of the admin sidebar and pushed the dashboard off-screen.
 */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  if (pathname.startsWith('/admin')) return null
  return <>{children}</>
}

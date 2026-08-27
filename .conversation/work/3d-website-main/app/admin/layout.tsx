import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'एडमिन पैनल | महादेव डेकोरेशन',
  description: 'महादेव डेकोरेशन का एडमिन प्रबंधन पैनल',
  // The admin panel must never appear in search results.
  robots: { index: false, follow: false },
}

/**
 * Bare shell for everything under /admin.
 *
 * The auth gate and the admin chrome (sidebar/header) live in the
 * app/admin/(protected)/layout.tsx route group, so that /admin/login can render
 * as a standalone screen without the dashboard shell — and without needing a
 * session to display. Route-group folders do not affect URLs, so
 * /admin, /admin/bookings, ... all keep their existing paths.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

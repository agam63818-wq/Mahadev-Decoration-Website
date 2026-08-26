import type { Metadata } from 'next'
import { AdminHeader } from '@/components/layout/AdminHeader'

export const metadata: Metadata = {
  title: 'एडमिन पैनल | महादेव डेकोरेशन',
  description: 'महादेव डेकोरेशन का एडमिन प्रबंधन पैनल',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminHeader>{children}</AdminHeader>
}

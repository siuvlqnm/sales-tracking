import '@/app/globals.css'
import type { Metadata } from 'next'
import { RouteGuard } from '@/components/RouteGuard'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: '统计系统',
  description: '统计系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RouteGuard>
          <Navbar />
          {children}
        </RouteGuard>
      </body>
    </html>
  )
}

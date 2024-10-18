import '@/app/globals.css'
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import { AuthWrapper } from '@/components/AuthWrapper'; 
// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '销售系统',
  description: '销售系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
          <Navbar />
          <AuthWrapper>
            {children}
          </AuthWrapper>
      </body>
    </html>
  )
}

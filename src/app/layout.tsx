import '@/app/globals.css'
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import ClientWrapper from '@/components/ClientWrapper'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientWrapper>
          <Navbar />
          {children}
        </ClientWrapper>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: 'mealMitra',
  description: 'Created by vrushabh',
  generator: 'mealMitra',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

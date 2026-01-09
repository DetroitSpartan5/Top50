import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/navigation'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700']
})

export const metadata: Metadata = {
  title: {
    default: 'topofmine',
    template: '%s | topofmine',
  },
  description: 'Rank your favorites. See how others compare. Movies, TV, books, games.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://topofmine.com'),
  openGraph: {
    type: 'website',
    siteName: 'topofmine',
    title: 'topofmine - Rank Your Favorites',
    description: 'Rank your favorites. See how others compare. Movies, TV, books, games.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'topofmine - Rank Your Favorites',
    description: 'Rank your favorites. See how others compare. Movies, TV, books, games.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <Providers>
          <Navigation />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

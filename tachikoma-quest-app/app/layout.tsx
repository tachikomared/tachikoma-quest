import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TACHI Quest | Earn $TACHI Rewards',
  description: 'Complete quests, repost, follow, and earn $TACHI token rewards on Base',
  openGraph: {
    title: 'TACHI Quest | Viral Rewards',
    description: 'Complete quests and earn $TACHI on Base',
    images: ['/og-image.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://your-app.vercel.app/frame-image.png',
    'fc:frame:button:1': 'Start Quest',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://your-app.vercel.app',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-tachikoma-dark text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

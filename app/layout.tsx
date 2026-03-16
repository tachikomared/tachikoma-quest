import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AuthGuard } from '@/components/auth-guard';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tachi-quest.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'TACHI Quest',
  description: 'Complete verified Farcaster quests and link your wallet for $TACHI airdrop eligibility',
  keywords: ['TACHI', 'Farcaster', 'Quests', 'Airdrop', 'Base', 'Crypto'],
  authors: [{ name: 'TACHI' }],
  openGraph: {
    title: 'TACHI Quest',
    description: 'Complete verified Farcaster quests and link your wallet for $TACHI airdrop eligibility',
    url: APP_URL,
    siteName: 'TACHI Quest',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'TACHI Quest',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TACHI Quest',
    description: 'Complete verified Farcaster quests and link your wallet for $TACHI airdrop eligibility',
    images: [`${APP_URL}/og-image.png`],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: `${APP_URL}/og-image.png`,
      button: {
        title: 'Start Quest',
        action: {
          type: 'launch_miniapp',
          name: 'TACHI Quest',
          url: APP_URL,
          splashImageUrl: `${APP_URL}/splash.png`,
          splashBackgroundColor: '#0a0a0f'
        }
      }
    }),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] text-[#F9FAFB] antialiased">
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}

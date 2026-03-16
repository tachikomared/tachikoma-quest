import type { Metadata, Viewport } from 'next';
import './globals.css?v=2';
import './mecha-theme.css?v=2';
import { Providers } from './providers';
import { AuthGuard } from '@/components/auth-guard';

export const metadata: Metadata = {
  title: 'TACHI QUEST // Mecha Crab Operations',
  description: 'Complete missions. Earn XP. Stack $TACHI. Join the Crab Army.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050508',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#050508] text-[#f0f0f0] antialiased font-mono">
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}

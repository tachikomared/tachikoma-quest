import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BOT_UAS = [
  'facebookexternalhit',
  'twitterbot',
  'discordbot',
  'slackbot',
  'telegrambot',
  'pinterest',
  'ahrefsbot',
  'semrushbot',
  'bytespider',
  'bingbot',
  'googlebot',
  'petalbot',
  'dataforseo',
];

export function middleware(req: NextRequest) {
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  const isBot = BOT_UAS.some((b) => ua.includes(b));

  if (isBot && req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'bot blocked' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_DOMAIN;
  if (!domain) {
    return NextResponse.json({ status: 'unhealthy', error: 'Missing NEXT_PUBLIC_DOMAIN' }, { status: 500 });
  }

  // Check DB connection
  // Check if .well-known manifest is valid

  return NextResponse.json({
    status: 'healthy',
    domain,
    timestamp: new Date().toISOString()
  });
}

import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    domain: process.env.NEXT_PUBLIC_DOMAIN,
    accountAssociation: {
      header: '...',
      payload: '...',
      signature: '...'
    }
  };
  return NextResponse.json(manifest);
}

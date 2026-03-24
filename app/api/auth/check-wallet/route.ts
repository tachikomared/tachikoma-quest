export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address')?.toLowerCase();

    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    const existingWallet = await sql`
      SELECT u.id, u.fc_fid, u.fc_username, u.referral_code, w.address
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE LOWER(w.address) = ${address}
      LIMIT 1
    `;

    return NextResponse.json({
      hasSession: existingWallet.length > 0,
      pfpUrl: null,
    });
  } catch (e: any) {
    console.error('[auth/check-wallet] Error:', e);
    return NextResponse.json({ error: e.message || 'Check failed' }, { status: 500 });
  }
}
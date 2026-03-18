import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser, getFullUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const current = await requireCurrentUser();
    const user = await getFullUser(current.fid, current.id);
    console.log('[api/me] Returning user:', user?.fcFid, 'guest:', user?.fcFid === 0, 'pfp:', user?.fcPfpUrl ? 'yes' : 'no');
    return NextResponse.json({ user });
  } catch (e: any) {
    console.error('[api/me] Error:', e.message);
    return NextResponse.json({ user: null, error: e.message }, { status: 500 });
  }
}

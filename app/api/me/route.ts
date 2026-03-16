import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser, getFullUser } from '@/lib/auth';

export async function GET() {
  try {
    const current = await requireCurrentUser();
    const user = await getFullUser(current.fid);
    console.log('[api/me] Returning user:', user?.fcFid, 'pfp:', user?.fcPfpUrl ? 'yes' : 'no', 'followers:', user?.fcFollowers);
    return NextResponse.json({ user });
  } catch (e: any) {
    console.error('[api/me] Error:', e.message);
    return NextResponse.json({ user: null, error: e.message }, { status: 500 });
  }
}

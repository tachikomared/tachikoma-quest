export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';


// Mark all notifications as read
export async function POST(req: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    await sql`
      UPDATE notifications 
      SET read = true 
      WHERE user_id = ${user.id} AND read = false
    `;

    return NextResponse.json({ ok: true, message: 'All marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Mark single notification as read
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = parseInt(params.id);
    if (isNaN(notificationId)) {
      return NextResponse.json({ ok: false, error: 'Invalid ID' }, { status: 400 });
    }

    await sql`
      UPDATE notifications 
      SET read = true 
      WHERE id = ${notificationId} AND user_id = ${user.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Mark read error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

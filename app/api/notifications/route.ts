import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

// Send Farcaster notification to user
export async function POST(req: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user || user.fid === 0) {
      return NextResponse.json({ ok: false, error: 'Not a Farcaster user' }, { status: 400 });
    }

    const { title, body, targetUrl } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ ok: false, error: 'Missing title or body' }, { status: 400 });
    }

    // Send via Neymar API
    const response = await fetch('https://api.neynar.com/v2/farcaster/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': NEYNAR_API_KEY || '',
      },
      body: JSON.stringify({
        target_fid: user.fid,
        title,
        body,
        target_url: targetUrl || 'https://tachi-quest.vercel.app',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Notification failed:', error);
      return NextResponse.json({ ok: false, error: 'Failed to send notification' }, { status: 500 });
    }

    // Log notification
    await sql`
      INSERT INTO notifications (user_id, title, body, sent_at, target_url)
      VALUES (${user.id}, ${title}, ${body}, NOW(), ${targetUrl || 'https://tachi-quest.vercel.app'})
    `;

    return NextResponse.json({ ok: true, message: 'Notification sent' });
  } catch (err) {
    console.error('Notification error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

// Get user's notification history
export async function GET(req: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await sql`
      SELECT 
        id,
        title,
        body,
        target_url,
        read,
        sent_at
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY sent_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      ok: true,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        targetUrl: n.target_url,
        read: n.read,
        sentAt: n.sent_at,
      })),
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

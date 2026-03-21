import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 300;

export async function GET() {
  try {
    const quests = await sql`
      SELECT id, title, description, points, category, active
      FROM quests
      WHERE active = true
      ORDER BY category ASC, points DESC, id ASC
    `;

    return NextResponse.json(
      { quests },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (e: any) {
    console.error('[quests] Error:', e.message);
    return NextResponse.json({ quests: [], error: e.message }, { status: 500 });
  }
}

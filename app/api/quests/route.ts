import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await sql`
    select id, title, description, platform, action, verification, points, repeatable, enabled, target
    from quests
    where enabled = true
    order by points asc, id asc
  `;
  return NextResponse.json({ quests: rows });
}

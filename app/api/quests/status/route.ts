import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const current = await requireCurrentUser();

    const rows = await sql`
      SELECT qc.quest_id
      FROM quest_claims qc
      JOIN users u ON u.id = qc.user_id
      WHERE u.fc_fid = ${current.fid}
    `;

    const completed = rows.map((r: any) => r.quest_id);

    return NextResponse.json({ completed });
  } catch (e: any) {
    return NextResponse.json({ completed: [], error: e.message }, { status: 500 });
  }
}

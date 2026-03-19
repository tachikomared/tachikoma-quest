import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

export const revalidate = 30;

export async function GET() {
  try {
    const current = await requireCurrentUser();

    const rows = current.fid === 0
      ? await sql`
          SELECT qc.quest_id
          FROM quest_claims qc
          WHERE qc.user_id = ${current.id}
        `
      : await sql`
          SELECT qc.quest_id
          FROM quest_claims qc
          JOIN users u ON u.id = qc.user_id
          WHERE u.fc_fid = ${current.fid}
        `;

    const completed = rows.map((r: any) => r.quest_id);

    return NextResponse.json(
      { completed },
      { headers: { 'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (e: any) {
    return NextResponse.json({ completed: [], error: e.message }, { status: 500 });
  }
}

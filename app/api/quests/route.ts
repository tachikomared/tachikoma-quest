import { NextResponse } from 'next/server';
import { QUESTS } from '@/lib/quests';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Ensure quests are present in DB for foreign key constraints
  for (const quest of QUESTS) {
    await sql`
      insert into quests (id, title, description, platform, action, verification, points, repeatable, enabled, target)
      values (
        ${quest.id},
        ${quest.title},
        ${quest.description},
        ${quest.platform},
        ${quest.action},
        ${quest.verification},
        ${quest.points},
        ${quest.repeatable},
        ${quest.enabled},
        ${JSON.stringify(quest.target)}::jsonb
      )
      on conflict (id) do update set
        title = excluded.title,
        description = excluded.description,
        platform = excluded.platform,
        action = excluded.action,
        verification = excluded.verification,
        points = excluded.points,
        repeatable = excluded.repeatable,
        enabled = excluded.enabled,
        target = excluded.target
    `;
  }

  return NextResponse.json({ quests: QUESTS.filter((q) => q.enabled) });
}

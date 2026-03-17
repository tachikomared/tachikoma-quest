import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { QUESTS } from '@/lib/quests';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Ensure quests exist in DB (best effort)
  try {
    for (const quest of QUESTS) {
      await sql`
        INSERT INTO quests (
          id, title, description, platform, action, verification, 
          points, tachi_reward, repeatable, enabled, target
        ) VALUES (
          ${quest.id},
          ${quest.title},
          ${quest.description},
          ${quest.platform},
          ${quest.action},
          ${quest.verification},
          ${quest.points},
          ${quest.tachiReward ?? 0},
          ${quest.repeatable},
          ${quest.enabled},
          ${JSON.stringify(quest.target)}::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          platform = EXCLUDED.platform,
          action = EXCLUDED.action,
          verification = EXCLUDED.verification,
          points = EXCLUDED.points,
          tachi_reward = EXCLUDED.tachi_reward,
          repeatable = EXCLUDED.repeatable,
          enabled = EXCLUDED.enabled,
          target = EXCLUDED.target
      `;
    }
  } catch (e) {
    console.warn('[quests] Sync skipped:', e);
  }

  return NextResponse.json({ quests: QUESTS.filter((q) => q.enabled) });
}

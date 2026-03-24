export const dynamic = "force-dynamic";
import { sql } from '@/lib/db';


export async function GET() {
  // Enhanced query to include token balance for TACHI holder leaderboard
  const leaderboard = await sql`
    select
      u.fc_username,
      (coalesce(sum(qc.points_awarded), 0) + coalesce(t.balance, 0)) as score
    from users u
    left join quest_claims qc on qc.user_id = u.id
    left join token_balances t on t.user_id = u.id
    group by u.id, u.fc_username, t.balance
    order by score desc
    limit 20
  `;

  return Response.json(leaderboard);
}

import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await sql`
    select
      w.address,
      u.fc_fid,
      u.fc_username,
      coalesce(sum(qc.points_awarded), 0)::int as points
    from users u
    join wallets w on w.user_id = u.id and w.verified = true
    left join quest_claims qc on qc.user_id = u.id
    group by w.address, u.fc_fid, u.fc_username
    order by points desc
  `;

  const csv = [
    'address,fc_fid,fc_username,points',
    ...rows.map((r) => `${r.address},${r.fc_fid},${r.fc_username ?? ''},${r.points}`),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="tachi-airdrop.csv"',
    },
  });
}

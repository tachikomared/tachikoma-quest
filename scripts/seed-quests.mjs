import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : 'require',
});

const quests = [
  ['fc-follow-main', 'Follow on Farcaster', 'Follow the main $TACHI Farcaster account', 'farcaster', 'follow_user', 'fc_follow_user', 150, false, true, JSON.stringify({ targetFid: Number(process.env.FC_TARGET_FID || 0) })],
  ['fc-recast-launch', 'Recast launch cast', 'Recast the official $TACHI launch cast', 'farcaster', 'recast_cast', 'fc_cast_viewer_context', 250, false, true, JSON.stringify({ castHash: process.env.FC_LAUNCH_CAST_HASH, castUrl: process.env.FC_LAUNCH_CAST_URL })],
  ['wallet-link', 'Link wallet', 'Link a Base wallet for airdrop eligibility', 'wallet', 'link_wallet', 'wallet_signature', 500, false, true, JSON.stringify({})],
  ['x-follow', 'Follow on X', 'Open the X profile', 'x', 'open_external', 'manual_open', 0, false, true, JSON.stringify({ url: 'https://x.com/YOUR_HANDLE' })]
];

for (const row of quests) {
  await sql`
    insert into quests (id, title, description, platform, action, verification, points, repeatable, enabled, target)
    values (${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, ${row[6]}, ${row[7]}, ${row[8]}, ${row[9]}::jsonb)
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

await sql.end();
console.log('seed complete');

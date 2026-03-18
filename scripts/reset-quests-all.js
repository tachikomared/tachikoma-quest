const postgres = require('postgres');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: DATABASE_URL.includes('localhost') ? false : 'require',
  max: 1,
  prepare: false,
  idle_timeout: 10,
  connect_timeout: 10,
});

async function tableExists(table) {
  const res = await sql`SELECT to_regclass(${table}) as exists`;
  return !!res[0]?.exists;
}

async function columnExists(table, column) {
  const res = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
    LIMIT 1
  `;
  return res.length > 0;
}

async function run() {
  const hasQuestClaims = await tableExists('quest_claims');
  const hasReferrals = await tableExists('referrals');
  const hasCommunityBurns = await tableExists('community_burns');
  const hasNotifications = await tableExists('notifications');
  const hasUsers = await tableExists('users');

  const hasStreakCount = await columnExists('users', 'streak_count');
  const hasStreakLast = await columnExists('users', 'streak_last_date');
  const hasMaxStreak = await columnExists('users', 'max_streak');

  await sql.begin(async (tx) => {
    if (hasQuestClaims) await tx`DELETE FROM quest_claims`;
    if (hasReferrals) await tx`DELETE FROM referrals`;
    if (hasCommunityBurns) await tx`DELETE FROM community_burns`;
    if (hasNotifications) await tx`DELETE FROM notifications`;

    if (hasUsers && (hasStreakCount || hasStreakLast || hasMaxStreak)) {
      const sets = [];
      if (hasStreakCount) sets.push(sql`streak_count = 0`);
      if (hasStreakLast) sets.push(sql`streak_last_date = NULL`);
      if (hasMaxStreak) sets.push(sql`max_streak = 0`);

      await tx`UPDATE users SET ${sql(sets)} `;
    }
  });
}

(async () => {
  try {
    await run();
    console.log('All quest + streak + referral + burn + notification data reset.');
  } catch (e) {
    console.error('Reset failed:', e);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
})();

const { Client } = require('pg');

const resetDevData = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = `
      BEGIN;

      TRUNCATE TABLE
        referrals,
        quest_claims,
        wallets
      RESTART IDENTITY CASCADE;

      UPDATE users SET
        fc_username = NULL,
        fc_display_name = NULL,
        fc_pfp_url = NULL,
        fc_bio = NULL,
        fc_score = NULL,
        referred_by_code = NULL
      WHERE TRUE;

      COMMIT;
    `;

    await client.query(sql);
    console.log('Dev data reset complete!');
  } catch (err) {
    console.error('Error:', err);
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
    console.log('Connection closed');
  }
};

resetDevData();

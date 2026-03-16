const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function migrate() {
  console.log('Running migration...');
  
  try {
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS fc_pfp_url TEXT,
      ADD COLUMN IF NOT EXISTS fc_bio TEXT,
      ADD COLUMN IF NOT EXISTS fc_followers INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS fc_following INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS fc_power_badge BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    `;
    console.log('✅ Migration complete: Added columns to users table');
    
    // Verify
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    console.log('\nCurrent users table columns:');
    columns.forEach(c => console.log('  -', c.column_name));
    
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();

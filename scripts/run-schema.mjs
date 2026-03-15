import postgres from 'postgres';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mgcC8SVXZJY7@ep-summer-mouse-ahzr449z-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = postgres(DATABASE_URL, { ssl: 'require' });

const schema = fs.readFileSync('db/schema.sql', 'utf8');

await sql.unsafe(schema);
console.log('Schema applied successfully');

await sql.end();

import { Client } from 'pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_gwofbl5svA8x@ep-still-shape-abooi4af-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new Client({ connectionString: DATABASE_URL });

async function migrate() {
  await client.connect();
  try {
    const result = await client.query(`ALTER TABLE days ADD COLUMN IF NOT EXISTS audio_url TEXT NOT NULL DEFAULT ''`);
    console.log('Migration successful:', result.command);
    
    // Verify
    const check = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'days' ORDER BY ordinal_position`);
    console.log('Columns:', check.rows.map(r => r.column_name).join(', '));
  } finally {
    await client.end();
  }
}

migrate().catch(e => { console.error('Error:', e.message); process.exit(1); });

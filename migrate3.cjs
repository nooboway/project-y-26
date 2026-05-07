// Run this with: node migrate3.cjs
// Sets NODE_PATH before requiring pg so it can find its peer deps
process.env.NODE_PATH = require('path').join(__dirname, 'node_modules/.pnpm/pg@8.20.0/node_modules');
require('module').Module._initPaths();

const { Client } = require('./node_modules/.pnpm/pg@8.20.0/node_modules/pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_gwofbl5svA8x@ep-still-shape-abooi4af-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new Client({ connectionString: DATABASE_URL });

async function migrate() {
  await client.connect();
  try {
    await client.query("ALTER TABLE days ADD COLUMN IF NOT EXISTS audio_url TEXT NOT NULL DEFAULT ''");
    console.log('SUCCESS: audio_url column added (or already exists)');
    const check = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'days' ORDER BY ordinal_position");
    console.log('Columns:', check.rows.map(r => r.column_name).join(', '));
  } finally {
    await client.end();
  }
}

migrate().catch(e => { console.error('Error:', e.message); process.exit(1); });

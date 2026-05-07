// Run via PowerShell with pre-set NODE_PATH (see below)
// $env:NODE_PATH set externally - do NOT touch it here
require('module').Module._initPaths();

const { Client } = require('C:/Users/dev/project-y-26/node_modules/.pnpm/pg@8.20.0/node_modules/pg');
const DATABASE_URL = 'postgresql://neondb_owner:npg_gwofbl5svA8x@ep-still-shape-abooi4af-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new Client({ connectionString: DATABASE_URL });

async function migrate() {
  console.log('Connecting...');
  await client.connect();
  console.log('Connected!');
  try {
    const stmts = [
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS audio_url TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS scratch_cards TEXT NOT NULL DEFAULT '[]'",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS slides TEXT NOT NULL DEFAULT '[]'",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS signature_svg TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS voice_note_url TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS preview_text TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS reply_text TEXT NOT NULL DEFAULT ''",
    ];
    for (const q of stmts) {
      await client.query(q);
      const col = q.match(/ADD COLUMN IF NOT EXISTS (\S+)/)[1];
      console.log('OK:', col);
    }
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='days' ORDER BY ordinal_position"
    );
    console.log('\nAll columns:', rows.map(r => r.column_name).join(', '));
  } finally {
    await client.end();
  }
}

migrate().catch(e => { console.error('Error:', e.message); process.exit(1); });

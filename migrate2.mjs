import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Override the module loader to find pg's sibling deps from the pnpm store
const Module = require('module');
const originalLoad = Module._resolveFilename.bind(Module);
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'pg-types' || request === 'pg-protocol' || request === 'pg-cloudflare' || request === 'pg-connection-string' || request === 'pgpass' || request === 'pg-pool') {
    const base = 'C:/Users/dev/project-y-26/node_modules/.pnpm/pg@8.20.0/node_modules';
    return originalLoad(`${base}/${request}`, parent, isMain, options);
  }
  return originalLoad(request, parent, isMain, options);
};

const pg = require('C:/Users/dev/project-y-26/node_modules/.pnpm/pg@8.20.0/node_modules/pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://neondb_owner:npg_gwofbl5svA8x@ep-still-shape-abooi4af-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new Client({ connectionString: DATABASE_URL });

async function migrate() {
  await client.connect();
  try {
    await client.query("ALTER TABLE days ADD COLUMN IF NOT EXISTS audio_url TEXT NOT NULL DEFAULT ''");
    console.log('audioUrl column added (or already exists)');
    const check = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'days' ORDER BY ordinal_position");
    console.log('Columns:', check.rows.map(r => r.column_name).join(', '));
  } finally {
    await client.end();
  }
}

migrate().catch(e => { console.error('Error:', e.message); process.exit(1); });

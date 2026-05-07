// Migration script: adds missing columns to days table
// Works around pnpm virtual store isolation by intercepting require() calls
'use strict';

const Module = require('module');
const path = require('path');
const BASE = path.join(__dirname, 'node_modules/.pnpm');

// Map bare pkg names → pnpm store paths
const PKG_MAP = {
  'pg-types':             'pg-types@2.2.0/node_modules/pg-types',
  'pg-pool':              'pg-pool@3.13.0_pg@8.20.0/node_modules/pg-pool',
  'pg-protocol':          'pg-protocol@1.13.0/node_modules/pg-protocol',
  'pg-connection-string': 'pg-connection-string@2.12.0/node_modules/pg-connection-string',
  'pgpass':               'pgpass@1.0.5/node_modules/pgpass',
  'pg-cloudflare':        null, // optional, skip
  'postgres-array':       'postgres-array@2.0.0/node_modules/postgres-array',
  'postgres-bytea':       'postgres-bytea@1.0.1/node_modules/postgres-bytea',
  'postgres-date':        'postgres-date@1.0.7/node_modules/postgres-date',
  'postgres-interval':    'postgres-interval@1.2.0/node_modules/postgres-interval',
  'xtend':                'xtend@4.0.2/node_modules/xtend',
  'split2':               null,
};

const orig = Module._resolveFilename.bind(Module);
Module._resolveFilename = function(request, parent, isMain, options) {
  // Handle exact matches
  if (Object.prototype.hasOwnProperty.call(PKG_MAP, request)) {
    const rel = PKG_MAP[request];
    if (!rel) return require.resolve('./migrate4-noop.cjs');
    return orig(path.join(BASE, rel), parent, isMain, options);
  }
  // Handle subpath imports like 'xtend/mutable'
  const slash = request.indexOf('/');
  if (slash > 0) {
    const pkg = request.slice(0, slash);
    const sub = request.slice(slash); // e.g. '/mutable'
    if (Object.prototype.hasOwnProperty.call(PKG_MAP, pkg)) {
      const rel = PKG_MAP[pkg];
      if (!rel) return require.resolve('./migrate4-noop.cjs');
      return orig(path.join(BASE, rel) + sub, parent, isMain, options);
    }
  }
  return orig(request, parent, isMain, options);
};

// Create a noop module for optional deps
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'migrate4-noop.cjs'))) {
  fs.writeFileSync(path.join(__dirname, 'migrate4-noop.cjs'), 'module.exports = {};');
}

const { Client } = require(path.join(BASE, 'pg@8.20.0/node_modules/pg'));

const DATABASE_URL = 'postgresql://neondb_owner:npg_gwofbl5svA8x@ep-still-shape-abooi4af-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new Client({ connectionString: DATABASE_URL });

async function migrate() {
  console.log('Connecting to Neon...');
  await client.connect();
  console.log('Connected!');
  try {
    // Add all missing columns safely
    const queries = [
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS audio_url TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS scratch_cards TEXT NOT NULL DEFAULT '[]'",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS slides TEXT NOT NULL DEFAULT '[]'",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS signature_svg TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS voice_note_url TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS preview_text TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE days ADD COLUMN IF NOT EXISTS reply_text TEXT NOT NULL DEFAULT ''",
    ];
    for (const q of queries) {
      await client.query(q);
      const col = q.match(/ADD COLUMN IF NOT EXISTS (\S+)/)[1];
      console.log(`OK: ${col}`);
    }
    const check = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='days' ORDER BY ordinal_position"
    );
    console.log('\nFinal columns:', check.rows.map(r => r.column_name).join(', '));
  } finally {
    await client.end();
  }
}

migrate().catch(e => { console.error('Migration error:', e.message); process.exit(1); });

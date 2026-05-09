import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres.muyzjlknvzzknvlavsfi:SbM390C9N1kGBo7A@aws-0-eu-central-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to Supabase.");
  try {
    await client.query("ALTER TABLE days ADD COLUMN IF NOT EXISTS igbo_title TEXT;");
    console.log("Column igbo_title added (if it didn't exist).");
  } catch (e) {
    console.error("Error adding column:", e);
  } finally {
    await client.end();
  }
}

run();

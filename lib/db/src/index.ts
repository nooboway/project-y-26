import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Strip channel_binding and sslmode params — these conflict with the explicit
// ssl option below in some pg/serverless environments (e.g. Supabase pooler
// uses self-signed certs in chain that fail default validation).
function cleanDbUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.searchParams.delete('channel_binding');
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return raw;
  }
}

const _cleanUrl = cleanDbUrl(process.env.DATABASE_URL);
const _isLocal = _cleanUrl.includes('localhost') || _cleanUrl.includes('127.0.0.1');

export const pool = new Pool({
  connectionString: _cleanUrl,
  ssl: _isLocal ? false : { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });

export * from "./schema/index";
export * from "drizzle-orm";

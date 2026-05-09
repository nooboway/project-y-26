import { pool } from "@workspace/db";
import { logger } from "./logger.js";

export async function ensureMigrate(): Promise<void> {
  const client = await pool.connect();
  try {
    // Create tables if they don't exist (handles fresh/empty databases)
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_config (
        id integer PRIMARY KEY DEFAULT 1,
        title text NOT NULL,
        recipient_name text NOT NULL,
        sender_name text NOT NULL,
        start_date text NOT NULL,
        birthday_date text NOT NULL,
        accent_color text NOT NULL,
        coordinates text NOT NULL,
        coordinates_place text NOT NULL,
        unlock_override integer NOT NULL DEFAULT 0,
        live_text text NOT NULL DEFAULT '',
        live_updated_at timestamp NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS days (
        slug text PRIMARY KEY,
        index integer NOT NULL,
        igbo_title text NOT NULL DEFAULT '',
        title text NOT NULL,
        eyebrow text NOT NULL DEFAULT '',
        kind text NOT NULL,
        hero_image text NOT NULL DEFAULT '',
        body text NOT NULL DEFAULT '',
        pull_quote text NOT NULL DEFAULT '',
        signoff text NOT NULL DEFAULT '',
        song_title text NOT NULL DEFAULT '',
        song_artist text NOT NULL DEFAULT '',
        youtube_id text NOT NULL DEFAULT '',
        drafts jsonb NOT NULL DEFAULT '[]',
        reasons jsonb NOT NULL DEFAULT '[]',
        gallery jsonb NOT NULL DEFAULT '[]',
        scratch_cards text NOT NULL DEFAULT '[]',
        slides text NOT NULL DEFAULT '[]',
        signature_svg text NOT NULL DEFAULT '',
        voice_note_url text NOT NULL DEFAULT '',
        preview_text text NOT NULL DEFAULT '',
        reply_text text NOT NULL DEFAULT '',
        reply_at timestamp,
        opened_at timestamp
      );
    `);
    // Add newer columns (idempotent for existing tables)
    await client.query(`
      ALTER TABLE days ADD COLUMN IF NOT EXISTS igbo_title text NOT NULL DEFAULT '';
      ALTER TABLE days ADD COLUMN IF NOT EXISTS scratch_cards text NOT NULL DEFAULT '[]';
      ALTER TABLE days ADD COLUMN IF NOT EXISTS slides text NOT NULL DEFAULT '[]';
      ALTER TABLE days ADD COLUMN IF NOT EXISTS audio_url text NOT NULL DEFAULT '';
      ALTER TABLE days ADD COLUMN IF NOT EXISTS copy jsonb NOT NULL DEFAULT '{}';
      ALTER TABLE site_config ADD COLUMN IF NOT EXISTS copy jsonb NOT NULL DEFAULT '{}';
    `);
    logger.info("DB migration: schema ensured");
  } catch (err) {
    logger.error({ err }, "DB migration failed");
    throw err;
  } finally {
    client.release();
  }
}

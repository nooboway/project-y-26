ALTER TABLE "days" ADD COLUMN "audio_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "days" ADD COLUMN "copy" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "copy" jsonb DEFAULT '{}'::jsonb NOT NULL;
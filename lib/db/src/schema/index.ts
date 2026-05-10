import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export type SiteCopy = {
  hero?:      { lineOne?: string; lineTwo?: string; lineThree?: string; subtitle?: string; image?: string };
  labels?:    { preBirthday?: string; birthday?: string; aftermath?: string };
  buttons?:   { preBirthday?: string; birthday?: string; aftermath?: string };
  countdown?: { style?: "numbers" | "flip" | "vinyl" | "letterpress"; label?: string; sub?: string; whenZero?: string };
  ticker?:    { accent?: string; bottom?: string; suffix?: string };
  footer?:    { tagline?: string };
  cover?:     { issuesHeading?: string; photoCaption?: string };
};

export type DayCopy = {
  letter?:    { intro?: string; signedAs?: string };
  song?:      { prompt?: string; cta?: string };
  voiceNote?: { prompt?: string };
  gallery?:   { prompt?: string };
  birthday?:  {
    subhead?: string; envelopeCta?: string; candleHint?: string;
    candleDoneCta?: string; candleDoneHint?: string;
  };
  reply?:     { prompt?: string; placeholder?: string; sentTitle?: string; sentBody?: string };
  drafts?:    { heading?: string };
  whyYou?:   { heading?: string; subhead?: string };
  terminal?:  { boot?: string[]; commands?: { name: string; response: string }[] };
  notes?:     { app?: string; folder?: string; date?: string; title?: string };
  tenWays?:   { enabled?: boolean; cta?: string; heading?: string; lines?: string[] };
};

export const siteConfigTable = pgTable("site_config", {
  id: integer("id").primaryKey().default(1),
  title: text("title").notNull(),
  recipientName: text("recipient_name").notNull(),
  senderName: text("sender_name").notNull(),
  startDate: text("start_date").notNull(),
  birthdayDate: text("birthday_date").notNull(),
  accentColor: text("accent_color").notNull(),
  coordinates: text("coordinates").notNull(),
  coordinatesPlace: text("coordinates_place").notNull(),
  unlockOverride: integer("unlock_override").notNull().default(0),
  liveText: text("live_text").notNull().default(""),
  liveUpdatedAt: timestamp("live_updated_at").notNull().defaultNow(),
  copy: jsonb("copy").$type<SiteCopy>().notNull().default({}),
});

export const daysTable = pgTable("days", {
  slug: text("slug").primaryKey(),
  index: integer("index").notNull(),
  igboTitle: text("igbo_title").notNull().default(""),
  title: text("title").notNull(),
  eyebrow: text("eyebrow").notNull().default(""),
  kind: text("kind").notNull(),
  heroImage: text("hero_image").notNull().default(""),
  body: text("body").notNull().default(""),
  pullQuote: text("pull_quote").notNull().default(""),
  signoff: text("signoff").notNull().default(""),
  songTitle: text("song_title").notNull().default(""),
  songArtist: text("song_artist").notNull().default(""),
  youtubeId: text("youtube_id").notNull().default(""),
  drafts: jsonb("drafts").$type<{ text: string; crossed: boolean }[]>().notNull().default([]),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
  gallery: jsonb("gallery").$type<{ url: string; caption: string; span: "s" | "m" | "l" | "xl" }[]>().notNull().default([]),
  scratchCards: text("scratch_cards").notNull().default("[]"),
  slides: text("slides").notNull().default("[]"),
  audioUrl: text("audio_url").notNull().default(""),
  unlockTime: text("unlock_time").notNull().default("00:00"),
  signatureSvg: text("signature_svg").notNull().default(""),
  voiceNoteUrl: text("voice_note_url").notNull().default(""),
  previewText: text("preview_text").notNull().default(""),
  replyText: text("reply_text").notNull().default(""),
  replyAt: timestamp("reply_at"),
  openedAt: timestamp("opened_at"),
  copy: jsonb("copy").$type<DayCopy>().notNull().default({}),
});

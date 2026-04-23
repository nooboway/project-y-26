import { db, siteConfigTable, daysTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const DAYS_SEED = [
  {
    slug: "day-1",
    index: 1,
    title: "An Issue Made For You",
    eyebrow: "ISSUE 01 — THE OPENING",
    kind: "letter",
    body:
      "Yin —\n\nFive days. That is the runway. Not because you need to be courted, but because some things deserve a deliberate arc — a slow exhale before the morning of you.\n\nThis is the first letter. You will get one a day. Read it slowly. Then close the tab. Then come back tomorrow, and there will be more.",
    pullQuote: "Some things deserve a deliberate arc.",
    signoff: "Yours, before the candles, J.",
    songTitle: "Something About Us",
    songArtist: "Daft Punk",
    youtubeId: "I9dpHi4hC9w",
    drafts: [],
    reasons: [],
    gallery: [],
    pullQuoteX: "",
  },
  {
    slug: "day-2",
    index: 2,
    title: "The Cover Story",
    eyebrow: "ISSUE 02 — THE FEATURE",
    kind: "magazine",
    body:
      "If you were the cover, the headline would be unembellished: *YIN*. Italics. Body copy on the inside. Photographer credits in mono at the bottom.\n\nWhat I keep noticing is the way light follows you. Not metaphor — light, literal. The kitchen at 7am. The cab window. The corner table at that place we don't say out loud yet.",
    pullQuote: "The way light follows you. Not metaphor — literal.",
    signoff: "— J.",
    songTitle: "April Come She Will",
    songArtist: "Simon & Garfunkel",
    youtubeId: "bo_efYhYU2A",
    drafts: [],
    reasons: [],
    gallery: [],
  },
  {
    slug: "day-3",
    index: 3,
    title: "Drafts I Never Sent",
    eyebrow: "ISSUE 03 — THE FOLDER",
    kind: "drafts",
    body:
      "I keep a folder. Most of these I rewrote sober. A few I should have sent. Today you get the unsent ones.",
    pullQuote: "",
    signoff: "— still drafting, J.",
    songTitle: "Liability",
    songArtist: "Lorde",
    youtubeId: "bSe1tdmNGRs",
    drafts: [
      { text: "It's 2:14am, you'd hate that I'm awake.", crossed: false },
      { text: "I almost called from the airport. I didn't.", crossed: true },
      { text: "You laughed and I forgot what I was about to say.", crossed: false },
      { text: "I'm not nervous. I'm not nervous. I'm not nervous.", crossed: true },
      { text: "If you ever feel small — read this twice.", crossed: false },
      { text: "I love that you correct me when I'm wrong.", crossed: false },
    ],
    reasons: [],
    gallery: [],
  },
  {
    slug: "day-4",
    index: 4,
    title: "Why You",
    eyebrow: "ISSUE 04 — THE LIST",
    kind: "why-you",
    body:
      "I made a list. It is a deliberate list. Not flattering, not poetic — true. Read it like field notes.",
    pullQuote: "Read it like field notes.",
    signoff: "— inventoried, J.",
    songTitle: "Such Great Heights",
    songArtist: "Iron & Wine",
    youtubeId: "vfPtGsSJldg",
    drafts: [],
    reasons: [
      "The way you defend the people you love before they ask.",
      "The seriousness you give to small choices — what coffee, what street, what song.",
      "How you remember exactly what someone said three weeks ago and quote it back, gently.",
      "The way you walk into a room and adjust the temperature of it.",
      "Your hands when you are explaining something you care about.",
      "That you cry at the right things and laugh at the wrong things.",
      "How you tell the truth, even when it costs you.",
      "The version of me that exists only when you're in the room.",
    ],
    gallery: [],
  },
  {
    slug: "day-5",
    index: 5,
    title: "HAPPY BIRTHDAY YIN",
    eyebrow: "ISSUE 05 — THE DAY",
    kind: "birthday",
    body:
      "Today is the headline. No subhead. No copy below it. Just — happy birthday, my favorite person.\n\nThere is a longer letter inside. Open it when you have a quiet ten minutes. Bring the tea, not the coffee. I'll be there in spirit, then in person.",
    pullQuote: "Today is the headline. No subhead.",
    signoff: "— always, J.",
    songTitle: "Yellow",
    songArtist: "Coldplay",
    youtubeId: "yKNxeF4KMsY",
    drafts: [],
    reasons: [],
    gallery: [
      { url: "", caption: "the morning we missed the train", span: "l" },
      { url: "", caption: "your hand, my dashboard", span: "s" },
      { url: "", caption: "the kitchen at 7am", span: "m" },
      { url: "", caption: "rooftop, late august", span: "xl" },
      { url: "", caption: "your laugh, mid-sentence", span: "m" },
      { url: "", caption: "the corner table", span: "s" },
      { url: "", caption: "october, the long walk", span: "l" },
    ],
  },
];

function defaultDates(): { startDate: string; birthdayDate: string } {
  // Default: birthday 5 days from "today" so a fresh deploy demos the full arc.
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const bday = new Date(start);
  bday.setUTCDate(bday.getUTCDate() + 4); // start..start+4 = 5 days
  return { startDate: start.toISOString(), birthdayDate: bday.toISOString() };
}

export async function ensureSeed(): Promise<void> {
  const existing = await db.select().from(siteConfigTable);
  if (existing.length === 0) {
    const { startDate, birthdayDate } = defaultDates();
    await db.insert(siteConfigTable).values({
      id: 1,
      title: "For Yin",
      recipientName: "Yin",
      senderName: "J",
      startDate,
      birthdayDate,
      accentColor: "#c47a6a",
      coordinates: "40.7128°N  74.0060°W",
      coordinatesPlace: "the corner where we first met",
      unlockOverride: 0,
      liveText: "thinking about you, in the cab, right now.",
    });
    logger.info("Seeded site_config");
  }

  const existingDays = await db.select().from(daysTable);
  if (existingDays.length === 0) {
    for (const d of DAYS_SEED) {
      await db.insert(daysTable).values({
        slug: d.slug,
        index: d.index,
        title: d.title,
        eyebrow: d.eyebrow,
        kind: d.kind,
        body: d.body,
        pullQuote: d.pullQuote,
        signoff: d.signoff,
        songTitle: d.songTitle,
        songArtist: d.songArtist,
        youtubeId: d.youtubeId,
        drafts: d.drafts as { text: string; crossed: boolean }[],
        reasons: d.reasons as string[],
        gallery: d.gallery as { url: string; caption: string; span: "s" | "m" | "l" | "xl" }[],
      });
    }
    logger.info({ count: DAYS_SEED.length }, "Seeded days");
  }

  // Touch sql to keep the import used in case of future ad-hoc queries.
  void sql;
}

import { db, siteConfigTable, daysTable } from "@workspace/db";
import { logger } from "./logger.js";

const DAYS_SEED = [
  {
    slug: "day-1",
    index: 1,
    igboTitle: "Ụtọ",
    title: "The Scratch Issue",
    eyebrow: "ISSUE 01 — THE OPENING",
    kind: "scratch",
    body: "Yin —\n\nFive days. That is the runway. Not because you need to be courted, but because some things deserve a deliberate arc — a slow exhale before the morning of you.\n\nThis is the first issue. Scratch the cards below to reveal what I've been holding back.",
    pullQuote: "Some things deserve a deliberate arc.",
    signoff: "Yours, before the candles, J.",
    songTitle: "Something About Us",
    songArtist: "Daft Punk",
    youtubeId: "I9dpHi4hC9w",
    scratchCards: [
      { front: "The First Thought", hidden: "I knew from the moment you laughed." },
      { front: "The Habit", hidden: "I check my phone for your name first." },
      { front: "The Hope", hidden: "That this week makes you feel seen." }
    ],
    slides: [],
  },
  {
    slug: "day-2",
    index: 2,
    igboTitle: "Echiche",
    title: "System Initialization",
    eyebrow: "ISSUE 02 — THE SOURCE",
    kind: "terminal",
    body: "If I could code the way I feel about you, the syntax would be perfect. No bugs. Just a clean loop of admiration.\n\nType 'help' in the terminal to interact with the system.",
    pullQuote: "The logic is sound. The feelings are not.",
    signoff: "— J.",
    songTitle: "April Come She Will",
    songArtist: "Simon & Garfunkel",
    youtubeId: "bo_efYhYU2A",
    scratchCards: [],
    slides: [],
  },
  {
    slug: "day-3",
    index: 3,
    igboTitle: "Obi m",
    title: "Voice Memo 03",
    eyebrow: "ISSUE 03 — THE AUDIO",
    kind: "voicememo",
    body: "I recorded this because sometimes ink isn't enough. Listen to the memo below.",
    pullQuote: "The frequency of you.",
    signoff: "— listening, J.",
    songTitle: "Liability",
    songArtist: "Lorde",
    youtubeId: "bSe1tdmNGRs",
    voiceNoteUrl: "", // Admin will upload
    scratchCards: [],
    slides: [],
  },
  {
    slug: "day-4",
    index: 4,
    igboTitle: "Ifunanya",
    title: "The Gallery of Reasons",
    eyebrow: "ISSUE 04 — THE VISUAL",
    kind: "slideshow",
    body: "I made a list. But a list is flat. Swipe through the slides to see why it has to be you.",
    pullQuote: "Every frame is a reason.",
    signoff: "— swiping, J.",
    songTitle: "Such Great Heights",
    songArtist: "Iron & Wine",
    youtubeId: "vfPtGsSJldg",
    slides: [
      { body: "The way you defend the people you love.", sub: "Fierce." },
      { body: "The seriousness you give to small choices.", sub: "Deliberate." },
      { body: "How you remember exactly what someone said.", sub: "Attentive." }
    ],
    scratchCards: [],
  },
  {
    slug: "day-5",
    index: 5,
    igboTitle: "Ndụ m",
    title: "HAPPY BIRTHDAY YIN",
    eyebrow: "ISSUE 05 — THE DAY",
    kind: "birthday",
    body: "Today is the headline. No subhead. Just — happy birthday, my favorite person.\n\nThere is a longer letter inside. Open it when you have a quiet ten minutes.",
    pullQuote: "Today is the headline.",
    signoff: "— always, J.",
    songTitle: "Yellow",
    songArtist: "Coldplay",
    youtubeId: "yKNxeF4KMsY",
    gallery: [
      { url: "", caption: "the morning we missed the train", span: "l" },
      { url: "", caption: "your hand, my dashboard", span: "s" },
      { url: "", caption: "the kitchen at 7am", span: "m" }
    ],
    scratchCards: [],
    slides: [],
  },
];

function defaultDates(): { startDate: string; birthdayDate: string } {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const bday = new Date(start);
  bday.setUTCDate(bday.getUTCDate() + 4);
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
      liveText: "thinking about you, right now.",
      liveUpdatedAt: new Date(),
    });
    logger.info("Seeded site_config");
  }

  const existingDays = await db.select().from(daysTable);
  if (existingDays.length === 0) {
    for (const d of DAYS_SEED) {
      await db.insert(daysTable).values({
        slug: d.slug,
        index: d.index,
        igboTitle: d.igboTitle,
        title: d.title,
        eyebrow: d.eyebrow,
        kind: d.kind,
        body: d.body,
        pullQuote: d.pullQuote,
        signoff: d.signoff,
        songTitle: d.songTitle,
        songArtist: d.songArtist,
        youtubeId: d.youtubeId,
        drafts: (d as any).drafts || [],
        reasons: (d as any).reasons || [],
        gallery: (d as any).gallery || [],
        scratchCards: JSON.stringify((d as any).scratchCards || []),
        slides: JSON.stringify((d as any).slides || []),
        voiceNoteUrl: (d as any).voiceNoteUrl || "",
        audioUrl: (d as any).audioUrl || "",
        heroImage: (d as any).heroImage || "",
        signatureSvg: (d as any).signatureSvg || "",
        previewText: (d as any).previewText || "",
        replyText: (d as any).replyText || "",
        replyAt: null,
        openedAt: null,
      });
    }
    logger.info({ count: DAYS_SEED.length }, "Seeded days v3.0");
  }
}

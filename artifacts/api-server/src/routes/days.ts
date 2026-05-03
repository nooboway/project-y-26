import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, daysTable } from "@workspace/db";
import {
  ListDaysResponse,
  GetDayResponse,
  MarkDaySeenResponse,
  SendDayReplyBody,
  SendDayReplyResponse,
} from "@workspace/api-zod";
import { loadSite, loadDays, computeDayIndex, dayUnlockDateIso } from "../lib/lock";

const router: IRouter = Router();

router.get("/days", async (_req, res): Promise<void> => {
  const site = await loadSite();
  const days = await loadDays();
  const now = new Date();
  const { currentDayIndex, isAftermath } = computeDayIndex(
    site.startDate, site.birthdayDate, site.unlockOverride, days.length, now,
  );
  const summaries = days.map((d) => {
    const unlocked = isAftermath || d.index <= currentDayIndex;
    return {
      slug: d.slug,
      index: d.index,
      title: unlocked ? d.title : "Locked",
      eyebrow: unlocked ? d.eyebrow : "Comes alive soon",
      kind: d.kind as "letter" | "magazine" | "drafts" | "why-you" | "gallery" | "birthday",
      unlocked,
      isToday: d.index === currentDayIndex,
      unlockDate: dayUnlockDateIso(site.startDate, d.index),
      youtubeId: unlocked ? d.youtubeId : "",
      previewText: d.previewText,
    };
  });
  res.json(ListDaysResponse.parse(summaries));
});

router.get("/days/:slug", async (req, res): Promise<void> => {
  const slugRaw = req.params.slug;
  const slug = Array.isArray(slugRaw) ? slugRaw[0] : slugRaw;
  if (typeof slug !== "string") {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const site = await loadSite();
  const days = await loadDays();
  const now = new Date();
  const { currentDayIndex, isAftermath } = computeDayIndex(
    site.startDate, site.birthdayDate, site.unlockOverride, days.length, now,
  );
  const [day] = await db.select().from(daysTable).where(eq(daysTable.slug, slug));
  if (!day) {
    res.status(404).json({ error: "Day not found" });
    return;
  }
  const unlocked = isAftermath || day.index <= currentDayIndex;
  if (!unlocked) {
    const unlockDate = dayUnlockDateIso(site.startDate, day.index);
    res.status(423).json({
      slug: day.slug,
      index: day.index,
      unlockDate,
      message: "This day comes alive on its own time. Come back soon.",
      previewText: day.previewText,
    });
    return;
  }
  res.json(GetDayResponse.parse({
    slug: day.slug,
    index: day.index,
    title: day.title,
    eyebrow: day.eyebrow,
    kind: day.kind,
    unlockDate: dayUnlockDateIso(site.startDate, day.index),
    heroImage: day.heroImage,
    body: day.body,
    pullQuote: day.pullQuote,
    signoff: day.signoff,
    songTitle: day.songTitle,
    songArtist: day.songArtist,
    youtubeId: day.youtubeId,
    signatureSvg: day.signatureSvg,
    voiceNoteUrl: day.voiceNoteUrl,
    previewText: day.previewText,
    replyText: day.replyText,
    drafts: day.drafts,
    reasons: day.reasons,
    gallery: day.gallery,
  }));
});

router.post("/days/:slug/seen", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "");
  if (!slug) { res.status(400).json({ error: "Invalid slug" }); return; }
  const [existing] = await db.select().from(daysTable).where(eq(daysTable.slug, slug));
  if (!existing) { res.status(404).json({ error: "Day not found" }); return; }
  const site = await loadSite();
  const days = await loadDays();
  const { currentDayIndex, isAftermath } = computeDayIndex(
    site.startDate, site.birthdayDate, site.unlockOverride, days.length, new Date(),
  );
  const unlocked = isAftermath || existing.index <= currentDayIndex;
  if (!unlocked) { res.status(423).json({ error: "Locked" }); return; }
  const firstOpen = !existing.openedAt;
  if (firstOpen) {
    await db.update(daysTable)
      .set({ openedAt: sql`now()` })
      .where(eq(daysTable.slug, slug));
  }
  res.json(MarkDaySeenResponse.parse({ ok: true, firstOpen }));
});

router.post("/days/:slug/reply", async (req, res): Promise<void> => {
  const slug = String(req.params.slug ?? "");
  const parsed = SendDayReplyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const text = parsed.data.text.slice(0, 1000);
  const [existing] = await db.select().from(daysTable).where(eq(daysTable.slug, slug));
  if (!existing) { res.status(404).json({ error: "Day not found" }); return; }
  await db.update(daysTable)
    .set({ replyText: text, replyAt: sql`now()` })
    .where(eq(daysTable.slug, slug));
  res.json(SendDayReplyResponse.parse({ ok: true }));
});

export default router;

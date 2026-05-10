import express, { Request, Response } from "express";
import { eq, sql } from "@workspace/db";
import { db, daysTable } from "@workspace/db";
import {
  ListDaysResponse,
  GetDayResponse,
  MarkDaySeenResponse,
  SendDayReplyBody,
  SendDayReplyResponse,
} from "@workspace/api-zod";
import {
  loadSite,
  loadDays,
  computeDayIndex,
  dayUnlockDateIso,
  dayUnlockDatetimeMs,
} from "../lib/lock.js";

const router = express.Router();

router.get("/days", async (_req: Request, res: Response): Promise<void> => {
  const site = await loadSite();
  const days = await loadDays();
  const now = new Date();
  const nowMs = now.getTime();
  const { isAftermath, currentDayIndex } = computeDayIndex(
    site.startDate, site.birthdayDate, site.unlockOverride, days.length, now,
  );

  const summaries = days.map((d) => {
    const unlockTime = (d as any).unlockTime ?? "00:00";
    const unlocked = isAftermath || d.index <= currentDayIndex || nowMs >= dayUnlockDatetimeMs(site.startDate, d.index, unlockTime);

    // "Tomorrow" — the next card to unlock. Show its igboTitle as a teaser
    // so she anticipates what's coming, but nothing else leaks.
    const isNext = !unlocked && d.index === currentDayIndex + 1;

    return {
      slug: d.slug,
      index: d.index,
      // Only reveal the Igbo title when unlocked, or as a one-card teaser
      igboTitle: (unlocked || isNext) ? d.igboTitle : "",
      title: unlocked ? d.title : "Locked",
      eyebrow: unlocked ? d.eyebrow : "",
      kind: d.kind as any,
      unlocked,
      isToday: unlocked && d.index === currentDayIndex,
      unlockDate: dayUnlockDateIso(site.startDate, d.index, unlockTime),
      youtubeId: unlocked ? d.youtubeId : "",
      previewText: d.previewText,
    };
  });
  res.json(ListDaysResponse.parse(summaries));
});

router.get("/days/:slug", async (req: Request, res: Response): Promise<void> => {
  const slugRaw = req.params.slug;
  const slug = Array.isArray(slugRaw) ? slugRaw[0] : slugRaw;
  if (typeof slug !== "string") {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const site = await loadSite();
  const days = await loadDays();
  const now = new Date();
  const nowMs = now.getTime();
  const { currentDayIndex, isAftermath } = computeDayIndex(
    site.startDate, site.birthdayDate, site.unlockOverride, days.length, now,
  );
  const [day] = await db.select().from(daysTable).where(eq(daysTable.slug, slug));
  if (!day) {
    res.status(404).json({ error: "Day not found" });
    return;
  }
  const unlockTime = (day as any).unlockTime ?? "00:00";
  const unlocked = isAftermath || day.index <= currentDayIndex || nowMs >= dayUnlockDatetimeMs(site.startDate, day.index, unlockTime);
  if (!unlocked) {
    res.status(423).json({
      slug: day.slug,
      index: day.index,
      unlockDate: dayUnlockDateIso(site.startDate, day.index, unlockTime),
      message: "This day comes alive on its own time. Come back soon.",
      previewText: day.previewText,
    });
    return;
  }
  res.json(GetDayResponse.parse({
    slug: day.slug,
    index: day.index,
    igboTitle: day.igboTitle,
    title: day.title,
    eyebrow: day.eyebrow,
    kind: day.kind as any,
    unlockDate: dayUnlockDateIso(site.startDate, day.index, unlockTime),
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
    scratchCards: JSON.parse((day as any).scratchCards || "[]"),
    slides: JSON.parse((day as any).slides || "[]"),
    audioUrl: day.audioUrl ?? "",
    copy: (day as any).copy ?? {},
  }));
});

router.post("/days/:slug/seen", async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug ?? "");
  if (!slug) { res.status(400).json({ error: "Invalid slug" }); return; }
  const [existing] = await db.select().from(daysTable).where(eq(daysTable.slug, slug));
  if (!existing) { res.status(404).json({ error: "Day not found" }); return; }
  const site = await loadSite();
  const days = await loadDays();
  const now = new Date();
  const nowMs = now.getTime();
  const { currentDayIndex, isAftermath } = computeDayIndex(
    site.startDate, site.birthdayDate, site.unlockOverride, days.length, now,
  );
  const unlockTime = (existing as any).unlockTime ?? "00:00";
  const unlocked = isAftermath || existing.index <= currentDayIndex || nowMs >= dayUnlockDatetimeMs(site.startDate, existing.index, unlockTime);
  if (!unlocked) { res.status(423).json({ error: "Locked" }); return; }
  const firstOpen = !existing.openedAt;
  if (firstOpen) {
    await db.update(daysTable)
      .set({ openedAt: sql`now()` })
      .where(eq(daysTable.slug, slug));
  }
  res.json(MarkDaySeenResponse.parse({ ok: true, firstOpen }));
});

router.post("/days/:slug/reply", async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug ?? "");
  const parsed = SendDayReplyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const text = parsed.data.text.slice(0, 1000);
  const [existing] = await db.select().from(daysTable).where(eq(daysTable.slug, slug));
  if (!existing) { res.status(404).json({ error: "Day not found" }); return; }
  await db.update(daysTable)
    .set({ replyText: text, replyAt: sql`now()` })
    .where(eq(daysTable.slug, slug));
  const hook = process.env.REPLY_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `💌 reply on **${slug}**\n> ${text}` }),
    }).catch(() => {});
  }
  res.json(SendDayReplyResponse.parse({ ok: true }));
});

export default router;

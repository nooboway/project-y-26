import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, daysTable } from "@workspace/db";
import { ListDaysResponse, GetDayResponse } from "@workspace/api-zod";
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
    drafts: day.drafts,
    reasons: day.reasons,
    gallery: day.gallery,
  }));
});

export default router;

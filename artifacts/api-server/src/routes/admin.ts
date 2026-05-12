import express, { Request, Response } from "express";
import { eq, sql } from "@workspace/db";
import crypto from "node:crypto";
import { db, siteConfigTable, daysTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminGetSiteResponse,
  AdminUpdateSiteBody,
  AdminUpdateSiteResponse,
  AdminUpdateLiveBody,
  AdminUpdateLiveResponse,
  AdminListDaysResponse,
  AdminUpdateDayBody,
  AdminUpdateDayResponse,
  AdminListSeenResponse,
} from "@workspace/api-zod";
import { loadSite, dayUnlockDateIso } from "../lib/lock.js";
import { makeToken, requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

const ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE ?? "love-yin-2026";

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.passphrase !== ADMIN_PASSPHRASE) {
    res.status(401).json({ error: "Wrong passphrase" });
    return;
  }
  res.json(AdminLoginResponse.parse({ token: makeToken() }));
});

router.get("/admin/site", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const s = await loadSite();
  res.json(AdminGetSiteResponse.parse({
    title: s.title,
    recipientName: s.recipientName,
    senderName: s.senderName,
    startDate: s.startDate,
    birthdayDate: s.birthdayDate,
    accentColor: s.accentColor,
    coordinates: s.coordinates,
    coordinatesPlace: s.coordinatesPlace,
    unlockOverride: s.unlockOverride,
    copy: s.copy,
  }));
});

router.put("/admin/site", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = AdminUpdateSiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(siteConfigTable)
    .set(parsed.data)
    .where(eq(siteConfigTable.id, 1))
    .returning();
  res.json(AdminUpdateSiteResponse.parse({
    title: updated.title,
    recipientName: updated.recipientName,
    senderName: updated.senderName,
    startDate: updated.startDate,
    birthdayDate: updated.birthdayDate,
    accentColor: updated.accentColor,
    coordinates: updated.coordinates,
    coordinatesPlace: updated.coordinatesPlace,
    unlockOverride: updated.unlockOverride,
    copy: updated.copy,
  }));
});

router.put("/admin/live", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = AdminUpdateLiveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const now = new Date();
  const [updated] = await db
    .update(siteConfigTable)
    .set({ liveText: parsed.data.text, liveUpdatedAt: now })
    .where(eq(siteConfigTable.id, 1))
    .returning();
  res.json(AdminUpdateLiveResponse.parse({
    text: updated.liveText,
    updatedAt: updated.liveUpdatedAt.toISOString(),
  }));
});

router.get("/admin/days", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const site = await loadSite();
  const rows = await db.select().from(daysTable).orderBy(daysTable.index);
  res.json(AdminListDaysResponse.parse(rows.map((d: any) => ({
    slug: d.slug,
    index: d.index,
    igboTitle: d.igboTitle,
    title: d.title,
    eyebrow: d.eyebrow,
    kind: d.kind,
    unlockDate: dayUnlockDateIso(site.startDate, d.index),
    heroImage: d.heroImage,
    body: d.body,
    pullQuote: d.pullQuote,
    signoff: d.signoff,
    songTitle: d.songTitle,
    songArtist: d.songArtist,
    youtubeId: d.youtubeId,
    signatureSvg: d.signatureSvg,
    voiceNoteUrl: d.voiceNoteUrl,
    previewText: d.previewText,
    replyText: d.replyText,
    drafts: d.drafts,
    reasons: d.reasons,
    gallery: d.gallery,
    scratchCards: JSON.parse(d.scratchCards || "[]"),
    slides: JSON.parse(d.slides || "[]"),
    audioUrl: d.audioUrl ?? "",
    copy: d.copy,
  }))));
});

router.get("/admin/seen", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(daysTable).orderBy(daysTable.index);
  res.json(AdminListSeenResponse.parse(rows.map((d: any) => ({
    slug: d.slug,
    title: d.title,
    openedAt: d.openedAt ? d.openedAt.toISOString() : null,
    replyAt: d.replyAt ? d.replyAt.toISOString() : null,
    replyText: d.replyText ?? "",
  }))));
});

router.put("/admin/days/:slug", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const slugRaw = req.params.slug;
  const slug = Array.isArray(slugRaw) ? slugRaw[0] : slugRaw;
  if (typeof slug !== "string") {
    res.status(400).json({ error: "Invalid slug" });
    return;
  }
  const parsed = AdminUpdateDayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData = { ...parsed.data } as any;
  if (updateData.scratchCards) updateData.scratchCards = JSON.stringify(updateData.scratchCards);
  if (updateData.slides) updateData.slides = JSON.stringify(updateData.slides);

  const [updated] = await db
    .update(daysTable)
    .set(updateData)
    .where(eq(daysTable.slug, slug))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Day not found" });
    return;
  }
  const site = await loadSite();
  res.json(AdminUpdateDayResponse.parse({
    slug: updated.slug,
    index: updated.index,
    igboTitle: updated.igboTitle,
    title: updated.title,
    eyebrow: updated.eyebrow,
    kind: updated.kind,
    unlockDate: dayUnlockDateIso(site.startDate, updated.index),
    heroImage: updated.heroImage,
    body: updated.body,
    pullQuote: updated.pullQuote,
    signoff: updated.signoff,
    songTitle: updated.songTitle,
    songArtist: updated.songArtist,
    youtubeId: updated.youtubeId,
    signatureSvg: updated.signatureSvg,
    voiceNoteUrl: updated.voiceNoteUrl,
    previewText: updated.previewText,
    replyText: updated.replyText,
    drafts: updated.drafts,
    reasons: updated.reasons,
    gallery: updated.gallery,
    scratchCards: JSON.parse(updated.scratchCards || "[]"),
    slides: JSON.parse(updated.slides || "[]"),
    audioUrl: updated.audioUrl ?? "",
    copy: updated.copy,
  }));
});

// Music resolver — paste any YouTube / SoundCloud / Spotify / direct URL,
// returns the canonical embed info and title/artist via oEmbed.
router.get("/admin/resolve-music", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = String((req.query as any).url ?? "").trim();
  if (!raw) { res.status(400).json({ error: "Missing url query param" }); return; }

  // Detect provider + extract IDs
  const ytIdMatch = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/);
  const ytBareMatch = /^[A-Za-z0-9_-]{11}$/.test(raw);
  const isSoundcloud = /soundcloud\.com\//.test(raw);
  const spotifyMatch = raw.match(/(?:open\.spotify\.com|spotify:)(?:\/?)(track|album|playlist|episode|show)[/:]([A-Za-z0-9]+)/);

  let provider: string | null = null;
  let oembedUrl: string | null = null;
  let youtubeId: string | undefined;
  let spotifyEmbed: { kind: string; id: string } | undefined;

  if (ytIdMatch || ytBareMatch) {
    provider = "youtube";
    youtubeId = ytIdMatch ? ytIdMatch[1] : raw;
    oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}&format=json`;
  } else if (isSoundcloud) {
    provider = "soundcloud";
    oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(raw)}`;
  } else if (spotifyMatch) {
    provider = "spotify";
    spotifyEmbed = { kind: spotifyMatch[1], id: spotifyMatch[2] };
    oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(raw)}`;
  } else if (/\.(mp3|m4a|wav|ogg|flac|aac)(\?|$)/i.test(raw)) {
    provider = "direct";
  }

  let meta: any = null;
  if (oembedUrl) {
    try {
      const r = await fetch(oembedUrl, { headers: { "User-Agent": "project-y-26/1.0" } });
      if (r.ok) meta = await r.json();
    } catch { /* ignore — return what we have */ }
  }

  res.json({
    provider,
    youtubeId,
    spotifyEmbed,
    title: meta?.title ?? "",
    author: meta?.author_name ?? "",
    thumbnail: meta?.thumbnail_url ?? "",
    embedHtml: meta?.html ?? "",
    rawUrl: raw,
  });
});

// Reset per-day stats (openedAt + replyText + replyAt). Use to clear test
// data before a real field deployment. Optional `slug` body to scope to one
// day, otherwise resets all days.
router.post("/admin/reset-stats", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const slug = typeof req.body?.slug === "string" ? req.body.slug : null;
  if (slug) {
    const [row] = await db.update(daysTable)
      .set({ openedAt: null, replyText: "", replyAt: null })
      .where(eq(daysTable.slug, slug))
      .returning({ slug: daysTable.slug });
    if (!row) { res.status(404).json({ error: "Day not found" }); return; }
    res.json({ ok: true, scope: "day", slug, count: 1 });
    return;
  }
  const rows = await db.update(daysTable)
    .set({ openedAt: null, replyText: "", replyAt: null })
    .where(sql`true`)
    .returning({ slug: daysTable.slug });
  res.json({ ok: true, scope: "all", count: rows.length });
});

export default router;

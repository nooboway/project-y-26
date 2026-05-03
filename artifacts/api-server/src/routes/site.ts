import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger.js";
import {
  GetSiteResponse,
  GetLiveMessageResponse,
} from "@workspace/api-zod";
import { loadSite, loadDays, computeDayIndex } from "../lib/lock.js";

const router = Router();

router.get("/site", async (_req: Request, res: Response): Promise<void> => {
  const site = await loadSite();
  const days = await loadDays();
  const now = new Date();
  const { currentDayIndex, isBirthday, isAftermath, secondsUntilBirthday } =
    computeDayIndex(site.startDate, site.birthdayDate, site.unlockOverride, days.length, now);

  const data = {
    title: site.title,
    recipientName: site.recipientName,
    senderName: site.senderName,
    startDate: site.startDate,
    birthdayDate: site.birthdayDate,
    accentColor: site.accentColor,
    coordinates: site.coordinates,
    coordinatesPlace: site.coordinatesPlace,
    serverNow: now.toISOString(),
    currentDayIndex,
    totalDays: days.length,
    isBirthday,
    isAftermath,
    secondsUntilBirthday,
  };
  res.json(GetSiteResponse.parse(data));
});

router.get("/live", async (_req: Request, res: Response): Promise<void> => {
  const site = await loadSite();
  res.json(
    GetLiveMessageResponse.parse({
      text: site.liveText,
      updatedAt: site.liveUpdatedAt.toISOString(),
    }),
  );
});

export default router;

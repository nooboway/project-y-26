import { db, siteConfigTable, daysTable } from "@workspace/db";
import { eq, asc } from "@workspace/db";

export type SiteConfigRow = typeof siteConfigTable.$inferSelect;
export type DayRow = typeof daysTable.$inferSelect;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Returns the exact UTC millisecond at which a day unlocks.
 *
 * unlockTime is "HH:MM" in GMT+1 (e.g. "09:00"). Defaults to "00:00"
 * (midnight GMT+1) which preserves the existing behaviour for any row
 * that was seeded before this column existed (assuming they meant local time).
 * We subtract 1 hour to convert GMT+1 input to UTC.
 */
export function dayUnlockDatetimeMs(
  startDateIso: string,
  dayIndex: number,
  unlockTime: string = "00:00",
): number {
  const start = new Date(startDateIso);
  const baseDayMs =
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()) +
    (dayIndex - 1) * MS_PER_DAY;
  const parts = unlockTime.split(":").map(Number);
  const hh = Number.isFinite(parts[0]) ? parts[0] : 0;
  const mm = Number.isFinite(parts[1]) ? parts[1] : 0;
  // Subtract 1 hour (3600 * 1000 ms) to convert GMT+1 to UTC
  return baseDayMs + (hh * 3600 + mm * 60) * 1000 - 3600000;
}

/**
 * Returns an ISO string for display (e.g. "comes alive SAT 25 MAY").
 * Uses dayUnlockDatetimeMs so the displayed time is accurate.
 */
export function dayUnlockDateIso(
  startDateIso: string,
  dayIndex: number,
  unlockTime: string = "00:00",
): string {
  return new Date(dayUnlockDatetimeMs(startDateIso, dayIndex, unlockTime)).toISOString();
}

export function computeDayIndex(
  startDateIso: string,
  birthdayIso: string,
  unlockOverride: number,
  totalDays: number,
  now: Date,
): {
  currentDayIndex: number;
  isBirthday: boolean;
  isAftermath: boolean;
  secondsUntilBirthday: number;
} {
  // Manual override — explicit admin-set index bypasses all date logic.
  // Guard: clamp to valid range so a stale override value can't unlock
  // more days than exist or accidentally set aftermath permanently.
  if (unlockOverride && unlockOverride > 0) {
    const idx = Math.min(Math.max(unlockOverride, 1), totalDays + 1);
    return {
      currentDayIndex: idx,
      isBirthday: idx === totalDays,
      isAftermath: idx > totalDays,
      secondsUntilBirthday: 0,
    };
  }

  const bday = startOfUtcDay(new Date(birthdayIso));
  const today = startOfUtcDay(now);
  const start = startOfUtcDay(new Date(startDateIso));

  let idx: number;
  if (today < start) {
    idx = 0;
  } else if (today > bday) {
    idx = totalDays + 1; // aftermath
  } else if (today === bday) {
    idx = totalDays; // birthday day
  } else {
    const dayCountFromStart = Math.floor((today - start) / MS_PER_DAY) + 1;
    idx = Math.min(Math.max(dayCountFromStart, 1), totalDays - 1);
  }

  const secondsUntilBirthday = Math.max(0, Math.floor((bday - now.getTime()) / 1000));

  return {
    currentDayIndex: idx,
    isBirthday: today === bday,
    isAftermath: today > bday,
    secondsUntilBirthday,
  };
}

export async function loadSite(): Promise<SiteConfigRow> {
  const [row] = await db.select().from(siteConfigTable).where(eq(siteConfigTable.id, 1));
  if (!row) throw new Error("Site config not seeded");
  return row;
}

export async function loadDays(): Promise<DayRow[]> {
  return db.select().from(daysTable).orderBy(asc(daysTable.index));
}

import { db, siteConfigTable, daysTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

export type SiteConfigRow = typeof siteConfigTable.$inferSelect;
export type DayRow = typeof daysTable.$inferSelect;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function computeDayIndex(
  startDateIso: string,
  birthdayIso: string,
  unlockOverride: number,
  totalDays: number,
  now: Date,
): { currentDayIndex: number; isBirthday: boolean; isAftermath: boolean; secondsUntilBirthday: number } {
  if (unlockOverride && unlockOverride > 0) {
    const idx = Math.min(unlockOverride, totalDays + 1);
    return {
      currentDayIndex: idx,
      isBirthday: idx === totalDays,
      isAftermath: idx > totalDays,
      secondsUntilBirthday: 0,
    };
  }
  const start = startOfUtcDay(new Date(startDateIso));
  const bday = startOfUtcDay(new Date(birthdayIso));
  const today = startOfUtcDay(now);

  // currentDayIndex: 0 before start, 1..totalDays during countdown (totalDays = birthday day), totalDays+1 after
  let idx: number;
  if (today < start) idx = 0;
  else if (today >= bday) {
    idx = today.valueOf() === bday.valueOf() ? totalDays : totalDays + 1;
  } else {
    const dayCountFromStart = Math.floor((today - start) / MS_PER_DAY) + 1;
    idx = Math.min(Math.max(dayCountFromStart, 1), totalDays);
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

export function dayUnlockDateIso(startDateIso: string, dayIndex: number): string {
  const start = new Date(startDateIso);
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + (dayIndex - 1)));
  return d.toISOString();
}

import type { SiteCopy, DayCopy } from "@workspace/db";

export const SITE_COPY_TEMPLATE: Required<SiteCopy> = {
  hero: {
    lineOne:   "HAPPY",
    lineTwo:   "birthday,",
    lineThree: "YIN.",
    subtitle:  "from J, slowly. an unbroken letter, opened one day at a time.",
    image:     "",
  },
  labels: {
    preBirthday: "FIVE DAYS TO YIN",
    birthday:    "TODAY IS YOU",
    aftermath:   "THANK YOU FOR BEING",
  },
  buttons: {
    preBirthday: "open today's letter",
    birthday:    "open the morning",
    aftermath:   "revisit the issues",
  },
  countdown: {
    style:    "numbers",
    label:    "until morning",
    sub:      "SIDE A · 33⅓ RPM",
    whenZero: "HAPPY BIRTHDAY YIN 🌸",
  },
  ticker: {
    accent: "THINKING ABOUT YOU, IN THE CAB, RIGHT NOW.",
    bottom: "HIM · THINKING · RIGHT NOW · ABOUT YOU · ALWAYS",
    suffix: "live from him",
  },
  footer: { tagline: "a private issue · printed in one copy" },
  cover:  { issuesHeading: "THE ISSUES", photoCaption: "Photo · 35mm · for y." },
};

export const BIRTHDAY_COPY_TEMPLATE: Required<NonNullable<DayCopy["birthday"]>> = {
  subhead:       "today is the headline. no subhead.",
  envelopeCta:   "open the morning",
  candleHint:    "make a wish · the morning is yours",
  candleDoneCta: "blow",
  candleDoneHint:"wish made ♡",
};

export const LETTER_COPY_TEMPLATE: Required<NonNullable<DayCopy["letter"]>> = {
  intro:    "a letter, slowly.",
  signedAs: "— signed,",
};

export const REPLY_COPY_TEMPLATE: Required<NonNullable<DayCopy["reply"]>> = {
  prompt:      "leave a one-line reply",
  placeholder: "a single sentence, anything. only he sees it.",
  sentTitle:   "your one-line reply landed.",
  sentBody:    "he'll know.",
};

export const DAY_COPY_TEMPLATES: Record<string, Record<string, any>> = {
  letter:    LETTER_COPY_TEMPLATE,
  birthday:  BIRTHDAY_COPY_TEMPLATE,
};

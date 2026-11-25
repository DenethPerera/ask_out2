/**
 * Every user-facing string, the fixed date, and the one shared photo asset for the
 * ask-out experience. Change copy here — nothing is buried inside JSX.
 */

/**
 * THE DATE. Fixed on purpose: never derived from the current month, so the page cannot
 * drift to September 20 or any other date later on. This is the only place the date
 * exists — every component reads these fields.
 */
export interface DateDetails {
  isoDate: string;
  displayDate: string;
  /** Parts, for the invitation card's typography. */
  weekday: string;
  month: string;
  day: string;
  year: string;
  /** Still to be confirmed — shown only when set to a non-empty string. */
  time: string;
  location: string;
}

export const DATE_DETAILS: DateDetails = {
  isoDate: "2026-08-20",
  displayDate: "Thursday, August 20, 2026",
  weekday: "Thursday",
  month: "August",
  day: "20",
  year: "2026",
  time: "",
  location: "",
};

export const TIME_SLOTS = [
  { id: "lunch", label: "Lunch", icon: "☀️", detail: "Lunch Date ☀️" },
  { id: "afternoon", label: "Afternoon", icon: "☕", detail: "Afternoon Coffee ☕" },
  { id: "evening", label: "Evening", icon: "🌅", detail: "Golden Hour 🌅" },
  { id: "dinner", label: "Dinner", icon: "🕯️", detail: "Candlelight Dinner 🕯️" },
] as const;

export type TimeSlotId = (typeof TIME_SLOTS)[number]["id"];

export const CALENDAR_COPY = {
  eyebrow: "✦ save our date ✦",
  heading: "When are you free? ❤️",
  subtitle: "Pick the day & vibe that works best for you",
  timeLabel: "Preferred time",
  confirmIdle: "Pick a date first ✨",
  confirmReady: "Lock in our date ❤️",
  back: "← Back",
};

export interface PhotoAsset {
  src: string;
  alt: string;
  /** "contain" never crops — the meme text at the top of the image must stay readable. */
  fit: "contain" | "cover";
}

/**
 * ONE image, used three ways: caught out (Ignore), called out (Maybe another time),
 * and the punchline after the romantic celebration (Thank you). Referenced from this
 * single constant so the path is never repeated.
 */
export const REACTION_PHOTO: PhotoAsset = {
  src: "/images/god-saw-what-you-did.png",
  alt: "A corgi giving a knowing side-eye, captioned “God saw What you did !!!!”",
  fit: "contain",
};

/**
 * The keepsake pressed into the empty bottom-right corner of the letter, faded so it
 * reads as part of the paper rather than as content.
 *
 * Set to null, the letter falls back to drawing its own postage stamp — no asset needed.
 * Alt text is empty on purpose: the sticker is decoration, announced to nobody.
 */
export const LETTER_STICKER: PhotoAsset | null = {
  src: "/images/letter-sticker.png",
  alt: "",
  fit: "cover",
};

/** Pressed "Ignore" during the envelope/letter part. */
export const IGNORE_COPY = {
  dialogLabel: "A little something",
  caption: "Really? 😭😂",
  dismiss: "Go back ❤️",
};

/** Chose the stationary "Maybe another time ❤️" decline. */
export const DECLINE_COPY = {
  /** Shown for a beat while the question fades, before the punchline. */
  transition: "Wait…",
  heading: "Oh really? 👀",
  caption: "I’ll remember that 😂❤️",
};

export const CELEBRATION_COPY = {
  /** Light-written word. The heart is a separate span so the emoji keeps its own colour. */
  title: "YESSS",
  titleEmoji: "❤️",
  second: "You just made my day 🥹❤️",
  third: "Best answer ever.",
  /** Printed across the top of the invitation card. */
  invitationEyebrow: "It’s a date ❤️",
};

/**
 * Moment 8 — handwritten phrases that drift far behind the celebration. Four at most;
 * they are atmosphere, not content, so nothing important is ever said here.
 */
export const LOVE_NOTES = ["it’s a date ❤️", "finally 😉", "best answer", "✨"];

export const FINAL_COPY = {
  title: "Thank you ❤️",
  subtitle: "Now I really have something to look forward to. 😉",
  smallPrint: "I’ll take care of the rest 😉",
};

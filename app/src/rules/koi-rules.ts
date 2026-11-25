// Koi-only pure rules that sit beside the unchanged pinky-core.ts.
import type { Venue } from "./pinky-core";

export const MESSAGE_MAX = 1000;
export const STALE_DAYS = 5;
export const PLAN_HORIZON_DAYS = 30;

export const assertAdult = (birthYear: number, now: Date): boolean => now.getUTCFullYear() - birthYear >= 18;

export const ageOk = (age: number, range: { min: number; max: number }) => age >= range.min && age <= range.max;

/** Each person's age range must contain the other's age. Checked silently at unlock, never used to pick who is shown. */
export function unlockOk(a: { age: number; ageMin: number; ageMax: number }, b: { age: number; ageMin: number; ageMax: number }): boolean {
  return ageOk(b.age, { min: a.ageMin, max: a.ageMax }) && ageOk(a.age, { min: b.ageMin, max: b.ageMax });
}

export type Scan = "ok" | "link" | "contact" | "money" | "too_long";

/** Held back with a gentle note to the sender only. Message text is never stored when refused. */
export function scanMessage(body: string, planBothConfirmed: boolean): Scan {
  if (body.length > MESSAGE_MAX) return "too_long";
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|co|me|io|th)\b)/i.test(body)) return "link";
  if (/(baht|บาท|transfer|โอน|crypto|usdt|gift ?card|\b\d{3,}\s?(thb|฿))/i.test(body)) return "money";
  const contact = /(\+?\d[\d\s-]{7,}\d)|\b(line|whatsapp|telegram|instagram|ig|ไลน์)\s*(id)?\s*[:@]\s*\S+/i.test(body);
  return contact && !planBothConfirmed ? "contact" : "ok";
}

export function staleClosed(p: { createdAt: number; hasPlaceAndTime: boolean; now: number }): boolean {
  return !p.hasPlaceAndTime && p.now - p.createdAt >= STALE_DAYS * 86_400_000;
}

/** A plan place must be a listed, public, active venue; the time must be in the future and within 30 days. */
export function planPlaceOk(venue: Venue | undefined, startsAt: number, now: number): boolean {
  if (!venue || !venue.isPublic || !venue.active) return false;
  return startsAt > now && startsAt <= now + PLAN_HORIZON_DAYS * 86_400_000;
}

/** Grapheme-aware length (Thai combining marks count once). */
export function graphemes(s: string): number {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<unknown> } }).Segmenter;
  return Seg ? [...new Seg(undefined, { granularity: "grapheme" }).segment(s)].length : [...s].length;
}

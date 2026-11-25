// Pure on-device engine: everything the prototype does to state, using the unchanged pinky-core rules.
import {
  canTap, chatAllowed, closeAskAt, closeDeadline, closeOutcome, END_KINDLY, endedKey, nextSharedSlot, PLACE_SETTINGS,
  sharedPlaceOk, unlockProposal, unlocked, type CloseAnswer, type Person,
} from "@/rules/pinky-core";
import { scanMessage, staleClosed, unlockOk, type Scan } from "@/rules/koi-rules";
import { personById, PEOPLE, REPLIES, toSlots, venueByKey, type Gender, type SamplePerson } from "@/data";
import type { Lang } from "@/i18n";

export type Msg = { id: string; from: "me" | "them"; body: string; at: number };
export type Pinky = {
  id: string; personId: string; createdAt: number; status: "active" | "closed";
  venueKey: string | null; startsAt: number | null; confMe: boolean; confThem: boolean; confMeAt: number | null; cleared: boolean;
  messages: Msg[]; moreGranted: boolean; closeAnswer: CloseAnswer;
};
export type State = {
  loaded: boolean; lang: Lang; consent: boolean; onboarded: boolean;
  name: string; area: string; birthYear: number | null; gender: Gender | null; openTo: Gender[] | "everyone";
  datingOn: boolean; pins: string[]; hours: string[]; offset: number;
  taps: Record<string, { at: number; unlockAt: number | null }>;
  ended: string[]; blocked: string[]; reported: string[]; pinkies: Pinky[];
  toast: { n: number; key: string } | null;
};
export const initialState = (): State => ({
  loaded: false, lang: "en", consent: false, onboarded: false, name: "", area: "ari", birthYear: null, gender: null, openTo: "everyone",
  datingOn: true, pins: [], hours: [], offset: 0, taps: {}, ended: [], blocked: [], reported: [], pinkies: [], toast: null,
});

export const myAge = (s: State, now: number) => (s.birthYear ? new Date(now).getUTCFullYear() - s.birthYear : 30);
const ageRange = (s: State, now: number) => ({ min: Math.max(18, myAge(s, now) - 8), max: myAge(s, now) + 10 });
export const meAsPerson = (s: State): Person => ({ relationship: "single", datingOn: s.datingOn, genderIdentity: s.gender, openTo: s.openTo });
const themAsPerson = (p: SamplePerson): Person => ({ relationship: "single", datingOn: true, genderIdentity: p.gender, openTo: p.openTo });

const toast = (s: State, key: string): State => ({ ...s, toast: { n: (s.toast?.n ?? 0) + 1, key } });
const uid = (p: string, now: number) => `${p}${now.toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export const pinkyFor = (s: State, personId: string) => s.pinkies.find((p) => p.personId === personId && p.status === "active");

/** What the viewer may see on a card. There is deliberately no "they tapped" value. */
export function rowFor(s: State, personId: string): "none" | "mine" | "mutual" {
  if (pinkyFor(s, personId)) return "mutual";
  return s.taps[personId] ? "mine" : "none";
}

/** Today's cards: only the viewer's own filters hide cards on their side; nothing about the other person's taps, pins or hours is used. */
export function visibleIntros(s: State, now: number): SamplePerson[] {
  if (!s.datingOn) return [];
  const open = s.openTo === "everyone" ? null : s.openTo;
  const range = ageRange(s, now);
  return PEOPLE.filter((p) => !s.ended.includes(p.id) && !s.blocked.includes(p.id) && (!open || open.includes(p.gender)) && p.age >= range.min && p.age <= range.max);
}

export function applyTap(s: State, personId: string, now: number): State {
  const them = personById.get(personId);
  if (!them || !s.datingOn || s.taps[personId] || s.ended.includes(personId) || s.blocked.includes(personId)) return s;
  const open = s.pinkies.filter((p) => p.status === "active").length;
  const outstanding = Object.keys(s.taps).filter((id) => !pinkyFor(s, id)).length;
  if (!canTap({ pinkies: open, outstandingTaps: outstanding })) return toast(s, "intros.cap");
  const r = ageRange(s, now);
  const ok =
    them.willHookBack &&
    unlocked({ taps: [true, true], people: [meAsPerson(s), themAsPerson(them)], blocked: false, contextOk: true, sameWorld: true }) &&
    unlockOk({ age: myAge(s, now), ageMin: r.min, ageMax: r.max }, { age: them.age, ageMin: them.ageMin, ageMax: them.ageMax }) &&
    sharedPlaceOk(s.pins, them.pins);
  // The visible result is identical either way: the tap is recorded and nothing else changes on screen.
  return { ...s, taps: { ...s.taps, [personId]: { at: now, unlockAt: ok ? now + 6000 : null } } };
}

export function applyStepBack(s: State, personId: string): State {
  if (pinkyFor(s, personId)) return s;
  const { [personId]: _gone, ...rest } = s.taps;
  return { ...s, taps: rest };
}

function proposal(s: State, p: SamplePerson, id: string, now: number) {
  const pr = unlockProposal({ aPins: s.pins, bPins: p.pins, aHours: toSlots(s.hours), bHours: toSlots(p.hours), venues: venueByKey, seed: id, now: new Date(now) });
  return { venueKey: pr.venueKey, startsAt: pr.startsAt ? pr.startsAt.getTime() : null };
}

function createPinky(s: State, personId: string, now: number): State {
  const them = personById.get(personId)!;
  const id = uid("pk", now);
  const pr = proposal(s, them, id, now);
  const pk: Pinky = { id, personId, createdAt: now, status: "active", ...pr, confMe: false, confThem: false, confMeAt: null, cleared: false, messages: [], moreGranted: false, closeAnswer: null };
  return toast({ ...s, pinkies: [...s.pinkies, pk] }, "n.unlock");
}

const patch = (s: State, id: string, fn: (p: Pinky) => Pinky): State => ({ ...s, pinkies: s.pinkies.map((p) => (p.id === id ? fn(p) : p)) });

export function endPinky(s: State, id: string, marker: boolean): State {
  const pk = s.pinkies.find((p) => p.id === id);
  if (!pk) return s;
  const { [pk.personId]: _t, ...taps } = s.taps;
  // Ending deletes the plan and the chat; the kept record only says "closed".
  return {
    ...s, taps, ended: marker && !s.ended.includes(pk.personId) ? [...s.ended, pk.personId] : s.ended,
    pinkies: s.pinkies.map((p) => (p.id === id ? { ...p, status: "closed", venueKey: null, startsAt: null, messages: [], confMe: false, confThem: false } : p)),
  };
}
export const dismissClosed = (s: State, id: string): State => ({ ...s, pinkies: s.pinkies.filter((p) => p.id !== id) });

export function setDatingOn(s: State, on: boolean): State {
  if (on) return { ...s, datingOn: true };
  // Off ends everything, silently: every tap withdrawn, every plan closed.
  return { ...s, datingOn: false, taps: {}, pinkies: [] };
}
export const blockPerson = (s: State, id: string): State => {
  const pk = s.pinkies.find((p) => p.id === id);
  if (!pk) return s;
  const out = endPinky(s, id, true);
  return { ...out, blocked: [...out.blocked, pk.personId], pinkies: out.pinkies.filter((p) => p.id !== id) };
};

export function confirmPlan(s: State, id: string, now: number): State {
  const pk = s.pinkies.find((p) => p.id === id);
  if (!pk || !pk.venueKey || !pk.startsAt) return s;
  return patch(s, id, (p) => ({ ...p, confMe: true, confMeAt: now, cleared: false }));
}

/** Any change to place or time clears both confirmations. */
export function editPlace(s: State, id: string, venueKey: string): State {
  const pk = s.pinkies.find((p) => p.id === id);
  if (!pk || pk.venueKey === venueKey) return s;
  const had = pk.confMe || pk.confThem;
  return patch(s, id, (p) => ({ ...p, venueKey, confMe: false, confThem: false, confMeAt: null, cleared: had || p.cleared }));
}

export function toggleHour(s: State, key: string, now: number): State {
  const hours = s.hours.includes(key) ? s.hours.filter((h) => h !== key) : [...s.hours, key];
  let next: State = { ...s, hours };
  for (const pk of s.pinkies) {
    if (pk.status !== "active" || (pk.closeAnswer && pk.startsAt)) continue;
    const them = personById.get(pk.personId)!;
    const t = nextSharedSlot(toSlots(hours), toSlots(them.hours), new Date(now));
    const startsAt = t ? t.getTime() : null;
    if (startsAt !== pk.startsAt) {
      const had = pk.confMe || pk.confThem;
      next = patch(next, pk.id, (p) => ({ ...p, startsAt, confMe: false, confThem: false, confMeAt: null, cleared: had || p.cleared }));
    }
  }
  return next;
}

export type SendResult = { ok: true; state: State } | { ok: false; reason: "limit" | Exclude<Scan, "ok"> };
export function sendMessage(s: State, id: string, body: string, now: number): SendResult {
  const pk = s.pinkies.find((p) => p.id === id);
  const text = body.trim();
  if (!pk || pk.status !== "active" || !text) return { ok: false, reason: "too_long" };
  const hasPlan = !!pk.venueKey && !!pk.startsAt;
  const mine = pk.messages.filter((m) => m.from === "me").length;
  if (!chatAllowed({ planHasPlaceAndTime: hasPlan, mySentBeforePlan: mine, extraGranted: pk.moreGranted })) return { ok: false, reason: "limit" };
  const scan = scanMessage(text, pk.confMe && pk.confThem);
  if (scan !== "ok") return { ok: false, reason: scan };
  return { ok: true, state: patch(s, id, (p) => ({ ...p, messages: [...p.messages, { id: uid("m", now), from: "me", body: text, at: now }] })) };
}
export const moreQuestions = (s: State, id: string): State => patch(s, id, (p) => (p.moreGranted ? p : { ...p, moreGranted: true }));
export const answerClose = (s: State, id: string, a: CloseAnswer): State => patch(s, id, (p) => ({ ...p, closeAnswer: a }));
/** End kindly: the preset is the only message (shown to the person who chose it); the plan and chat are deleted like any ending. */
export const endKindly = (s: State, id: string, _preset: keyof typeof END_KINDLY): State => endPinky(s, id, true);

export const closeDue = (pk: Pinky, now: number) => !!pk.startsAt && now >= closeAskAt(new Date(pk.startsAt)).getTime();
export const closeView = (pk: Pinky, now: number): "none" | "ask" | "waiting" | "closed" | "second_date" => {
  if (!pk.startsAt || !closeDue(pk, now)) return "none";
  if (pk.closeAnswer === null) return now >= closeDeadline(new Date(pk.startsAt)).getTime() ? "closed" : "ask";
  const them = personById.get(pk.personId)!.closeAnswer;
  return closeOutcome({ mine: pk.closeAnswer, theirs: them, now: new Date(now), deadline: closeDeadline(new Date(pk.startsAt)) });
};

/** Advance simulated time: unlocks, sample replies and confirmations, stale and close resolution. Pure and idempotent. */
export function tick(s: State, now: number, lang: Lang): State {
  let next = s;
  for (const [personId, t] of Object.entries(s.taps)) {
    if (t.unlockAt !== null && t.unlockAt <= now && !pinkyFor(next, personId) && !next.ended.includes(personId)) next = createPinky(next, personId, now);
  }
  for (const pk of next.pinkies) {
    if (pk.status !== "active") continue;
    const them = personById.get(pk.personId)!;
    if (staleClosed({ createdAt: pk.createdAt, hasPlaceAndTime: !!pk.venueKey && !!pk.startsAt, now })) { next = endPinky(next, pk.id, true); continue; }
    if (pk.confMe && !pk.confThem && pk.confMeAt && now - pk.confMeAt >= 8000) next = toast(patch(next, pk.id, (p) => ({ ...p, confThem: true })), "n.plan");
    const last = pk.messages[pk.messages.length - 1];
    const theirs = pk.messages.filter((m) => m.from === "them").length;
    if (last && last.from === "me" && now - last.at >= 3000 && theirs < REPLIES.length) {
      const r = REPLIES[(them.id.length + theirs) % REPLIES.length];
      next = toast(patch(next, pk.id, (p) => ({ ...p, messages: [...p.messages, { id: uid("r", now), from: "them", body: lang === "th" ? r.th : r.en, at: now }] })), "n.msg");
    }
    const view = closeView(pk, now);
    if (view === "closed") next = endPinky(next, pk.id, true);
    else if (view === "second_date") {
      const pr = proposal(next, them, pk.id + "2", now);
      next = patch(next, pk.id, (p) => ({ ...p, ...pr, confMe: false, confThem: false, confMeAt: null, cleared: false, closeAnswer: null }));
    }
  }
  return next;
}

export { PLACE_SETTINGS, endedKey };

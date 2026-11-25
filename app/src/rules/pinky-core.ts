/**
 * Pinky core: the pure rules, with no framework and no database.
 * Ported from Jurrgun (src/domain/pinky.ts, src/domain/rules.ts,
 * src/domain/pinky-plans.ts). See PINKY-TEMPLATE.md for the full spec.
 *
 * Wire these into your own data layer. Two rules matter most:
 *  - `offered` must never be given anything about the OTHER person;
 *  - `unlocked` is the only place the other person's data is read, and its
 *    result must never change what a non-mutual tapper sees.
 */

// ------------------------------------------------------------ settings --

export const SETTINGS = {
  /** Hours after a shared event ends during which taps are taken. */
  tapWindowHours: 72,
  /** Days after an activity pairing ends during which taps are taken. */
  pairingGraceDays: 7,
  /** Finished shared activities needed before a pairing offers Pinky. */
  minSharedActivities: 2,
  ideasAtATime: 3,
  ideasPerDay: 9,
  /** Show the home-safe check only this close to the date. */
  homeSafeLeadHours: 20,
  noteMax: 280,
  placeMax: 80,
} as const;

export const ENDED_PREFIX = "pinky-ended:";
export const endedKey = (contextKey: string) => `${ENDED_PREFIX}${contextKey}`;
export const pairingKey = (matchId: string) => `buddy:${matchId}`;
/** Store pairs ordered (a < b); always match both orders when querying. */
export const orderedPair = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x]);

// -------------------------------------------------------- eligibility --

export type Person = {
  relationship: string; // "single" | ...
  datingOn: boolean;
  genderIdentity: string | null;
  /** Gender identities this person is open to, or "everyone". */
  openTo: string[] | "everyone" | null;
  orientation?: string | null;
  /** Optional orientation filter (empty or absent = no filter). */
  orientationOpenTo?: string[] | null;
  /** Only open to women. */
  womenOnly?: boolean;
};

/** "Dating is on": the one test used everywhere. Turning it off ends everything. */
export function eligible(p: Pick<Person, "relationship" | "datingOn">): boolean {
  return p.relationship === "single" && p.datingOn;
}

const isWoman = (p: Person) => p.genderIdentity === "woman";

/** Each is open to the other, both ways. */
export function compatible(a: Person, b: Person): boolean {
  const accepts = (openTo: Person["openTo"], identity: string | null) =>
    openTo === "everyone" || (!!identity && Array.isArray(openTo) && openTo.includes(identity));
  const orientationOk = (filter: string[] | null | undefined, theirs: string | null | undefined) =>
    !filter?.length || (!!theirs && filter.includes(theirs));
  const womenOnlyOk = (!a.womenOnly || isWoman(b)) && (!b.womenOnly || isWoman(a));
  return (
    accepts(a.openTo, b.genderIdentity) &&
    accepts(b.openTo, a.genderIdentity) &&
    orientationOk(a.orientationOpenTo, b.orientation) &&
    orientationOk(b.orientationOpenTo, a.orientation) &&
    womenOnlyOk
  );
}

// ------------------------------------------------------------- window --

const HOUR = 3_600_000;

export function eventWindow(endsAt: Date, now = new Date()): "before" | "open" | "closed" {
  const t = now.getTime();
  if (t < endsAt.getTime()) return "before";
  if (t < endsAt.getTime() + SETTINGS.tapWindowHours * HOUR) return "open";
  return "closed";
}

/** When taps on an activity pairing stop being taken: null while it's active. */
export function pairingOpenUntil(p: { state: "active" | "ended"; endedAt: Date | null }): Date | null {
  if (p.state !== "ended") return null;
  return new Date((p.endedAt ?? new Date(0)).getTime() + SETTINGS.pairingGraceDays * 24 * HOUR);
}

// -------------------------------------------------------- offer / unlock --

/**
 * Whether the Pinky row shows for `me` on someone's card. It takes NOTHING
 * about the other person except facts about the shared context, so its
 * presence never leaks their status.
 */
export function offered(
  me: Pick<Person, "relationship" | "datingOn">,
  ctx: { met: boolean; blocked: boolean; ended: boolean; windowOpen: boolean; mutual: boolean; contextOk?: boolean },
): boolean {
  if (!ctx.met || ctx.blocked || ctx.ended || !eligible(me)) return false;
  return ctx.mutual || (ctx.windowOpen && (ctx.contextOk ?? true));
}

/** Every rule for a mutual Pinky. Checked silently, only at the tap. */
export function unlocked(p: {
  taps: [boolean, boolean];
  people: [Person, Person];
  blocked: boolean;
  contextOk: boolean; // both checked in / enough shared activities
  sameWorld: boolean; // e.g. both real or both demo accounts
}): boolean {
  const [a, b] = p.people;
  return p.taps[0] && p.taps[1] && !p.blocked && p.contextOk && p.sameWorld && eligible(a) && eligible(b) && compatible(a, b);
}

/** What the viewer may see. There is deliberately no "they tapped" value. */
export type ViewerState = "none" | "mine" | "mutual";

// -------------------------------------------------------------- ideas --

export type DateIdea = { key: string; kind: string; area: string; place: string; when: string; why: string };

/** mulberry32 seeded from a string: same pair and day, same ideas. */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], next: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Only the overlap of both people's private first-date answers is ever used. */
export function sharedKinds(a: string[] | undefined, b: string[] | undefined): Set<string> {
  const mine = new Set(a ?? []);
  return new Set((b ?? []).filter((k) => mine.has(k)));
}

/**
 * The day's ideas for a pair, in display order, in batches. Each batch has at
 * least one idea that isn't preference-driven and at most (batch - 1) that
 * are, shuffled, so neither person can infer the other's answers.
 * Seed with `${pinkyId}:${YYYY-MM-DD in your app's time zone}`.
 */
export function dayIdeas(seed: string, shared: Set<string>, all: DateIdea[]): DateIdea[] {
  const { ideasAtATime: per, ideasPerDay: cap } = SETTINGS;
  const next = rng(seed);
  const pool = shuffle(all, next);
  const liked = pool.filter((i) => shared.has(i.kind));
  const other = pool.filter((i) => !shared.has(i.kind));
  const out: DateIdea[] = [];
  while (out.length < Math.min(cap, all.length)) {
    const batch: DateIdea[] = [];
    const free = other.shift();
    if (free) batch.push(free);
    while (batch.length < per) {
      const likedIn = batch.filter((x) => shared.has(x.kind)).length;
      const pick = (likedIn < per - 1 ? liked.shift() : undefined) ?? other.shift() ?? liked.shift();
      if (!pick) break;
      batch.push(pick);
    }
    if (!batch.length) break;
    out.push(...shuffle(batch, next));
  }
  return out.slice(0, cap);
}

/** The ideas showing after `presses` of "Other ideas" today (0 = the first batch). */
export const ideaBatch = (day: DateIdea[], presses: number) =>
  day.slice(presses * SETTINGS.ideasAtATime, (presses + 1) * SETTINGS.ideasAtATime);

// --------------------------------------------------------------- plan --

export type Plan = { placeName: string | null; startsAt: Date | null; aConfirmedAt: Date | null; bConfirmedAt: Date | null };

export const bothConfirmed = (p: Plan | null | undefined) => !!p?.aConfirmedAt && !!p?.bConfirmedAt;

/** Apply an edit: a change of place or time clears BOTH confirms. */
export function applyPlanEdit(prev: Plan | null, next: { placeName: string | null; startsAt: Date | null }): Plan {
  const moved = !prev || prev.placeName !== next.placeName || prev.startsAt?.getTime() !== next.startsAt?.getTime();
  return {
    placeName: next.placeName?.slice(0, SETTINGS.placeMax) ?? null,
    startsAt: next.startsAt,
    aConfirmedAt: moved ? null : prev!.aConfirmedAt,
    bConfirmedAt: moved ? null : prev!.bConfirmedAt,
  };
}

export const planIsPast = (p: Plan, now = new Date()) => !!p.startsAt && p.startsAt.getTime() < now.getTime();

/** Offer "ask me if I got home safe" only close to the date (it fires at the next time of day). */
export const homeSafeOffered = (p: Plan, now = new Date()) =>
  !!p.startsAt && !planIsPast(p, now) && p.startsAt.getTime() - now.getTime() <= SETTINGS.homeSafeLeadHours * HOUR;

/** Send the other person one plan notice only if none is unread already. Note edits never notify. */
export const shouldSendPlanNotice = (kind: "plan" | "confirm" | "note", unreadPlanNoticeWaiting: boolean) =>
  kind !== "note" && !unreadPlanNoticeWaiting;

// --------------------------------------------------------- end kindly --

/** Preset goodbyes only; nothing free-typed. */
export const END_KINDLY = {
  thanks: "Thank you for the date. I hope you find the right person.",
  friends: "I'd rather we were friends.",
  not_ready: "I'm not ready right now. I'm sorry.",
} as const;
export type EndKindlyKey = keyof typeof END_KINDLY;
export const isEndKindly = (x: string): x is EndKindlyKey => x in END_KINDLY;

/** Notification text must never name the feature. Use in tests. */
export const NOTIFICATION_LEAK = /\b(date|dating|pinky|romance)\b/i;

// =====================================================================
// Place-first features (PINKY-TEMPLATE.md §10). New: not yet run in
// production anywhere. Suggested starting values below.
// =====================================================================

export const PLACE_SETTINGS = {
  pinsPerPerson: 5,
  minPins: 3,
  countRound: 5,
  countHideBelow: 5,
  requireSharedPlace: false,
  slotMinHours: 2,
  proposeLeadHours: 24,
  proposeHorizonDays: 14,
  /** Local time zone as a fixed UTC offset (Bangkok +7). Use a tz library where there is daylight saving. */
  localOffsetMin: 420,
  prePlanMessages: 6,
  rainThreshold: 0.6,
  maxOpen: 3,
  /** "See them again?" is asked at this local hour the morning after the date. */
  closeAskHour: 10,
  closeWindowHours: 48,
  noShowLimit: 2,
  noShowWindowDays: 60,
  homeSafeEscalateMin: 60,
} as const;

// ----------------------------------------------------- venues and pins --

export type Venue = {
  key: string;
  kind: string;
  area: string;
  /** Only curated public places can be pinned. */
  isPublic: boolean;
  active: boolean;
  outdoor: boolean;
  /** Indoor backup for rain (outdoor venues). */
  backupKey?: string | null;
  /** A partner "safe first-date venue": public, staffed, near transit, late-safe, code phrase trained. */
  safe: boolean;
};

/** Whether `venue` may be pinned by someone who already has `current` pins. */
export function pinAllowed(venue: Venue, current: string[]): boolean {
  return venue.isPublic && venue.active && !current.includes(venue.key) && current.length < PLACE_SETTINGS.pinsPerPerson;
}

/** A map count: rounded down, hidden below the threshold. Never "here now". Null = show nothing. */
export function coarseCount(n: number): number | null {
  const { countRound, countHideBelow } = PLACE_SETTINGS;
  if (n < countHideBelow) return null;
  return Math.floor(n / countRound) * countRound;
}

/**
 * After a mutual unlock only: one place both pinned, picked deterministically
 * (seed with the Pinky id), preferring safe venues. Only the overlap is ever used.
 */
export function sharedPlace(aPins: string[], bPins: string[], venues: Map<string, Venue>, seed: string): string | null {
  const mine = new Set(aPins);
  const both = bPins.filter((k) => mine.has(k) && venues.get(k)?.active).sort();
  if (!both.length) return null;
  const safe = both.filter((k) => venues.get(k)?.safe);
  const from = safe.length ? safe : both;
  return from[Math.floor(rng(seed)() * from.length)];
}

/** The places a mutual pair may see: the overlap only (never the rest of either list). */
export const visibleSharedPins = (aPins: string[], bPins: string[]) => [...sharedKinds(aPins, bPins)].sort();

// ---------------------------------------------------------- open hours --

/** A weekly free window in local time. day: 0 = Sunday. Hours 0–24, end > start. */
export type Slot = { day: number; startHour: number; endHour: number };

const localMidnightUtc = (d: Date) => {
  const off = PLACE_SETTINGS.localOffsetMin * 60_000;
  const local = new Date(d.getTime() + off);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - off;
};

/**
 * The earliest window both are free for at least slotMinHours, starting no
 * sooner than proposeLeadHours and within proposeHorizonDays. Returns only
 * that start time; never either person's week.
 */
export function nextSharedSlot(a: Slot[], b: Slot[], now = new Date()): Date | null {
  const { slotMinHours, proposeLeadHours, proposeHorizonDays, localOffsetMin } = PLACE_SETTINGS;
  const earliest = now.getTime() + proposeLeadHours * HOUR;
  const latest = now.getTime() + proposeHorizonDays * 24 * HOUR;
  for (let i = 0; i <= proposeHorizonDays; i++) {
    const midnight = localMidnightUtc(new Date(now.getTime() + i * 24 * HOUR));
    const day = new Date(midnight + localOffsetMin * 60_000).getUTCDay();
    const starts: number[] = [];
    for (const x of a.filter((s) => s.day === day)) {
      for (const y of b.filter((s) => s.day === day)) {
        const s = Math.max(x.startHour, y.startHour);
        const e = Math.min(x.endHour, y.endHour);
        // Start no earlier than the lead time, rounded up to the hour.
        const leadHour = Math.ceil((earliest - midnight) / HOUR);
        const from = Math.max(s, leadHour);
        if (e - from >= slotMinHours) starts.push(from);
      }
    }
    if (starts.length) {
      const t = midnight + Math.min(...starts) * HOUR;
      if (t <= latest) return new Date(t);
    }
  }
  return null;
}

/** The plan pre-filled at unlock: a proposal with no confirms. Null fields fall back to ideas / manual entry. */
export function unlockProposal(p: { aPins: string[]; bPins: string[]; aHours: Slot[]; bHours: Slot[]; venues: Map<string, Venue>; seed: string; now?: Date }) {
  return {
    venueKey: sharedPlace(p.aPins, p.bPins, p.venues, p.seed),
    startsAt: nextSharedSlot(p.aHours, p.bHours, p.now),
    aConfirmedAt: null,
    bConfirmedAt: null,
  };
}

/** With requireSharedPlace on, one more silent unlock rule. */
export const sharedPlaceOk = (aPins: string[], bPins: string[]) =>
  !PLACE_SETTINGS.requireSharedPlace || aPins.some((k) => bPins.includes(k));

// -------------------------------------------------- pre-plan chat limit --

/** Whether I may send another message. Report and block are never limited (handle them outside chat). */
export function chatAllowed(p: { planHasPlaceAndTime: boolean; mySentBeforePlan: number; extraGranted: boolean }): boolean {
  if (p.planHasPlaceAndTime) return true;
  const cap = PLACE_SETTINGS.prePlanMessages * (p.extraGranted ? 2 : 1);
  return p.mySentBeforePlan < cap;
}

// ------------------------------------------------------------ rain plan --

/** The backup to OFFER (never auto-apply) when rain is likely at the plan's time. A swap clears both confirms. */
export function rainSwap(venue: Venue | undefined, rainChance: number | null): string | null {
  if (!venue?.outdoor || !venue.backupKey || rainChance == null) return null;
  return rainChance >= PLACE_SETTINGS.rainThreshold ? venue.backupKey : null;
}

// ------------------------------------------------------ open-Pinky cap --

/** A new tap is allowed while open/paused Pinkies + my outstanding taps < maxOpen. Depends only on the viewer. */
export const canTap = (open: { pinkies: number; outstandingTaps: number }) =>
  open.pinkies + open.outstandingTaps < PLACE_SETTINGS.maxOpen;

// --------------------------------------------------- ghost-free close --

export type CloseAnswer = "yes" | "no" | "didnt_meet" | null;

/** When "See them again?" is asked: closeAskHour local time on the day after the date. */
export function closeAskAt(startsAt: Date): Date {
  return new Date(localMidnightUtc(startsAt) + 24 * HOUR + PLACE_SETTINGS.closeAskHour * HOUR);
}
export const closeDeadline = (startsAt: Date) => new Date(closeAskAt(startsAt).getTime() + PLACE_SETTINGS.closeWindowHours * HOUR);

/**
 * What one person sees. Both yes resolves at once; anything else resolves for
 * the other person only at the deadline, so "no" and "no answer" look the same,
 * timing included. Whoever says no / didn't meet is closed straight away.
 */
export function closeOutcome(p: { mine: CloseAnswer; theirs: CloseAnswer; now: Date; deadline: Date }): "second_date" | "closed" | "waiting" {
  if (p.mine === "no" || p.mine === "didnt_meet") return "closed";
  if (p.mine === "yes" && p.theirs === "yes") return "second_date";
  if (p.now.getTime() >= p.deadline.getTime()) return "closed";
  return "waiting";
}

/** The one neutral line both get when it closes. Never sent in either person's name. */
export const CLOSE_LINE = "This one's closed. Thank you both for showing up.";

// ------------------------------------------------ showed-up trust ------

export type ShowUp = { reporter: string; about: string; outcome: "came" | "no_show" | "i_cancelled"; at: Date };

/**
 * Quietly lower visibility when noShowLimit DIFFERENT people reported a
 * no-show within the window. Never shown as a score; ages out.
 */
export function noShowLimited(accountId: string, reports: ShowUp[], now = new Date()): boolean {
  const since = now.getTime() - PLACE_SETTINGS.noShowWindowDays * 24 * HOUR;
  const by = new Set(reports.filter((r) => r.about === accountId && r.outcome === "no_show" && r.at.getTime() >= since).map((r) => r.reporter));
  return by.size >= PLACE_SETTINGS.noShowLimit;
}

/** Cancelling at least proposeLeadHours before the date is never a no-show. */
export const cancelIsFine = (cancelledAt: Date, startsAt: Date) =>
  startsAt.getTime() - cancelledAt.getTime() >= PLACE_SETTINGS.proposeLeadHours * HOUR;

// ------------------------------------------- arrival and home-safe --

/** When the person's OWN trusted contact is told, if they opted in and haven't replied. Never the date. */
export const homeSafeEscalateAt = (askedAt: Date) => new Date(askedAt.getTime() + PLACE_SETTINGS.homeSafeEscalateMin * 60_000);

// ---------------------------------------------------------- wingmate --

/** Preset vouches only. Shown to a mutual partner as "A friend vouched: '…'", without the friend's name. */
export const VOUCHES = {
  on_time: "Always on time",
  kind: "Genuinely kind",
  long_walks: "Great company on a long walk",
  funny: "Makes everyone laugh",
} as const;
export type VouchKey = keyof typeof VOUCHES;

// --------------------------------------------------------- memory map --

/** What a kept memory stores: the venue and the month. Never the other person. */
export const memoryOf = (plan: { venueKey: string; startsAt: Date }) => ({
  venueKey: plan.venueKey,
  month: new Date(plan.startsAt.getTime() + PLACE_SETTINGS.localOffsetMin * 60_000).toISOString().slice(0, 7),
});

// =====================================================================
// The four theories carried over from the original app (PINKY-TEMPLATE.md
// §10.13–10.16): stable matching, costly signalling, tit-for-tat and
// optimal stopping.
// =====================================================================

export const THEORY_SETTINGS = {
  tableMin: 4,
  tableMax: 6,
  swapCap: 2000,
  helloOpenHours: 36,
  helloMax: 80,
  reliableLast: 4,
  exploreDates: 3,
  freshEvery: 4,
} as const;

// ------------------------------------------ fair tables (stable matching) --

export type TablePerson = { id: string; interests: string[]; languages: string[] };

/** How much a likes sitting with b: shared interests, plus one for any shared language. Never gender. */
export function affinity(a: TablePerson, b: TablePerson): number {
  const shared = a.interests.filter((x) => b.interests.includes(x)).length;
  const lang = a.languages.some((x) => b.languages.includes(x)) ? 1 : 0;
  return shared + lang;
}

/** A person's happiness at a table: the sum of affinities, minus 3 with no anchor (nobody they share anything with). */
export function happiness(p: TablePerson, table: TablePerson[]): number {
  const others = table.filter((q) => q.id !== p.id);
  const scores = others.map((q) => affinity(p, q));
  return scores.reduce((s, x) => s + x, 0) - (scores.some((x) => x > 0) ? 0 : 3);
}

/** Table sizes for n people: as few tables as fit tableMax, sizes as even as possible. */
export function tableSizes(n: number): number[] {
  if (n <= 0) return [];
  const k = Math.max(1, Math.ceil(n / THEORY_SETTINGS.tableMax));
  return Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));
}

/** Swaps between two people at different tables that would make BOTH happier. 0 = exchange-stable. */
export function blockingSwaps(tables: TablePerson[][]): number {
  let n = 0;
  for (let i = 0; i < tables.length; i++)
    for (let j = i + 1; j < tables.length; j++)
      for (const p of tables[i]) for (const q of tables[j]) if (swapHelpsBoth(tables[i], tables[j], p, q)) n++;
  return n;
}

function swapHelpsBoth(A: TablePerson[], B: TablePerson[], p: TablePerson, q: TablePerson): boolean {
  const A2 = A.filter((x) => x.id !== p.id).concat(q);
  const B2 = B.filter((x) => x.id !== q.id).concat(p);
  return happiness(p, B2) > happiness(p, A) && happiness(q, A2) > happiness(q, B);
}

/**
 * Split people into tables so that no two people at different tables would
 * both rather swap (exchange-stable). Greedy seed, then improving swaps until
 * none is left or swapCap is reached. Exchange-stable splits don't always
 * exist, so `blocking` reports the swaps still left (0 = stable).
 */
export function exchangeStableTables(people: TablePerson[]): { tables: TablePerson[][]; swaps: number; blocking: number } {
  const sizes = tableSizes(people.length);
  const tables: TablePerson[][] = sizes.map(() => []);
  // Greedy seed: most-connected people first, each to the open table they like most.
  const degree = (p: TablePerson) => people.reduce((s, q) => s + (q.id === p.id ? 0 : affinity(p, q)), 0);
  for (const p of [...people].sort((a, b) => degree(b) - degree(a) || a.id.localeCompare(b.id))) {
    let best = -1, bestScore = -Infinity;
    tables.forEach((t, i) => {
      if (t.length >= sizes[i]) return;
      const s = t.reduce((acc, q) => acc + affinity(p, q), 0);
      if (s > bestScore) { bestScore = s; best = i; }
    });
    tables[best].push(p);
  }
  let swaps = 0;
  for (let improved = true; improved && swaps < THEORY_SETTINGS.swapCap; ) {
    improved = false;
    outer: for (let i = 0; i < tables.length; i++)
      for (let j = i + 1; j < tables.length; j++)
        for (const p of tables[i])
          for (const q of tables[j])
            if (swapHelpsBoth(tables[i], tables[j], p, q)) {
              tables[i] = tables[i].filter((x) => x.id !== p.id).concat(q);
              tables[j] = tables[j].filter((x) => x.id !== q.id).concat(p);
              swaps++;
              improved = true;
              break outer;
            }
  }
  return { tables, swaps, blocking: blockingSwaps(tables) };
}

// ---------------------------------- say hi first (costly signalling) --

/** "Say hi first" is open from helloOpenHours before a table until it ends. */
export function helloOpen(table: { startsAt: Date; endsAt: Date }, now = new Date()): boolean {
  return now.getTime() >= table.startsAt.getTime() - THEORY_SETTINGS.helloOpenHours * HOUR && now.getTime() < table.endsAt.getTime();
}

/** One line, whitespace collapsed and capped; empty clears it. */
export function cleanHello(raw: string): string | null {
  const line = raw.replace(/\s+/g, " ").trim().slice(0, THEORY_SETTINGS.helloMax).trim();
  return line || null;
}

// ------------------------------------------ showing up pays (tit-for-tat) --

/**
 * Reliable: turned up to the last reliableLast plans or tables (newest first),
 * or a host or date privately said "again". Never displayed.
 */
export function reliable(history: ("came" | "no_show" | "cancelled_late" | "cancelled_early")[], againYes = false): boolean {
  if (againYes) return true;
  const recent = history.filter((h) => h !== "cancelled_early").slice(0, THEORY_SETTINGS.reliableLast);
  return recent.length === THEORY_SETTINGS.reliableLast && recent.every((h) => h === "came");
}

export type WaitlistEntry = { id: string; priority: boolean; reliable: boolean; joinedAt: Date };

/** Freed seats go to: priority kept (not lost to no-shows), then reliable, then first come, first served. */
export function waitlistOrder(entries: WaitlistEntry[]): WaitlistEntry[] {
  return entries.slice().sort((a, b) => {
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    if (a.reliable !== b.reliable) return a.reliable ? -1 : 1;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });
}

// ------------------------------- explore, then lean in (optimal stopping) --

export type IdeaMode = "explore" | "lean" | "fresh";

/** Explore for the first exploreDates dates; then lean in, except one fresh week in every freshEvery. */
export function ideaMode(datesHad: number, weekNumber: number): IdeaMode {
  if (datesHad < THEORY_SETTINGS.exploreDates) return "explore";
  return weekNumber % THEORY_SETTINGS.freshEvery === 0 ? "fresh" : "lean";
}

/**
 * The kinds of date that `dayIdeas` should favour for this person in this mode:
 *  - explore: shared kinds they haven't tried yet (else all shared kinds);
 *  - lean: shared kinds plus kinds that ended in a mutual "again";
 *  - fresh: kinds they've never tried, so the favoured slots go to something new.
 * Read only from the person's own private history; never shown.
 */
export function favouredKinds(mode: IdeaMode, p: { shared: Set<string>; worked: string[]; tried: string[]; allKinds: string[] }): Set<string> {
  const untried = (k: string) => !p.tried.includes(k);
  if (mode === "explore") {
    const fresh = [...p.shared].filter(untried);
    return new Set(fresh.length ? fresh : p.shared);
  }
  if (mode === "lean") return new Set([...p.shared, ...p.worked]);
  return new Set(p.allKinds.filter(untried));
}

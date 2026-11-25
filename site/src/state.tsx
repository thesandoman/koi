import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { translate, type Lang } from "./i18n";
import { PARTS, SAM_HOURS, SAM_PINS, START, VENUES } from "./data";

export type Answer = "yes" | "no" | "didnt" | null;
type S = {
  lang: Lang; pins: string[]; hintMax: boolean; pinNonce: number;
  youHooked: boolean; samHooks: boolean;
  hours: string[]; place: string | null; confYou: boolean; confSam: boolean; cleared: boolean; planKey: string | null;
  answer: Answer; deadline: boolean; viewer: "you" | "sam"; step: number;
};
type A =
  | { type: "pin"; id: string } | { type: "hook" } | { type: "stepBack" } | { type: "sam"; on: boolean } | { type: "friends" }
  | { type: "hour"; key: string } | { type: "place"; id: string } | { type: "confYou" } | { type: "confSam" }
  | { type: "answer"; a: Answer } | { type: "skip48" } | { type: "resetClose" }
  | { type: "viewer"; v: "you" | "sam" } | { type: "step"; n: number } | { type: "lang"; l: Lang };

export const sharedOf = (pins: string[]) => pins.filter((id) => SAM_PINS.has(id)).sort();

export function proposedTime(hours: string[], now = new Date()): Date | null {
  const bkk = new Date(now.getTime() + 7 * 3600e3);
  const y = bkk.getUTCFullYear(), m = bkk.getUTCMonth(), d = bkk.getUTCDate();
  const mine = new Set(hours);
  for (let i = 0; i <= 14; i++) {
    const dayUtc = Date.UTC(y, m, d + i);
    const wd = new Date(dayUtc).getUTCDay();
    for (const p of PARTS) {
      const k = `${wd}-${p}`;
      if (!mine.has(k) || !SAM_HOURS.has(k)) continue;
      const start = dayUtc + START[p] * 3600e3 - 7 * 3600e3;
      if (start >= now.getTime() + 24 * 3600e3) return new Date(start);
    }
  }
  return null;
}

function initialLang(): Lang {
  try { const s = localStorage.getItem("koi-lang"); if (s === "th" || s === "en") return s; } catch { /* storage may be blocked */ }
  return (navigator.language || "en").toLowerCase().startsWith("th") ? "th" : "en";
}
const init = (): S => ({
  lang: "en", pins: [], hintMax: false, pinNonce: 0, youHooked: false, samHooks: false,
  hours: [], place: null, confYou: false, confSam: false, cleared: false, planKey: null,
  answer: null, deadline: false, viewer: "you", step: 0,
});

function base(s: S, a: A): S {
  switch (a.type) {
    case "pin":
      if (s.pins.includes(a.id)) return { ...s, pins: s.pins.filter((p) => p !== a.id), hintMax: false };
      if (s.pins.length >= 3) return { ...s, hintMax: true };
      return { ...s, pins: [...s.pins, a.id], hintMax: false, pinNonce: s.pinNonce + 1 };
    case "hook": return { ...s, youHooked: true };
    case "stepBack": return { ...s, youHooked: false };
    case "sam": return { ...s, samHooks: a.on };
    case "friends": return { ...s, youHooked: false, samHooks: false };
    case "hour": return { ...s, hours: s.hours.includes(a.key) ? s.hours.filter((h) => h !== a.key) : [...s.hours, a.key] };
    case "place": return { ...s, place: a.id };
    case "confYou": return { ...s, confYou: true, cleared: false };
    case "confSam": return { ...s, confSam: true };
    case "answer": return { ...s, answer: a.a };
    case "skip48": return { ...s, deadline: true };
    case "resetClose": return { ...s, answer: null, deadline: false };
    case "viewer": return { ...s, viewer: a.v };
    case "step": return { ...s, step: a.n };
    case "lang": return { ...s, lang: a.l };
  }
}

// Any change to place or time clears both confirmations.
function reduce(s: S, a: A): S {
  const n = base(s, a);
  const mutual = n.youHooked && n.samHooks;
  if (!mutual) return { ...n, place: null, confYou: false, confSam: false, cleared: false, planKey: null };
  const shared = sharedOf(n.pins);
  const options = shared.length ? shared : VENUES.map((v) => v.id);
  const place = n.place && options.includes(n.place) ? n.place : shared[0] ?? null;
  const key = `${place}|${proposedTime(n.hours)?.getTime() ?? ""}`;
  const changed = n.planKey !== null && key !== n.planKey && (n.confYou || n.confSam);
  return { ...n, place, planKey: key, confYou: changed ? false : n.confYou, confSam: changed ? false : n.confSam, cleared: changed ? true : n.cleared };
}

type Ctx = {
  s: S; dispatch: Dispatch<A>; t: (k: string, v?: Record<string, string | number>) => string;
  mutual: boolean; shared: string[]; when: Date | null; locale: string;
};
const KoiCtx = createContext<Ctx | null>(null);

export function KoiProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reduce, undefined, init);
  useEffect(() => { dispatch({ type: "lang", l: initialLang() }); }, []);
  useEffect(() => {
    document.documentElement.lang = s.lang;
    try { localStorage.setItem("koi-lang", s.lang); } catch { /* ignore */ }
  }, [s.lang]);
  const value = useMemo<Ctx>(() => ({
    s, dispatch, t: (k, v) => translate(s.lang, k, v),
    mutual: s.youHooked && s.samHooks, shared: sharedOf(s.pins), when: proposedTime(s.hours),
    locale: s.lang === "th" ? "th-TH-u-ca-gregory" : "en-GB",
  }), [s]);
  return <KoiCtx.Provider value={value}>{children}</KoiCtx.Provider>;
}
export function useKoi() {
  const c = useContext(KoiCtx);
  if (!c) throw new Error("useKoi outside provider");
  return c;
}
export const fmtTime = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(d);

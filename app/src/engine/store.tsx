import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CloseAnswer } from "@/rules/pinky-core";
import { translate, type Lang } from "@/i18n";
import type { Gender } from "@/data";
import * as L from "./logic";

type Action =
  | { type: "loaded"; state: Partial<L.State> }
  | { type: "set"; patch: Partial<L.State> }
  | { type: "fn"; fn: (s: L.State) => L.State };

const KEY = "koi-prototype-v1";
const reducer = (s: L.State, a: Action): L.State =>
  a.type === "loaded" ? { ...s, ...a.state, loaded: true } : a.type === "set" ? { ...s, ...a.patch } : a.fn(s);

export type Api = {
  s: L.State; now: () => number; t: (k: string, v?: Record<string, string | number>) => string;
  set: (p: Partial<L.State>) => void;
  pin: (key: string) => "ok" | "limit";
  hook: (personId: string) => void; stepBack: (personId: string) => void;
  confirm: (id: string) => void; place: (id: string, key: string) => void; hour: (key: string) => void;
  send: (id: string, body: string) => L.SendResult extends infer R ? Exclude<R, { ok: true }> | { ok: true } : never;
  more: (id: string) => void; friends: (id: string) => void; kindly: (id: string) => void; block: (id: string) => void; report: (personId: string) => void;
  answer: (id: string, a: CloseAnswer) => void; dismiss: (id: string) => void;
  dating: (on: boolean) => void; skipDay: () => void; reset: () => void;
  setGender: (g: Gender) => void;
};
const Ctx = createContext<Api | null>(null);

export function KoiProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, undefined, L.initialState);
  const ref = useRef(s);
  ref.current = s;
  const now = useCallback(() => Date.now() + ref.current.offset, []);
  const fn = useCallback((f: (s: L.State) => L.State) => dispatch({ type: "fn", fn: f }), []);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => dispatch({ type: "loaded", state: raw ? JSON.parse(raw) : {} })).catch(() => dispatch({ type: "loaded", state: {} }));
  }, []);
  useEffect(() => {
    if (!s.loaded) return;
    const { loaded, toast, ...rest } = s;
    const id = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(rest)).catch(() => {}); }, 300);
    return () => clearTimeout(id);
  }, [s]);
  useEffect(() => {
    const id = setInterval(() => fn((st) => L.tick(st, Date.now() + st.offset, st.lang)), 1000);
    return () => clearInterval(id);
  }, [fn]);

  const api = useMemo<Api>(() => ({
    s, now, t: (k, v) => translate(s.lang, k, v),
    set: (patch) => dispatch({ type: "set", patch }),
    pin: (key) => {
      const cur = ref.current.pins;
      if (cur.includes(key)) { fn((st) => ({ ...st, pins: st.pins.filter((p) => p !== key) })); return "ok"; }
      if (cur.length >= 5) return "limit";
      fn((st) => ({ ...st, pins: [...st.pins, key] }));
      return "ok";
    },
    hook: (id) => fn((st) => L.applyTap(st, id, Date.now() + st.offset)),
    stepBack: (id) => fn((st) => L.applyStepBack(st, id)),
    confirm: (id) => fn((st) => L.confirmPlan(st, id, Date.now() + st.offset)),
    place: (id, key) => fn((st) => L.editPlace(st, id, key)),
    hour: (key) => fn((st) => L.toggleHour(st, key, Date.now() + st.offset)),
    send: (id, body) => {
      const r = L.sendMessage(ref.current, id, body, Date.now() + ref.current.offset);
      if (r.ok) { fn(() => r.state); return { ok: true as const, state: r.state }; }
      return r;
    },
    more: (id) => fn((st) => L.moreQuestions(st, id)),
    friends: (id) => fn((st) => L.endPinky(st, id, true)),
    kindly: (id) => fn((st) => L.endKindly(st, id, "thanks")),
    block: (id) => fn((st) => L.blockPerson(st, id)),
    report: (personId) => fn((st) => ({ ...st, reported: st.reported.includes(personId) ? st.reported : [...st.reported, personId] })),
    answer: (id, a) => fn((st) => L.answerClose(st, id, a)),
    dismiss: (id) => fn((st) => L.dismissClosed(st, id)),
    dating: (on) => fn((st) => L.setDatingOn(st, on)),
    skipDay: () => fn((st) => ({ ...st, offset: st.offset + 86_400_000 })),
    reset: () => { AsyncStorage.removeItem(KEY).catch(() => {}); dispatch({ type: "set", patch: { ...L.initialState(), loaded: true } }); },
    setGender: (g) => dispatch({ type: "set", patch: { gender: g } }),
  }), [s, now, fn]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export function useKoi(): Api {
  const c = useContext(Ctx);
  if (!c) throw new Error("useKoi outside KoiProvider");
  return c;
}
export type { Lang };

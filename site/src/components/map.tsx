import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { VENUES } from "@/data";
import { useKoi } from "@/state";
import { Btn } from "@/components/ui/button";
import { goTo } from "@/lib/scroll";

/** Wide pond-water ripple, like a koi surfacing. Mounted briefly at a point. */
export function Ripple({ x, y, tone = "leaf" }: { x: string; y: string; tone?: "leaf" | "rose" }) {
  return (
    <span aria-hidden className="pointer-events-none absolute z-0" style={{ left: x, top: y }}>
      {[0, 0.16, 0.32].map((d) => (
        <motion.span key={d} initial={{ scale: 0.1, opacity: 0.55 }} animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 1.5, delay: d, ease: [0.16, 1, 0.3, 1] }}
          className={cn("absolute -left-24 -top-24 size-48 rounded-full border-2", tone === "leaf" ? "border-leaf" : "border-primary")} />
      ))}
    </span>
  );
}

export function MapArt({ labels = true }: { labels?: boolean }) {
  return (
    <svg viewBox="0 0 500 700" className="absolute inset-0 size-full" aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
      <g className="fill-leaf-soft">
        <ellipse cx="330" cy="486" rx="62" ry="38" /><ellipse cx="300" cy="86" rx="64" ry="26" />
        <ellipse cx="238" cy="232" rx="30" ry="18" />
      </g>
      <g fill="none" className="stroke-border" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9">
        <path d="M230 300 C320 315 400 340 500 365" /><path d="M260 130 C275 220 290 320 300 420 S340 600 380 700" />
        <path d="M20 470 C120 450 220 440 320 446" /><path d="M300 150 C360 150 420 140 500 110" />
      </g>
      <path id="river" d="M150 0 C172 120 120 220 140 330 S90 470 140 560 S212 650 190 700" fill="none" className="stroke-muted-foreground/25" strokeWidth="40" strokeLinecap="round" />
      {labels && (
        <g className="fill-muted-foreground" fontFamily="Inter Koi, Noto Thai Koi, sans-serif" fontWeight="600">
          <text fontSize="13" letterSpacing="2.2"><textPath href="#river" startOffset="45%">Chao Phraya</textPath></text>
          <text x="150" y="262" fontSize="14" opacity=".75">Siam</text>
          <text x="396" y="388" fontSize="14" opacity=".75">Thonglor</text>
          <text x="22" y="350" fontSize="14" opacity=".75">Old Town</text>
          <text x="336" y="660" fontSize="14" opacity=".75">Silom</text>
        </g>
      )}
    </svg>
  );
}

function PinGlyph({ on }: { on: boolean }) {
  return (
    <motion.svg key={on ? "on" : "off"} viewBox="122 7 28 37" aria-hidden className="h-9 w-7 overflow-visible"
      initial={on ? { y: -18, scale: 0.92 } : false} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 13 }}>
      <path d="M136 42 C128 32 124 27 124 21 A12 12 0 1 1 148 21 C148 27 144 32 136 42 Z"
        className={cn("transition-colors duration-150", on ? "fill-leaf stroke-leaf" : "fill-card stroke-muted-foreground")} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="136" cy="21" r="4.5" className={on ? "fill-card" : "fill-muted-foreground"} />
    </motion.svg>
  );
}

export function MapScreen() {
  const { s, dispatch, t, mutual, shared } = useKoi();
  const [ripples, setRipples] = useState<{ id: number; x: string; y: string }[]>([]);
  const name = (v: (typeof VENUES)[number]) => (s.lang === "th" ? v.th : v.en);

  useEffect(() => {
    if (!s.pinNonce) return;
    const last = s.pins[s.pins.length - 1];
    const v = VENUES.find((x) => x.id === last);
    if (!v) return;
    const id = s.pinNonce;
    setRipples((r) => [...r, { id, x: `${(v.x / 500) * 100}%`, y: `${(v.y / 700) * 100}%` }]);
    const tm = setTimeout(() => setRipples((r) => r.filter((q) => q.id !== id)), 2200);
    return () => clearTimeout(tm);
  }, [s.pinNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col gap-3 px-3.5 pb-4 pt-12">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="font-heading text-[17px] font-bold leading-tight">{t("map.sheet")}</h3>
        <p className="text-xs font-semibold text-muted-foreground" aria-live="polite">{t("map.count", { n: s.pins.length })}</p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-border bg-card" role="group" aria-label={t("map.title")}>
        <div className="absolute inset-0 m-auto aspect-[500/700] h-full max-w-full">
          <MapArt />
          {ripples.map((r) => <Ripple key={r.id} x={r.x} y={r.y} />)}
          {VENUES.map((v) => {
            const on = s.pins.includes(v.id);
            const both = mutual && on && shared.includes(v.id);
            return (
              <button key={v.id} type="button" aria-pressed={on} onClick={() => dispatch({ type: "pin", id: v.id })}
                aria-label={t(on ? "map.unpin" : "map.pin", { name: name(v) })}
                className="group absolute z-10 grid h-11 w-11 -translate-x-1/2 -translate-y-full place-items-end justify-center pb-0.5"
                style={{ left: `${(v.x / 500) * 100}%`, top: `${(v.y / 700) * 100}%` }}>
                <span className={cn("pointer-events-none absolute bottom-full left-1/2 z-20 mb-0.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-background transition-opacity",
                  on ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>{name(v)}</span>
                <span className={cn(both && "[&_path]:fill-primary [&_path]:stroke-primary [&_circle]:fill-card")}><PinGlyph on={on} /></span>
              </button>
            );
          })}
        </div>
      </div>

      <ul className="-mx-3.5 flex snap-x gap-2 overflow-x-auto px-3.5 pb-1" aria-label="Places">
        {VENUES.map((v) => {
          const on = s.pins.includes(v.id);
          return (
            <li key={v.id} className="snap-start">
              <button type="button" aria-pressed={on} onClick={() => dispatch({ type: "pin", id: v.id })}
                className={cn("min-h-11 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                  on ? "border-leaf bg-leaf-soft text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
                {name(v)}
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence initial={false}>
        {s.pins.length >= 3 && (
          <motion.div key="next" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            <Btn variant="primary" className="w-full" onClick={() => goTo("step-tap")}>{t("map.next")}</Btn>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

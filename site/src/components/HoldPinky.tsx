import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useKoi } from "@/state";

const HOLD_MS = 800;
const R = 58, C = 2 * Math.PI * R;

/**
 * Press and hold to hook a pinky. A ring fills while you hold; let go early and it drains.
 * Anyone can use it: Enter or a screen reader's activation completes it at once, and a mouse can click twice instead of holding.
 */
export function HoldPinky({ label, hint, done, tone = "rose", onComplete }: { label: string; hint: string; done: string; tone?: "rose" | "leaf"; onComplete: () => void }) {
  const { t } = useKoi();
  const reduce = useReducedMotion();
  const p = useMotionValue(0);
  const dash = useTransform(p, (v) => C * (1 - v));
  const ctl = useRef<ReturnType<typeof animate> | null>(null);
  const finished = useRef(false);
  const lastClick = useRef(0);
  const [phase, setPhase] = useState<"idle" | "holding" | "tip" | "done">("idle");
  const color = tone === "rose" ? "var(--rose)" : "var(--leaf)";
  const ink = tone === "rose" ? "var(--on-rose)" : "var(--on-leaf)";

  useEffect(() => () => ctl.current?.stop(), []);

  const complete = () => {
    if (finished.current) return;
    finished.current = true;
    ctl.current?.stop();
    p.set(1);
    setPhase("done");
    onComplete();
  };
  const start = () => {
    if (finished.current) return;
    setPhase("holding");
    ctl.current = animate(p, 1, { duration: HOLD_MS / 1000, ease: "linear", onComplete: complete });
  };
  const stop = () => {
    if (finished.current) return;
    ctl.current?.stop();
    ctl.current = animate(p, 0, { duration: 0.22 });
    setPhase((x) => (x === "holding" ? "tip" : x));
  };
  const onClick = (e: React.MouseEvent) => {
    if (finished.current) return;
    if (e.detail === 0) return complete(); // keyboard or assistive-technology activation
    const now = Date.now();
    if (now - lastClick.current < 1500) return complete();
    lastClick.current = now;
    setPhase("tip");
  };
  const text = phase === "done" ? done : phase === "holding" ? t("hold.keep") : phase === "tip" ? t("hold.tip") : hint;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button" aria-label={label} aria-describedby="hold-hint" disabled={phase === "done"}
        onPointerDown={(e) => { if (e.pointerType === "mouse" && e.button !== 0) return; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); start(); }}
        onPointerUp={stop} onPointerCancel={stop} onClick={onClick}
        onKeyDown={(e) => { if ((e.key === " ") && !e.repeat) { e.preventDefault(); start(); } }} onKeyUp={(e) => { if (e.key === " ") stop(); }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        className="relative grid size-[8.25rem] touch-none select-none place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus)]"
      >
        <svg viewBox="0 0 132 132" className="absolute inset-0 size-full" aria-hidden>
          <circle cx="66" cy="66" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
          <motion.circle cx="66" cy="66" r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} style={{ strokeDashoffset: dash }} transform="rotate(-90 66 66)" />
          <circle cx="66" cy="66" r="46" fill={phase === "done" ? color : "var(--card)"} />
          <path d="M52 44 V70 A10 10 0 0 0 72 70 V62" stroke={phase === "done" ? ink : "var(--ink)"} strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M80 88 V62 A10 10 0 0 0 60 62 V70" stroke={phase === "done" ? ink : color} strokeWidth="6" strokeLinecap="round" fill="none" />
        </svg>
      </motion.button>
      <p id="hold-hint" role="status" className="min-h-9 max-w-[18ch] text-center text-[13px] leading-snug text-muted-foreground">{text}</p>
    </div>
  );
}

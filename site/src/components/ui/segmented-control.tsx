"use client";
// Adapted from "Segmented Control" by uibrik on 21st.dev (free component).

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MotionConfig, motion } from "motion/react";

export type SegmentedOption = string | { value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean };
export type SegmentedControlProps = {
  options: readonly SegmentedOption[];
  value?: string; defaultValue?: string; onChange?: (value: string) => void;
  size?: "sm" | "md" | "lg"; equalWidth?: boolean; draggable?: boolean; duration?: number; label?: string; className?: string;
};
const SIZES = {
  sm: { bar: "h-8 p-0.5 text-[13px]", seg: "px-3 gap-1.5", radius: 10 },
  md: { bar: "h-9 p-[3px] text-sm", seg: "px-3.5 gap-1.5", radius: 12 },
  lg: { bar: "h-[3.25rem] p-1 text-[15px]", seg: "px-4 gap-2", radius: 14 },
} as const;
type Norm = { value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean };
const normalise = (o: SegmentedOption): Norm => (typeof o === "string" ? { value: o, label: o } : o);

export function SegmentedControl({ options, value, defaultValue, onChange, size = "md", equalWidth = false, draggable = true, duration = 0.35, label, className }: SegmentedControlProps) {
  const items = options.map(normalise);
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const selected = value ?? inner;
  const selectedIndex = Math.max(0, items.findIndex((o) => o.value === selected));
  const [held, setHeld] = useState<number | null>(null);
  const shown = held ?? selectedIndex;
  const [boxes, setBoxes] = useState<{ x: number; y: number; w: number; h: number }[]>([]);
  const scrubbed = useRef(false);
  const bar = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = SIZES[size];

  const choose = (i: number) => {
    const o = items[i];
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    if (o.value !== selected) onChange?.(o.value);
  };
  const count = items.length;
  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const read = () => setBoxes(refs.current.slice(0, count).map((b) => ({ x: b?.offsetLeft ?? 0, y: b?.offsetTop ?? 0, w: b?.offsetWidth ?? 0, h: b?.offsetHeight ?? 0 })));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    refs.current.forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
  }, [count, size, equalWidth]);

  const indexAt = (clientX: number) => {
    let best = selectedIndex, dist = Infinity;
    refs.current.forEach((b, i) => {
      if (!b || items[i]?.disabled) return;
      const r = b.getBoundingClientRect();
      const d = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    scrubbed.current = false;
    if (e.button !== 0 || items[i].disabled) return;
    if (i !== selectedIndex || !draggable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setHeld(i);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (held === null) return;
    const i = indexAt(e.clientX);
    if (i !== held) setHeld(i);
  };
  const release = (commit: boolean) => {
    if (held === null) return;
    if (commit) choose(held);
    scrubbed.current = true;
    setHeld(null);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    let to = -1;
    if (e.key === "Home") to = items.findIndex((o) => !o.disabled);
    else if (e.key === "End") to = items.length - 1 - [...items].reverse().findIndex((o) => !o.disabled);
    else if (step) {
      for (let k = 1; k <= items.length; k++) {
        const i = (selectedIndex + step * k + items.length) % items.length;
        if (!items[i].disabled) { to = i; break; }
      }
    }
    if (to < 0 || to === selectedIndex) return;
    e.preventDefault();
    choose(to);
    refs.current[to]?.focus();
  };

  const box = boxes[shown];
  const pressed = held !== null;
  return (
    <MotionConfig reducedMotion="user">
      <div ref={bar} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}
        className={cn("relative isolate w-fit select-none items-stretch bg-muted", equalWidth ? "inline-grid auto-cols-fr grid-flow-col" : "inline-flex", s.bar, className)}
        style={{ borderRadius: s.radius + (size === "sm" ? 2 : size === "md" ? 3 : 4) }}>
        {box && (
          <motion.span aria-hidden className="absolute left-0 -z-10 bg-card shadow-sm" style={{ top: box.y, height: box.h, borderRadius: s.radius }}
            initial={false} animate={{ x: box.x, width: box.w, scale: pressed ? 0.95 : 1 }}
            transition={{ x: { type: "spring", duration, bounce: 0 }, width: { type: "spring", duration, bounce: 0 }, scale: { type: "spring", duration: 0.25, bounce: 0 } }} />
        )}
        {items.map((o, i) => {
          const on = i === selectedIndex;
          return (
            <button key={o.value} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} disabled={o.disabled}
              tabIndex={on ? 0 : -1}
              onClick={() => { if (scrubbed.current) scrubbed.current = false; else choose(i); }}
              onPointerDown={(e) => onPointerDown(e, i)} onPointerMove={onPointerMove}
              onPointerUp={() => release(true)} onPointerCancel={() => release(false)}
              className={cn("relative flex cursor-pointer items-center justify-center whitespace-nowrap font-medium outline-none transition-[color,opacity] duration-200",
                "focus-visible:ring-2 focus-visible:ring-foreground/40 disabled:cursor-default disabled:opacity-40",
                i === shown ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                !box && on && "bg-card", s.seg)}
              style={{ borderRadius: s.radius, touchAction: on && draggable ? "none" : undefined }}>
              {o.icon && <span className="grid place-items-center [&_svg]:size-4">{o.icon}</span>}
              {o.label}
            </button>
          );
        })}
      </div>
    </MotionConfig>
  );
}

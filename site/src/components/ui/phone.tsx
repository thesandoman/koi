"use client";
// Adapted from "Phone Scroll Hero" by ruixen.ui on 21st.dev: tilted phone that flattens and climbs as you scroll.

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function PhoneFrame({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-[9/19.5] w-[max(13.8rem,min(86vw,calc(min(40rem,100dvh-9.5rem)*0.4615)))]", className)}>
      <span aria-hidden className="absolute -left-[2px] top-[16%] h-7 w-[3px] rounded-l-sm bg-muted-foreground/40" />
      <span aria-hidden className="absolute -left-[2px] top-[24%] h-11 w-[3px] rounded-l-sm bg-muted-foreground/40" />
      <span aria-hidden className="absolute -right-[2px] top-[22%] h-14 w-[3px] rounded-r-sm bg-muted-foreground/40" />
      <div className="h-full w-full rounded-[2.75rem] border border-border bg-muted p-[0.4rem] shadow-phone">
        <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-background ring-1 ring-inset ring-border/70">
          <div aria-hidden className="absolute left-1/2 top-2.5 z-20 h-[1.4rem] w-[5.2rem] -translate-x-1/2 rounded-full bg-black" />
          {children}
        </div>
      </div>
    </div>
  );
}

export function PhoneScrollHero({ titleComponent, children, overlap = 14, tilt = 24, className }: {
  titleComponent: React.ReactNode; children?: React.ReactNode; overlap?: number; tilt?: number; className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const progress = useMotionValue(0);

  useIsoLayoutEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      progress.set(Math.min(1, Math.max(0, -rect.top / travel)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduced, progress]);

  const rotateX = useTransform(progress, [0, 1], [tilt, 0]);
  const scale = useTransform(progress, [0, 1], [0.93, 1]);
  const titleY = useTransform(progress, [0, 1], [0, -28]);
  const phoneY = useTransform(progress, [0, 1], ["0%", `-${overlap}%`]);
  const still = Boolean(reduced);

  return (
    <section ref={ref} aria-label="Hero" className={cn("relative flex w-full items-start justify-center overflow-x-clip px-3 pt-20 md:px-8", className)}>
      <div className="w-full" style={{ perspective: "1400px" }}>
        <motion.div style={{ y: still ? 0 : titleY }} className="relative z-0 mx-auto max-w-5xl px-2 text-center">{titleComponent}</motion.div>
        <motion.div style={{ y: still ? 0 : phoneY, rotateX: still ? 0 : rotateX, scale: still ? 1 : scale, transformOrigin: "50% 100%" }} className="relative z-10 mt-1">
          {children}
        </motion.div>
      </div>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AREAS, DAY_ORDER, PARTS } from "@/data";
import { useKoi } from "@/state";
import { Btn, LinkBtn } from "@/components/ui/button";
import { PhoneFrame, PhoneScrollHero } from "@/components/ui/phone";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MapArt, MapScreen } from "@/components/map";
import { CloseScreen, PlanScreen, TapScreen } from "@/components/screens";

/* ---------- header ---------- */
export function Header() {
  const { s, dispatch, t } = useKoi();
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 rounded-full border border-border bg-background py-1.5 pl-5 pr-1.5 shadow-[0_1px_2px_rgb(0_0_0/.06),0_8px_24px_-12px_rgb(0_0_0/.25)]">
        <a href="#top" aria-label="Koi" className="shrink-0">
          <picture>
            <source media="(prefers-color-scheme: dark)" srcSet="/brand/koi-wordmark-dark.svg" />
            <img src="/brand/koi-wordmark-light.svg" alt="Koi" width="76" height="55" className="h-9 w-auto" />
          </picture>
        </a>
        <div className="flex items-center gap-2">
          <SegmentedControl size="lg" label="Language" value={s.lang} onChange={(v) => dispatch({ type: "lang", l: v === "th" ? "th" : "en" })}
            options={[{ value: "en", label: "EN" }, { value: "th", label: <span lang="th">ไทย</span> }]} />
          <LinkBtn variant="primary" href="#join" className="min-h-[3.25rem] px-4 sm:px-5">{t("nav.join")}</LinkBtn>
        </div>
      </div>
    </header>
  );
}

/* ---------- hero ---------- */
export function Hero() {
  const { s, t } = useKoi();
  const n = s.pins.length;
  const hint = s.hintMax ? t("hero.hintMax") : n === 0 ? t("hero.hint0") : n < 3 ? t("hero.hintN", { n, r: 3 - n }) : t("hero.hint3");
  return (
    <PhoneScrollHero
      titleComponent={
        <>
          <h1 className="font-heading text-[clamp(3.25rem,11vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.035em]">{t("hero.h1")}</h1>
          <p className="mx-auto mt-4 max-w-[34ch] text-lg text-foreground sm:text-xl">{t("hero.lede")}</p>
          <p aria-live="polite" className="mx-auto mt-3 min-h-[2.9em] max-w-[44ch] text-[15px] font-medium text-muted-foreground">{hint}</p>
        </>
      }
    >
      <PhoneFrame><MapScreen /></PhoneFrame>
      <p className="mx-auto mt-6 max-w-[40ch] text-center text-sm text-muted-foreground">{t("map.fine")}</p>
    </PhoneScrollHero>
  );
}

/* ---------- how it works ---------- */
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="group inline-flex min-h-11 items-center gap-3 text-left font-semibold">
      <span className={cn("relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors duration-200", on ? "bg-leaf" : "bg-border")}>
        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={cn("absolute top-[3px] size-6 rounded-full bg-card shadow", on ? "right-[3px]" : "left-[3px]")} />
      </span>
      {label}
    </button>
  );
}

function HoursGrid() {
  const { s, dispatch, t, locale } = useKoi();
  const day = (wd: number, long = false) => new Intl.DateTimeFormat(locale, { weekday: long ? "long" : "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + wd)));
  return (
    <table className="border-separate border-spacing-1" aria-label={t("plan.p2")}>
      <thead><tr><td />{PARTS.map((p) => <th key={p} scope="col" className="px-1 pb-1 text-xs font-semibold text-muted-foreground">{t(`day.${p}`)}</th>)}</tr></thead>
      <tbody>
        {DAY_ORDER.map((wd) => (
          <tr key={wd}>
            <th scope="row" className="pr-2 text-left text-xs font-semibold text-muted-foreground">{day(wd)}</th>
            {PARTS.map((p) => {
              const k = `${wd}-${p}`;
              const on = s.hours.includes(k);
              return (
                <td key={p}>
                  <button type="button" aria-pressed={on} aria-label={`${day(wd, true)}, ${t(`day.${p}`)}`} onClick={() => dispatch({ type: "hour", key: k })}
                    className={cn("h-11 w-16 rounded-xl border transition-colors duration-150", on ? "border-leaf bg-leaf" : "border-border bg-card hover:bg-muted")} />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhoneStage({ index }: { index: number }) {
  const { s, dispatch, t } = useKoi();
  const screen = index === 0 ? <TapScreen viewer={s.viewer} /> : index === 1 ? <PlanScreen /> : <CloseScreen viewer={s.viewer} />;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={index === 1 ? "invisible" : undefined} aria-hidden={index === 1}>
        <SegmentedControl size="lg" label={t("seg.label")} value={s.viewer} onChange={(v) => dispatch({ type: "viewer", v: v === "sam" ? "sam" : "you" })}
          options={[{ value: "you", label: t("seg.you") }, { value: "sam", label: t("seg.sam") }]} />
      </div>
      <PhoneFrame>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${index}-${index === 1 ? "" : s.viewer}`} className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            {screen}
          </motion.div>
        </AnimatePresence>
      </PhoneFrame>
    </div>
  );
}

const STEPS = [
  { id: "step-tap", h: "private.h2", p: ["private.p1", "private.p2"] },
  { id: "step-plan", h: "plan.h2", p: ["plan.p1", "plan.p2"] },
  { id: "step-close", h: "close.h2", p: ["close.p1", "close.p2"] },
] as const;

export function How() {
  const { s, dispatch, t } = useKoi();
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-step]")];
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) dispatch({ type: "step", n: Number((e.target as HTMLElement).dataset.step) }); }, { rootMargin: "-45% 0px -45% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dispatch]);

  const controls = [
    <Toggle key="a" on={s.samHooks} onChange={(v) => dispatch({ type: "sam", on: v })} label={t("private.sam")} />,
    <div key="b" className="max-w-full overflow-x-auto"><HoursGrid /></div>,
    <div key="c" className="flex flex-col items-start gap-3">
      <p className="max-w-[44ch] text-sm text-muted-foreground">{t("close.hint")}</p>
      <div className="flex flex-wrap gap-2">
        {!(s.answer === "yes" || s.deadline) && <Btn variant="ink" onClick={() => dispatch({ type: "skip48" })}>{t("close.skip")}</Btn>}
        {(s.answer !== null || s.deadline) && <Btn variant="quiet" onClick={() => dispatch({ type: "resetClose" })}>{t("close.reset")}</Btn>}
      </div>
    </div>,
  ];

  return (
    <section id="how" aria-label={t("nav.how")} className="mx-auto grid max-w-6xl gap-x-20 px-5 pt-16 lg:grid-cols-[minmax(0,28rem)_auto] lg:justify-center">
      <div>
        {STEPS.map((st, i) => (
          <article key={st.id} id={st.id} data-step={i} className="flex flex-col justify-center gap-5 py-14 lg:min-h-[100dvh]">
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.03em]">{t(st.h)}</h2>
            {st.p.map((k) => <p key={k} className="max-w-[46ch] text-[17px] text-muted-foreground">{t(k)}</p>)}
            {controls[i]}
            <div className="mt-8 lg:hidden"><PhoneStage index={i} /></div>
          </article>
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-20 flex h-[calc(100dvh-5rem)] items-center"><PhoneStage index={s.step} /></div>
      </div>
    </section>
  );
}

/* ---------- never ---------- */
const note = { hidden: { y: 16 }, show: { y: 0 } };
export function Never() {
  const { t } = useKoi();
  const big = "font-heading text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.035em]";
  return (
    <section aria-labelledby="h-never" className="mx-auto max-w-6xl px-5 py-28">
      <h2 id="h-never" className="max-w-[18ch] text-[clamp(2rem,4.8vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">{t("never.h2")}</h2>
      <div className="mt-12 grid gap-4 lg:grid-cols-6 lg:auto-rows-[minmax(13rem,auto)]">
        <div className="flex flex-col gap-5 rounded-[2rem] bg-muted p-7 lg:col-span-3 lg:row-span-2">
          <p className="text-sm font-semibold text-muted-foreground">{t("never.lockcap")}</p>
          <motion.ul initial="hidden" whileInView="show" viewport={{ once: true, margin: "-20% 0px" }} transition={{ staggerChildren: 0.14 }} className="mt-auto flex flex-col gap-3">
            {["never.n1", "never.n2", "never.n3"].map((k) => (
              <motion.li key={k} variants={note} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/.06),0_10px_24px_-14px_rgb(0_0_0/.3)]">
                <p className="text-xs font-semibold text-muted-foreground">{t("never.n1t")}</p>
                <p className="text-[17px] font-semibold">{t(k)}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[2rem] border border-border bg-card p-7 lg:col-span-3">
          <p className={big}>{t("never.big1")}</p><p className="max-w-[36ch] text-muted-foreground">{t("never.i1d")}</p>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-foreground p-7 text-background lg:col-span-3">
          <p className={big}>{t("never.big2")}</p><p className="max-w-[36ch] opacity-75">{t("never.i2d")}</p>
        </div>
        <div className="relative flex min-h-[18rem] flex-col justify-end gap-2 overflow-hidden rounded-[2rem] border border-border bg-card p-7 lg:col-span-2">
          <div className="absolute inset-0 opacity-90"><MapArt labels={false} /></div>
          <div className="relative rounded-2xl bg-card/95 p-4">
            <p className="font-heading text-xl font-bold leading-tight">{t("never.mapTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("never.mapBody")}</p>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-leaf-soft p-7 lg:col-span-2">
          <p className={big}>{t("never.big3")}</p><p className="max-w-[30ch] text-muted-foreground">{t("never.i5d")}</p>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[2rem] border border-border bg-card p-7 lg:col-span-2">
          <p className={cn(big, "text-[clamp(1.9rem,3.6vw,2.75rem)]")}>{t("never.big4")}</p><p className="max-w-[30ch] text-muted-foreground">{t("never.i4d")}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- join ---------- */
export function Join() {
  const { s, t } = useKoi();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/waitlist", { headers: { accept: "application/json" } }).then((r) => (r.ok ? r.json() : { open: false })).then((j) => setOpen(Boolean(j.open))).catch(() => {});
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const email = (f.elements.namedItem("email") as HTMLInputElement).value.trim();
    const area = (f.elements.namedItem("area") as HTMLSelectElement).value;
    const consent = (f.elements.namedItem("consent") as HTMLInputElement).checked;
    const website = (f.elements.namedItem("website") as HTMLInputElement).value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg(t("join.badEmail"));
    if (!area) return setMsg(t("join.needArea"));
    if (!consent) return setMsg(t("join.needConsent"));
    setMsg("…");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, area, consent: true, website, locale: s.lang }) });
      if (r.ok) { setMsg(t("join.ok")); f.reset(); } else setMsg(r.status === 400 ? t("join.badEmail") : t("join.fail"));
    } catch { setMsg(t("join.fail")); }
  }

  return (
    <section id="join" aria-labelledby="h-join" className="bg-muted">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-28 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-5">
          <h2 id="h-join" className="max-w-[16ch] text-[clamp(2.25rem,5.2vw,4rem)] font-bold leading-[1] tracking-[-0.035em]">{t("join.h2")}</h2>
          <p className="max-w-[46ch] text-[17px] text-muted-foreground">{t("join.p1")}</p>
        </div>
        {open ? (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-[2rem] bg-card p-7 shadow-[0_1px_2px_rgb(0_0_0/.06),0_24px_48px_-24px_rgb(0_0_0/.35)]">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">{t("join.email")}
              <input name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} className="min-h-12 rounded-xl border border-border bg-background px-3.5 text-base font-normal" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">{t("join.area")}
              <select name="area" required defaultValue="" className="min-h-12 rounded-xl border border-border bg-background px-3 text-base font-normal">
                <option value="">{t("join.choose")}</option>
                {AREAS.map(([id, en, th]) => <option key={id} value={id}>{s.lang === "th" ? th : en}</option>)}
              </select>
            </label>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px]" />
            <label className="grid grid-cols-[1.5rem_1fr] items-start gap-3 text-sm text-muted-foreground">
              <input name="consent" type="checkbox" required className="mt-0.5 size-6" /><span>{t("join.consent")}</span>
            </label>
            <Btn variant="primary" type="submit" className="self-start">{t("join.cta")}</Btn>
            <p role="status" aria-live="polite" className="min-h-6 text-sm font-semibold">{msg}</p>
          </form>
        ) : (
          <p className="rounded-[2rem] bg-card p-7 text-lg font-semibold">{t("join.closed")}</p>
        )}
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useKoi();
  return (
    <footer className="mx-auto max-w-6xl px-5 py-10">
      <p className="max-w-[60ch] text-sm text-muted-foreground">{t("foot.p")}</p>
    </footer>
  );
}

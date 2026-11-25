import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { VENUES, venueById } from "@/data";
import { fmtTime, useKoi } from "@/state";
import { Btn } from "@/components/ui/button";
import { Ripple } from "@/components/map";
import { goTo } from "@/lib/scroll";

const Screen = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("relative flex h-full flex-col gap-4 overflow-y-auto px-5 pb-6 pt-14", className)}>{children}</div>
);

function Toast() {
  const { t } = useKoi();
  return (
    <motion.div role="status" initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="absolute inset-x-3 top-11 z-30 rounded-2xl bg-foreground px-4 py-2.5 text-background shadow-lg">
      <p className="text-[11px] font-semibold opacity-70">{t("tap.toastApp")}</p>
      <p className="text-[13px] font-semibold">{t("tap.toast")}</p>
    </motion.div>
  );
}

function Profile({ who }: { who: "sam" | "you" }) {
  const { t } = useKoi();
  const k = (x: string) => t(`prof.${who}${x}`);
  return (
    <>
      <div className="flex items-center gap-3">
        <div aria-hidden className="grid size-14 place-items-center rounded-full border border-border bg-muted font-heading text-xl font-bold text-muted-foreground">{who === "sam" ? "S" : "Y"}</div>
        <div>
          <h3 className="font-heading text-xl font-bold leading-tight">{t(`prof.${who}`)}</h3>
          <p className="text-sm text-muted-foreground">{k("Area")}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-muted p-3.5 text-sm">
        <p className="text-xs font-semibold text-muted-foreground">{k("Prompt")}</p>
        <p className="mt-0.5">{k("Answer")}</p>
      </div>
    </>
  );
}

const Private = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl border border-dashed border-leaf bg-leaf-soft px-3.5 py-3 text-[13px] text-foreground">{children}</p>
);

export function TapScreen({ viewer }: { viewer: "you" | "sam" }) {
  const { s, dispatch, t, mutual, shared } = useKoi();
  const me = viewer === "you" ? s.youHooked : s.samHooks;
  const other = viewer === "you" ? s.samHooks : s.youHooked;
  const hook = () => dispatch(viewer === "you" ? { type: "hook" } : { type: "sam", on: true });
  const back = () => dispatch(viewer === "you" ? { type: "stepBack" } : { type: "sam", on: false });

  if (mutual) {
    const place = shared[0] ? (s.lang === "th" ? venueById(shared[0]).th : venueById(shared[0]).en) : null;
    return (
      <Screen className="justify-center">
        <Toast />
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground">
          <Ripple x="50%" y="40%" tone="rose" />
          <div className="relative z-10 flex flex-col gap-3">
            <h3 className="font-heading text-2xl font-bold leading-tight">{viewer === "you" ? t("tap.mutual", { name: "Sam" }) : t("tap.mutualSam")}</h3>
            <p className="text-sm opacity-90">{t("tap.mutualBody")}</p>
            {viewer === "you" && <p className="text-sm font-semibold">{place ? t("tap.shared", { place }) : t("tap.noShared")}</p>}
          </div>
        </div>
        {viewer === "you" && (
          <div className="flex flex-col gap-2">
            <Btn variant="ink" onClick={() => goTo("step-plan")}>{t("tap.openPlan")}</Btn>
            <Btn variant="quiet" onClick={() => dispatch({ type: "friends" })}>{t("tap.friends")}</Btn>
          </div>
        )}
      </Screen>
    );
  }
  if (me) {
    return (
      <Screen className="justify-center">
        <h3 className="font-heading text-2xl font-bold leading-tight">{t("tap.out")}</h3>
        <p className="text-[15px] text-muted-foreground">{t("tap.outBody")}</p>
        <Btn variant="plain" onClick={back}>{t("tap.step")}</Btn>
        <p className="text-xs text-muted-foreground">{t("tap.stepNote")}</p>
      </Screen>
    );
  }
  return (
    <Screen>
      <Profile who={viewer === "you" ? "sam" : "you"} />
      <Private>{t("tap.private")}</Private>
      <Btn variant="primary" onClick={hook}>{t("tap.hook")}</Btn>
      {other && <p role="status" className="text-[13px] font-semibold">{t("tap.unchanged")}</p>}
    </Screen>
  );
}

export function PlanScreen() {
  const { s, dispatch, t, mutual, shared, when, locale } = useKoi();
  if (!mutual) {
    return (
      <Screen className="justify-center">
        <p className="text-[15px] text-muted-foreground">{t("plan.locked")}</p>
        <Btn variant="quiet" onClick={() => goTo("step-tap")}>{t("plan.goUp")}</Btn>
      </Screen>
    );
  }
  const options = shared.length ? shared.map(venueById) : VENUES;
  const ready = !!s.place && !!when;
  const both = s.confYou && s.confSam;
  return (
    <Screen>
      <div className="flex flex-col gap-1">
        <label htmlFor="plan-place" className="text-xs font-semibold text-muted-foreground">{t("plan.place")}</label>
        <select id="plan-place" value={s.place ?? ""} onChange={(e) => dispatch({ type: "place", id: e.target.value })}
          className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-[15px] font-semibold">
          {!s.place && <option value="">{t("plan.choose")}</option>}
          {options.map((v) => <option key={v.id} value={v.id}>{s.lang === "th" ? v.th : v.en}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <p className="text-xs font-semibold text-muted-foreground">{t("plan.time")}</p>
        <p className="text-[17px] font-semibold leading-snug">{when ? fmtTime(when, locale) : t("plan.noTime")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {s.confYou ? <span className="text-sm font-semibold text-leaf">✓ {t("plan.you")}</span>
          : <Btn variant="primary" disabled={!ready} onClick={() => dispatch({ type: "confYou" })}>{t("plan.confirm")}</Btn>}
        {s.confSam ? <span className="text-sm font-semibold text-leaf">✓ {t("plan.sam")}</span>
          : <Btn variant="plain" disabled={!ready} onClick={() => dispatch({ type: "confSam" })}>{t("plan.samConfirm")}</Btn>}
      </div>
      <p role="status" className="min-h-5 text-[13px] font-semibold">{both ? `✓ ${t("plan.both")}` : s.cleared ? t("plan.cleared") : ""}</p>
      <Private>{t("plan.safety")}</Private>
      {typeof navigator !== "undefined" && "share" in navigator && ready && (
        <Btn variant="quiet" onClick={() => navigator.share({ text: `${venueById(s.place!).en} · ${fmtTime(when!, locale)}` }).catch(() => {})}>{t("plan.share")}</Btn>
      )}
    </Screen>
  );
}

export function CloseScreen({ viewer }: { viewer: "you" | "sam" }) {
  const { s, dispatch, t } = useKoi();
  const second = s.answer === "yes";
  const youClosed = s.answer === "no" || s.answer === "didnt" || (s.answer === null && s.deadline);
  const samClosed = s.deadline && !second;
  if (viewer === "you") {
    return (
      <Screen className="justify-center">
        {second ? <p className="text-lg font-semibold leading-snug">{t("close.second")}</p>
          : youClosed ? <p className="text-lg font-semibold leading-snug">{t("close.closed")}</p>
          : (
            <>
              <h3 className="font-heading text-2xl font-bold leading-tight">{t("close.ask")}</h3>
              <div className="flex flex-col gap-2">
                {([["yes", "close.yes"], ["no", "close.no"], ["didnt", "close.didnt"]] as const).map(([a, k]) => (
                  <Btn key={a} variant={a === "yes" ? "ink" : "plain"} onClick={() => dispatch({ type: "answer", a })}>{t(k)}</Btn>
                ))}
              </div>
            </>
          )}
      </Screen>
    );
  }
  return (
    <Screen className="justify-center">
      {second ? <p className="text-lg font-semibold leading-snug">{t("close.samSecond")}</p>
        : samClosed ? <p className="text-lg font-semibold leading-snug">{t("close.closed")}</p>
        : (<><p className="text-[15px]">{t("close.samSaid")}</p><p role="status" className="text-lg font-semibold leading-snug">{t("close.samWait")}</p></>)}
    </Screen>
  );
}

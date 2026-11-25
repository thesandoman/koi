import { useState } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AREAS, areaName, type Gender } from "@/data";
import { assertAdult } from "@/rules/koi-rules";
import { fonts, radius, useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { Btn, Chip, Private, Screen, T } from "@/components/ui";
import { MapCanvas } from "@/components/MapCanvas";
import { HoursGrid } from "@/components/HoursGrid";

const GENDERS: Gender[] = ["woman", "man", "non_binary"];

export default function Onboarding() {
  const { s, t, set, pin, hour, now } = useKoi();
  const router = useRouter();
  const c = useColors();
  const [step, setStep] = useState(0);
  const [birth, setBirth] = useState(s.birthYear ? String(s.birthYear) : "");
  const [err, setErr] = useState("");

  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.card, color: c.ink, borderRadius: radius.sm, minHeight: 48, paddingHorizontal: 14, fontSize: 16, fontFamily: fonts[s.lang].body } as const;
  const lang = (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Chip label="EN" on={s.lang === "en"} onPress={() => set({ lang: "en" })} />
      <Chip label="ไทย" on={s.lang === "th"} onPress={() => set({ lang: "th" })} />
    </View>
  );
  const toggleOpen = (g: Gender | "everyone") => {
    if (g === "everyone") return set({ openTo: "everyone" });
    const cur = s.openTo === "everyone" ? [] : s.openTo;
    const nx = cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g];
    set({ openTo: nx.length ? nx : "everyone" });
  };

  const profileNext = () => {
    const y = Number(birth);
    if (!s.name.trim() || !s.gender) return setErr(t("ob.name"));
    if (!Number.isInteger(y) || y < 1930 || y > new Date(now()).getUTCFullYear()) return setErr(t("ob.birth"));
    if (!assertAdult(y, new Date(now()))) return setErr(t("ob.adult"));
    setErr(""); set({ birthYear: y }); setStep(3);
  };
  const finish = () => { set({ onboarded: true }); router.replace("/intros"); };

  if (step === 0) {
    return (
      <Screen>
        {lang}
        <View style={{ height: 24 }} />
        <T v="display">{t("ob.h")}</T>
        <T muted>{t("ob.p")}</T>
        <Private><T v="small">{t("ob.sample")}</T></Private>
        <Btn variant="primary" label={t("ob.start")} onPress={() => setStep(1)} />
      </Screen>
    );
  }
  if (step === 1) {
    return (
      <Screen>
        <T v="title" accessibilityRole="header">{t("ob.consent.h")}</T>
        <T muted>{t("ob.consent.p1")}</T>
        <T muted>{t("ob.consent.p2")}</T>
        <Btn variant="ink" label={t("ob.consent.agree")} onPress={() => { set({ consent: true }); setStep(2); }} />
        <Btn variant="quiet" label={t("common.back")} onPress={() => setStep(0)} />
      </Screen>
    );
  }
  if (step === 2) {
    return (
      <Screen>
        <T v="title" accessibilityRole="header">{t("ob.profile.h")}</T>
        <T v="label" muted>{t("ob.name")}</T>
        <TextInput value={s.name} onChangeText={(v) => set({ name: v })} style={input} maxLength={30} accessibilityLabel={t("ob.name")} placeholderTextColor={c.body} />
        <T v="label" muted>{t("ob.area")}</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {AREAS.map((a) => <Chip key={a.id} label={areaName(a.id, s.lang)} on={s.area === a.id} onPress={() => set({ area: a.id })} />)}
        </View>
        <T v="label" muted>{t("ob.birth")}</T>
        <TextInput value={birth} onChangeText={setBirth} keyboardType="number-pad" maxLength={4} style={input} accessibilityLabel={t("ob.birth")} placeholder="1996" placeholderTextColor={c.body} />
        <T v="small" muted>{t("ob.adult")}</T>
        <T v="label" muted>{t("ob.gender")}</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{GENDERS.map((g) => <Chip key={g} label={t(`gender.${g}`)} on={s.gender === g} onPress={() => set({ gender: g })} />)}</View>
        <T v="label" muted>{t("ob.openTo")}</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Chip label={t("open.everyone")} on={s.openTo === "everyone"} onPress={() => toggleOpen("everyone")} />
          {GENDERS.map((g) => <Chip key={g} label={t(`open.${g}`)} on={s.openTo !== "everyone" && s.openTo.includes(g)} onPress={() => toggleOpen(g)} />)}
        </View>
        {err ? <T v="small" style={{ color: c.rose }} accessibilityRole="text">{err}</T> : null}
        <Btn variant="ink" label={t("common.next")} onPress={profileNext} />
      </Screen>
    );
  }
  if (step === 3) {
    return (
      <Screen>
        <T v="title" accessibilityRole="header">{t("ob.pins.h")}</T>
        <T muted>{t("ob.pins.p")}</T>
        <MapCanvas pins={s.pins} onToggle={pin} />
        <T v="small" muted>{s.pins.length < 3 ? t("map.min") : t("map.count", { n: s.pins.length })}</T>
        <Btn variant="ink" label={t("common.next")} disabled={s.pins.length < 3} onPress={() => setStep(4)} />
      </Screen>
    );
  }
  return (
    <Screen>
      <T v="title" accessibilityRole="header">{t("ob.hours.h")}</T>
      <T muted>{t("ob.hours.p")}</T>
      <HoursGrid hours={s.hours} onToggle={hour} />
      <Btn variant="primary" label={t("ob.finish")} onPress={finish} />
    </Screen>
  );
}

import { View } from "react-native";
import { useRouter } from "expo-router";
import { areaName, personName, type SamplePerson } from "@/data";
import { pinkyFor, rowFor, visibleIntros } from "@/engine/logic";
import { useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { LinkText, Rule, Screen, T } from "@/components/ui";
import { HoldPinky } from "@/components/HoldPinky";

function Person({ p }: { p: SamplePerson }) {
  const { s, t, hook, stepBack } = useKoi();
  const c = useColors();
  const router = useRouter();
  const row = rowFor(s, p.id);
  const name = personName(p, s.lang);
  const pk = pinkyFor(s, p.id);
  return (
    <View style={{ gap: 14, paddingVertical: 12 }}>
      <View>
        <T v="display" accessibilityRole="header">{name}, {p.age}</T>
        <T muted>{areaName(p.area, s.lang)}</T>
      </View>
      <View>
        <T v="label" muted>{s.lang === "th" ? p.promptTh : p.promptEn}</T>
        <T v="title" style={{ marginTop: 4 }}>“{s.lang === "th" ? p.answerTh : p.answerEn}”</T>
      </View>
      <T muted>{p.interests.join(", ")}</T>

      {row === "none" && (
        <View style={{ alignItems: "center", gap: 6, paddingVertical: 8 }}>
          <HoldPinky name={name} label={t("intros.hook")} hint={t("hold.hook")} done={t("hold.hooked")} onComplete={() => hook(p.id)} />
          <T v="small" muted style={{ textAlign: "center" }}>{t("intros.private")}</T>
        </View>
      )}
      {row === "mine" && (
        <View style={{ gap: 2 }}>
          <T v="title">{t("intros.out")}</T>
          <T muted>{t("intros.outBody")}</T>
          <LinkText label={t("intros.step")} onPress={() => stepBack(p.id)} tone="muted" />
        </View>
      )}
      {row === "mutual" && pk && (
        <View style={{ backgroundColor: c.rose, borderRadius: 28, padding: 22, gap: 4 }}>
          <T v="title" style={{ color: c.onRose }}>{t("intros.mutual", { name })}</T>
          <LinkText label={t("intros.openPlan")} tone="ink" onPress={() => router.push({ pathname: "/plan/[id]", params: { id: pk.id } })} />
        </View>
      )}
    </View>
  );
}

export default function Intros() {
  const { s, t, now } = useKoi();
  const people = visibleIntros(s, now());
  return (
    <Screen pad={24}>
      <T v="title" accessibilityRole="header">{t("intros.h")}</T>
      <T v="small" muted>{t("intros.sample")}</T>
      {!s.datingOn ? <T>{t("intros.off")}</T> : people.map((p, i) => (<View key={p.id}>{i > 0 && <Rule />}<Person p={p} /></View>))}
      {s.datingOn && <T muted style={{ textAlign: "center", paddingVertical: 24 }}>{t("intros.empty")}</T>}
    </Screen>
  );
}

import { View } from "react-native";
import { useRouter } from "expo-router";
import { areaName, personName, type SamplePerson } from "@/data";
import { pinkyFor, rowFor, visibleIntros } from "@/engine/logic";
import { radius, useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { Btn, Card, Private, Screen, T } from "@/components/ui";

function Person({ p }: { p: SamplePerson }) {
  const { s, t, hook, stepBack } = useKoi();
  const c = useColors();
  const router = useRouter();
  const row = rowFor(s, p.id);
  const name = personName(p, s.lang);
  const pk = pinkyFor(s, p.id);
  return (
    <Card>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <View accessibilityElementsHidden style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.bg2, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" }}>
          <T v="title" muted>{name.slice(0, 1)}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T v="title">{name}, {p.age}</T>
          <T v="small" muted>{areaName(p.area, s.lang)}</T>
        </View>
      </View>
      <View style={{ backgroundColor: c.bg2, borderRadius: radius.md, padding: 14, gap: 2 }}>
        <T v="label" muted>{s.lang === "th" ? p.promptTh : p.promptEn}</T>
        <T>{s.lang === "th" ? p.answerTh : p.answerEn}</T>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {p.interests.map((i) => <View key={i} style={{ borderRadius: 99, borderWidth: 1, borderColor: c.line, paddingHorizontal: 10, paddingVertical: 4 }}><T v="small" muted>{i}</T></View>)}
      </View>
      {row === "none" && (<><Private><T v="small">{t("intros.private")}</T></Private><Btn variant="primary" label={t("intros.hook")} onPress={() => hook(p.id)} /></>)}
      {row === "mine" && (<>
        <T v="title">{t("intros.out")}</T><T muted>{t("intros.outBody")}</T>
        <Btn label={t("intros.step")} onPress={() => stepBack(p.id)} /><T v="small" muted>{t("intros.stepNote")}</T>
      </>)}
      {row === "mutual" && pk && (
        <View style={{ backgroundColor: c.rose, borderRadius: radius.md, padding: 16, gap: 12 }}>
          <T v="title" style={{ color: c.onRose }}>{t("intros.mutual", { name })}</T>
          <Btn variant="ink" label={t("intros.openPlan")} onPress={() => router.push({ pathname: "/plan/[id]", params: { id: pk.id } })} />
        </View>
      )}
    </Card>
  );
}

export default function Intros() {
  const { s, t, now } = useKoi();
  const people = visibleIntros(s, now());
  return (
    <Screen>
      <T v="title" accessibilityRole="header">{t("intros.h")}</T>
      <T v="small" muted>{t("intros.sample")}</T>
      {!s.datingOn ? <Card><T>{t("intros.off")}</T></Card> : people.map((p) => <Person key={p.id} p={p} />)}
      {s.datingOn && <T muted style={{ textAlign: "center", paddingVertical: 12 }}>{t("intros.empty")}</T>}
    </Screen>
  );
}

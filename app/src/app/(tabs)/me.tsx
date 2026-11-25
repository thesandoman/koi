import { useState } from "react";
import { Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { AREAS, areaName, venueByKey, venueName } from "@/data";
import { useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { Btn, Card, Chip, Screen, T } from "@/components/ui";
import { HoursGrid } from "@/components/HoursGrid";

export default function Me() {
  const { s, t, set, hour, dating, skipDay, reset } = useKoi();
  const c = useColors();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  return (
    <Screen>
      <T v="title" accessibilityRole="header">{t("me.h")}</T>
      <Card>
        <T v="title">{s.name || "—"}</T>
        <T muted>{areaName(s.area, s.lang)}</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {AREAS.map((a) => <Chip key={a.id} label={areaName(a.id, s.lang)} on={s.area === a.id} onPress={() => set({ area: a.id })} />)}
        </View>
      </Card>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
          <T>{t("me.datingOn")}</T>
          <Switch accessibilityLabel={t("me.dating")} value={s.datingOn} onValueChange={dating} trackColor={{ true: c.leaf, false: c.line }} thumbColor={c.card} />
        </View>
        <T v="label" muted>{t("me.language")}</T>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip label="EN" on={s.lang === "en"} onPress={() => set({ lang: "en" })} />
          <Chip label="ไทย" on={s.lang === "th"} onPress={() => set({ lang: "th" })} />
        </View>
      </Card>
      <Card>
        <T v="label" muted>{t("me.pins")}</T>
        <T>{s.pins.map((k) => venueName(venueByKey.get(k)!, s.lang)).join(" · ")}</T>
        <Btn variant="quiet" label={t("tab.places")} onPress={() => router.push("/places")} />
      </Card>
      <Card>
        <T v="label" muted>{t("me.hours")}</T>
        <HoursGrid hours={s.hours} onToggle={hour} />
      </Card>
      <Card>
        <T v="label" muted>{t("me.demo")}</T>
        <Btn label={t("me.skip")} onPress={skipDay} />
        <T v="small" muted>{t("me.skipNote")}</T>
        {confirm ? (
          <>
            <T v="small">{t("me.resetConfirm")}</T>
            <Btn variant="ink" label={t("me.reset")} onPress={() => { reset(); setConfirm(false); router.replace("/onboarding"); }} />
            <Btn variant="quiet" label={t("common.cancel")} onPress={() => setConfirm(false)} />
          </>
        ) : <Btn variant="quiet" label={t("me.reset")} onPress={() => setConfirm(true)} />}
        <T v="small" muted>{t("me.sample")}</T>
      </Card>
    </Screen>
  );
}

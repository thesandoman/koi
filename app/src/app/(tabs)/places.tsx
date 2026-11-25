import { View } from "react-native";
import { VENUES, venueName } from "@/data";
import { useKoi } from "@/engine/store";
import { Chip, Screen, T } from "@/components/ui";
import { MapCanvas } from "@/components/MapCanvas";
import { useState } from "react";

export default function Places() {
  const { s, t, pin } = useKoi();
  const [limit, setLimit] = useState(false);
  const toggle = (k: string) => setLimit(pin(k) === "limit");
  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <T v="title" accessibilityRole="header">{t("map.h")}</T>
        <T v="small" muted>{t("map.count", { n: s.pins.length })}</T>
      </View>
      <MapCanvas pins={s.pins} onToggle={toggle} />
      <T v="small" muted>{limit ? t("map.limit") : s.pins.length < 3 ? t("map.min") : t("map.fine")}</T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {VENUES.map((v) => <Chip key={v.key} label={venueName(v, s.lang)} on={s.pins.includes(v.key)} onPress={() => toggle(v.key)} />)}
      </View>
    </Screen>
  );
}

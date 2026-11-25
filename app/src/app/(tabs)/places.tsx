import { VENUES, venueByKey, venueName } from "@/data";
import { useState } from "react";
import { useKoi } from "@/engine/store";
import { Screen, T } from "@/components/ui";
import { MapCanvas } from "@/components/MapCanvas";

export default function Places() {
  const { s, t, pin } = useKoi();
  const [limit, setLimit] = useState(false);
  const toggle = (k: string) => setLimit(pin(k) === "limit");
  return (
    <Screen pad={24}>
      <T v="title" accessibilityRole="header">{t("map.h")}</T>
      <T v="small" muted>{limit ? t("map.limit") : s.pins.length < 3 ? t("map.min") : `${t("map.count", { n: s.pins.length })} · ${VENUES.length}`}</T>
      <MapCanvas pins={s.pins} onToggle={toggle} height={520} />
      {s.pins.length > 0 && <T muted>{s.pins.map((k) => venueName(venueByKey.get(k)!, s.lang)).join(", ")}</T>}
      <T v="small" muted>{t("map.fine")}</T>
    </Screen>
  );
}

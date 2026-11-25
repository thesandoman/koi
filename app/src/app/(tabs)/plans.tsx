import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { personById, personName, venueByKey, venueName } from "@/data";
import { useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { LinkText, Rule, Screen, T } from "@/components/ui";
import { fmtTime } from "@/lib/format";

export default function Plans() {
  const { s, t, dismiss } = useKoi();
  const router = useRouter();
  const c = useColors();
  return (
    <Screen pad={24}>
      <T v="title" accessibilityRole="header">{t("plans.h")}</T>
      {s.pinkies.length === 0 && <T muted style={{ paddingVertical: 24 }}>{t("plans.empty")}</T>}
      {s.pinkies.map((pk, i) => {
        const p = personById.get(pk.personId)!;
        const name = personName(p, s.lang);
        if (pk.status === "closed") {
          return (
            <View key={pk.id}>{i > 0 && <Rule />}
              <T v="title" muted>{name}</T><T muted>{t("close.closed")}</T>
              <LinkText label={t("common.done")} onPress={() => dismiss(pk.id)} tone="muted" />
            </View>
          );
        }
        const v = pk.venueKey ? venueByKey.get(pk.venueKey) : undefined;
        return (
          <View key={pk.id}>{i > 0 && <Rule />}
            <Pressable accessibilityRole="button" accessibilityLabel={t("plans.with", { name })} onPress={() => router.push({ pathname: "/plan/[id]", params: { id: pk.id } })} style={{ paddingVertical: 14, gap: 2 }}>
              <T v="display" style={{ fontSize: 30, lineHeight: 34 }}>{name}</T>
              <T v="title" style={{ color: c.leaf }}>{v ? venueName(v, s.lang) : t("plan.choose")}</T>
              <T muted>{pk.startsAt ? fmtTime(pk.startsAt, s.lang) : t("plan.noTime")}</T>
              {pk.confMe && pk.confThem && <T v="label" style={{ color: c.leaf }}>{t("plan.both")}</T>}
            </Pressable>
          </View>
        );
      })}
    </Screen>
  );
}

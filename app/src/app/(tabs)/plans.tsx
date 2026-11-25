import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { personById, personName, venueByKey, venueName } from "@/data";
import { useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { Btn, Card, Screen, T } from "@/components/ui";
import { fmtTime } from "@/lib/format";

export default function Plans() {
  const { s, t, dismiss } = useKoi();
  const router = useRouter();
  const c = useColors();
  return (
    <Screen>
      <T v="title" accessibilityRole="header">{t("plans.h")}</T>
      {s.pinkies.length === 0 && <Card><T muted>{t("plans.empty")}</T></Card>}
      {s.pinkies.map((pk) => {
        const p = personById.get(pk.personId)!;
        const name = personName(p, s.lang);
        if (pk.status === "closed") {
          return (
            <Card key={pk.id}>
              <T v="title">{name}</T><T muted>{t("close.closed")}</T>
              <Btn variant="quiet" label={t("common.done")} onPress={() => dismiss(pk.id)} />
            </Card>
          );
        }
        const v = pk.venueKey ? venueByKey.get(pk.venueKey) : undefined;
        return (
          <Pressable key={pk.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/plan/[id]", params: { id: pk.id } })}>
            <Card style={{ borderColor: c.leaf }}>
              <T v="title">{t("plans.with", { name })}</T>
              <T muted>{v ? venueName(v, s.lang) : t("plan.choose")}</T>
              <T muted>{pk.startsAt ? fmtTime(pk.startsAt, s.lang) : t("plan.noTime")}</T>
              {pk.confMe && pk.confThem && <T v="label" style={{ color: c.leaf }}>{t("plan.both")}</T>}
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

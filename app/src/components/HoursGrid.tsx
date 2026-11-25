import { Pressable, Text, View } from "react-native";
import { DAY_ORDER, PARTS } from "@/data";
import { fonts, radius, useColors } from "@/theme";
import { useKoi } from "@/engine/store";

export function HoursGrid({ hours, onToggle }: { hours: string[]; onToggle: (key: string) => void }) {
  const c = useColors();
  const { s, t } = useKoi();
  const f = fonts[s.lang];
  const lab = { color: c.body, fontFamily: f.semi, fontSize: 12 } as const;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 6, paddingLeft: 48 }}>
        {PARTS.map((p) => <Text key={p} style={[lab, { flex: 1, textAlign: "center" }]}>{t(`day.${p}`)}</Text>)}
      </View>
      {DAY_ORDER.map((wd) => (
        <View key={wd} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Text style={[lab, { width: 42 }]}>{t(`wd.${wd}`)}</Text>
          {PARTS.map((p) => {
            const k = `${wd}-${p}`;
            const on = hours.includes(k);
            return (
              <Pressable key={p} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${t(`wd.${wd}`)} ${t(`day.${p}`)}`} onPress={() => onToggle(k)}
                style={{ flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: on ? c.leaf : c.line, backgroundColor: on ? c.leaf : c.card }} />
            );
          })}
        </View>
      ))}
    </View>
  );
}

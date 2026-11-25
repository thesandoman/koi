import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { fonts, useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { TabIcon } from "@/components/icons";

export default function TabsLayout() {
  const c = useColors();
  const { s, t } = useKoi();
  const open = s.pinkies.filter((p) => p.status === "active").length;
  const tab = (name: "places" | "intros" | "plans" | "me") => ({
    title: t(`tab.${name}`),
    tabBarIcon: ({ color }: { color: ColorValue }) => <TabIcon name={name} color={String(color)} />,
    tabBarLabel: ({ color }: { color: ColorValue }) => <Text style={{ color, fontFamily: fonts[s.lang].semi, fontSize: 11 }}>{t(`tab.${name}`)}</Text>,
  });
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.ink, tabBarInactiveTintColor: c.body, tabBarStyle: { backgroundColor: c.card, borderTopColor: c.line, minHeight: 62 }, tabBarItemStyle: { minHeight: 52 } }}>
      <Tabs.Screen name="intros" options={tab("intros")} />
      <Tabs.Screen name="places" options={tab("places")} />
      <Tabs.Screen name="plans" options={{ ...tab("plans"), tabBarBadge: open > 0 ? open : undefined, tabBarBadgeStyle: { backgroundColor: c.leaf, color: c.onLeaf } }} />
      <Tabs.Screen name="me" options={tab("me")} />
    </Tabs>
  );
}

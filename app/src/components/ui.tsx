import { useMemo, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { fonts, MIN_TAP, radius, useColors } from "@/theme";
import { useKoi } from "@/engine/store";

type Variant = "display" | "title" | "body" | "small" | "label";
const size: Record<Variant, { fontSize: number; lineHeight: number }> = {
  display: { fontSize: 40, lineHeight: 42 }, title: { fontSize: 22, lineHeight: 27 }, body: { fontSize: 16, lineHeight: 24 }, small: { fontSize: 13, lineHeight: 19 }, label: { fontSize: 12, lineHeight: 17 },
};

export function T({ v = "body", muted, children, style, ...p }: { v?: Variant; muted?: boolean; children?: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number; accessibilityRole?: "header" | "text" }) {
  const c = useColors();
  const { s } = useKoi();
  const f = fonts[s.lang];
  const family = v === "display" ? f.display : v === "title" ? f.head : v === "label" ? f.semi : f.body;
  const th = s.lang === "th";
  return (
    <Text {...p} style={[{ color: muted ? c.body : c.ink, fontFamily: family, ...size[v], lineHeight: size[v].lineHeight + (th ? 5 : 0), letterSpacing: v === "display" && !th ? -1.2 : 0 }, style]}>
      {children}
    </Text>
  );
}

export function Btn({ label, onPress, variant = "plain", disabled, style }: { label: string; onPress: () => void; variant?: "primary" | "plain" | "ink" | "quiet"; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const { s } = useKoi();
  const bg = variant === "primary" ? c.rose : variant === "ink" ? c.ink : variant === "plain" ? c.card : "transparent";
  const fg = variant === "primary" ? c.onRose : variant === "ink" ? c.bg : c.ink;
  const border = variant === "plain" || variant === "quiet" ? c.line : "transparent";
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled}
      onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {}); onPress(); }}
      style={({ pressed }) => [{ minHeight: 48, paddingHorizontal: 22, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: bg, borderWidth: 1, borderColor: border, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      <Text style={{ color: fg, fontFamily: fonts[s.lang].semi, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  const { s } = useKoi();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}
      style={{ minHeight: MIN_TAP, paddingHorizontal: 16, borderRadius: radius.full, justifyContent: "center", borderWidth: 1, borderColor: on ? c.leaf : c.line, backgroundColor: on ? c.leafSoft : c.card }}>
      <Text style={{ color: on ? c.ink : c.body, fontFamily: fonts[s.lang].medium, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Screen({ children, scroll = true, pad = 20, bottom = true }: { children: ReactNode; scroll?: boolean; pad?: number; bottom?: boolean }) {
  const c = useColors();
  const body = scroll
    ? <ScrollView contentContainerStyle={{ padding: pad, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={{ flex: 1, padding: pad, gap: 16 }}>{children}</View>;
  return <SafeAreaView edges={bottom ? ["top", "left", "right"] : ["top"]} style={{ flex: 1, backgroundColor: c.bg }}>{body}</SafeAreaView>;
}

export function Private({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: c.leaf, backgroundColor: c.leafSoft, borderRadius: radius.md, padding: 14 }}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, padding: 18, gap: 12 }, style]}>{children}</View>;
}

export const hap = (kind: "light" | "success") => {
  if (Platform.OS === "web") return;
  (kind === "success" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => {});
};
export const useStyles = () => useMemo(() => StyleSheet.create({ row: { flexDirection: "row", gap: 8, flexWrap: "wrap" } }), []);

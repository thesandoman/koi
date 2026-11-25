import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { KoiProvider, useKoi } from "@/engine/store";
import { fonts, radius, useColors } from "@/theme";
import { hap } from "@/components/ui";

function Toast() {
  const { s, t } = useKoi();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const y = useRef(new Animated.Value(-120)).current;
  const [shown, setShown] = useState<string | null>(null);
  const n = s.toast?.n;
  useEffect(() => {
    if (!s.toast) return;
    setShown(s.toast.key);
    if (s.toast.key === "n.unlock") hap("success");
    Animated.spring(y, { toValue: 0, stiffness: 380, damping: 26, mass: 1, useNativeDriver: true }).start();
    const id = setTimeout(() => Animated.timing(y, { toValue: -140, duration: 220, useNativeDriver: true }).start(), 3800);
    return () => clearTimeout(id);
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shown) return null;
  return (
    <Animated.View pointerEvents="box-none" style={{ position: "absolute", top: insets.top + 8, left: 14, right: 14, transform: [{ translateY: y }], zIndex: 50 }}>
      <Pressable accessibilityRole="button" onPress={() => router.push("/plans")} style={{ backgroundColor: c.ink, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
        <Text style={{ color: c.bg, opacity: 0.7, fontFamily: fonts[s.lang].semi, fontSize: 11 }}>Koi</Text>
        <Text style={{ color: c.bg, fontFamily: fonts[s.lang].semi, fontSize: 15 }}>{t(shown)}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Only the eight faces the app uses (the package index would bundle all 34).
const FONT_FILES = {
  BricolageGrotesque_700Bold: require("@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf"),
  BricolageGrotesque_800ExtraBold: require("@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf"),
  Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
  Inter_500Medium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
  Inter_600SemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
  NotoSansThai_400Regular: require("@expo-google-fonts/noto-sans-thai/400Regular/NotoSansThai_400Regular.ttf"),
  NotoSansThai_600SemiBold: require("@expo-google-fonts/noto-sans-thai/600SemiBold/NotoSansThai_600SemiBold.ttf"),
  NotoSansThai_700Bold: require("@expo-google-fonts/noto-sans-thai/700Bold/NotoSansThai_700Bold.ttf"),
};

function Shell() {
  const c = useColors();
  const { s } = useKoi();
  const [loaded, fontError] = useFonts(FONT_FILES);
  // A font that fails to load must never leave the screen blank: fall back to system fonts.
  if (!(loaded || fontError) || !s.loaded) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg2, alignItems: "center" }}>
     <View style={{ flex: 1, width: "100%", maxWidth: 520, backgroundColor: c.bg }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: "fade_from_bottom" }} />
      <Toast />
     </View>
    </View>
  );
}

export default function RootLayout() {
  return <SafeAreaProvider><KoiProvider><Shell /></KoiProvider></SafeAreaProvider>;
}

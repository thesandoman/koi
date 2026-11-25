import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { NotoSansThai_400Regular, NotoSansThai_600SemiBold, NotoSansThai_700Bold } from "@expo-google-fonts/noto-sans-thai";
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

function Shell() {
  const c = useColors();
  const { s } = useKoi();
  const [loaded] = useFonts({ BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, NotoSansThai_400Regular, NotoSansThai_600SemiBold, NotoSansThai_700Bold });
  if (!loaded || !s.loaded) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
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

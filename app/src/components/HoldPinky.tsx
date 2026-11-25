import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { T, hap, useReducedMotion, useScreenReader } from "@/components/ui";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 132, R = 58, C = 2 * Math.PI * R;
const HOLD_MS = 800;

/**
 * Press and hold to make a promise. A ring fills while you hold; letting go early lets it drain.
 * Everyone can do it: a screen reader gets one tap, and anyone can double-tap instead of holding.
 */
export function HoldPinky({ name, tone = "rose", label, hint, done, onComplete }: {
  name: string; tone?: "rose" | "leaf"; label: string; hint: string; done: string; onComplete: () => void;
}) {
  const c = useColors();
  const { t } = useKoi();
  const reduce = useReducedMotion();
  const screenReader = useScreenReader();
  const fill = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);
  const lastTap = useRef(0);
  const [phase, setPhase] = useState<"idle" | "holding" | "tip" | "done">("idle");
  const color = tone === "rose" ? c.rose : c.leaf;
  const ink = tone === "rose" ? c.onRose : c.onLeaf;

  useEffect(() => () => fill.stopAnimation(), [fill]);

  const complete = () => {
    if (finished.current) return;
    finished.current = true;
    setPhase("done");
    fill.setValue(1);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (!reduce) Animated.sequence([Animated.timing(pop, { toValue: 1.14, duration: 120, useNativeDriver: true }), Animated.spring(pop, { toValue: 1, stiffness: 300, damping: 12, mass: 1, useNativeDriver: true })]).start();
    onComplete();
  };

  const start = () => {
    if (finished.current || screenReader) return;
    setPhase("holding");
    hap("light");
    Animated.timing(fill, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start(({ finished: ok }) => { if (ok) complete(); });
    if (Platform.OS !== "web") setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), HOLD_MS / 2);
  };
  const stop = () => {
    if (finished.current) return;
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    setPhase((p) => (p === "holding" ? "tip" : p));
  };
  // A quick tap is allowed too: with a screen reader it completes at once, otherwise a second tap within 1.5 s does.
  const tap = () => {
    if (finished.current) return;
    const now = Date.now();
    if (screenReader || now - lastTap.current < 1500) return complete();
    lastTap.current = now;
    setPhase("tip");
  };

  const offset = fill.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });
  const text = phase === "done" ? done : phase === "holding" ? t("hold.keep") : phase === "tip" ? t("hold.tip") : hint;

  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <Pressable
        accessibilityRole="button" accessibilityLabel={`${label} ${name}`} accessibilityHint={screenReader ? undefined : t("hold.a11y")}
        accessibilityActions={[{ name: "activate" }]} onAccessibilityAction={complete}
        onPressIn={start} onPressOut={stop} onPress={tap} disabled={phase === "done"}
        style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}
      >
        <Animated.View style={{ transform: [{ scale: pop }], width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 132 132" style={{ position: "absolute" }}>
            <Circle cx={66} cy={66} r={R} stroke={c.line} strokeWidth={6} fill="none" />
            <AnimatedCircle cx={66} cy={66} r={R} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 66 66)" />
            <Circle cx={66} cy={66} r={46} fill={phase === "done" ? color : c.card} />
            {/* Two little fingers hooked together: the Koi mark, drawn at ring scale. */}
            <Path d="M52 44 V70 A10 10 0 0 0 72 70 V62" stroke={phase === "done" ? ink : c.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
            <Path d="M80 88 V62 A10 10 0 0 0 60 62 V70" stroke={phase === "done" ? ink : color} strokeWidth={6} strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>
      </Pressable>
      <T v="small" muted style={{ textAlign: "center", minHeight: 38 }} accessibilityRole="text">{text}</T>
    </View>
  );
}

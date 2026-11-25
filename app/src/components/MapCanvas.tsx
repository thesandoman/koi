import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { VENUES, venueName } from "@/data";
import { fonts, radius, useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { hap } from "@/components/ui";

function Ripple({ x, y, color }: { x: number; y: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 1500, easing: Easing.out(Easing.exp), useNativeDriver: true }).start(); }, [v]);
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} pointerEvents="none" style={{ position: "absolute", left: x - 70, top: y - 70, width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: color,
          opacity: v.interpolate({ inputRange: [0, 0.15 + i * 0.1, 1], outputRange: [0, 0.55, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.1 + i * 0.05, 1] }) }] }} />
      ))}
    </>
  );
}

function Pin({ on, shared }: { on: boolean; shared?: boolean }) {
  const c = useColors();
  const y = useRef(new Animated.Value(on ? -16 : 0)).current;
  useEffect(() => { if (on) { y.setValue(-16); Animated.spring(y, { toValue: 0, stiffness: 520, damping: 13, mass: 1, useNativeDriver: true }).start(); } }, [on, y]);
  const fill = on ? (shared ? c.rose : c.leaf) : c.card;
  return (
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <Svg width={28} height={37} viewBox="122 7 28 37">
        <Path d="M136 42 C128 32 124 27 124 21 A12 12 0 1 1 148 21 C148 27 144 32 136 42 Z" fill={fill} stroke={on ? fill : c.body} strokeWidth={3} strokeLinejoin="round" />
        <Circle cx={136} cy={21} r={4.5} fill={on ? c.card : c.body} />
      </Svg>
    </Animated.View>
  );
}

/** A people-free map of Bangkok. Pins are curated public places only. */
export function MapCanvas({ pins, onToggle, shared = [] }: { pins: string[]; onToggle: (key: string) => void; shared?: string[] }) {
  const c = useColors();
  const { s, t } = useKoi();
  const [w, setW] = useState(0);
  const h = (w * 700) / 500;
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const seq = useRef(0);

  const toggle = (key: string, x: number, y: number) => {
    const adding = !pins.includes(key);
    onToggle(key);
    if (adding && pins.length < 5) {
      hap("light");
      const id = ++seq.current;
      setRipples((r) => [...r, { id, x: (x / 500) * w, y: (y / 700) * h }]);
      setTimeout(() => setRipples((r) => r.filter((q) => q.id !== id)), 2200);
    }
  };

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, overflow: "hidden", height: w ? h : 360 }}>
      {w > 0 && (
        <>
          <Svg width={w} height={h} viewBox="0 0 500 700" style={{ position: "absolute" }}>
            <G fill={c.leafSoft}>
              <Ellipse cx={330} cy={486} rx={62} ry={38} /><Ellipse cx={300} cy={86} rx={64} ry={26} /><Ellipse cx={238} cy={232} rx={30} ry={18} />
            </G>
            <G fill="none" stroke={c.line} strokeWidth={3} strokeLinecap="round" strokeDasharray="2 9">
              <Path d="M230 300 C320 315 400 340 500 365" /><Path d="M260 130 C275 220 290 320 300 420 S340 600 380 700" />
              <Path d="M20 470 C120 450 220 440 320 446" /><Path d="M300 150 C360 150 420 140 500 110" />
            </G>
            <Path d="M150 0 C172 120 120 220 140 330 S90 470 140 560 S212 650 190 700" fill="none" stroke={c.body} strokeOpacity={0.22} strokeWidth={40} strokeLinecap="round" />
          </Svg>
          {ripples.map((r) => <Ripple key={r.id} x={r.x} y={r.y} color={c.leaf} />)}
          {VENUES.map((v) => {
            const on = pins.includes(v.key);
            const left = (v.x / 500) * w, top = (v.y / 700) * h;
            const name = venueName(v, s.lang);
            return (
              <Pressable key={v.key} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={t(on ? "map.unpin" : "map.pin", { name })}
                onPress={() => toggle(v.key, v.x, v.y)} hitSlop={4}
                style={{ position: "absolute", left: left - 22, top: top - 46, width: 44, height: 46, alignItems: "center", justifyContent: "flex-end", zIndex: on ? 3 : 2 }}>
                {on && (
                  <View style={{ position: "absolute", bottom: 42, backgroundColor: c.ink, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text numberOfLines={1} style={{ color: c.bg, fontFamily: fonts[s.lang].semi, fontSize: 11 }}>{name}</Text>
                  </View>
                )}
                <Pin on={on} shared={shared.includes(v.key)} />
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
}

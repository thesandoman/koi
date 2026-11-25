import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View, useWindowDimensions, type ScrollViewInstance } from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { MAP_H, MAP_W, VENUES, venueName } from "@/data";
import { fonts, radius, useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { LinkText, hap, useReducedMotion } from "@/components/ui";

const RIVER = "M300 0 C330 180 250 320 290 470 C330 620 240 640 300 780 C360 920 380 960 340 1100";
const SEGS: [number, number][][] = [
  [[300, 0], [330, 180], [250, 320], [290, 470]],
  [[290, 470], [330, 620], [240, 640], [300, 780]],
  [[300, 780], [360, 920], [380, 960], [340, 1100]],
];
const bez = (p: [number, number][], t: number): [number, number] => {
  const u = 1 - t;
  return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]];
};
// Points along the river, so a koi can swim down it.
const PATH: [number, number][] = SEGS.flatMap((s) => Array.from({ length: 20 }, (_, i) => bez(s, i / 20))).concat([[340, 1100]]);
const ANGLES = PATH.map((p, i) => { const q = PATH[Math.min(i + 1, PATH.length - 1)], o = PATH[Math.max(i - 1, 0)]; return (Math.atan2(q[1] - o[1], q[0] - o[0]) * 180) / Math.PI; });

function Ripple({ x, y, color }: { x: number; y: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 1500, easing: Easing.out(Easing.exp), useNativeDriver: true }).start(); }, [v]);
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} pointerEvents="none" style={{ position: "absolute", left: x - 80, top: y - 80, width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: color,
          opacity: v.interpolate({ inputRange: [0, 0.15 + i * 0.1, 1], outputRange: [0, 0.6, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.1 + i * 0.05, 1] }) }] }} />
      ))}
    </>
  );
}

/** A small koi that swims down the river. Skipped when the user asked for reduced motion. */
function Koi({ seconds, reverse, delay }: { seconds: number; reverse?: boolean; delay: number }) {
  const c = useColors();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(t, { toValue: 1, duration: seconds * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [t, seconds, delay]);
  const pts = reverse ? [...PATH].reverse() : PATH;
  const ang = reverse ? [...ANGLES].reverse().map((a) => a + 180) : ANGLES;
  const range = pts.map((_, i) => i / (pts.length - 1));
  const sway = pts.map((_, i) => (reverse ? -1 : 1) * Math.sin(i * 0.7) * 5);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: -20, top: -10, width: 40, height: 20, opacity: 0.9,
      transform: [{ translateX: t.interpolate({ inputRange: range, outputRange: pts.map((p, i) => p[0] + sway[i]) }) }, { translateY: t.interpolate({ inputRange: range, outputRange: pts.map((p) => p[1]) }) }, { rotate: t.interpolate({ inputRange: range, outputRange: ang.map((a) => `${a}deg`) }) }] }}>
      <Svg width={40} height={20} viewBox="0 0 40 20">
        <Path d="M2 10 L11 3 L11 17 Z" fill={c.leaf} opacity={0.8} />
        <Path d="M8 10 C14 0 30 1 38 10 C30 19 14 20 8 10 Z" fill={c.card} stroke={c.leaf} strokeWidth={1.5} />
        <Path d="M16 6 C20 4 24 5 26 8 C22 9 18 9 16 6 Z" fill={c.leaf} opacity={0.55} />
        <Circle cx={32} cy={8} r={1.4} fill={c.ink} />
      </Svg>
    </Animated.View>
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

const AREA_LABELS = [["Chatuchak", 520, 40], ["Ari", 400, 230], ["Siam", 330, 390], ["Thonglor", 720, 440], ["Silom", 590, 580], ["Old Town", 420, 640], ["Yaowarat", 560, 850], ["Thonburi", 90, 700]] as const;

/** A people-free map of Bangkok you can drag around. Pins are curated public places only. */
export function MapCanvas({ pins, onToggle, shared = [], height = 460 }: { pins: string[]; onToggle: (key: string) => void; shared?: string[]; height?: number }) {
  const c = useColors();
  const { s, t } = useKoi();
  const reduce = useReducedMotion();
  const { width: winW } = useWindowDimensions();
  const [viewW, setViewW] = useState(Math.min(winW - 40, 520));
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const seq = useRef(0);
  const hRef = useRef<ScrollViewInstance>(null);
  const vRef = useRef<ScrollViewInstance>(null);

  const burst = (x: number, y: number, color: string) => {
    const id = ++seq.current;
    setRipples((r) => [...r, { id, x, y, color }]);
    setTimeout(() => setRipples((r) => r.filter((q) => q.id !== id)), 2200);
  };
  const toggle = (key: string, x: number, y: number) => {
    const adding = !pins.includes(key);
    onToggle(key);
    if (adding && pins.length < 5) { hap("light"); burst(x, y, c.leaf); }
  };
  const lookAt = (x: number, y: number, animated = true) => {
    hRef.current?.scrollTo({ x: Math.max(0, Math.min(MAP_W - viewW, x - viewW / 2)), animated });
    vRef.current?.scrollTo({ y: Math.max(0, Math.min(MAP_H - height, y - height / 2)), animated });
  };
  useEffect(() => { const id = setTimeout(() => lookAt(470, 430, false), 60); return () => clearTimeout(id); }, [viewW]); // eslint-disable-line react-hooks/exhaustive-deps
  const surprise = () => {
    const pool = VENUES.filter((v) => !pins.includes(v.key));
    const v = pool[Math.floor(Math.random() * pool.length)] ?? VENUES[0];
    lookAt(v.x, v.y);
    setTimeout(() => burst(v.x, v.y, c.rose), 450);
    hap("light");
  };

  const parks = useMemo(() => VENUES.filter((v) => v.kind === "walk" && v.outdoor), []);
  return (
    <View style={{ gap: 4 }}>
      <View onLayout={(e) => setViewW(e.nativeEvent.layout.width)} style={{ height, borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.card }}
        accessibilityLabel={t("map.title")}>
        <ScrollView ref={hRef} horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled bounces={false}>
          <ScrollView ref={vRef} showsVerticalScrollIndicator={false} nestedScrollEnabled bounces={false}>
            <View style={{ width: MAP_W, height: MAP_H }}>
              <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ position: "absolute" }}>
                <G fill={c.leafSoft}>{parks.map((v) => <Ellipse key={v.key} cx={v.x} cy={v.y} rx={64} ry={40} />)}</G>
                <G fill="none" stroke={c.line} strokeWidth={3} strokeLinecap="round" strokeDasharray="2 9">
                  <Path d="M300 500 C420 520 560 540 800 600" /><Path d="M470 130 C490 350 520 540 560 760 S640 1000 700 1100" />
                  <Path d="M40 700 C200 680 380 690 560 700" /><Path d="M470 300 C560 290 660 270 800 220" /><Path d="M340 900 C440 880 560 900 800 940" />
                </G>
                <Path d={RIVER} fill="none" stroke={c.body} strokeOpacity={0.2} strokeWidth={56} strokeLinecap="round" />
              </Svg>
              {AREA_LABELS.map(([n, x, y]) => (
                <Text key={n} pointerEvents="none" style={{ position: "absolute", left: x, top: y, color: c.body, opacity: 0.55, fontFamily: fonts[s.lang].semi, fontSize: 13, letterSpacing: 2 }}>{n}</Text>
              ))}
              {!reduce && <><Koi seconds={26} delay={0} /><Koi seconds={34} delay={6} reverse /><Koi seconds={30} delay={14} /></>}
              {ripples.map((r) => <Ripple key={r.id} x={r.x} y={r.y} color={r.color} />)}
              {VENUES.map((v) => {
                const on = pins.includes(v.key);
                const name = venueName(v, s.lang);
                return (
                  <Pressable key={v.key} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={t(on ? "map.unpin" : "map.pin", { name })}
                    onPress={() => toggle(v.key, v.x, v.y)} hitSlop={4}
                    style={{ position: "absolute", left: v.x - 52, top: v.y - 46, width: 104, minHeight: 76, alignItems: "center", zIndex: on ? 3 : 2 }}>
                    <Pin on={on} shared={shared.includes(v.key)} />
                    <Text numberOfLines={2} style={{ marginTop: 2, textAlign: "center", fontSize: 11, lineHeight: 14, color: on ? c.leaf : c.body, fontFamily: on ? fonts[s.lang].semi : fonts[s.lang].medium }}>{name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
      <LinkText label={t("map.surprise")} onPress={surprise} />
    </View>
  );
}

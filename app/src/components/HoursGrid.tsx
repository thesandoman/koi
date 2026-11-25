import { useEffect, useRef } from "react";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";
import { DAY_ORDER, PARTS } from "@/data";
import { fonts, useColors } from "@/theme";
import { useKoi } from "@/engine/store";
import { hap } from "@/components/ui";

const DOT = 44, GAP = 10, LABEL = 46;

function Dot({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  const c = useColors();
  const k = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (on) { k.setValue(0.7); Animated.spring(k, { toValue: 1, stiffness: 420, damping: 12, mass: 1, useNativeDriver: true }).start(); }
  }, [on, k]);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label} onPress={onPress} hitSlop={2}>
      <Animated.View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, transform: [{ scale: k }], borderWidth: on ? 0 : 1.5, borderColor: c.line, backgroundColor: on ? c.leaf : "transparent" }} />
    </Pressable>
  );
}

/**
 * Your usual free times as a week of dots. Tap one, or drag a finger across several to paint them on (or off).
 */
export function HoursGrid({ hours, onToggle }: { hours: string[]; onToggle: (key: string) => void }) {
  const c = useColors();
  const { s, t } = useKoi();
  const f = fonts[s.lang];
  const box = useRef<{ measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const mode = useRef<boolean | null>(null);
  const cur = useRef(hours);
  cur.current = hours;

  const cellAt = (px: number, py: number): string | null => {
    const x = px - origin.current.x - LABEL, y = py - origin.current.y - 22;
    const col = Math.floor(x / (DOT + GAP)), row = Math.floor(y / (DOT + GAP));
    if (col < 0 || col >= PARTS.length || row < 0 || row >= DAY_ORDER.length) return null;
    return `${DAY_ORDER[row]}-${PARTS[col]}`;
  };
  const paint = (px: number, py: number) => {
    const key = cellAt(px, py);
    if (!key || mode.current === null) return;
    const on = cur.current.includes(key);
    if (on !== mode.current) { onToggle(key); hap("light"); cur.current = mode.current ? [...cur.current, key] : cur.current.filter((h) => h !== key); }
  };
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onPanResponderGrant: (_e, g) => {
      box.current?.measureInWindow((x: number, y: number) => {
        origin.current = { x, y };
        const start = cellAt(g.x0, g.y0);
        mode.current = start ? !cur.current.includes(start) : true; // dragging from an empty dot paints, from a filled one erases
        paint(g.moveX || g.x0, g.moveY || g.y0);
      });
    },
    onPanResponderMove: (_e, g) => paint(g.moveX, g.moveY),
    onPanResponderRelease: () => { mode.current = null; },
    onPanResponderTerminate: () => { mode.current = null; },
  })).current;

  return (
    <View ref={box as never} {...pan.panHandlers} style={{ gap: GAP, alignSelf: "flex-start" }} accessibilityLabel={t("ob.hours.p")}>
      <View style={{ flexDirection: "row", gap: GAP, paddingLeft: LABEL, height: 12 }}>
        {PARTS.map((p) => <Text key={p} style={{ width: DOT, textAlign: "center", color: c.body, fontFamily: f.semi, fontSize: 11 }} numberOfLines={1}>{t(`day.${p}`)}</Text>)}
      </View>
      {DAY_ORDER.map((wd) => (
        <View key={wd} style={{ flexDirection: "row", gap: GAP, alignItems: "center" }}>
          <Text style={{ width: LABEL - GAP, color: c.body, fontFamily: f.semi, fontSize: 12 }}>{t(`wd.${wd}`)}</Text>
          {PARTS.map((p) => {
            const k = `${wd}-${p}`;
            return <Dot key={p} on={hours.includes(k)} label={`${t(`wd.${wd}`)} ${t(`day.${p}`)}`} onPress={() => onToggle(k)} />;
          })}
        </View>
      ))}
    </View>
  );
}

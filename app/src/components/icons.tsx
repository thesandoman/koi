import Svg, { Circle, Path, Rect } from "react-native-svg";

export function TabIcon({ name, color }: { name: "places" | "intros" | "plans" | "me"; color: string }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {name === "places" && <><Path d="M12 21c-4-4.5-6-7.6-6-10.5a6 6 0 1 1 12 0c0 2.9-2 6-6 10.5z" {...p} /><Circle cx={12} cy={10.5} r={2.2} {...p} /></>}
      {name === "intros" && <><Circle cx={9} cy={8.5} r={3} {...p} /><Path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" {...p} /><Path d="M16 5.8a3 3 0 0 1 0 5.4M17.5 14.6c1.9.5 3 2 3.4 4.4" {...p} /></>}
      {name === "plans" && <><Rect x={4} y={5.5} width={16} height={14} rx={3} {...p} /><Path d="M4 10h16M9 3.5v4M15 3.5v4" {...p} /></>}
      {name === "me" && <><Circle cx={12} cy={8.5} r={3.5} {...p} /><Path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" {...p} /></>}
    </Svg>
  );
}

export function CheckIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 16 16"><Path d="M3 8.5l3.2 3.2L13 4.8" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>;
}
export function ArrowLeftIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 16 16"><Path d="M13 8H3m5-5L3 8l5 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>;
}

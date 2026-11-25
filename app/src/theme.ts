import { useColorScheme } from "react-native";

export const palette = {
  light: { bg: "#F4F6F1", bg2: "#E8EDE6", card: "#FBFCF9", ink: "#15201C", body: "#46534D", line: "#CCD6CF", rose: "#C42E57", onRose: "#FFFFFF", leaf: "#2E7D5B", leafSoft: "#DCEFE4", onLeaf: "#FFFFFF" },
  dark: { bg: "#14201B", bg2: "#1A2822", card: "#1F2E28", ink: "#EEF2EC", body: "#AEBDB5", line: "#33443C", rose: "#F28CA6", onRose: "#14201B", leaf: "#62C195", leafSoft: "#20382D", onLeaf: "#14201B" },
} as const;
export type Colors = { [K in keyof typeof palette.light]: string };

export function useColors(): Colors {
  return useColorScheme() === "dark" ? palette.dark : palette.light;
}

/** Font family per role and language (Thai uses Noto Sans Thai throughout). */
export const fonts = {
  en: { display: "BricolageGrotesque_800ExtraBold", head: "BricolageGrotesque_700Bold", body: "Inter_400Regular", medium: "Inter_500Medium", semi: "Inter_600SemiBold" },
  th: { display: "NotoSansThai_700Bold", head: "NotoSansThai_700Bold", body: "NotoSansThai_400Regular", medium: "NotoSansThai_400Regular", semi: "NotoSansThai_600SemiBold" },
} as const;

export const radius = { sm: 12, md: 16, lg: 24, xl: 32, full: 999 } as const;
export const MIN_TAP = 44;

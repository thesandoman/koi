import { STRINGS as BASE, type Lang } from "./i18n-strings";
export type { Lang };

const EXTRA: Record<Lang, Record<string, string>> = {
  en: {
    "tap.mutualSam": "Sam and you both hooked pinkies.",
    "seg.you": "Your phone", "seg.sam": "Sam's phone", "seg.label": "Whose phone",
    "map.sheet": "Places you'd happily go",
    "map.count": "{n} of 3 pinned",
    "map.next": "See what happens next",
    "nav.how": "How it works",
    "never.big1": "No swiping.", "never.big2": "No scores.", "never.big3": "No boosts.", "never.big4": "No camera roll scans.",
    "never.mapTitle": "Only places, never people.",
    "never.mapBody": "The map shows public places. Nobody's location is ever on it, and counts are rounded and never live.",
    "foot.rights": "Koi · Bangkok",
  },
  th: {
    "tap.mutualSam": "แซมกับคุณเกี่ยวก้อยกันทั้งคู่",
    "seg.you": "โทรศัพท์ของคุณ", "seg.sam": "โทรศัพท์ของแซม", "seg.label": "ดูจากโทรศัพท์ของใคร",
    "map.sheet": "สถานที่ที่คุณยินดีไป",
    "map.count": "ปักหมุดแล้ว {n} จาก 3",
    "map.next": "ดูว่าเกิดอะไรต่อ",
    "nav.how": "ทำงานอย่างไร",
    "never.big1": "ไม่ปัดซ้ายขวา", "never.big2": "ไม่มีคะแนน", "never.big3": "ไม่มีบูสต์", "never.big4": "ไม่สแกนรูปในเครื่อง",
    "never.mapTitle": "มีแค่สถานที่ ไม่มีคน",
    "never.mapBody": "แผนที่แสดงเฉพาะสถานที่สาธารณะ ไม่มีตำแหน่งของใครอยู่บนนั้น ตัวเลขปัดเศษและไม่เรียลไทม์",
    "foot.rights": "Koi · กรุงเทพฯ",
  },
};

export const STRINGS: Record<Lang, Record<string, string>> = {
  en: { ...BASE.en, ...EXTRA.en },
  th: { ...BASE.th, ...EXTRA.th },
};

export function translate(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const raw = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

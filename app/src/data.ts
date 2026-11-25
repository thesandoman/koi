// Prototype data. The people are SAMPLE people for the on-device prototype, never real users.
import type { Venue as CoreVenue, Slot } from "@/rules/pinky-core";

export type AppVenue = CoreVenue & { nameEn: string; nameTh: string; x: number; y: number };

// x,y in a 500 x 700 map space, north up.
export const VENUES: AppVenue[] = [
  { key: "chatuchak", nameEn: "Chatuchak Weekend Market", nameTh: "ตลาดนัดจตุจักร", kind: "market", area: "chatuchak", isPublic: true, active: true, outdoor: true, backupKey: "ari", safe: false, x: 300, y: 78 },
  { key: "ortorkor", nameEn: "Or Tor Kor Market", nameTh: "ตลาด อ.ต.ก.", kind: "market", area: "chatuchak", isPublic: true, active: true, outdoor: false, backupKey: null, safe: false, x: 428, y: 158 },
  { key: "ari", nameEn: "Soi Ari cafés", nameTh: "คาเฟ่ซอยอารีย์", kind: "coffee", area: "ari", isPublic: true, active: true, outdoor: false, backupKey: null, safe: false, x: 240, y: 222 },
  { key: "bacc", nameEn: "Bangkok Art and Culture Centre", nameTh: "หอศิลปวัฒนธรรมกรุงเทพฯ", kind: "museum", area: "siam", isPublic: true, active: true, outdoor: false, backupKey: null, safe: false, x: 300, y: 352 },
  { key: "thonglor", nameEn: "Thonglor cafés", nameTh: "คาเฟ่ทองหล่อ", kind: "coffee", area: "thonglor", isPublic: true, active: true, outdoor: false, backupKey: null, safe: false, x: 425, y: 330 },
  { key: "lumphini", nameEn: "Lumphini Park", nameTh: "สวนลุมพินี", kind: "walk", area: "silom", isPublic: true, active: true, outdoor: true, backupKey: "bacc", safe: false, x: 330, y: 478 },
  { key: "watarun", nameEn: "Wat Arun riverside", nameTh: "ริมน้ำวัดอรุณ", kind: "walk", area: "old", isPublic: true, active: true, outdoor: true, backupKey: "yaowarat", safe: false, x: 66, y: 392 },
  { key: "yaowarat", nameEn: "Yaowarat street food", nameTh: "อาหารริมทางเยาวราช", kind: "streetfood", area: "yaowarat", isPublic: true, active: true, outdoor: false, backupKey: null, safe: false, x: 214, y: 588 },
];
export const venueByKey = new Map(VENUES.map((v) => [v.key, v]));
export const venueName = (v: AppVenue, lang: "en" | "th") => (lang === "th" ? v.nameTh : v.nameEn);

export const AREAS: { id: string; en: string; th: string }[] = [
  { id: "ari", en: "Ari", th: "อารีย์" }, { id: "siam", en: "Siam", th: "สยาม" }, { id: "sukhumvit", en: "Sukhumvit", th: "สุขุมวิท" },
  { id: "thonglor", en: "Thonglor", th: "ทองหล่อ" }, { id: "silom", en: "Silom", th: "สีลม" }, { id: "old", en: "Old Town", th: "เมืองเก่า" },
  { id: "yaowarat", en: "Yaowarat", th: "เยาวราช" }, { id: "chatuchak", en: "Chatuchak", th: "จตุจักร" },
];
export const areaName = (id: string, lang: "en" | "th") => { const a = AREAS.find((x) => x.id === id); return a ? (lang === "th" ? a.th : a.en) : id; };

// Open hours: "<weekday 0=Sun>-<part>" with parts m(09-12) a(13-17) e(18-22).
export const PARTS = ["m", "a", "e"] as const;
export type Part = (typeof PARTS)[number];
const PART_HOURS: Record<Part, [number, number]> = { m: [9, 12], a: [13, 17], e: [18, 22] };
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export function toSlots(keys: string[]): Slot[] {
  return keys.map((k) => { const [d, p] = k.split("-"); const [s, e] = PART_HOURS[p as Part]; return { day: Number(d), startHour: s, endHour: e }; });
}

export type Gender = "woman" | "man" | "non_binary";
export type SamplePerson = {
  id: string; nameEn: string; nameTh: string; age: number; area: string; gender: Gender; openTo: Gender[];
  ageMin: number; ageMax: number; interests: string[];
  promptEn: string; promptTh: string; answerEn: string; answerTh: string;
  // Hidden from the user. Used only by the silent unlock check and the simulation.
  pins: string[]; hours: string[]; willHookBack: boolean; closeAnswer: "yes" | "no" | null;
};
const ALL: Gender[] = ["woman", "man", "non_binary"];
export const PEOPLE: SamplePerson[] = [
  { id: "mint", nameEn: "Mint", nameTh: "มิ้นท์", age: 28, area: "ari", gender: "woman", openTo: ALL, ageMin: 25, ageMax: 40, interests: ["Markets", "Slow walks", "Noodles"], promptEn: "A perfect Sunday", promptTh: "วันอาทิตย์ที่ดีที่สุด", answerEn: "Market in the morning, a long walk, noodles after.", answerTh: "ตลาดตอนเช้า เดินเล่นนาน ๆ แล้วปิดด้วยก๋วยเตี๋ยว", pins: ["lumphini", "ortorkor", "yaowarat", "bacc", "ari"], hours: ["6-a", "6-e", "0-m", "0-a", "5-e"], willHookBack: true, closeAnswer: "yes" },
  { id: "nok", nameEn: "Nok", nameTh: "นก", age: 31, area: "thonglor", gender: "man", openTo: ["woman"], ageMin: 26, ageMax: 38, interests: ["Coffee", "Cinema", "Cycling"], promptEn: "Ask me about", promptTh: "ถามฉันเรื่อง", answerEn: "The best flat white within ten minutes of any BTS stop.", answerTh: "แฟลตไวท์ที่อร่อยที่สุดในระยะสิบนาทีจากสถานี BTS", pins: ["thonglor", "ari", "bacc", "lumphini", "chatuchak"], hours: ["4-e", "5-e", "6-e"], willHookBack: false, closeAnswer: null },
  { id: "beam", nameEn: "Beam", nameTh: "บีม", age: 30, area: "silom", gender: "man", openTo: ALL, ageMin: 24, ageMax: 40, interests: ["Parks", "Street food", "Photography"], promptEn: "A perfect Sunday", promptTh: "วันอาทิตย์ที่ดีที่สุด", answerEn: "Lumphini at sunrise, then whatever smells good.", answerTh: "สวนลุมตอนเช้า แล้วเดินตามกลิ่นอาหาร", pins: ["lumphini", "yaowarat", "watarun", "ortorkor", "thonglor"], hours: ["6-m", "6-a", "0-m", "3-e"], willHookBack: true, closeAnswer: "yes" },
  { id: "pim", nameEn: "Pim", nameTh: "พิม", age: 27, area: "siam", gender: "woman", openTo: ["man", "non_binary"], ageMin: 26, ageMax: 36, interests: ["Museums", "Books", "Tea"], promptEn: "I'm looking for", promptTh: "ฉันกำลังมองหา", answerEn: "Someone who'll wander a gallery with me and not check their phone.", answerTh: "คนที่เดินดูหอศิลป์กับฉันโดยไม่เช็กมือถือ", pins: ["bacc", "ari", "ortorkor", "lumphini", "thonglor"], hours: ["6-a", "6-e", "5-e", "0-a"], willHookBack: true, closeAnswer: "no" },
  { id: "ton", nameEn: "Ton", nameTh: "ต้น", age: 33, area: "old", gender: "man", openTo: ["woman", "non_binary"], ageMin: 27, ageMax: 38, interests: ["Temples", "Boats", "History"], promptEn: "Ask me about", promptTh: "ถามฉันเรื่อง", answerEn: "Why the river looks different at every hour.", answerTh: "ทำไมแม่น้ำถึงหน้าตาไม่เหมือนกันทุกชั่วโมง", pins: ["watarun", "yaowarat", "bacc"], hours: ["2-e", "3-e"], willHookBack: false, closeAnswer: null },
  { id: "fah", nameEn: "Fah", nameTh: "ฟ้า", age: 29, area: "chatuchak", gender: "woman", openTo: ["man", "woman"], ageMin: 25, ageMax: 38, interests: ["Plants", "Vintage", "Markets"], promptEn: "A perfect Sunday", promptTh: "วันอาทิตย์ที่ดีที่สุด", answerEn: "Chatuchak with an empty tote bag and no plan.", answerTh: "จตุจักรพร้อมถุงผ้าเปล่าและไม่มีแผน", pins: ["chatuchak", "ortorkor", "ari", "lumphini", "yaowarat"], hours: ["6-m", "6-a", "0-m", "5-e"], willHookBack: true, closeAnswer: null },
  { id: "ploy", nameEn: "Ploy", nameTh: "พลอย", age: 26, area: "ari", gender: "non_binary", openTo: ALL, ageMin: 24, ageMax: 35, interests: ["Music", "Coffee", "Zines"], promptEn: "I'm looking for", promptTh: "ฉันกำลังมองหา", answerEn: "A good listener and a better playlist.", answerTh: "คนฟังเก่ง กับเพลย์ลิสต์ที่เจ๋งกว่า", pins: ["ari", "thonglor", "bacc"], hours: ["4-e", "6-e"], willHookBack: false, closeAnswer: null },
  { id: "arm", nameEn: "Arm", nameTh: "อาร์ม", age: 35, area: "yaowarat", gender: "man", openTo: ALL, ageMin: 28, ageMax: 42, interests: ["Cooking", "Street food", "Night walks"], promptEn: "Ask me about", promptTh: "ถามฉันเรื่อง", answerEn: "The one stall on Yaowarat worth queueing for.", answerTh: "ร้านเดียวบนเยาวราชที่คุ้มกับการต่อคิว", pins: ["yaowarat", "watarun", "lumphini", "ortorkor", "bacc"], hours: ["5-e", "6-e", "6-a"], willHookBack: true, closeAnswer: "yes" },
];
export const personById = new Map(PEOPLE.map((p) => [p.id, p]));
export const personName = (p: SamplePerson, lang: "en" | "th") => (lang === "th" ? p.nameTh : p.nameEn);

// Warm, plain, safe replies from sample people (no links, contact details or money).
export const REPLIES: { en: string; th: string }[] = [
  { en: "Hi! Glad we both picked the same kind of place.", th: "สวัสดี! ดีใจที่เราเลือกที่แนวเดียวกัน" },
  { en: "Honestly I'd rather just meet. Does the plan work for you?", th: "จริง ๆ อยากเจอกันเลยมากกว่า แผนนี้โอเคกับคุณไหม" },
  { en: "Ha, that's funny. Tell me more when we're there.", th: "ฮ่า ตลกดี ไว้เล่าต่อตอนเจอกันนะ" },
  { en: "I'm usually early, just so you know.", th: "ปกติฉันไปถึงก่อนเวลานะ บอกไว้ก่อน" },
  { en: "Sounds good to me.", th: "ฟังดีเลย" },
  { en: "See you soon!", th: "แล้วเจอกันเร็ว ๆ นี้!" },
];

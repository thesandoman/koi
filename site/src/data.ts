// Illustrative demo data only: not real partners, not real people.
export type Venue = { id: string; x: number; y: number; en: string; th: string };

// Positions are in a 500 x 700 map space (north up).
export const VENUES: Venue[] = [
  { id: "chatuchak", x: 300, y: 78, en: "Chatuchak Weekend Market", th: "ตลาดนัดจตุจักร" },
  { id: "ortorkor", x: 428, y: 158, en: "Or Tor Kor Market", th: "ตลาด อ.ต.ก." },
  { id: "ari", x: 240, y: 222, en: "Soi Ari cafés", th: "คาเฟ่ซอยอารีย์" },
  { id: "bacc", x: 300, y: 352, en: "Bangkok Art and Culture Centre", th: "หอศิลปวัฒนธรรมกรุงเทพฯ" },
  { id: "thonglor", x: 425, y: 330, en: "Thonglor cafés", th: "คาเฟ่ทองหล่อ" },
  { id: "lumphini", x: 330, y: 478, en: "Lumphini Park", th: "สวนลุมพินี" },
  { id: "watarun", x: 66, y: 392, en: "Wat Arun riverside", th: "ริมน้ำวัดอรุณ" },
  { id: "yaowarat", x: 214, y: 588, en: "Yaowarat street food", th: "อาหารริมทางเยาวราช" },
];
export const SAM_PINS = new Set(["lumphini", "ortorkor", "yaowarat", "bacc", "thonglor"]);
export const SAM_HOURS = new Set(["4-e", "5-e", "6-a", "6-e", "0-m", "0-a"]);
export const PARTS = ["m", "a", "e"] as const;
export type Part = (typeof PARTS)[number];
export const START: Record<Part, number> = { m: 9, a: 13, e: 18 };
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const AREAS: [string, string, string][] = [
  ["ari", "Ari", "อารีย์"], ["siam", "Siam", "สยาม"], ["sukhumvit", "Sukhumvit", "สุขุมวิท"],
  ["thonglor", "Thonglor", "ทองหล่อ"], ["silom", "Silom", "สีลม"], ["old", "Old Town", "เมืองเก่า"],
  ["yaowarat", "Yaowarat", "เยาวราช"], ["chatuchak", "Chatuchak", "จตุจักร"], ["other", "Somewhere else", "ที่อื่น"],
];
export const venueById = (id: string) => VENUES.find((v) => v.id === id)!;

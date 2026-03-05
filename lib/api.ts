import type {
  PrayerTimesResponse,
  FastingResponse,
  NamesResponse,
  Coords,
} from "@/types";

// ⚠️  Replace with your actual key from islamicapi.com
export const API_KEY = process.env.NEXT_PUBLIC_ISLAMIC_API_KEY ?? "YOUR_API_KEY";
const BASE = "https://islamicapi.com/api/v1";

export async function fetchPrayerTimes(
  coords: Coords,
  method = 3,
  school = 1
): Promise<PrayerTimesResponse> {
  const url = `${BASE}/prayer-time/?lat=${coords.lat}&lon=${coords.lon}&method=${method}&school=${school}&api_key=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchFasting(
  coords: Coords,
  method = 3,
  date = ""
): Promise<FastingResponse> {
  const dateQ = date ? `&date=${date}` : "";
  const url = `${BASE}/fasting/?lat=${coords.lat}&lon=${coords.lon}&method=${method}&api_key=${API_KEY}${dateQ}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchNames(language = "en"): Promise<NamesResponse> {
  const url = `${BASE}/asma-ul-husna/?language=${language}&api_key=${API_KEY}`;
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getUserLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message))
    );
  });
}

export function timeStrToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export const METHODS = [
  { value: 3,  label: "Muslim World League" },
  { value: 2,  label: "ISNA (North America)" },
  { value: 1,  label: "Univ. of Islamic Sciences, Karachi" },
  { value: 4,  label: "Umm Al-Qura University, Makkah" },
  { value: 5,  label: "Egyptian General Authority" },
  { value: 8,  label: "Gulf Region" },
  { value: 9,  label: "Kuwait" },
  { value: 10, label: "Qatar" },
  { value: 11, label: "MUIS Singapore" },
  { value: 12, label: "UOIF France" },
  { value: 13, label: "Diyanet Turkey" },
  { value: 17, label: "JAKIM Malaysia" },
  { value: 18, label: "Tunisia" },
  { value: 19, label: "Algeria" },
  { value: 20, label: "KEMENAG Indonesia" },
  { value: 21, label: "Morocco" },
  { value: 23, label: "Jordan" },
];

export const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export const PRAYER_META: Record<string, { icon: string; color: string }> = {
  Fajr:    { icon: "🌄", color: "from-indigo-500/20 to-indigo-900/5" },
  Sunrise: { icon: "☀️", color: "from-orange-400/20 to-orange-900/5" },
  Dhuhr:   { icon: "🌤️", color: "from-yellow-400/20 to-yellow-900/5" },
  Asr:     { icon: "🌇", color: "from-amber-500/20 to-amber-900/5" },
  Maghrib: { icon: "🌆", color: "from-rose-500/20 to-rose-900/5" },
  Isha:    { icon: "🌙", color: "from-blue-600/20 to-blue-900/5" },
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic" },
  { code: "ur", label: "Urdu" },
  { code: "id", label: "Indonesian" },
  { code: "ms", label: "Malay" },
  { code: "tr", label: "Turkish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "bn", label: "Bengali" },
  { code: "hi", label: "Hindi" },
  { code: "fa", label: "Persian" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "so", label: "Somali" },
  { code: "sw", label: "Swahili" },
  { code: "ha", label: "Hausa" },
  { code: "pt", label: "Portuguese" },
];

export const THEME_OPTIONS = [
  { value: "dark"     as const, label: "Deep Teal",     icon: "🌿" },
  { value: "light"    as const, label: "Parchment",     icon: "📜" },
  { value: "warm"     as const, label: "Warm Night",    icon: "🪔" },
  { value: "midnight" as const, label: "Midnight Blue", icon: "🌌" },
];

// ── Hadith API ─────────────────────────────────────────────────────────────────
export const HADITH_API_KEY = process.env.NEXT_PUBLIC_HADITH_API_KEY ?? "YOUR_HADITH_API_KEY";
const HADITH_BASE = "https://hadithapi.com/api";
export const HADITH_BOOKS = [
  { slug: "sahih-bukhari",  label: "Sahih Bukhari",       count: 7276 },
  { slug: "sahih-muslim",   label: "Sahih Muslim",        count: 7564 },
  { slug: "al-tirmidhi",    label: "Jami' Al-Tirmidhi",   count: 3956 },
  { slug: "abu-dawood",     label: "Sunan Abu Dawood",    count: 5274 },
  { slug: "ibn-e-majah",    label: "Sunan Ibn-e-Majah",   count: 4341 },
  { slug: "sunan-nasai",    label: "Sunan An-Nasa'i",     count: 5762 },
  { slug: "mishkat",        label: "Mishkat Al-Masabih",  count: 6294 },
  { slug: "musnad-ahmad",   label: "Musnad Ahmad",        count: 4305 },
  { slug: "al-silsila-sahiha", label: "Al-Silsila Sahiha", count: 4035 },
];

import type { HadithsResponse, ChaptersResponse } from "@/types";

export async function fetchHadiths(params: {
  book?: string;
  chapter?: string;
  hadithNumber?: string;
  status?: string;
  paginate?: number;
  page?: number;
}): Promise<HadithsResponse> {
  const q = new URLSearchParams({ apiKey: HADITH_API_KEY });
  if (params.book)         q.set("book", params.book);
  if (params.chapter)      q.set("chapter", params.chapter);
  if (params.hadithNumber) q.set("hadithNumber", params.hadithNumber);
  if (params.status)       q.set("status", params.status);
  if (params.paginate)     q.set("paginate", String(params.paginate));
  if (params.page)         q.set("page", String(params.page));
  const res = await fetch(`${HADITH_BASE}/hadiths?${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchHadithChapters(bookSlug: string): Promise<ChaptersResponse> {
  const res = await fetch(`${HADITH_BASE}/${bookSlug}/chapters?apiKey=${HADITH_API_KEY}`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchRandomHadith(): Promise<HadithsResponse> {
  const book = HADITH_BOOKS[Math.floor(Math.random() * 3)]; // top 3 books
  const randomNum = Math.floor(Math.random() * Math.min(book.count, 500)) + 1;
  return fetchHadiths({ book: book.slug, hadithNumber: String(randomNum), paginate: 1 });
}
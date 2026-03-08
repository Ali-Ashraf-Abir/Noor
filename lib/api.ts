import axios from "axios";
import Cookies from "js-cookie";
import type {
  Theme,
  PrayerTimesResponse,
  FastingResponse,
  NamesResponse,
  HadithsResponse,
  ChaptersResponse,
  Coords,
} from "@/types";

// ── Backend API (Learning Platform) ───────────────────────────────────────────
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"];
      const isAuthRoute = authRoutes.some(route => window.location.pathname.startsWith(route));

      if (!isAuthRoute) {
        Cookies.remove("token");
        if (typeof window !== "undefined") window.location.href = "/auth/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Islamic API — proxied through your Express backend ────────────────────────
// API keys live in your backend .env — never exposed to the browser.
// Backend routes are mounted at /api/islamic/* (see routes/islamic.js)

export async function fetchPrayerTimes(
  coords: Coords,
  method = 3,
  school = 1
): Promise<PrayerTimesResponse> {
  const res = await api.get("/api/islamic/prayer-time", {
    params: { lat: coords.lat, lon: coords.lon, method, school },
  });
  return res.data;
}

export async function fetchFasting(
  coords: Coords,
  method = 3,
  date = ""
): Promise<FastingResponse> {
  const res = await api.get("/api/islamic/fasting", {
    params: { lat: coords.lat, lon: coords.lon, method, ...(date && { date }) },
  });
  return res.data;
}

export async function fetchNames(language = "en"): Promise<NamesResponse> {
  const res = await api.get("/api/islamic/names", {
    params: { language },
  });
  return res.data;
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

// ── Hadith API — proxied through your Express backend ─────────────────────────
// Backend routes are mounted at /api/islamic/hadiths/* (see routes/islamic.js)

export async function fetchHadiths(params: {
  book?: string;
  chapter?: string;
  hadithNumber?: string;
  status?: string;
  paginate?: number;
  page?: number;
}): Promise<HadithsResponse> {
  const res = await api.get("/api/islamic/hadiths", { params });
  return res.data;
}

export async function fetchHadithChapters(bookSlug: string): Promise<ChaptersResponse> {
  const res = await api.get(`/api/islamic/hadiths/${bookSlug}/chapters`);
  return res.data;
}

export async function fetchRandomHadith(): Promise<HadithsResponse> {
  const book = HADITH_BOOKS[Math.floor(Math.random() * 3)];
  const randomNum = Math.floor(Math.random() * Math.min(book.count, 500)) + 1;
  return fetchHadiths({ book: book.slug, hadithNumber: String(randomNum), paginate: 1 });
}

// ── Static Constants ───────────────────────────────────────────────────────────
export const THEME_OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "dark",     label: "Deep Teal",     icon: "🌿" },
  { value: "light",    label: "Parchment",     icon: "📜" },
  { value: "warm",     label: "Warm Night",    icon: "🪔" },
  { value: "midnight", label: "Midnight Blue", icon: "🌌" },
];

export const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  seerah:        { label: "Seerah",        icon: "🌙", color: "#4CAF50" },
  prophets:      { label: "Prophets",      icon: "⭐", color: "#2196F3" },
  sahabah:       { label: "Sahabah",       icon: "🛡️", color: "#9C27B0" },
  history:       { label: "History",       icon: "📜", color: "#FF5722" },
  islamic_facts: { label: "Islamic Facts", icon: "💎", color: "#FF9800" },
  hadith:        { label: "Hadith",        icon: "📖", color: "#009688" },
};

export const HADITH_BOOKS = [
  { slug: "sahih-bukhari",     label: "Sahih Bukhari",       count: 7276 },
  { slug: "sahih-muslim",      label: "Sahih Muslim",        count: 7564 },
  { slug: "al-tirmidhi",       label: "Jami' Al-Tirmidhi",   count: 3956 },
  { slug: "abu-dawood",        label: "Sunan Abu Dawood",    count: 5274 },
  { slug: "ibn-e-majah",       label: "Sunan Ibn-e-Majah",   count: 4341 },
  { slug: "sunan-nasai",       label: "Sunan An-Nasa'i",     count: 5762 },
  { slug: "mishkat",           label: "Mishkat Al-Masabih",  count: 6294 },
  { slug: "musnad-ahmad",      label: "Musnad Ahmad",        count: 4305 },
  { slug: "al-silsila-sahiha", label: "Al-Silsila Sahiha",   count: 4035 },
];

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
  { code: "en", label: "English"    },
  { code: "ar", label: "Arabic"     },
  { code: "ur", label: "Urdu"       },
  { code: "id", label: "Indonesian" },
  { code: "ms", label: "Malay"      },
  { code: "tr", label: "Turkish"    },
  { code: "fr", label: "French"     },
  { code: "de", label: "German"     },
  { code: "es", label: "Spanish"    },
  { code: "bn", label: "Bengali"    },
  { code: "hi", label: "Hindi"      },
  { code: "fa", label: "Persian"    },
  { code: "ru", label: "Russian"    },
  { code: "zh", label: "Chinese"    },
  { code: "ja", label: "Japanese"   },
  { code: "ko", label: "Korean"     },
  { code: "so", label: "Somali"     },
  { code: "sw", label: "Swahili"    },
  { code: "ha", label: "Hausa"      },
  { code: "pt", label: "Portuguese" },
];

export const getLevelColor = (level: number): string => {
  if (level >= 10) return "var(--gold-light)";
  if (level >= 7)  return "var(--accent-hover)";
  if (level >= 4)  return "var(--accent)";
  return "var(--text-secondary)";
};
// ── Prayer Time types ──────────────────────────────────────────────────────────
export interface PrayerTimes {
  [key: string]: string;
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface HijriMonth {
  number: number;
  en: string;
  ar: string;
  days: number;
}

export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: { en: string; ar: string };
  month: HijriMonth;
  year: string;
  designation: { abbreviated: string; expanded: string };
  holidays: string[];
  adjustedHolidays: string[];
  method: string;
}

export interface GregorianDate {
  date: string;
  format: string;
  day: string;
  weekday: { en: string };
  month: { number: number; en: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
}

export interface QiblaData {
  direction: { degrees: number; from: string; clockwise: boolean };
  distance: { value: number; unit: string };
}

export interface ProhibitedWindow {
  start: string;
  end: string;
}

export interface ProhibitedTimes {
  sunrise: ProhibitedWindow;
  noon: ProhibitedWindow;
  sunset: ProhibitedWindow;
}

export interface TimezoneData {
  name: string;
  utc_offset: string;
  abbreviation: string;
}

export interface PrayerTimesData {
  times: PrayerTimes;
  date: { readable: string; timestamp: string; hijri: HijriDate; gregorian: GregorianDate };
  qibla: QiblaData;
  prohibited_times: ProhibitedTimes;
  timezone: TimezoneData;
}

export interface PrayerTimesResponse {
  code: number;
  status: string;
  data?: PrayerTimesData;
  message?: string;
}

// ── Fasting types ──────────────────────────────────────────────────────────────
export interface FastingTime {
  sahur: string;
  iftar: string;
  duration: string;
}

export interface FastingEntry {
  date: string;
  hijri: string;
  hijri_readable: string;
  time: FastingTime;
}

export interface WhiteDays {
  status: string;
  days: { "13th": string; "14th": string; "15th": string };
}

export interface FastingData {
  fasting: FastingEntry[];
  white_days: WhiteDays;
}

export interface FastingResponse {
  code: number;
  status: string;
  range?: string;
  data?: FastingData;
  message?: string;
}

// ── Asma ul Husna types ────────────────────────────────────────────────────────
export interface AllahName {
  number: number;
  name: string;
  transliteration: string;
  translation: string;
  meaning: string;
  audio: string;
}

export interface NamesResponse {
  code: number;
  status: string;
  data?: { names: AllahName[] };
  message?: string;
}

// ── Theme ──────────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light" | "warm" | "midnight";

export interface ThemeOption {
  value: Theme;
  label: string;
  icon: string;
}

// ── Misc ───────────────────────────────────────────────────────────────────────
export interface CalculationMethod {
  value: number;
  label: string;
}

export interface NextPrayer {
  name: string;
  time: string;
  secondsLeft: number;
}

export interface Coords {
  lat: number;
  lon: number;
}

// ── Hadith types ───────────────────────────────────────────────────────────────
export interface HadithBook {
  id: number;
  bookName: string;
  writerName: string;
  bookSlug: string;
  hadiths_count: string;
  chapters_count: string;
}

export interface HadithChapter {
  id: number;
  chapterNumber: string;
  chapterEnglish: string;
  chapterUrdu: string;
  chapterArabic: string;
  bookSlug: string;
}

export interface Hadith {
  id: number;
  hadithNumber: string;
  englishNarrator: string;
  hadithEnglish: string;
  hadithUrdu: string;
  hadithArabic: string;
  urduNarrator: string;
  headingEnglish: string | null;
  chapterId: string;
  bookSlug: string;
  volume: string;
  status: string;
  book: { bookName: string; writerName: string; bookSlug: string };
  chapter: { chapterEnglish: string; chapterArabic: string; chapterUrdu: string };
}

export interface HadithsResponse {
  status: number;
  message: string;
  hadiths: {
    current_page: number;
    data: Hadith[];
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BooksResponse {
  status: number;
  message: string;
  books: HadithBook[];
}

export interface ChaptersResponse {
  status: number;
  message: string;
  chapters: HadithChapter[];
}
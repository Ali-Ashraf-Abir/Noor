"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchPrayerTimes,
  getUserLocation,
  METHODS,
  PRAYER_ORDER,
  timeStrToMinutes,
} from "@/lib/api";
import type { PrayerTimesData, Coords } from "@/types";
import LocationButton from "@/components/LocationButton";
import ErrorBanner from "@/components/ErrorBanner";
import CountdownTimer from "@/components/CountDownTimer";
import QiblaCompass from "@/components/QiblaCompass";

// ── Persistence keys ───────────────────────────────────────────────────────────
const LS_COORDS = "prayer-coords";
const LS_METHOD = "prayer-method";
const LS_SCHOOL = "prayer-school";

function loadStored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

// ── SVG icon set ──────────────────────────────────────────────────────────────
const Icons = {
  Fajr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M3 12h2m14 0h2M6.34 17.66l-1.42 1.42M19.08 4.92l-1.42 1.42" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" opacity="0.4" />
      <path strokeLinecap="round" d="M3 17c2-4 6-6 9-6s7 2 9 6" strokeWidth="1.5" />
    </svg>
  ),
  Sunrise: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m-7.07 2.93 1.41 1.41M3 13h2m14 0h2m-3.34-5.66 1.41-1.41" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a7 7 0 0 1 14 0" />
      <line x1="3" y1="19" x2="21" y2="19" strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v4" opacity="0.5" />
    </svg>
  ),
  Dhuhr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Asr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <circle cx="12" cy="12" r="3.5" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" opacity="0.5" />
      <path strokeLinecap="round" d="M3 17c3-3 6-4 9-4s6 1 9 4" />
    </svg>
  ),
  Maghrib: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a7 7 0 0 1 9.9-6.36A5 5 0 1 1 17 19" />
      <line x1="3" y1="19" x2="21" y2="19" strokeLinecap="round" />
    </svg>
  ),
  Isha: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
    </svg>
  ),
  Compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z" />
    </svg>
  ),
  Globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3.6 9h16.8M3.6 15h16.8" />
      <path strokeLinecap="round" d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" />
    </svg>
  ),
  Ban: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M5.636 5.636 18.364 18.364" />
    </svg>
  ),
  Pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  Refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
};

const PRAYER_COLORS: Record<string, string> = {
  Fajr: "text-indigo-400",
  Sunrise: "text-orange-400",
  Dhuhr: "text-yellow-400",
  Asr: "text-amber-400",
  Maghrib: "text-rose-400",
  Isha: "text-blue-400",
};

function getNextPrayer(times: Record<string, string>) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const name of PRAYER_ORDER) {
    const prayerMinutes = timeStrToMinutes(times[name]);
    if (prayerMinutes > currentMinutes) {
      return { name, time: times[name], secondsLeft: (prayerMinutes - currentMinutes) * 60 - now.getSeconds() };
    }
  }
  const fajrMinutes = timeStrToMinutes(times["Fajr"]);
  const minutesLeftToday = 24 * 60 - currentMinutes;
  return { name: "Fajr", time: times["Fajr"], secondsLeft: (minutesLeftToday + fajrMinutes) * 60 - now.getSeconds() };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function PrayerTimesPage() {
  const [data, setData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [method, setMethod] = useState(3);
  const [school, setSchool] = useState(1);
  const [now, setNow] = useState(new Date());
  // has the component mounted and read localStorage yet?
  const [hydrated, setHydrated] = useState(false);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── On mount: restore saved prefs and auto-load if coords exist ──────────────
  useEffect(() => {
    const savedCoords = loadStored<Coords | null>(LS_COORDS, null);
    const savedMethod = loadStored<number>(LS_METHOD, 3);
    const savedSchool = loadStored<number>(LS_SCHOOL, 1);

    setMethod(savedMethod);
    setSchool(savedSchool);

    if (savedCoords) {
      setCoords(savedCoords);
      // Auto-fetch with saved prefs
      fetchPrayerTimes(savedCoords, savedMethod, savedSchool)
        .then(res => {
          if (res.code === 200 && res.data) setData(res.data);
          else setError(res.message ?? "Failed to fetch prayer times.");
        })
        .catch(e => setError((e as Error).message))
        .finally(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch helper (used on filter changes + manual locate) ────────────────────
  const load = useCallback(async (c: Coords, m: number, s: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPrayerTimes(c, m, s);
      if (res.code === 200 && res.data) setData(res.data);
      else setError(res.message ?? "Failed to fetch prayer times.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Re-fetch when method/school changes (only if coords already known) ───────
  useEffect(() => {
    if (!hydrated || !coords) return;
    save(LS_METHOD, method);
    save(LS_SCHOOL, school);
    load(coords, method, school);
  }, [method, school]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual location button ───────────────────────────────────────────────────
  const handleLocate = async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getUserLocation();
      setCoords(c);
      save(LS_COORDS, c);
      save(LS_METHOD, method);
      save(LS_SCHOOL, school);
      await load(c, method, school);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  // ── Clear saved location ─────────────────────────────────────────────────────
  const handleClearLocation = () => {
    try { localStorage.removeItem(LS_COORDS); } catch { }
    setCoords(null);
    setData(null);
    setError(null);
  };

  const nextPrayer = data ? getNextPrayer(data.times) : null;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const hasSavedLocation = !!coords;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">
            Prayer Times
          </h1>
          <p className="text-[var(--text-muted)]">Accurate timings based on your location</p>
        </div>

        {/* Controls */}
        <div className="card-glass rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Calculation Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(Number(e.target.value))}
                className="input"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Madhab (Asr)
              </label>
              <select
                value={school}
                onChange={(e) => setSchool(Number(e.target.value))}
                className="input"
              >
                <option value={1}>Shafi / Standard</option>
                <option value={2}>Hanafi</option>
              </select>
            </div>
            <div className="flex items-end">
              <LocationButton loading={loading} hasLocation={hasSavedLocation} onClick={handleLocate} />
            </div>
          </div>

          {/* Saved location indicator */}
          {hasSavedLocation && data && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
                <span className="text-[var(--gold)]">{Icons.Pin}</span>
                <span>Location saved · auto-loads on each visit</span>
              </div>
              <button
                onClick={handleClearLocation}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                {Icons.Refresh}
                Reset location
              </button>
            </div>
          )}

          {/* First visit prompt */}
          {!hasSavedLocation && !loading && (
            <p className="text-[var(--text-muted)] text-sm text-center mt-4">
              Click "Use My Location" to fetch today's prayer times. Your location will be saved for future visits.
            </p>
          )}

          {/* Auto-loading indicator on hydration */}
          {hasSavedLocation && loading && (
            <p className="text-[var(--text-muted)] text-sm text-center mt-4">
              Loading your saved prayer times…
            </p>
          )}
        </div>

        {error && <ErrorBanner message={error} />}

        {data && (
          <>
            {/* Date row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="card rounded-xl p-4 text-center">
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Gregorian</p>
                <p className="text-[var(--text-primary)] font-semibold text-sm">{data.date.gregorian.date}</p>
                <p className="text-[var(--text-muted)] text-xs">{data.date.gregorian.weekday.en}</p>
              </div>
              <div className="card rounded-xl p-4 text-center">
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Hijri</p>
                <p className="text-[var(--gold-light)] font-semibold text-sm">
                  {data.date.hijri.day} {data.date.hijri.month.en}
                </p>
                <p className="text-[var(--text-muted)] text-xs">{data.date.hijri.year} AH</p>
              </div>
              <div className="card rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Live Clock</p>
                <p className="text-[var(--text-primary)] font-mono font-bold text-lg">
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
                <p className="text-[var(--text-muted)] text-xs">{data.timezone.name}</p>
              </div>
            </div>

            {/* Next prayer countdown */}
            {nextPrayer && (
              <div className="card rounded-2xl p-6 text-center" style={{ borderColor: "var(--border-accent)" }}>
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-4">
                  Next Prayer
                </p>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className={`${PRAYER_COLORS[nextPrayer.name] ?? "text-[var(--gold)]"}`}>
                    {Icons[nextPrayer.name as keyof typeof Icons]}
                  </span>
                  <div className="text-left">
                    <p className="font-display font-bold text-3xl text-[var(--gold-light)]">
                      {nextPrayer.name}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm">at {nextPrayer.time}</p>
                  </div>
                </div>
                <CountdownTimer totalSeconds={nextPrayer.secondsLeft} />
              </div>
            )}

            {/* Prayer cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PRAYER_ORDER.map((name) => {
                const prayerMins = timeStrToMinutes(data.times[name]);
                const isNext = nextPrayer?.name === name;
                const isPast = prayerMins < currentMinutes;
                return (
                  <div
                    key={name}
                    className={`card rounded-xl p-5 text-center transition-all duration-300 ${isNext ? "prayer-active" : isPast ? "opacity-50" : ""
                      }`}
                  >
                    <div className={`flex justify-center mb-3 ${PRAYER_COLORS[name] ?? "text-[var(--gold)]"}`}>
                      {Icons[name as keyof typeof Icons]}
                    </div>
                    <p className="text-[var(--text-muted)] text-xs mb-1">{name}</p>
                    <p className={`font-bold text-lg font-mono ${isNext ? "text-[var(--gold-light)]" : "text-[var(--text-primary)]"
                      }`}>
                      {data.times[name]}
                    </p>
                    {isNext && <span className="badge badge-gold mt-2">Next</span>}
                  </div>
                );
              })}
            </div>

            {/* Qibla + Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card rounded-xl p-5 flex items-center gap-4">
                <span className="text-[var(--gold)] flex-shrink-0">{Icons.Compass}</span>
                <div>
                  <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-0.5">
                    Qibla Direction
                  </p>
                  <p className="text-[var(--gold-light)] font-bold text-xl">
                    {data.qibla.direction.degrees}°
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">
                    from North · {data.qibla.distance.value.toLocaleString()} km to Makkah
                  </p>
                  {data && (
                    <QiblaCompass qiblaDegrees={data.qibla.direction.degrees} />
                  )}
                </div>
              </div>
              <div className="card rounded-xl p-5 flex items-center gap-4">
                <span className="text-[var(--accent)] flex-shrink-0">{Icons.Globe}</span>
                <div>
                  <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-0.5">
                    Timezone
                  </p>
                  <p className="text-[var(--text-primary)] font-semibold">{data.timezone.name}</p>
                  <p className="text-[var(--text-muted)] text-xs">
                    UTC {data.timezone.utc_offset} · {data.timezone.abbreviation}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional times */}
            <details className="card rounded-xl overflow-hidden group">
              <summary className="px-5 py-4 cursor-pointer flex items-center justify-between text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors select-none">
                <span className="font-medium">Additional Times</span>
                <span className="text-[var(--gold)] text-xs group-open:rotate-180 transition-transform inline-block">▾</span>
              </summary>
              <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[var(--border)]">
                {(["Sunrise", "Sunset", "Imsak", "Midnight"] as const).map((name) => (
                  <div key={name} className="bg-[var(--bg-elevated)] rounded-lg p-3 text-center">
                    <p className="text-[var(--text-muted)] text-xs mb-1">{name}</p>
                    <p className="text-[var(--text-primary)] text-sm font-mono font-semibold">
                      {data.times[name]}
                    </p>
                  </div>
                ))}
              </div>
            </details>

            {/* Prohibited times */}
            <div className="card rounded-xl p-5">
              <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-red-400">{Icons.Ban}</span>
                Prohibited Prayer Times
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(data.prohibited_times) as [string, { start: string; end: string }][]).map(
                  ([key, val]) => (
                    <div
                      key={key}
                      className="bg-[var(--bg-elevated)] border border-red-500/20 rounded-lg p-3 text-center"
                    >
                      <p className="text-red-400 text-xs capitalize mb-1">{key}</p>
                      <p className="text-[var(--text-primary)] text-xs font-mono">
                        {val.start} – {val.end}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
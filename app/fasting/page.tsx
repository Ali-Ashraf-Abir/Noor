"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchFasting, getUserLocation, METHODS } from "@/lib/api";
import type { FastingData, FastingEntry, Coords } from "@/types";
import LocationButton from "@/components/LocationButton";
import ErrorBanner from "@/components/ErrorBanner";
import CountdownTimer from "@/components/CountDownTimer";


type ViewMode = "today" | "date" | "month";

// ── SVG icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Sahur: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
      <path strokeLinecap="round" d="M15 9.5a2.5 2.5 0 0 1-2.5 2.5" opacity="0.5"/>
    </svg>
  ),
  Iftar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a7 7 0 0 1 9.9-6.36A5 5 0 1 1 17 19" />
      <line x1="3" y1="19" x2="21" y2="19" strokeLinecap="round" />
    </svg>
  ),
  Moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  WhiteDays: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  ),
  Hourglass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14M5 21h14M7 3c0 4 2 6 5 9-3 3-5 5-5 9M17 3c0 4-2 6-5 9 3 3 5 5 5 9" />
    </svg>
  ),
};

function parseTimeToSeconds(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let [, h, m, period] = match;
  let hours = parseInt(h, 10);
  const mins = parseInt(m, 10);
  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  const now = new Date();
  const target = new Date();
  target.setHours(hours, mins, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

function FastingCard({ entry, isToday }: { entry: FastingEntry; isToday: boolean }) {
  const [sahurSecs, setSahurSecs] = useState(0);
  const [iftarSecs, setIftarSecs] = useState(0);

  useEffect(() => {
    if (!isToday) return;
    const recalc = () => {
      setSahurSecs(parseTimeToSeconds(entry.time.sahur));
      setIftarSecs(parseTimeToSeconds(entry.time.iftar));
    };
    recalc();
    const id = setInterval(recalc, 30_000);
    return () => clearInterval(id);
  }, [entry, isToday]);

  return (
    <div className={`card rounded-2xl overflow-hidden ${isToday ? "border-[var(--border-accent)]" : ""}`}>
      {isToday && (
        <div className="bg-[var(--gold-muted)] px-5 py-2 flex items-center gap-2 border-b border-[var(--border-accent)]">
          <span className="badge badge-gold">Today</span>
          <span className="text-[var(--text-muted)] text-xs">{entry.date} · {entry.hijri_readable}</span>
        </div>
      )}
      <div className="p-5">
        {!isToday && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--text-secondary)] text-sm font-medium">{entry.date}</span>
            <span className="text-[var(--text-muted)] text-xs">{entry.hijri}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Sahur */}
          <div className="text-center">
            <div className="text-indigo-400 mb-3">{Icons.Sahur}</div>
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Sahur</p>
            <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{entry.time.sahur}</p>
            {isToday && sahurSecs > 0 && (
              <div className="mt-3">
                <p className="text-[var(--text-muted)] text-xs mb-2">Until Sahur ends</p>
                <CountdownTimer totalSeconds={sahurSecs} />
              </div>
            )}
          </div>

          {/* Iftar */}
          <div className="text-center">
            <div className="text-amber-400 mb-3">{Icons.Iftar}</div>
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Iftar</p>
            <p className="font-display font-bold text-2xl text-[var(--text-primary)]">{entry.time.iftar}</p>
            {isToday && iftarSecs > 0 && (
              <div className="mt-3">
                <p className="text-[var(--text-muted)] text-xs mb-2">Until Iftar</p>
                <CountdownTimer totalSeconds={iftarSecs} />
              </div>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2">
          <span className="text-[var(--text-muted)]">{Icons.Hourglass}</span>
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Duration</span>
          <span className="text-[var(--gold-light)] font-bold text-lg ml-1">{entry.time.duration}</span>
        </div>
      </div>
    </div>
  );
}

export default function FastingPage() {
  const [data, setData] = useState<FastingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [method, setMethod] = useState(3);
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const buildDateParam = useCallback(
    (mode: ViewMode) => {
      if (mode === "date") return selectedDate;
      if (mode === "month") return selectedMonth;
      return "";
    },
    [selectedDate, selectedMonth]
  );

  const load = useCallback(
    async (c: Coords, mode: ViewMode) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchFasting(c, method, buildDateParam(mode));
        if (res.code === 200 && res.data) setData(res.data);
        else setError(res.message ?? "Failed to fetch fasting times.");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [method, buildDateParam]
  );

  const handleLocate = async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getUserLocation();
      setCoords(c);
      await load(c, viewMode);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!coords) { handleLocate(); return; }
    load(coords, viewMode);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">
            Fasting Times
          </h1>
          <p className="text-[var(--text-muted)]">Sahur & Iftar schedule for your location</p>
        </div>

        {/* Controls */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["today", "date", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === mode
                    ? "btn-gold"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
                }`}
              >
                {mode === "today" ? "Today" : mode === "date" ? "Specific Date" : "Full Month"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Calculation Method
              </label>
              <select value={method} onChange={(e) => setMethod(Number(e.target.value))} className="input">
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {viewMode === "date" && (
              <div>
                <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" />
              </div>
            )}

            {viewMode === "month" && (
              <div>
                <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">Month</label>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input" />
              </div>
            )}

            <div className={`flex items-end ${viewMode === "today" ? "sm:col-span-2" : ""}`}>
              <LocationButton
                loading={loading}
                hasLocation={!!coords}
                onClick={handleSearch}
                label="Use My Location"
                refreshLabel="Refresh"
              />
            </div>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Today / Single day */}
        {data && viewMode !== "month" && data.fasting[0] && (
          <>
            <FastingCard entry={data.fasting[0]} isToday={viewMode === "today"} />

            {/* White Days */}
            {data.white_days?.days && (
              <div className="card rounded-xl p-5">
                <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="text-[var(--gold)]">{Icons.WhiteDays}</span>
                  White Days — Ayyam al-Bid
                </h3>
                <p className="text-[var(--text-muted)] text-xs mb-4 pl-6">
                  The 13th, 14th &amp; 15th of each Islamic month — sunnah voluntary fasts
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(data.white_days.days) as [string, string][]).map(([day, date]) => (
                    <div key={day} className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg p-3 text-center">
                      <p className="text-[var(--gold)] text-xs capitalize mb-1 font-medium">{day} day</p>
                      <p className="text-[var(--text-primary)] text-sm font-medium">{date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Month table */}
        {data && viewMode === "month" && data.fasting.length > 0 && (
          <div className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                <span className="text-[var(--gold)]">{Icons.Calendar}</span>
                Monthly Fasting Schedule
              </h3>
              <span className="badge badge-gold">{data.fasting.length} days</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hijri</th>
                    <th>
                      <span className="flex items-center gap-1.5">
                        <span className="text-indigo-400">{Icons.Moon}</span> Sahur
                      </span>
                    </th>
                    <th>
                      <span className="flex items-center gap-1.5">
                        <span className="text-amber-400">{Icons.Iftar}</span> Iftar
                      </span>
                    </th>
                    <th className="hidden sm:table-cell">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fasting.map((entry) => {
                    const isToday = entry.date === todayStr;
                    return (
                      <tr key={entry.date} className={isToday ? "today" : ""}>
                        <td>
                          <span className={isToday ? "text-[var(--gold-light)] font-bold" : "text-[var(--text-primary)]"}>
                            {entry.date}
                          </span>
                          {isToday && <span className="ml-2 badge badge-gold">Today</span>}
                        </td>
                        <td className="text-[var(--text-muted)] text-xs">{entry.hijri}</td>
                        <td className="text-indigo-400 font-mono text-sm font-medium">{entry.time.sahur}</td>
                        <td className="text-amber-400 font-mono text-sm font-medium">{entry.time.iftar}</td>
                        <td className="hidden sm:table-cell text-[var(--text-muted)] text-xs">{entry.time.duration}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
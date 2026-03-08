"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconFajr = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M19.07 4.22l-.7.7M3 12h1M20 12h1M6 18a6 6 0 0 1 12 0"/>
    <circle cx="12" cy="11" r="3" opacity="0.5"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconDhuhr = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);
const IconAsr = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3.5"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" opacity="0.4"/>
    <path d="M4 17c2.5-2.5 5-4 8-4s5.5 1.5 8 4"/>
  </svg>
);
const IconMaghrib = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19a7 7 0 0 1 9.9-6.36A5 5 0 1 1 17 19"/>
    <line x1="3" y1="19" x2="21" y2="19"/>
  </svg>
);
const IconIsha = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/>
  </svg>
);
const IconFlame = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c0 1.38-.5 2-1 3 1.5 0 4-1.5 4-4.5 0-2-1.5-3.5-2-5.5-.5 1-1 2-1 3.5-1 0-1.5-1-2-2.5C8 12 8.5 14.5 8.5 14.5Z"/>
    <path d="M12 2C12 2 12 6 14 8c2 2 3 4 3 6a5 5 0 0 1-10 0c0-2 1-4 2-5.5C9.5 10 10 12 10 12S8 10 8 8c0-2 1.5-4 4-6Z" opacity="0.5"/>
  </svg>
);
const IconMosque = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20V10l4-4 2 2 3-5 3 5 2-2 4 4v10H3Z"/>
    <path d="M9 20v-5a3 3 0 0 1 6 0v5"/>
    <path d="M3 20h18"/>
    <path d="M12 3V1M9 4l-1-2M15 4l1-2"/>
  </svg>
);
const IconNote = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────────
type PrayerStatus = "onTime" | "late" | "missed" | "qadha" | null;

interface PrayerEntry {
  name: string;
  status: PrayerStatus;
  note: string;
}

interface SalahLog {
  date: string;
  prayers: PrayerEntry[];
}

interface Stats {
  totalLogged: number;
  totalOnTime: number;
  totalLate: number;
  totalMissed: number;
  totalQadha: number;
}

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

const PRAYER_ICON_MAP: Record<string, React.ReactNode> = {
  Fajr: <IconFajr />, Dhuhr: <IconDhuhr />, Asr: <IconAsr />,
  Maghrib: <IconMaghrib />, Isha: <IconIsha />,
};

const PRAYER_TIMES: Record<string, string> = {
  Fajr: "Pre-dawn", Dhuhr: "Midday", Asr: "Afternoon", Maghrib: "Sunset", Isha: "Night",
};

const STATUS_CONFIG = {
  onTime: { label: "On Time",  color: "#4ecd82", bg: "rgba(78,205,130,0.12)",  border: "rgba(78,205,130,0.3)"  },
  late:   { label: "Late",     color: "#c9a84c", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.3)"  },
  qadha:  { label: "Qadha",    color: "#7eb8e0", bg: "rgba(126,184,224,0.12)",border: "rgba(126,184,224,0.3)" },
  missed: { label: "Missed",   color: "#e07070", bg: "rgba(224,112,112,0.12)",border: "rgba(224,112,112,0.3)" },
};

const today = () => new Date().toISOString().slice(0, 10);

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SalahTrackerPage() {
  const [todayPrayers, setTodayPrayers] = useState<Record<string, PrayerEntry>>({});
  const [logs,  setLogs]   = useState<SalahLog[]>([]);
  const [stats, setStats]  = useState<Stats | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [mounted,  setMounted]  = useState(false);
  const [viewMode, setViewMode] = useState<"today" | "history">("today");

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get("/salah/today"),
        api.get("/salah?days=30"),
      ]);

      // Build today map
      const map: Record<string, PrayerEntry> = {};
      PRAYERS.forEach(p => { map[p] = { name: p, status: null, note: "" }; });
      (todayRes.data.log?.prayers ?? []).forEach((p: PrayerEntry) => { map[p.name] = p; });
      setTodayPrayers(map);

      setLogs(historyRes.data.logs ?? []);
      setStats(historyRes.data.stats ?? null);
      setStreak(historyRes.data.streak ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => setMounted(true));
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Save a single prayer ─────────────────────────────────────────────────────
  const savePrayer = async (name: string, status: PrayerStatus) => {
    setSaving(true);
    const note = todayPrayers[name]?.note ?? "";
    try {
      const res = await api.patch("/salah/prayer", { name, status, note });
      const updated = res.data.log?.prayers ?? [];
      setTodayPrayers(prev => {
        const next = { ...prev };
        updated.forEach((p: PrayerEntry) => { next[p.name] = p; });
        return next;
      });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const saveNote = async (name: string, note: string) => {
    const status = todayPrayers[name]?.status ?? "onTime";
    try {
      await api.patch("/salah/prayer", { name, status, note });
      setTodayPrayers(prev => ({ ...prev, [name]: { ...prev[name], note } }));
    } catch (e) { console.error(e); }
    setActiveNote(null);
  };

  const completedToday = PRAYERS.filter(p => todayPrayers[p]?.status && todayPrayers[p]?.status !== "missed").length;
  const pct = Math.round((completedToday / 5) * 100);

  if (loading) return <LoadingScreen />;

  return (
    <div className="st-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,400&family=Cormorant+SC:wght@300;400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        .st-root {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'EB Garamond', Georgia, serif;
          padding: 2rem 1rem 6rem;
          position: relative;
        }
        .st-root::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 0%, rgba(78,205,130,0.06), transparent 55%),
            radial-gradient(ellipse 40% 50% at 80% 100%, rgba(201,168,76,0.05), transparent 55%);
          pointer-events: none; z-index: 0;
        }

        .st-inner {
          position: relative; z-index: 1;
          max-width: 720px; margin: 0 auto;
        }

        /* ── Header ── */
        .st-header {
          text-align: center; margin-bottom: 2rem;
          opacity: 0; transform: translateY(-12px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .st-header.in { opacity: 1; transform: translateY(0); }
        .st-title {
          font-family: 'Cormorant SC', serif;
          font-size: 2rem; letter-spacing: 0.2em;
          color: var(--text-primary); margin-bottom: 0.3rem;
        }
        .st-subtitle {
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 1.1rem; color: var(--text-muted);
        }

        /* ── Streak banner ── */
        .streak-banner {
          background: var(--bg-surface);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 16px; padding: 1.25rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; margin-bottom: 1rem;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s;
        }
        .streak-banner.in { opacity: 1; transform: translateY(0); }
        .streak-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem; font-weight: 700; color: #c9a84c; line-height: 1;
        }
        .streak-lbl {
          font-family: 'Cormorant SC', serif;
          font-size: 0.9rem; letter-spacing: 0.14em;
          color: var(--text-muted); margin-top: 0.2rem;
        }
        .streak-icon { color: #c9a84c; }

        /* ── Stats row ── */
        .stats-row {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.7rem;
          margin-bottom: 1rem;
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.5s ease 0.14s, transform 0.5s ease 0.14s;
        }
        .stats-row.in { opacity: 1; transform: translateY(0); }
        .stat-chip {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 0.85rem 0.5rem; text-align: center;
        }
        .stat-chip-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1;
        }
        .stat-chip-lbl {
          font-family: 'Cormorant SC', serif;
          font-size: 0.72rem; letter-spacing: 0.1em; color: var(--text-muted);
          margin-top: 0.2rem;
        }
        @media (max-width: 480px) { .stats-row { grid-template-columns: repeat(2,1fr); } }

        /* ── Tabs ── */
        .tabs {
          display: flex; background: var(--bg-surface);
          border: 1px solid var(--border); border-radius: 12px;
          padding: 0.25rem; margin-bottom: 1.25rem;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.45s ease 0.2s, transform 0.45s ease 0.2s;
        }
        .tabs.in { opacity: 1; transform: translateY(0); }
        .tab-btn {
          flex: 1; padding: 0.65rem; border-radius: 9px;
          font-family: 'Cormorant SC', serif;
          font-size: 1.05rem; letter-spacing: 0.14em;
          color: var(--text-muted); background: none; border: none;
          cursor: pointer; transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--bg-elevated); color: #c9a84c;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /* ── Today panel ── */
        .today-progress {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1rem;
        }
        .today-progress-top {
          display: flex; justify-content: space-between; align-items: baseline;
          font-family: 'Cormorant SC', serif;
          font-size: 1rem; letter-spacing: 0.12em;
          color: var(--text-muted); margin-bottom: 0.7rem;
        }
        .today-pct { color: #4ecd82; font-size: 1.1rem; }
        .prog-track {
          height: 6px; background: var(--bg-elevated);
          border-radius: 999px; overflow: hidden;
        }
        .prog-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #4ecd82, #7eb8a0);
          transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .prog-fill::after {
          content: ''; position: absolute; right: 0; top: 0; bottom: 0;
          width: 12px; background: rgba(255,255,255,0.3);
          filter: blur(3px); border-radius: 999px;
        }

        /* ── Prayer cards ── */
        .prayer-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.25rem 1.5rem;
          margin-bottom: 0.7rem; position: relative;
          transition: border-color 0.2s;
        }
        .prayer-card.has-status { border-color: var(--pc-border); }
        .prayer-card-top {
          display: flex; align-items: center; gap: 1rem; margin-bottom: 0.9rem;
        }
        .prayer-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .prayer-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.35rem; font-weight: 600; color: var(--text-primary); flex: 1;
        }
        .prayer-time-lbl {
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 0.9rem; color: var(--text-muted);
        }
        .status-current {
          font-family: 'Cormorant SC', serif;
          font-size: 0.78rem; letter-spacing: 0.1em;
          padding: 3px 10px; border-radius: 999px; border: 1px solid;
        }

        /* Status buttons */
        .status-btns {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }
        .status-btn {
          flex: 1; min-width: 70px;
          padding: 0.55rem 0.25rem; border-radius: 10px;
          font-family: 'Cormorant SC', serif;
          font-size: 0.85rem; letter-spacing: 0.1em;
          border: 1px solid; cursor: pointer;
          transition: all 0.18s; text-align: center;
        }
        .status-btn:hover { transform: translateY(-1px); }
        .status-btn.active { transform: translateY(0); box-shadow: 0 0 0 2px var(--sb-color); }

        /* Note input */
        .note-area {
          margin-top: 0.75rem;
        }
        .note-input {
          width: 100%; background: var(--bg-elevated);
          border: 1px solid var(--border); border-radius: 10px;
          padding: 0.6rem 0.9rem; font-family: 'EB Garamond', serif;
          font-size: 1rem; color: var(--text-primary);
          resize: none; outline: none;
          transition: border-color 0.2s;
        }
        .note-input:focus { border-color: rgba(201,168,76,0.4); }
        .note-actions {
          display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.4rem;
        }
        .note-btn {
          font-family: 'Cormorant SC', serif; font-size: 0.9rem;
          letter-spacing: 0.1em; padding: 4px 14px; border-radius: 8px;
          border: 1px solid var(--border); cursor: pointer;
          background: var(--bg-elevated); color: var(--text-muted);
          transition: all 0.15s;
        }
        .note-btn.save {
          background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.3);
          color: #c9a84c;
        }
        .note-btn.save:hover { background: rgba(201,168,76,0.18); }
        .note-toggle {
          margin-top: 0.6rem; background: none; border: none;
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 0.92rem; color: var(--text-muted); cursor: pointer;
          text-decoration: underline; padding: 0;
          transition: color 0.2s;
          display: flex; align-items: center; gap: 0.35rem;
        }
        .note-toggle:hover { color: var(--text-secondary); }

        /* ── History panel ── */
        .hist-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 14px; margin-bottom: 0.7rem; overflow: hidden;
        }
        .hist-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.9rem 1.25rem;
          background: var(--bg-elevated);
        }
        .hist-date {
          font-family: 'Cormorant SC', serif;
          font-size: 1rem; letter-spacing: 0.12em; color: var(--text-secondary);
        }
        .hist-dots { display: flex; gap: 0.3rem; align-items: center; }
        .hist-dot {
          width: 9px; height: 9px; border-radius: 50%;
        }
        .hist-prayers {
          display: grid; grid-template-columns: repeat(5,1fr);
          padding: 0.75rem 1.25rem; gap: 0.4rem;
        }
        .hist-prayer-cell { text-align: center; }
        .hist-prayer-name {
          font-family: 'Cormorant SC', serif; font-size: 0.65rem;
          letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.2rem;
        }
        .hist-prayer-badge {
          font-size: 0.7rem; padding: 2px 6px; border-radius: 999px;
          border: 1px solid; font-family: 'Cormorant SC', serif;
          letter-spacing: 0.06em;
        }

        /* Loading */
        @keyframes breathe {
          0%,100% { opacity: 0.3; transform: scale(0.94); }
          50%      { opacity: 1;   transform: scale(1.04); }
        }
        .loading-icon { animation: breathe 2s ease-in-out infinite; font-size: 2.5rem; }
      `}</style>

      <div className="st-inner">

        {/* Header */}
        <div className={`st-header ${mounted ? "in" : ""}`}>
          <h1 className="st-title">Salah Tracker</h1>
          <p className="st-subtitle">Track your prayers, build your connection</p>
        </div>

        {/* Streak */}
        <div className={`streak-banner ${mounted ? "in" : ""}`}>
          <div>
            <div className="streak-num">{streak}</div>
            <div className="streak-lbl">Day Streak</div>
          </div>
          <div className="streak-icon"><IconFlame /></div>
        </div>

        {/* Stats */}
        {stats && (
          <div className={`stats-row ${mounted ? "in" : ""}`}>
            {[
              { val: stats.totalOnTime, lbl: "On Time",  color: "#4ecd82" },
              { val: stats.totalLate,   lbl: "Late",     color: "#c9a84c" },
              { val: stats.totalQadha,  lbl: "Qadha",    color: "#7eb8e0" },
              { val: stats.totalMissed, lbl: "Missed",   color: "#e07070" },
            ].map(s => (
              <div key={s.lbl} className="stat-chip">
                <div className="stat-chip-val" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-chip-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className={`tabs ${mounted ? "in" : ""}`}>
          <button className={`tab-btn ${viewMode === "today" ? "active" : ""}`} onClick={() => setViewMode("today")}>
            Today
          </button>
          <button className={`tab-btn ${viewMode === "history" ? "active" : ""}`} onClick={() => setViewMode("history")}>
            History
          </button>
        </div>

        {/* ── Today ── */}
        {viewMode === "today" && (
          <>
            <div className="today-progress">
              <div className="today-progress-top">
                <span>{completedToday} of 5 prayers</span>
                <span className="today-pct">{pct}%</span>
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {PRAYERS.map((name, i) => {
              const entry  = todayPrayers[name] ?? { name, status: null, note: "" };
              const sc     = entry.status ? STATUS_CONFIG[entry.status] : null;
              const isNote = activeNote === name;

              return (
                <div
                  key={name}
                  className={`prayer-card ${sc ? "has-status" : ""}`}
                  style={{
                    "--pc-border": sc?.border ?? "var(--border)",
                    animationDelay: `${i * 0.07}s`,
                  } as React.CSSProperties}
                >
                  <div className="prayer-card-top">
                    <span className="prayer-icon" style={{ color: "var(--text-muted)" }}>{PRAYER_ICON_MAP[name]}</span>
                    <div style={{ flex: 1 }}>
                      <div className="prayer-name">{name}</div>
                      <div className="prayer-time-lbl">{PRAYER_TIMES[name]}</div>
                    </div>
                    {sc && (
                      <span
                        className="status-current"
                        style={{ color: sc.color, borderColor: sc.border, background: sc.bg }}
                      >
                        {sc.label}
                      </span>
                    )}
                  </div>

                  <div className="status-btns">
                    {(Object.entries(STATUS_CONFIG) as [PrayerStatus, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        className={`status-btn ${entry.status === key ? "active" : ""}`}
                        style={{
                          "--sb-color": cfg.color,
                          color: entry.status === key ? cfg.color : "var(--text-muted)",
                          borderColor: entry.status === key ? cfg.border : "var(--border)",
                          background: entry.status === key ? cfg.bg : "var(--bg-elevated)",
                        } as React.CSSProperties}
                        onClick={() => savePrayer(name, key)}
                        disabled={saving}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>

                  {!isNote && (
                    <button className="note-toggle" onClick={() => setActiveNote(name)}>
                      <IconNote />
                      {entry.note ? entry.note : "add note"}
                    </button>
                  )}

                  {isNote && (
                    <div className="note-area">
                      <textarea
                        className="note-input"
                        rows={2}
                        defaultValue={entry.note}
                        placeholder="Optional note…"
                        id={`note-${name}`}
                      />
                      <div className="note-actions">
                        <button className="note-btn" onClick={() => setActiveNote(null)}>Cancel</button>
                        <button
                          className="note-btn save"
                          onClick={() => {
                            const el = document.getElementById(`note-${name}`) as HTMLTextAreaElement;
                            saveNote(name, el?.value ?? "");
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── History ── */}
        {viewMode === "history" && (
          <>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", opacity: 0.4 }}><IconMosque /></div>
                <p style={{ fontFamily: "'Cormorant SC', serif", fontSize: "1.1rem", letterSpacing: "0.16em" }}>
                  No logs yet
                </p>
                <p style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", marginTop: "0.4rem" }}>
                  Start tracking today's prayers above
                </p>
              </div>
            ) : (
              logs.map(log => {
                const dots = PRAYERS.map(p => {
                  const entry = log.prayers.find(pr => pr.name === p);
                  return entry?.status ? STATUS_CONFIG[entry.status].color : "#444";
                });
                const allDone = PRAYERS.every(p =>
                  log.prayers.some(pr => pr.name === p && pr.status !== "missed")
                );
                return (
                  <div key={log.date} className="hist-card">
                    <div className="hist-head">
                      <span className="hist-date">{formatDate(log.date)}</span>
                      <div className="hist-dots">
                        {allDone && <span style={{ fontSize: "0.7rem", color: "#4ecd82", fontFamily: "'Cormorant SC',serif", letterSpacing: "0.1em", marginRight: "0.4rem" }}>✓ Complete</span>}
                        {dots.map((c, i) => (
                          <div key={i} className="hist-dot" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="hist-prayers">
                      {PRAYERS.map(p => {
                        const entry = log.prayers.find(pr => pr.name === p);
                        const sc = entry?.status ? STATUS_CONFIG[entry.status] : null;
                        return (
                          <div key={p} className="hist-prayer-cell">
                            <div className="hist-prayer-name">{p}</div>
                            <div
                              className="hist-prayer-badge"
                              style={sc
                                ? { color: sc.color, borderColor: sc.border, background: sc.bg }
                                : { color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-elevated)" }
                              }
                            >
                              {sc ? sc.label.slice(0, 4) : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
      <div className="loading-icon" style={{ color: "var(--text-muted)" }}><IconMosque /></div>
      <p style={{ fontFamily: "'Cormorant SC', serif", fontSize: "1.1rem", letterSpacing: "0.2em", color: "var(--text-muted)" }}>Loading</p>
    </div>
  );
}
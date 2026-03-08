"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Tasbih {
  _id: string;
  name: string;
  arabic: string;
  target: number;
  count: number;
  totalEver: number;
  color: string;
  isPreset: boolean;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);
const IconBeads = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5"  r="2"/><circle cx="19" cy="9"  r="2"/>
    <circle cx="19" cy="15" r="2"/><circle cx="12" cy="19" r="2"/>
    <circle cx="5"  cy="15" r="2"/><circle cx="5"  cy="9"  r="2"/>
    <path d="M12 7v3M17.6 10.4l-2.1 1.6M17.6 13.6l-2.1-1.6M12 17v-3M6.4 13.6l2.1-1.6M6.4 10.4l2.1 1.6"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
  </svg>
);
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/>
  </svg>
);
const IconTrend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 7 13.5 15.5l-4-4L2 17"/>
    <path d="M16 7h6v6"/>
  </svg>
);
const IconTarget = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconCount = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </svg>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TasbihStatsPage() {
  const router = useRouter();
  const [tasbihs, setTasbihs] = useState<Tasbih[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sort, setSort] = useState<"totalEver" | "name" | "pct">("totalEver");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/tasbih");
      setTasbihs(res.data.tasbihs ?? []);
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      requestAnimationFrame(() => setMounted(true));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...tasbihs].sort((a, b) => {
    if (sort === "totalEver") return b.totalEver - a.totalEver;
    if (sort === "name")      return a.name.localeCompare(b.name);
    if (sort === "pct")       return (b.count / b.target) - (a.count / a.target);
    return 0;
  });

  const grandTotal  = tasbihs.reduce((s, t) => s + t.totalEver, 0);
  const totalTypes  = tasbihs.length;
  const mostCounted = tasbihs.reduce((best, t) => t.totalEver > (best?.totalEver ?? -1) ? t : best, null as Tasbih | null);
  const completedSessions = tasbihs.reduce((s, t) => s + Math.floor(t.totalEver / (t.target || 1)), 0);

  if (loading) return <LoadingScreen />;

  return (
    <div className="ts-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cormorant+SC:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        .ts-root {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'EB Garamond', Georgia, serif;
          padding: 2rem 1rem 6rem;
          position: relative;
          overflow-x: hidden;
        }
        .ts-root::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 55% 35% at 10% 0%, rgba(201,168,76,0.07), transparent 55%),
            radial-gradient(ellipse 40% 45% at 90% 100%, rgba(126,184,224,0.05), transparent 55%);
          pointer-events: none; z-index: 0;
        }
        /* Islamic geometric pattern overlay */
        .ts-root::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.018)' stroke-width='0.5'%3E%3Cpolygon points='30,4 56,20 56,40 30,56 4,40 4,20'/%3E%3Cpolygon points='30,14 46,24 46,36 30,46 14,36 14,24'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 60px 60px;
          pointer-events: none; z-index: 0;
        }

        .ts-inner {
          position: relative; z-index: 1;
          max-width: 720px; margin: 0 auto;
        }

        /* ── Top bar ── */
        .ts-topbar {
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 2rem;
          opacity: 0; transform: translateY(-10px);
          transition: opacity 0.4s, transform 0.4s;
        }
        .ts-topbar.in { opacity: 1; transform: translateY(0); }
        .back-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: none; border: 1px solid var(--border);
          border-radius: 9px; padding: 0.45rem 0.9rem;
          font-family: 'Cormorant SC', serif; font-size: 0.92rem;
          letter-spacing: 0.1em; color: var(--text-muted);
          cursor: pointer; transition: all 0.18s; flex-shrink: 0;
        }
        .back-btn:hover { color: var(--text-secondary); border-color: rgba(201,168,76,0.3); }
        .ts-page-title {
          font-family: 'Cormorant SC', serif;
          font-size: 1.5rem; letter-spacing: 0.2em;
          color: var(--text-primary);
        }

        /* ── Summary cards ── */
        .summary-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem;
          margin-bottom: 1.5rem;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.5s ease 0.06s, transform 0.5s ease 0.06s;
        }
        .summary-grid.in { opacity: 1; transform: translateY(0); }
        @media (min-width: 500px) { .summary-grid { grid-template-columns: repeat(4, 1fr); } }

        .sum-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 1rem 0.85rem;
          position: relative; overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
        }
        .sum-card:hover { transform: translateY(-2px); border-color: rgba(201,168,76,0.25); }
        .sum-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: var(--sc); opacity: 0.35;
        }
        .sum-icon {
          width: 26px; height: 26px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.6rem;
          background: color-mix(in srgb, var(--sc) 14%, transparent);
          color: var(--sc);
        }
        .sum-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.6rem; font-weight: 700; color: var(--text-primary);
          line-height: 1; margin-bottom: 0.15rem;
        }
        .sum-lbl {
          font-family: 'Cormorant SC', serif; font-size: 0.72rem;
          letter-spacing: 0.1em; color: var(--text-muted);
        }

        /* ── Sort row ── */
        .sort-row {
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 1rem;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.45s ease 0.14s, transform 0.45s ease 0.14s;
        }
        .sort-row.in { opacity: 1; transform: translateY(0); }
        .sort-lbl {
          font-family: 'Cormorant SC', serif; font-size: 0.82rem;
          letter-spacing: 0.12em; color: var(--text-muted); flex-shrink: 0;
        }
        .sort-btn {
          padding: 0.3rem 0.85rem; border-radius: 999px;
          font-family: 'Cormorant SC', serif; font-size: 0.82rem; letter-spacing: 0.1em;
          border: 1px solid var(--border); background: none;
          color: var(--text-muted); cursor: pointer; transition: all 0.16s;
        }
        .sort-btn.active {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.3); color: #c9a84c;
        }

        /* ── Tasbih rows ── */
        .tasbih-list {
          display: flex; flex-direction: column; gap: 0.75rem;
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s;
        }
        .tasbih-list.in { opacity: 1; transform: translateY(0); }

        .tb-row {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.25rem 1.5rem;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .tb-row:hover { transform: translateX(4px); border-color: var(--rc); }
        .tb-row::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: var(--rc); border-radius: 16px 0 0 16px;
          opacity: 0.7;
        }

        /* Row header */
        .tb-row-head {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 1rem;
          margin-bottom: 0.85rem;
        }
        .tb-row-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem; font-weight: 600;
          color: var(--text-primary); line-height: 1.2;
        }
        .tb-row-arabic {
          font-family: 'Amiri', serif; font-size: 1rem;
          color: var(--text-muted); direction: rtl; margin-top: 0.1rem;
        }
        .tb-row-badge {
          font-family: 'Cormorant SC', serif; font-size: 0.75rem;
          letter-spacing: 0.1em; padding: 3px 10px; border-radius: 999px;
          border: 1px solid; white-space: nowrap; flex-shrink: 0;
        }

        /* Progress bar */
        .tb-prog-wrap { margin-bottom: 0.75rem; }
        .tb-prog-labels {
          display: flex; justify-content: space-between;
          font-family: 'Cormorant SC', serif; font-size: 0.78rem;
          letter-spacing: 0.08em; color: var(--text-muted);
          margin-bottom: 0.4rem;
        }
        .tb-prog-track {
          height: 5px; background: var(--bg-elevated);
          border-radius: 999px; overflow: hidden;
        }
        .tb-prog-fill {
          height: 100%; border-radius: 999px;
          transition: width 1s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .tb-prog-fill::after {
          content: ''; position: absolute; right: 0; top: 0; bottom: 0;
          width: 10px; background: rgba(255,255,255,0.3);
          filter: blur(2px); border-radius: 999px;
        }

        /* Stats row inside card */
        .tb-meta {
          display: flex; gap: 1.25rem; flex-wrap: wrap;
        }
        .tb-meta-item {
          display: flex; align-items: center; gap: 0.35rem;
          font-family: 'Cormorant SC', serif; font-size: 0.8rem;
          letter-spacing: 0.08em; color: var(--text-muted);
        }
        .tb-meta-item strong {
          color: var(--text-secondary); font-weight: 500;
        }

        /* Sessions completed indicator */
        .sessions-dots {
          display: flex; gap: 3px; flex-wrap: wrap; margin-top: 0.6rem;
        }
        .session-dot {
          width: 7px; height: 7px; border-radius: 50%;
          transition: transform 0.15s;
        }
        .session-dot:hover { transform: scale(1.4); }

        /* ── Empty ── */
        .ts-empty {
          text-align: center; padding: 5rem 1rem; color: var(--text-muted);
        }
        .ts-empty-icon {
          display: flex; justify-content: center;
          margin-bottom: 1.25rem; opacity: 0.35;
        }
        .ts-empty-title {
          font-family: 'Cormorant SC', serif; font-size: 1.2rem;
          letter-spacing: 0.18em; margin-bottom: 0.4rem;
        }
        .ts-empty-sub {
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 1.05rem;
        }

        /* ── Loading ── */
        @keyframes breathe {
          0%,100% { opacity: 0.3; transform: scale(0.94); }
          50%      { opacity: 1;   transform: scale(1.04); }
        }
        .ts-loading-icon { animation: breathe 2s ease-in-out infinite; color: var(--text-muted); }
      `}</style>

      <div className="ts-inner">

        {/* Top bar */}
        <div className={`ts-topbar ${mounted ? "in" : ""}`}>
          <button className="back-btn" onClick={() => router.back()}>
            <IconBack /> Back
          </button>
          <span className="ts-page-title">Dhikr Progress</span>
        </div>

        {/* Summary cards */}
        <div className={`summary-grid ${mounted ? "in" : ""}`}>
          {[
            { icon: <IconCount />,  val: grandTotal.toLocaleString(),       lbl: "Total Dhikr",      color: "#c9a84c" },
            { icon: <IconBeads />,  val: totalTypes,                        lbl: "Types",            color: "#7eb8a0" },
            { icon: <IconTarget />, val: completedSessions.toLocaleString(), lbl: "Sessions Done",   color: "#b07fd4" },
            { icon: <IconStar />,   val: mostCounted?.name.split(" ")[0] ?? "—", lbl: "Most Counted", color: "#d4845a" },
          ].map(({ icon, val, lbl, color }) => (
            <div key={lbl} className="sum-card" style={{ "--sc": color } as React.CSSProperties}>
              <div className="sum-icon">{icon}</div>
              <div className="sum-val">{val}</div>
              <div className="sum-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Sort controls */}
        {tasbihs.length > 0 && (
          <div className={`sort-row ${mounted ? "in" : ""}`}>
            <span className="sort-lbl">Sort by</span>
            {(["totalEver", "pct", "name"] as const).map(s => (
              <button
                key={s}
                className={`sort-btn ${sort === s ? "active" : ""}`}
                onClick={() => setSort(s)}
              >
                {s === "totalEver" ? "Most Counted" : s === "pct" ? "Progress" : "Name"}
              </button>
            ))}
          </div>
        )}

        {/* Tasbih list */}
        {tasbihs.length === 0 ? (
          <div className="ts-empty">
            <div className="ts-empty-icon"><IconBeads /></div>
            <div className="ts-empty-title">No Tasbihs Yet</div>
            <div className="ts-empty-sub">Go back and start counting to see your progress here.</div>
          </div>
        ) : (
          <div className={`tasbih-list ${mounted ? "in" : ""}`}>
            {sorted.map((t, i) => {
              const pct          = t.target > 0 ? Math.min((t.count / t.target) * 100, 100) : 0;
              const sessionsEver = Math.floor(t.totalEver / (t.target || 1));
              // Show up to 20 dots representing completed sessions
              const dotCount     = Math.min(sessionsEver, 20);
              const isComplete   = t.count >= t.target;

              return (
                <div
                  key={t._id}
                  className="tb-row"
                  style={{
                    "--rc": t.color,
                    animationDelay: `${i * 0.05}s`,
                  } as React.CSSProperties}
                >
                  {/* Header */}
                  <div className="tb-row-head">
                    <div>
                      <div className="tb-row-name">{t.name}</div>
                      {t.arabic && <div className="tb-row-arabic">{t.arabic}</div>}
                    </div>
                    <span
                      className="tb-row-badge"
                      style={{
                        color: isComplete ? "#4ecd82" : t.color,
                        borderColor: isComplete ? "rgba(78,205,130,0.3)" : `${t.color}44`,
                        background: isComplete ? "rgba(78,205,130,0.08)" : `${t.color}11`,
                      }}
                    >
                      {isComplete ? "✓ Complete" : `${Math.round(pct)}%`}
                    </span>
                  </div>

                  {/* Current session progress bar */}
                  <div className="tb-prog-wrap">
                    <div className="tb-prog-labels">
                      <span>Current session</span>
                      <span>{t.count} / {t.target}</span>
                    </div>
                    <div className="tb-prog-track">
                      <div
                        className="tb-prog-fill"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${t.color}88, ${t.color})`,
                          boxShadow: `0 0 8px ${t.color}44`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Meta stats */}
                  <div className="tb-meta">
                    <div className="tb-meta-item">
                      <IconCount />
                      <span>Total ever: <strong>{t.totalEver.toLocaleString()}</strong></span>
                    </div>
                    <div className="tb-meta-item">
                      <IconTarget />
                      <span>Target: <strong>{t.target}</strong></span>
                    </div>
                    <div className="tb-meta-item">
                      <IconTrend />
                      <span>Sessions: <strong>{sessionsEver.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  {/* Session dots — one dot per completed session (max 20) */}
                  {sessionsEver > 0 && (
                    <div className="sessions-dots">
                      {[...Array(dotCount)].map((_, di) => (
                        <div
                          key={di}
                          className="session-dot"
                          title={`Session ${di + 1}`}
                          style={{
                            background: t.color,
                            opacity: 0.3 + (di / Math.max(dotCount - 1, 1)) * 0.7,
                          }}
                        />
                      ))}
                      {sessionsEver > 20 && (
                        <span style={{
                          fontFamily: "'Cormorant SC', serif",
                          fontSize: "0.7rem", letterSpacing: "0.08em",
                          color: "var(--text-muted)", marginLeft: "0.3rem",
                          alignSelf: "center",
                        }}>
                          +{(sessionsEver - 20).toLocaleString()} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1rem",
    }}>
      <div className="ts-loading-icon"><IconBeads /></div>
      <p style={{
        fontFamily: "'Cormorant SC', serif", fontSize: "1.1rem",
        letterSpacing: "0.2em", color: "var(--text-muted)",
      }}>Loading</p>
    </div>
  );
}
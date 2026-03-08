"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconBeads = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5"  r="2"/><circle cx="19" cy="9"  r="2"/>
    <circle cx="19" cy="15" r="2"/><circle cx="12" cy="19" r="2"/>
    <circle cx="5"  cy="15" r="2"/><circle cx="5"  cy="9"  r="2"/>
    <path d="M12 7v3M17.6 10.4l-2.1 1.6M17.6 13.6l-2.1-1.6M12 17v-3M6.4 13.6l2.1-1.6M6.4 10.4l2.1 1.6"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconX = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
);
const IconChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

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

// ── Tasbih Page ────────────────────────────────────────────────────────────────
export default function TasbihPage() {
  const [tasbihs,   setTasbihs]   = useState<Tasbih[]>([]);
  const [active,    setActive]    = useState<Tasbih | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [mounted,   setMounted]   = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [ripple,    setRipple]    = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Create form state
  const [newName,   setNewName]   = useState("");
  const [newArabic, setNewArabic] = useState("");
  const [newTarget, setNewTarget] = useState(33);
  const [newColor,  setNewColor]  = useState("#c9a84c");
  const [creating,  setCreating]  = useState(false);

  const router = useRouter();
  const tapRef      = useRef<NodeJS.Timeout | null>(null);
  const pendingRef  = useRef<number>(0);    // taps buffered, not yet sent
  const activeIdRef = useRef<string>("");   // which tasbih is being tapped
  const BATCH_SIZE    = 15;
  const IDLE_DELAY_MS = 3000;

  // Flush buffered taps to backend
  const flushPending = useCallback(async () => {
    if (pendingRef.current === 0) return;
    const id = activeIdRef.current;
    const by = pendingRef.current;
    pendingRef.current = 0;
    if (tapRef.current) { clearTimeout(tapRef.current); tapRef.current = null; }
    try {
      await api.patch(`/tasbih/${id}/increment`, { by });
    } catch (e) { console.error(e); }
  }, []);

  // Flush on tab hide / close / route change (component unmount)
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flushPending(); };
    const onUnload = () => flushPending();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      flushPending();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flushPending]);

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await api.get("/tasbih");
      const list: Tasbih[] = res.data.tasbihs ?? [];
      setTasbihs(list);
      if (list.length > 0 && !active) setActive(list[0]);
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      requestAnimationFrame(() => setMounted(true));
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  // ── Sync active when list updates ────────────────────────────────────────────
  useEffect(() => {
    if (active) {
      const updated = tasbihs.find(t => t._id === active._id);
      if (updated) setActive(updated);
    }
  }, [tasbihs]); // eslint-disable-line

  // ── Increment ─────────────────────────────────────────────────────────────────
  const increment = useCallback(() => {
    if (!active) return;

    const next = active.count + 1;
    const done = next >= active.target;

    // Update UI instantly — zero network calls here
    setActive(a => a ? { ...a, count: next, totalEver: a.totalEver + 1 } : a);
    setTasbihs(ts => ts.map(t => t._id === active._id ? { ...t, count: next, totalEver: t.totalEver + 1 } : t));
    setRipple(true);
    setTimeout(() => setRipple(false), 400);

    if (done) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 2000);
    }

    // Buffer the tap
    activeIdRef.current = active._id;
    pendingRef.current += 1;

    // Flush immediately if we hit the batch size
    if (pendingRef.current >= BATCH_SIZE) {
      flushPending();
      return;
    }

    // Otherwise reset the 3-second idle timer
    if (tapRef.current) clearTimeout(tapRef.current);
    tapRef.current = setTimeout(() => flushPending(), IDLE_DELAY_MS);
  }, [active, flushPending]);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const reset = async () => {
    if (!active) return;
    // Flush any buffered taps before resetting so counts aren't lost
    await flushPending();
    try {
      const res = await api.patch(`/tasbih/${active._id}/reset`, {});
      const updated = res.data.tasbih;
      setTasbihs(ts => ts.map(t => t._id === updated._id ? updated : t));
      setActive(updated);
    } catch (e) { console.error(e); }
  };

  // ── Create ────────────────────────────────────────────────────────────────────
  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/tasbih", {
        name: newName.trim(), arabic: newArabic.trim(),
        target: newTarget, color: newColor,
      });
      const t = res.data.tasbih;
      setTasbihs(ts => [...ts, t]);
      setActive(t);
      setShowCreate(false);
      setNewName(""); setNewArabic(""); setNewTarget(33); setNewColor("#c9a84c");
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteTasbih = async (id: string) => {
    try {
      await api.delete(`/tasbih/${id}`);
      const next = tasbihs.filter(t => t._id !== id);
      setTasbihs(next);
      if (active?._id === id) setActive(next[0] ?? null);
    } catch (e) { console.error(e); }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !showCreate) { e.preventDefault(); increment(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [increment, showCreate]);

  const pct = active ? Math.min((active.count / active.target) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 88;
  const dash = (pct / 100) * circumference;

  if (loading) return <LoadingScreen />;

  return (
    <div className="tb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cormorant+SC:wght@300;400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        .tb-root {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'EB Garamond', Georgia, serif;
          padding: 2rem 1rem 6rem;
          position: relative;
          overflow-x: hidden;
        }
        .tb-root::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 50% 50% at 50% 0%, color-mix(in srgb, var(--ac) 10%, transparent), transparent 60%);
          pointer-events: none; z-index: 0;
        }

        .tb-inner {
          position: relative; z-index: 1;
          max-width: 640px; margin: 0 auto;
        }

        /* ── Header ── */
        .tb-header {
          text-align: center; margin-bottom: 2rem;
          opacity: 0; transform: translateY(-12px);
          transition: opacity 0.5s, transform 0.5s;
        }
        .tb-header.in { opacity: 1; transform: translateY(0); }
        .tb-title {
          font-family: 'Cormorant SC', serif;
          font-size: 2rem; letter-spacing: 0.2em; color: var(--text-primary);
        }
        .tb-sub {
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 1.05rem; color: var(--text-muted); margin-top: 0.25rem;
        }

        /* ── Selector row ── */
        .selector {
          display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;
          margin-bottom: 1.75rem;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.45s ease 0.08s, transform 0.45s ease 0.08s;
        }
        .selector.in { opacity: 1; transform: translateY(0); }
        .sel-btn {
          padding: 0.45rem 1rem; border-radius: 999px;
          font-family: 'Cormorant SC', serif; font-size: 0.88rem; letter-spacing: 0.1em;
          border: 1px solid var(--border); background: var(--bg-surface);
          color: var(--text-muted); cursor: pointer; transition: all 0.18s;
          position: relative;
        }
        .sel-btn.active {
          background: color-mix(in srgb, var(--sc) 12%, transparent);
          border-color: color-mix(in srgb, var(--sc) 35%, transparent);
          color: var(--sc);
        }
        .sel-btn-del {
          position: absolute; top: -5px; right: -5px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #e07070; border: none; cursor: pointer;
          color: white; line-height: 16px; text-align: center;
          display: none; align-items: center; justify-content: center;
        }
        .sel-btn:hover .sel-btn-del { display: flex; }
        .add-btn {
          padding: 0.45rem 0.9rem; border-radius: 999px;
          font-family: 'Cormorant SC', serif; font-size: 0.88rem; letter-spacing: 0.1em;
          border: 1px dashed var(--border); background: none;
          color: var(--text-muted); cursor: pointer; transition: all 0.18s;
          display: flex; align-items: center; gap: 0.3rem;
        }
        .add-btn:hover { border-color: rgba(201,168,76,0.4); color: #c9a84c; }

        /* ── Ring counter ── */
        .ring-section {
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 1.75rem;
          opacity: 0; transform: scale(0.95);
          transition: opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s;
        }
        .ring-section.in { opacity: 1; transform: scale(1); }

        .ring-wrap { position: relative; width: 220px; height: 220px; cursor: pointer; user-select: none; }
        .ring-wrap svg { transform: rotate(-90deg); }

        .ring-inner {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.2rem;
        }
        .ring-count {
          font-family: 'Amiri', serif;
          font-size: 3.8rem; font-weight: 700; line-height: 1;
          color: var(--text-primary);
          transition: transform 0.08s ease;
        }
        .ring-count.bump { transform: scale(1.12); }
        .ring-target {
          font-family: 'Cormorant SC', serif; font-size: 0.85rem;
          letter-spacing: 0.14em; color: var(--text-muted);
        }
        .ring-arabic {
          font-family: 'Amiri', serif; font-size: 1.05rem;
          color: var(--text-secondary); direction: rtl;
          max-width: 120px; text-align: center; line-height: 1.4;
        }

        /* Tap button */
        .tap-btn {
          margin-top: 1.5rem;
          width: 80px; height: 80px; border-radius: 50%;
          border: 2px solid;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; overflow: hidden;
          transition: transform 0.1s ease, box-shadow 0.2s;
          background: none;
        }
        .tap-btn:active { transform: scale(0.93); }
        .tap-btn-inner {
          width: 52px; height: 52px; border-radius: 50%;
          transition: transform 0.1s;
        }
        .tap-btn.rippling .tap-btn-inner { transform: scale(0.88); }

        @keyframes ripple-out {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .tap-ripple {
          position: absolute; inset: 0; border-radius: 50%;
          animation: ripple-out 0.4s ease-out forwards;
        }

        /* Completed burst */
        @keyframes burst {
          0%   { opacity: 0; transform: scale(0.5); }
          40%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .completed-badge {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(78,205,130,0.15);
          border: 1px solid rgba(78,205,130,0.4);
          border-radius: 20px; padding: 1rem 2rem;
          font-family: 'Cormorant SC', serif;
          font-size: 1.2rem; letter-spacing: 0.16em;
          color: #4ecd82; pointer-events: none;
          animation: burst 2s ease-out forwards;
          z-index: 100;
          display: flex; align-items: center; gap: 0.5rem;
        }

        /* ── Controls ── */
        .controls {
          display: flex; align-items: center; justify-content: center; gap: 1rem;
          margin-top: 1rem;
        }
        .ctrl-btn {
          padding: 0.5rem 1.4rem; border-radius: 10px;
          font-family: 'Cormorant SC', serif; font-size: 0.95rem; letter-spacing: 0.12em;
          border: 1px solid var(--border); background: var(--bg-surface);
          color: var(--text-muted); cursor: pointer; transition: all 0.18s;
        }
        .ctrl-btn:hover { border-color: rgba(224,112,112,0.3); color: #e07070; }
        .total-ever {
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 0.92rem; color: var(--text-muted);
        }
        .kb-hint {
          font-family: 'Cormorant SC', serif; font-size: 0.75rem;
          letter-spacing: 0.1em; color: var(--text-muted);
          margin-top: 0.6rem; opacity: 0.6;
        }

        /* ── Create modal ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 50; display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 2rem;
          width: 100%; max-width: 420px;
        }
        .modal-title {
          font-family: 'Cormorant SC', serif;
          font-size: 1.2rem; letter-spacing: 0.18em;
          color: var(--text-primary); margin-bottom: 1.25rem;
        }
        .form-field { margin-bottom: 1rem; }
        .form-label {
          display: block; font-family: 'Cormorant SC', serif;
          font-size: 0.82rem; letter-spacing: 0.12em;
          color: var(--text-muted); margin-bottom: 0.4rem;
        }
        .form-input {
          width: 100%; background: var(--bg-elevated);
          border: 1px solid var(--border); border-radius: 10px;
          padding: 0.6rem 0.9rem; font-family: 'EB Garamond', serif;
          font-size: 1rem; color: var(--text-primary); outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus { border-color: rgba(201,168,76,0.4); }
        .form-row { display: flex; gap: 0.75rem; }
        .modal-actions { display: flex; gap: 0.6rem; margin-top: 1.25rem; }
        .modal-btn {
          flex: 1; padding: 0.65rem; border-radius: 10px;
          font-family: 'Cormorant SC', serif; font-size: 1rem; letter-spacing: 0.12em;
          border: 1px solid var(--border); cursor: pointer; transition: all 0.18s;
          background: var(--bg-elevated); color: var(--text-muted);
        }
        .modal-btn.primary {
          background: rgba(201,168,76,0.12);
          border-color: rgba(201,168,76,0.3); color: #c9a84c;
        }
        .modal-btn.primary:hover { background: rgba(201,168,76,0.2); }

        /* ── Totals bar ── */
        .totals-bar {
          display: flex; gap: 0.7rem; margin-top: 1rem;
        }
        .total-chip {
          flex: 1; background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 0.9rem; text-align: center;
        }
        .total-chip-val {
          font-family: 'Amiri', serif; font-size: 1.5rem; font-weight: 700;
          color: var(--text-primary); line-height: 1;
        }
        .total-chip-lbl {
          font-family: 'Cormorant SC', serif; font-size: 0.72rem;
          letter-spacing: 0.1em; color: var(--text-muted); margin-top: 0.2rem;
        }

        /* ── View all button ── */
        .view-all-btn {
          margin-top: 1rem;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.75rem;
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 12px; cursor: pointer;
          font-family: 'Cormorant SC', serif; font-size: 0.95rem; letter-spacing: 0.14em;
          color: var(--text-muted); transition: all 0.2s;
        }
        .view-all-btn:hover {
          border-color: rgba(201,168,76,0.35);
          color: #c9a84c;
          background: rgba(201,168,76,0.05);
        }

        @keyframes breathe {
          0%,100% { opacity: 0.3; transform: scale(0.94); }
          50%      { opacity: 1;   transform: scale(1.04); }
        }
        .loading-icon { animation: breathe 2s ease-in-out infinite; font-size: 2.5rem; }
      `}</style>

      <div className="tb-inner" style={{ "--ac": active?.color ?? "#c9a84c" } as React.CSSProperties}>

        {/* Header */}
        <div className={`tb-header ${mounted ? "in" : ""}`}>
          <h1 className="tb-title">Tasbih Counter</h1>
          <p className="tb-sub">Remembrance of Allah, the greatest of deeds</p>
        </div>

        {/* Selector */}
        <div className={`selector ${mounted ? "in" : ""}`}>
          {tasbihs.map(t => (
            <button
              key={t._id}
              className={`sel-btn ${active?._id === t._id ? "active" : ""}`}
              style={{ "--sc": t.color } as React.CSSProperties}
              onClick={() => { flushPending(); setActive(t); }}
            >
              {t.name}
              {!t.isPreset && (
                  <span
                    className="sel-btn-del"
                    onClick={e => { e.stopPropagation(); deleteTasbih(t._id); }}
                  ><IconX /></span>
                )}
            </button>
          ))}
          <button className="add-btn" onClick={() => setShowCreate(true)}>
            <IconPlus /> New
          </button>
        </div>

        {/* Ring counter */}
        {active && (
          <div className={`ring-section ${mounted ? "in" : ""}`}>
            <div
              className="ring-wrap"
              onClick={increment}
              role="button"
              tabIndex={0}
              aria-label={`Increment ${active.name}`}
            >
              <svg width="220" height="220" viewBox="0 0 220 220">
                {/* Background ring */}
                <circle cx="110" cy="110" r="88" fill="none"
                  stroke="var(--bg-elevated)" strokeWidth="10" />
                {/* Progress ring */}
                <circle cx="110" cy="110" r="88" fill="none"
                  stroke={active.color} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - dash}
                  style={{
                    transition: "stroke-dashoffset 0.3s cubic-bezier(0.22,1,0.36,1)",
                    filter: `drop-shadow(0 0 8px ${active.color}55)`,
                  }}
                />
                {/* Tick marks at target */}
                {[...Array(active.target <= 100 ? active.target : 10)].map((_, i) => {
                  const total = active.target <= 100 ? active.target : 10;
                  const angle = ((i / total) * 360 - 90) * (Math.PI / 180);
                  const r1 = 95, r2 = 100;
                  return (
                    <line key={i}
                      x1={110 + r1 * Math.cos(angle)} y1={110 + r1 * Math.sin(angle)}
                      x2={110 + r2 * Math.cos(angle)} y2={110 + r2 * Math.sin(angle)}
                      stroke={i < active.count ? active.color : "var(--border)"}
                      strokeWidth="1.5" strokeLinecap="round"
                      opacity={active.target <= 100 ? 1 : 0}
                    />
                  );
                })}
              </svg>

              <div className="ring-inner">
                <div className={`ring-count ${ripple ? "bump" : ""}`}>
                  {active.count}
                </div>
                {active.arabic && (
                  <div className="ring-arabic">{active.arabic}</div>
                )}
                <div className="ring-target">of {active.target}</div>
              </div>
            </div>

            {/* Tap button */}
            <button
              className={`tap-btn ${ripple ? "rippling" : ""}`}
              style={{
                borderColor: active.color,
                boxShadow: `0 0 24px ${active.color}33`,
              }}
              onClick={increment}
              aria-label="Count"
            >
              <div
                className="tap-btn-inner"
                style={{ background: `${active.color}22` }}
              />
              {ripple && (
                <div
                  className="tap-ripple"
                  style={{ background: active.color }}
                />
              )}
            </button>

            {/* Controls */}
            <div className="controls">
              <button className="ctrl-btn" onClick={reset}>Reset</button>
              <span className="total-ever">{active.totalEver.toLocaleString()} total ever</span>
            </div>
            <p className="kb-hint">Space bar to count</p>

            {/* Totals summary */}
            <div className="totals-bar">
              {tasbihs.slice(0, 3).map(t => (
                <div key={t._id} className="total-chip">
                  <div className="total-chip-val" style={{ color: t.color }}>{t.totalEver.toLocaleString()}</div>
                  <div className="total-chip-lbl">{t.name.split(" ")[0]}</div>
                </div>
              ))}
            </div>
            <button
              className="view-all-btn"
              onClick={() => { flushPending(); router.push("/ibadah/tasbihcounter/stats"); }}
            >
              <IconBarChart />
              View all progress
              <IconChevron />
            </button>
          </div>
        )}

        {!active && (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", opacity: 0.4 }}><IconBeads /></div>
            <p style={{ fontFamily: "'Cormorant SC', serif", fontSize: "1.1rem", letterSpacing: "0.16em" }}>
              No tasbihs yet
            </p>
          </div>
        )}
      </div>

      {/* Completed burst */}
      {justCompleted && (
        <div className="completed-badge">
          <IconCheck /> {active?.target} — Alhamdulillah!
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">New Tasbih</div>

            <div className="form-field">
              <label className="form-label">Name</label>
              <input className="form-input" value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. SubhanAllah" />
            </div>

            <div className="form-field">
              <label className="form-label">Arabic (optional)</label>
              <input className="form-input" value={newArabic}
                onChange={e => setNewArabic(e.target.value)}
                placeholder="سُبْحَانَ اللَّهِ"
                dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: "1.1rem" }} />
            </div>

            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Target</label>
                <input className="form-input" type="number" min={1} max={1000}
                  value={newTarget} onChange={e => setNewTarget(parseInt(e.target.value) || 33)} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Color</label>
                <input className="form-input" type="color"
                  value={newColor} onChange={e => setNewColor(e.target.value)}
                  style={{ height: "42px", padding: "0.2rem 0.4rem", cursor: "pointer" }} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={create} disabled={creating || !newName.trim()}>
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
      <div className="loading-icon" style={{ color: "var(--text-muted)" }}><IconBeads /></div>
      <p style={{ fontFamily: "'Cormorant SC', serif", fontSize: "1.1rem", letterSpacing: "0.2em", color: "var(--text-muted)" }}>Loading</p>
    </div>
  );
}
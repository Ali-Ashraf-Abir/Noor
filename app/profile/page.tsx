"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Zap, Flame, BookOpen, CheckCircle,
  Award, Star, Calendar, ShieldCheck, LogOut,
  BarChart2, Clock, TrendingUp
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/* ── Types ── */
interface QuizScore {
  chapterId: { _id: string; title: string; category: string } | string;
  score: number;
  total: number;
  percentage: number;
  xpEarned: number;
  completedAt: string;
}
interface CompletedChapter {
  _id: string;
  title: string;
  category: string;
}
interface FullUser {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  isAdmin: boolean;
  completedChapters: CompletedChapter[];
  quizScores: QuizScore[];
  createdAt: string;
}

/* ── Config ── */
const XP_PER_LEVEL = 500;

const LEVEL_COLORS = [
  "#7eb8a0","#7eb8e0","#c9a84c","#b07fd4","#d4845a",
  "#4db8a8","#c9a84c","#7eb8e0","#b07fd4","#c9a84c"
];
const getLevelColor = (level: number) => LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  seerah:        { label: "Seerah",        color: "#c9a84c" },
  prophets:      { label: "Prophets",      color: "#7eb8e0" },
  sahabah:       { label: "Sahabah",       color: "#b07fd4" },
  history:       { label: "History",       color: "#d4845a" },
  islamic_facts: { label: "Islamic Facts", color: "#c9a84c" },
  hadith:        { label: "Hadith",        color: "#4db8a8" },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

type Tab = "overview" | "chapters" | "quizzes";

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function ProfilePage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    api.get("/progress")
      .then(r => {
        const p = r.data.progress;
        setUser({
          id:               String(p.id),
          username:         p.username,
          email:            p.email,
          isAdmin:          p.isAdmin ?? false,
          createdAt:        p.createdAt,
          xp:               p.xp,
          level:            p.level,
          levelTitle:       p.levelTitle,
          streak:           p.streak,
          completedChapters: p.completedChapters ?? [],
          quizScores:       p.quizScores ?? [],
        });
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/auth/login");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      })
      .finally(() => {
        setLoading(false);
        requestAnimationFrame(() => setMounted(true));
      });
  }, [router]);

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} />;
  if (!user)   return null;

  const lc       = getLevelColor(user.level);
  const xpInLevel = user.xp % XP_PER_LEVEL;
  const levelPct  = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const avgScore  = user.quizScores.length
    ? Math.round(user.quizScores.reduce((s, q) => s + q.percentage, 0) / user.quizScores.length)
    : 0;

  return (
    <div className="pr" style={{ "--lc": lc } as React.CSSProperties}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,400&family=Cormorant+SC:wght@300;400;500;600&display=swap');

        .pr {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'EB Garamond', Georgia, serif;
          position: relative;
          overflow-x: hidden;
        }
        .pr::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 55% 40% at 0% 0%, color-mix(in srgb, var(--lc) 13%, transparent), transparent 55%),
            radial-gradient(ellipse 45% 55% at 100% 100%, color-mix(in srgb, var(--lc) 7%, transparent), transparent 55%);
          pointer-events: none; z-index: 0;
        }
        .pr::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.028)' stroke-width='0.6'%3E%3Crect x='14' y='14' width='28' height='28' transform='rotate(45 28 28)'/%3E%3Ccircle cx='28' cy='28' r='18'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 56px 56px;
          pointer-events: none; z-index: 0;
        }

        .pr-inner {
          position: relative; z-index: 1;
          max-width: 860px;
          margin: 0 auto;
          padding: 2.5rem 1.25rem 6rem;
        }

        /* ── Top bar ── */
        .pr-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 2rem;
          opacity: 0; transform: translateY(-10px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .pr-topbar.in { opacity: 1; transform: translateY(0); }
        .topbar-title {
          font-family: 'Cormorant SC', serif;
          font-size: 1.19rem; letter-spacing: 0.22em;
          color: var(--text-muted);
        }
        .logout-btn {
          display: flex; align-items: center; gap: 0.45rem;
          background: none; border: 1px solid var(--border);
          border-radius: 8px; padding: 0.55rem 1.1rem;
          font-family: 'Cormorant SC', serif;
          font-size: 1.05rem; letter-spacing: 0.12em;
          color: var(--text-muted); cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .logout-btn:hover {
          color: #e07070;
          border-color: rgba(224,112,112,0.3);
          background: rgba(224,112,112,0.05);
        }

        /* ── Hero card ── */
        .hero-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2.25rem;
          margin-bottom: 1rem;
          position: relative; overflow: hidden;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.55s ease 0.05s, transform 0.55s ease 0.05s;
        }
        .hero-card.in { opacity: 1; transform: translateY(0); }
        .hero-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--lc), transparent);
        }
        .hero-card::after {
          content: '';
          position: absolute; top: -80px; right: -80px;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--lc) 15%, transparent), transparent 70%);
          pointer-events: none;
        }
        .hero-row {
          display: flex; align-items: flex-start; gap: 1.75rem; flex-wrap: wrap;
        }
        .avatar {
          width: 72px; height: 72px; border-radius: 16px;
          background: color-mix(in srgb, var(--lc) 12%, var(--bg-elevated));
          border: 1px solid color-mix(in srgb, var(--lc) 25%, transparent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 24px color-mix(in srgb, var(--lc) 20%, transparent);
        }
        .hero-info { flex: 1; min-width: 0; }
        .hero-username {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 600; line-height: 1.1;
          color: var(--text-primary); margin-bottom: 0.3rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hero-email {
          display: flex; align-items: center; gap: 0.4rem;
          font-family: 'EB Garamond', serif;
          font-size: 1.15rem; color: var(--text-muted); margin-bottom: 0.75rem;
        }
        .hero-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .badge {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 4px 13px; border-radius: 999px;
          font-family: 'Cormorant SC', serif;
          font-size: 0.72rem; letter-spacing: 0.12em; border: 1px solid;
        }
        .badge-level {
          background: color-mix(in srgb, var(--lc) 10%, transparent);
          border-color: color-mix(in srgb, var(--lc) 26%, transparent);
          color: var(--lc);
        }
        .badge-admin {
          background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.28); color: #c9a84c;
        }
        .badge-joined {
          background: var(--bg-elevated); border-color: var(--border); color: var(--text-muted);
        }

        /* XP bar */
        .xp-sec { margin-top: 1.75rem; }
        .xp-labels {
          display: flex; justify-content: space-between; align-items: baseline;
          font-family: 'Cormorant SC', serif;
          font-size: 1.02rem; letter-spacing: 0.1em;
          color: var(--text-muted); margin-bottom: 0.5rem;
        }
        .xp-lv { color: var(--lc); font-size: 1.16rem; }
        .xp-track {
          height: 6px; background: var(--bg-elevated);
          border-radius: 999px; overflow: hidden; border: 1px solid var(--border);
        }
        .xp-fill {
          height: 100%; border-radius: 999px;
          background: var(--lc);
          box-shadow: 0 0 10px color-mix(in srgb, var(--lc) 50%, transparent);
          transition: width 1s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .xp-fill::after {
          content: ''; position: absolute; right: 0; top: 0; bottom: 0;
          width: 14px; background: rgba(255,255,255,0.3);
          filter: blur(3px); border-radius: 999px;
        }
        .xp-total {
          font-family: 'Cormorant SC', serif; font-size: 1.02rem;
          letter-spacing: 0.1em; color: var(--text-muted);
          margin-top: 0.4rem; text-align: right;
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 0.85rem; margin-bottom: 1rem;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.5s ease 0.12s, transform 0.5s ease 0.12s;
        }
        .stats-grid.in { opacity: 1; transform: translateY(0); }
        @media (max-width: 580px) { .stats-grid { grid-template-columns: repeat(2,1fr); } }

        .stat-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 1.1rem 1rem;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s; cursor: default;
        }
        .stat-card:hover {
          border-color: color-mix(in srgb, var(--sc) 32%, transparent);
          transform: translateY(-2px);
        }
        .stat-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: var(--sc); opacity: 0.3;
          border-radius: 0 0 14px 14px;
        }
        .stat-ico {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.7rem;
          background: color-mix(in srgb, var(--sc) 12%, transparent);
        }
        .stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.7rem; font-weight: 700;
          color: var(--text-primary); line-height: 1; margin-bottom: 0.2rem;
        }
        .stat-lbl {
          font-family: 'Cormorant SC', serif;
          font-size: 0.97rem; letter-spacing: 0.13em; color: var(--text-muted);
        }

        /* ── Tabs ── */
        .tabs-row {
          display: flex; gap: 0;
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 0.28rem;
          margin-bottom: 1rem;
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.45s ease 0.22s, transform 0.45s ease 0.22s;
        }
        .tabs-row.in { opacity: 1; transform: translateY(0); }
        .tab-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.45rem;
          padding: 0.72rem 0.5rem; border-radius: 9px;
          background: none; border: none; cursor: pointer;
          font-family: 'Cormorant SC', serif;
          font-size: 0.8rem; letter-spacing: 0.14em;
          color: var(--text-muted); transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--bg-elevated); color: var(--lc);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .tab-btn:hover:not(.active) { color: var(--text-secondary); }

        /* ── Tab panels ── */
        .tab-panel { opacity: 0; transform: translateY(8px); transition: opacity 0.3s ease, transform 0.3s ease; }
        .tab-panel.in { opacity: 1; transform: translateY(0); }

        /* ── Section card ── */
        .sec-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden; margin-bottom: 1rem;
        }
        .sec-head {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.95rem 1.5rem; border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
        }
        .sec-head-title {
          font-family: 'Cormorant SC', serif;
          font-size: 1.07rem; letter-spacing: 0.16em; color: var(--text-secondary);
        }
        .sec-head-count {
          margin-left: auto;
          font-family: 'Cormorant SC', serif; font-size: 0.99rem;
          letter-spacing: 0.1em; color: var(--text-muted);
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 999px; padding: 2px 10px;
        }

        /* ── Chapter row ── */
        .ch-row {
          display: flex; align-items: center; gap: 0.9rem;
          padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--border);
          transition: background 0.18s; cursor: default;
        }
        .ch-row:last-child { border-bottom: none; }
        .ch-row:hover { background: var(--bg-elevated); }
        .ch-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .ch-title { font-family: 'EB Garamond', serif; font-size: 1rem; color: var(--text-primary); flex: 1; }

        /* ── Quiz row ── */
        .qz-row {
          display: grid; grid-template-columns: 1fr auto auto auto;
          align-items: center; gap: 1rem;
          padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--border);
          transition: background 0.18s; cursor: default;
        }
        .qz-row:last-child { border-bottom: none; }
        .qz-row:hover { background: var(--bg-elevated); }
        .qz-title {
          font-family: 'EB Garamond', serif; font-size: 1rem;
          color: var(--text-primary); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .qz-score {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem; font-weight: 600; white-space: nowrap;
        }
        .qz-xp {
          font-family: 'Cormorant SC', serif; font-size: 1.02rem;
          letter-spacing: 0.1em; color: var(--lc); white-space: nowrap;
          background: color-mix(in srgb, var(--lc) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--lc) 22%, transparent);
          border-radius: 999px; padding: 3px 10px;
        }
        .qz-date {
          display: flex; align-items: center; gap: 0.3rem;
          font-family: 'Cormorant SC', serif; font-size: 0.97rem;
          letter-spacing: 0.08em; color: var(--text-muted); white-space: nowrap;
        }
        @media (max-width: 540px) { .qz-row { grid-template-columns: 1fr auto auto; } .qz-date { display: none; } }

        /* ── Overview ── */
        .ov-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1rem; margin-bottom: 1rem;
        }
        @media (max-width: 580px) { .ov-grid { grid-template-columns: 1fr; } }
        .ov-card {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.4rem;
        }
        .ov-card-title {
          font-family: 'Cormorant SC', serif; font-size: 1.05rem;
          letter-spacing: 0.16em; color: var(--text-muted);
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .cat-bar-row { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.7rem; }
        .cat-bar-row:last-child { margin-bottom: 0; }
        .cat-bar-label {
          font-family: 'Cormorant SC', serif; font-size: 0.99rem;
          letter-spacing: 0.08em; color: var(--text-secondary);
          width: 110px; flex-shrink: 0;
        }
        .cat-bar-track { flex: 1; height: 5px; background: var(--bg-elevated); border-radius: 999px; overflow: hidden; }
        .cat-bar-fill { height: 100%; border-radius: 999px; transition: width 1.2s cubic-bezier(0.22,1,0.36,1); }
        .cat-bar-n {
          font-family: 'Cormorant SC', serif; font-size: 0.97rem;
          color: var(--text-muted); width: 20px; text-align: right; flex-shrink: 0;
        }
        .ring-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        }
        .ring { position: relative; width: 96px; height: 96px; }
        .ring svg { transform: rotate(-90deg); }
        .ring-val {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.55rem; font-weight: 700; color: var(--text-primary);
        }
        .ring-lbl {
          font-family: 'Cormorant SC', serif; font-size: 1.02rem;
          letter-spacing: 0.14em; color: var(--text-muted); text-align: center;
        }

        /* Error */
        .err-screen {
          min-height: 100vh; background: var(--bg-base);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.75rem;
        }
        .err-title {
          font-family: 'Cormorant SC', serif; font-size: 1.2rem;
          letter-spacing: 0.2em; color: #e07070;
        }
        .err-sub {
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 1.1rem; color: var(--text-muted);
        }

        /* Empty */
        .empty { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
        .empty-ico {
          width: 48px; height: 48px; border-radius: 14px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
        }
        .empty-title {
          font-family: 'Cormorant SC', serif; font-size: 1.16rem;
          letter-spacing: 0.16em; margin-bottom: 0.35rem;
        }
        .empty-sub { font-family: 'EB Garamond', serif; font-style: italic; font-size: 1.1rem; }

        /* Loading */
        @keyframes breathe {
          0%,100% { opacity: 0.3; transform: scale(0.93); }
          50%      { opacity: 1;   transform: scale(1.05); }
        }
        .load-ico { animation: breathe 2.2s ease-in-out infinite; }
        .load-lbl {
          font-family: 'Cormorant SC', serif; font-size: 1.16rem;
          letter-spacing: 0.22em; color: var(--text-muted); margin-top: 1.25rem;
        }
      `}</style>

      <div className="pr-inner">

        {/* Top bar */}
        <div className={`pr-topbar ${mounted ? "in" : ""}`}>
          <span className="topbar-title">Your Profile</span>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={11} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>

        {/* Hero card */}
        <div className={`hero-card ${mounted ? "in" : ""}`}>
          <div className="hero-row">
            <div className="avatar">
              <User size={30} color={lc} strokeWidth={1.5} />
            </div>
            <div className="hero-info">
              <div className="hero-username">{user.username}</div>
              <div className="hero-email">
                <Mail size={13} strokeWidth={1.5} />
                {user.email}
              </div>
              <div className="hero-badges">
                <span className="badge badge-level">
                  <Award size={9} strokeWidth={1.5} />
                  Level {user.level} · {user.levelTitle}
                </span>
                {user.isAdmin && (
                  <span className="badge badge-admin">
                    <ShieldCheck size={9} strokeWidth={1.5} />
                    Admin
                  </span>
                )}
                <span className="badge badge-joined">
                  <Calendar size={9} strokeWidth={1.5} />
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="xp-sec">
            <div className="xp-labels">
              <span>Level {user.level}</span>
              <span className="xp-lv">{xpInLevel} / {XP_PER_LEVEL} XP</span>
              <span>Level {user.level + 1}</span>
            </div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${levelPct}%` }} />
            </div>
            <div className="xp-total">{user.xp.toLocaleString()} total XP earned</div>
          </div>
        </div>

        {/* Stats */}
        <div className={`stats-grid ${mounted ? "in" : ""}`}>
          {[
            { icon: <Zap size={14} strokeWidth={1.5} />,        val: user.xp.toLocaleString(),          lbl: "Total XP",      color: "#c9a84c" },
            { icon: <Flame size={14} strokeWidth={1.5} />,       val: user.streak,                       lbl: "Day Streak",    color: "#d4845a" },
            { icon: <BookOpen size={14} strokeWidth={1.5} />,    val: user.completedChapters.length,     lbl: "Chapters",      color: "#4db8a8" },
            { icon: <CheckCircle size={14} strokeWidth={1.5} />, val: user.quizScores.length,            lbl: "Quizzes Done",  color: "#b07fd4" },
          ].map(({ icon, val, lbl, color }) => (
            <div key={lbl} className="stat-card" style={{ "--sc": color } as React.CSSProperties}>
              <div className="stat-ico" style={{ color }}>{icon}</div>
              <div className="stat-val">{val}</div>
              <div className="stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`tabs-row ${mounted ? "in" : ""}`}>
          {(["overview", "chapters", "quizzes"] as Tab[]).map(t => (
            <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "overview" && <BarChart2 size={12} strokeWidth={1.5} />}
              {t === "chapters" && <BookOpen  size={12} strokeWidth={1.5} />}
              {t === "quizzes"  && <Star      size={12} strokeWidth={1.5} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Panels */}
        <TabPanel show={tab === "overview"}>
          <OverviewTab user={user} avgScore={avgScore} lc={lc} />
        </TabPanel>
        <TabPanel show={tab === "chapters"}>
          <ChaptersTab chapters={user.completedChapters} />
        </TabPanel>
        <TabPanel show={tab === "quizzes"}>
          <QuizzesTab scores={user.quizScores} lc={lc} />
        </TabPanel>

      </div>
    </div>
  );
}

/* ── Tab panel ── */
function TabPanel({ show, children }: { show: boolean; children: React.ReactNode }) {
  const [render, setRender]   = useState(show);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) {
      setRender(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [show]);
  if (!render) return null;
  return <div className={`tab-panel ${visible ? "in" : ""}`}>{children}</div>;
}

/* ── Overview ── */
function OverviewTab({ user, avgScore, lc }: { user: FullUser; avgScore: number; lc: string }) {
  const catCounts: Record<string, number> = {};
  user.completedChapters.forEach(c => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });
  const maxCat = Math.max(1, ...Object.values(catCounts));
  const cats   = Object.entries(CATEGORY_META).filter(([k]) => catCounts[k] > 0);
  const C    = 2 * Math.PI * 38;
  const dash = (avgScore / 100) * C;

  return (
    <>
      <div className="ov-grid">
        <div className="ov-card">
          <div className="ov-card-title"><TrendingUp size={12} strokeWidth={1.5} />Progress by Category</div>
          {cats.length === 0
            ? <p style={{ fontFamily:"'EB Garamond',serif", fontStyle:"italic", fontSize:"0.92rem", color:"var(--text-muted)" }}>No chapters completed yet.</p>
            : cats.map(([key, m]) => (
              <div key={key} className="cat-bar-row">
                <div className="cat-bar-label">{m.label}</div>
                <div className="cat-bar-track">
                  <div className="cat-bar-fill" style={{ width:`${((catCounts[key]||0)/maxCat)*100}%`, background: m.color }} />
                </div>
                <div className="cat-bar-n">{catCounts[key]||0}</div>
              </div>
            ))
          }
        </div>

        <div className="ov-card">
          <div className="ov-card-title"><Star size={12} strokeWidth={1.5} />Quiz Performance</div>
          <div className="ring-wrap">
            <div className="ring">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="var(--bg-elevated)" strokeWidth="7" />
                <circle cx="48" cy="48" r="38" fill="none"
                  stroke={lc} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - dash}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
                />
              </svg>
              <div className="ring-val">{avgScore}%</div>
            </div>
            <div className="ring-lbl">Average Quiz Score</div>
            <div className="ring-lbl" style={{ opacity: 0.55 }}>
              {user.quizScores.length} {user.quizScores.length === 1 ? "quiz" : "quizzes"} completed
            </div>
          </div>
        </div>
      </div>

      {user.quizScores.length > 0 && (
        <div className="sec-card">
          <div className="sec-head">
            <Clock size={13} strokeWidth={1.5} color="var(--text-muted)" />
            <span className="sec-head-title">Recent Activity</span>
          </div>
          {[...user.quizScores]
            .sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
            .slice(0, 5)
            .map((q, i) => {
              const title = typeof q.chapterId === "object" ? q.chapterId.title : "Chapter";
              return (
                <div key={i} className="qz-row">
                  <div className="qz-title">{title}</div>
                  <div className="qz-score" style={{ color: q.percentage >= 70 ? "#4ecd82" : "#e07070" }}>
                    {q.score}/{q.total}
                  </div>
                  <div className="qz-xp">+{q.xpEarned} XP</div>
                  <div className="qz-date">
                    <Clock size={10} strokeWidth={1.5} />
                    {new Date(q.completedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </>
  );
}

/* ── Chapters tab ── */
function ChaptersTab({ chapters }: { chapters: CompletedChapter[] }) {
  if (!chapters.length) return (
    <div className="empty">
      <div className="empty-ico"><BookOpen size={22} strokeWidth={1.5} color="var(--text-muted)" /></div>
      <div className="empty-title">No Chapters Yet</div>
      <div className="empty-sub">Start reading to see your progress here.</div>
    </div>
  );

  const grouped: Record<string, CompletedChapter[]> = {};
  chapters.forEach(c => { if (!grouped[c.category]) grouped[c.category] = []; grouped[c.category].push(c); });

  return (
    <>
      {Object.entries(grouped).map(([cat, chs]) => {
        const m = CATEGORY_META[cat] || { label: cat, color: "var(--text-muted)" };
        return (
          <div key={cat} className="sec-card">
            <div className="sec-head">
              <div style={{ width:7, height:7, borderRadius:"50%", background: m.color, flexShrink:0 }} />
              <span className="sec-head-title">{m.label}</span>
              <span className="sec-head-count">{chs.length}</span>
            </div>
            {chs.map(ch => (
              <div key={ch._id} className="ch-row">
                <div className="ch-dot" style={{ background: m.color }} />
                <div className="ch-title">{ch.title}</div>
                <CheckCircle size={14} strokeWidth={1.5} color="#4ecd82" />
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

/* ── Quizzes tab ── */
function QuizzesTab({ scores, lc }: { scores: QuizScore[]; lc: string }) {
  if (!scores.length) return (
    <div className="empty">
      <div className="empty-ico"><Star size={22} strokeWidth={1.5} color="var(--text-muted)" /></div>
      <div className="empty-title">No Quizzes Completed</div>
      <div className="empty-sub">Finish a chapter and take its quiz to see scores here.</div>
    </div>
  );

  return (
    <div className="sec-card">
      <div className="sec-head">
        <Star size={13} strokeWidth={1.5} color="var(--text-muted)" />
        <span className="sec-head-title">All Quiz Results</span>
        <span className="sec-head-count">{scores.length}</span>
      </div>
      {[...scores]
        .sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .map((q, i) => {
          const title = typeof q.chapterId === "object" ? q.chapterId.title : "Chapter";
          const c = q.percentage >= 80 ? "#4ecd82" : q.percentage >= 50 ? "#c9a84c" : "#e07070";
          return (
            <div key={i} className="qz-row">
              <div className="qz-title">{title}</div>
              <div className="qz-score" style={{ color: c }}>{q.percentage}%</div>
              <div className="qz-xp" style={{ "--lc": lc } as React.CSSProperties}>+{q.xpEarned} XP</div>
              <div className="qz-date">
                <Clock size={10} strokeWidth={1.5} />
                {new Date(q.completedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}
              </div>
            </div>
          );
        })}
    </div>
  );
}

/* ── Loading ── */
function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div className="load-ico"><User size={40} strokeWidth={1} color="var(--text-muted)" /></div>
      <div className="load-lbl">Loading Profile</div>
    </div>
  );
}

/* ── Error ── */
function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="err-screen">
      <div className="err-title">Something went wrong</div>
      <div className="err-sub">{message}</div>
    </div>
  );
}
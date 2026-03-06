"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { hasCompletedQuiz } from "@/lib/ChapterLocks";
import { useAuth } from "@/context/AuthContext";

/* ── Types ─────────────────────────────────────────────── */
interface StorySection    { type: "story";     title: string; content: string }
interface KeyFactsSection { type: "keyFacts";  title: string; facts: string[] }
interface CharSection     { type: "character"; title: string; name: string; description: string; traits: string[] }
interface LessonsSection  { type: "lessons";   title: string; lessons: string[] }
interface QuizSection     { type: "quiz";      title: string; questions: any[] }
type Section = StorySection | KeyFactsSection | CharSection | LessonsSection | QuizSection;

interface Chapter {
  _id: string;
  title: string;
  subtitle?: string;
  category: string;
  era?: string;
  estimatedReadingTime?: number;
  sections: Section[];
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; glow: string; bg: string }> = {
  seerah:        { label: "Seerah",        icon: "🌙", color: "#c9a84c", glow: "rgba(201,168,76,0.25)",  bg: "rgba(201,168,76,0.07)"  },
  prophets:      { label: "Prophets",      icon: "⭐", color: "#7eb8e0", glow: "rgba(126,184,224,0.25)", bg: "rgba(126,184,224,0.07)" },
  sahabah:       { label: "Sahabah",       icon: "🛡️", color: "#b07fd4", glow: "rgba(176,127,212,0.25)", bg: "rgba(176,127,212,0.07)" },
  history:       { label: "History",       icon: "📜", color: "#d4845a", glow: "rgba(212,132,90,0.25)",  bg: "rgba(212,132,90,0.07)"  },
  islamic_facts: { label: "Islamic Facts", icon: "💎", color: "#c9a84c", glow: "rgba(201,168,76,0.25)",  bg: "rgba(201,168,76,0.07)"  },
  hadith:        { label: "Hadith",        icon: "📖", color: "#4db8a8", glow: "rgba(77,184,168,0.25)",  bg: "rgba(77,184,168,0.07)"  },
};

/* ── Intersection observer hook ── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return { ref, visible };
}

/* ── Main Component ─────────────────────────────────────── */
export default function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const [mounted, setMounted] = useState(false);
  const {user}= useAuth()
  useEffect(() => {
    api.get(`/chapters/${id}`)
      .then(r => {
        setChapter(r.data.chapter);
        if (r.data.xpAwarded) setXpAwarded(r.data.xpAwarded);
      })
      .finally(() => {
        setLoading(false);
        requestAnimationFrame(() => setMounted(true));
      });
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setScrollPct(Math.min(100, pct));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) return <LoadingScreen />;
  if (!chapter) return <NotFound />;

  const meta = CATEGORY_META[chapter.category] ?? {
    label: chapter.category, icon: "📚",
    color: "#c9a84c", glow: "rgba(201,168,76,0.25)", bg: "rgba(201,168,76,0.07)"
  };
  const hasQuiz = chapter.sections.some(s => s.type === "quiz");
  const quizDone = hasCompletedQuiz(chapter._id,user?.id ?? "");
  const readingSections = chapter.sections.filter(s => s.type !== "quiz");

  return (
    <div
      className="cr"
      style={{ "--cc": meta.color, "--cg": meta.glow, "--cb": meta.bg } as any}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Cormorant+SC:wght@300;400;500;600&display=swap');

        /* ── Root ── */
      

        /* ── Reading progress ── */
        .rp {
          position: fixed;
          top: 0; left: 0;
          height: 2px;
          z-index: 200;
          background: var(--cc);
          box-shadow: 0 0 12px var(--cg);
          transition: width 0.12s linear;
        }

        /* ── Nav ── */
        .nav {
          position: sticky;
          top: 0; z-index: 100;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 2rem;
          background: rgba(var(--bg-base-rgb, 14,14,14), 0.75);
          backdrop-filter: blur(24px) saturate(1.4);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .nav-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: 'Cormorant SC', serif;
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          transition: color 0.2s;
          white-space: nowrap;
        }
        .nav-back:hover { color: var(--cc); }
        .nav-back svg { transition: transform 0.2s; }
        .nav-back:hover svg { transform: translateX(-3px); }
        .nav-track {
          flex: 1;
          height: 1px;
          background: var(--border);
          border-radius: 999px;
          overflow: hidden;
        }
        .nav-fill {
          height: 100%;
          background: var(--cc);
          transition: width 0.15s;
        }
        .nav-pct {
          font-family: 'Cormorant SC', serif;
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          min-width: 28px;
          text-align: right;
        }

        /* ── Hero ── */
        .hero {
          position: relative;
          z-index: 1;
          padding: 5.5rem 2rem 4rem;
          text-align: center;
          max-width: 760px;
          margin: 0 auto;
        }

        /* Category badge */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 1.1rem;
          background: var(--cb);
          border: 1px solid color-mix(in srgb, var(--cc) 30%, transparent);
          border-radius: 999px;
          font-family: 'Cormorant SC', serif;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          color: var(--cc);
          margin-bottom: 2rem;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .hero-badge.in { opacity: 1; transform: translateY(0); }

        /* Icon */
        .hero-icon {
          width: 80px; height: 80px;
          border-radius: 20px;
          background: var(--cb);
          border: 1px solid color-mix(in srgb, var(--cc) 22%, transparent);
          display: flex; align-items: center; justify-content: center;
          font-size: 2.25rem;
          margin: 0 auto 2rem;
          box-shadow: 0 8px 40px var(--cg), 0 2px 8px rgba(0,0,0,0.3);
          opacity: 0;
          transform: translateY(16px) scale(0.9);
          transition: opacity 0.55s ease 0.05s, transform 0.55s cubic-bezier(0.34,1.4,0.64,1) 0.05s;
        }
        .hero-icon.in { opacity: 1; transform: translateY(0) scale(1); }

        /* Title — plain, no gradient */
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.2rem, 6vw, 3.75rem);
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          margin-bottom: 1rem;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s;
        }
        .hero-title.in { opacity: 1; transform: translateY(0); }

        /* Subtitle */
        .hero-sub {
          font-family: 'EB Garamond', serif;
          font-size: 1.15rem;
          font-style: italic;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto 2rem;
          line-height: 1.8;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.55s ease 0.25s, transform 0.55s ease 0.25s;
        }
        .hero-sub.in { opacity: 1; transform: translateY(0); }

        /* Meta row */
        .hero-meta {
          display: inline-flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.6rem 1.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.5s ease 0.35s;
        }
        .hero-meta.in { opacity: 1; }
        .hm-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: 'Cormorant SC', serif;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .hm-dot {
          width: 3px; height: 3px;
          background: var(--border-strong);
          border-radius: 50%;
        }

        /* Ornamental separator */
        .hero-sep {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 0 2rem;
          max-width: 760px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .sep-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--cc) 35%, transparent));
        }
        .sep-line.r {
          background: linear-gradient(270deg, transparent, color-mix(in srgb, var(--cc) 35%, transparent));
        }
        .sep-center {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--cc);
          opacity: 0.5;
          font-size: 0.7rem;
          letter-spacing: 0.35em;
        }

        /* ── Content ── */
        .content {
          position: relative;
          z-index: 1;
          max-width: 700px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 8rem;
        }

        /* Scroll reveal */
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal.in { opacity: 1; transform: translateY(0); }

        /* Between-section ornament */
        .sec-sep {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin: 0.5rem 0;
          opacity: 0.2;
        }
        .sec-sep::before, .sec-sep::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--cc);
        }
        .sec-sep-glyph {
          font-size: 0.7rem;
          color: var(--cc);
          letter-spacing: 0.3em;
        }

        /* ═══════════════════════════
           STORY
        ═══════════════════════════ */
        .s-story { margin: 2.5rem 0; }

        .story-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.25rem;
        }
        .sh-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--cc), transparent);
          opacity: 0.3;
        }
        .sh-line.r {
          background: linear-gradient(270deg, var(--cc), transparent);
        }
        .sh-label {
          font-family: 'Cormorant SC', serif;
          font-size: 0.92rem;
          letter-spacing: 0.24em;
          color: var(--cc);
          white-space: nowrap;
        }

        .story-body {
          font-family: 'EB Garamond', serif;
          font-size: 1.2rem;
          line-height: 2.05;
          color: var(--text-secondary);
          text-align: justify;
          hyphens: auto;
        }

        /* Drop cap */
        .story-body::first-letter {
          font-family: 'Cormorant Garamond', serif;
          font-size: 5.2rem;
          font-weight: 700;
          float: left;
          line-height: 0.75;
          margin-right: 0.07em;
          margin-top: 0.09em;
          color: var(--cc);
          filter: drop-shadow(0 2px 12px var(--cg));
        }

        .story-foot {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 2.25rem;
          opacity: 0.15;
        }
        .story-foot::before, .story-foot::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--cc);
        }
        .story-foot-glyph { color: var(--cc); font-size: 1.1rem; }

        /* ═══════════════════════════
           KEY FACTS
        ═══════════════════════════ */
        .s-facts {
          margin: 2.5rem 0;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          background: var(--bg-surface);
        }
        .facts-head {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
        }
        .facts-head-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--cb);
          border: 1px solid color-mix(in srgb, var(--cc) 25%, transparent);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .facts-head-label {
          font-family: 'Cormorant SC', serif;
          font-size: 0.95rem;
          letter-spacing: 0.18em;
          color: var(--text-secondary);
        }
        .fact-row {
          display: grid;
          grid-template-columns: 3rem 1fr;
          align-items: start;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          transition: background 0.18s;
        }
        .fact-row:last-child { border-bottom: none; }
        .fact-row:hover { background: var(--bg-elevated); }
        .fact-n {
          font-family: 'Cormorant SC', serif;
          font-size: 0.58rem;
          color: var(--cc);
          opacity: 0.45;
          padding-top: 0.28rem;
          letter-spacing: 0.05em;
        }
        .fact-t {
          font-family: 'EB Garamond', serif;
          font-size: 1.05rem;
          line-height: 1.72;
          color: var(--text-primary);
        }

        /* ═══════════════════════════
           CHARACTER
        ═══════════════════════════ */
        .s-char {
          margin: 2.5rem 0;
          position: relative;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .char-stripe {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, #b07fd4 30%, transparent);
        }
        .char-inner { padding: 2rem 2rem 2rem 2.5rem; }
        .char-kicker {
          font-family: 'Cormorant SC', serif;
          font-size: 0.96rem;
          letter-spacing: 0.2em;
          color: #b07fd4;
          opacity: 0.7;
          margin-bottom: 0.5rem;
        }
        .char-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.1rem;
          font-weight: 600;
          font-style: italic;
          color: #c89ee0;
          line-height: 1.15;
          margin-bottom: 1rem;
        }
        .char-desc {
          font-family: 'EB Garamond', serif;
          font-size: 1.05rem;
          line-height: 1.85;
          color: var(--text-secondary);
          margin-bottom: 1.4rem;
        }
        .traits { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .trait {
          padding: 4px 14px;
          border-radius: 999px;
          background: rgba(176,127,212,0.09);
          border: 1px solid rgba(176,127,212,0.22);
          color: #c89ee0;
          font-family: 'EB Garamond', serif;
          font-style: italic;
          font-size: 0.9rem;
          transition: background 0.2s, border-color 0.2s;
          cursor: default;
        }
        .trait:hover {
          background: rgba(176,127,212,0.18);
          border-color: rgba(176,127,212,0.38);
        }

        /* ═══════════════════════════
           LESSONS
        ═══════════════════════════ */
        .s-lessons { margin: 2.5rem 0; }
        .lessons-hdr {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .lh-line {
          flex: 1; height: 1px;
          background: var(--border);
        }
        .lh-label {
          font-family: 'Cormorant SC', serif;
          font-size: 0.82rem;
          letter-spacing: 0.2em;
          color: var(--text-muted);
          white-space: nowrap;
          padding: 0 0.25rem;
        }
        .lesson {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          padding: 1.15rem 1.25rem;
          margin-bottom: 0.55rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: border-color 0.22s, transform 0.22s, box-shadow 0.22s;
          cursor: default;
        }
        .lesson:hover {
          border-color: color-mix(in srgb, var(--cc) 28%, transparent);
          transform: translateX(4px);
          box-shadow: -4px 0 20px var(--cg);
        }
        .lesson-n {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--cb);
          border: 1px solid color-mix(in srgb, var(--cc) 20%, transparent);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--cc);
          flex-shrink: 0;
          margin-top: 0.1rem;
        }
        .lesson-t {
          font-family: 'EB Garamond', serif;
          font-size: 1.05rem;
          line-height: 1.72;
          color: var(--text-primary);
        }

        /* ═══════════════════════════
           QUIZ PREVIEW
        ═══════════════════════════ */
        .s-quiz {
          margin: 2.5rem 0;
          padding: 2.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-accent);
          border-radius: 16px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .s-quiz::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% -10%, var(--gold-muted, rgba(201,168,76,0.08)) 0%, transparent 65%);
          pointer-events: none;
        }
        .qp-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .qp-kicker {
          font-family: 'Cormorant SC', serif;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          color: var(--gold, #c9a84c);
          opacity: 0.65;
          margin-bottom: 0.3rem;
        }
        .qp-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.3rem;
        }
        .qp-sub {
          font-family: 'EB Garamond', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        /* ═══════════════════════════
           CTA
        ═══════════════════════════ */
        .cta { margin-top: 4rem; text-align: center; }

        .quiz-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1rem 3rem;
          background: var(--cc);
          color: #0e0e0e;
          font-family: 'Cormorant SC', serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 24px var(--cg), 0 2px 6px rgba(0,0,0,0.25);
        }
        .quiz-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 40px var(--cg), 0 4px 12px rgba(0,0,0,0.3);
          filter: brightness(1.08);
        }
        .quiz-btn:active { transform: translateY(-1px); }
        .qb-arr { transition: transform 0.2s; display: inline-block; }
        .quiz-btn:hover .qb-arr { transform: translateX(5px); }

        .done-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 2.5rem;
          background: rgba(78,205,130,0.06);
          border: 1px solid rgba(78,205,130,0.2);
          border-radius: 999px;
          font-family: 'Cormorant SC', serif;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          color: #4ecd82;
        }
        .done-ring {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: rgba(78,205,130,0.12);
          border: 1px solid rgba(78,205,130,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem;
        }

        /* ═══════════════════════════
           XP TOAST
        ═══════════════════════════ */
        @keyframes toastIn {
          from { transform: translate(-50%, -40px); opacity: 0; }
          to   { transform: translate(-50%, 0);      opacity: 1; }
        }
        .xp-toast {
          position: fixed;
          top: 18px; left: 50%;
          transform: translateX(-50%);
          background: var(--bg-elevated);
          border: 1px solid var(--cc);
          border-radius: 999px;
          padding: 0.5rem 1.5rem;
          font-family: 'Cormorant SC', serif;
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          color: var(--cc);
          z-index: 300;
          animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
          box-shadow: 0 4px 28px var(--cg);
          white-space: nowrap;
        }

        /* ═══════════════════════════
           LOADING
        ═══════════════════════════ */
        @keyframes breathe {
          0%,100% { opacity: 0.3; transform: scale(0.92); }
          50%      { opacity: 1;   transform: scale(1.05); }
        }
        .loading-em { font-size: 3.5rem; animation: breathe 2.4s ease-in-out infinite; }
        .loading-lbl {
          font-family: 'Cormorant SC', serif;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          color: var(--text-muted);
          margin-top: 1.5rem;
        }
      `}</style>

      {/* Reading progress */}
      <div className="rp" style={{ width: `${scrollPct}%` }} />

      {/* XP toast */}
      {xpAwarded > 0 && <XPToast xp={xpAwarded} color={meta.color} />}

     

      {/* Hero */}
      <div className="hero">
        <div className={`hero-badge ${mounted ? "in" : ""}`}>
          <span>{meta.icon}</span>
          <span>{meta.label}{chapter.era ? ` · ${chapter.era}` : ""}</span>
        </div>

        <div className={`hero-icon ${mounted ? "in" : ""}`}>
          {meta.icon}
        </div>

        <h1 className={`hero-title ${mounted ? "in" : ""}`}>
          {chapter.title}
        </h1>

        {chapter.subtitle && (
          <p className={`hero-sub ${mounted ? "in" : ""}`}>
            {chapter.subtitle}
          </p>
        )}

        <div className={`hero-meta ${mounted ? "in" : ""}`}>
          {chapter.estimatedReadingTime && (
            <>
              <div className="hm-item">⏱ {chapter.estimatedReadingTime} min read</div>
              <div className="hm-dot" />
            </>
          )}
          <div className="hm-item">📖 {readingSections.length} sections</div>
          {hasQuiz && <><div className="hm-dot" /><div className="hm-item">📝 Quiz</div></>}
        </div>
      </div>

      {/* Separator */}
      <div className="hero-sep">
        <div className="sep-line" />
        <div className="sep-center">
          <span>✦</span><span>✦</span><span>✦</span>
        </div>
        <div className="sep-line r" />
      </div>

      {/* Sections */}
      <div className="content">
        {chapter.sections.map((sec, i) => (
          <RevealSection key={i}>
            {i > 0 && (
              <div className="sec-sep">
                <span className="sec-sep-glyph">· · ·</span>
              </div>
            )}
            <SectionRenderer section={sec} meta={meta} />
          </RevealSection>
        ))}

        {hasQuiz && (
          <RevealSection>
            <div className="cta">
              {quizDone ? (
                <div className="done-badge">
                  <div className="done-ring">✓</div>
                  <span>Quiz Completed</span>
                </div>
              ) : (
                <button
                  className="quiz-btn"
                  onClick={() => router.push(`/learn/quiz/${chapter._id}`)}
                >
                  <span>Begin the Quiz</span>
                  <span className="qb-arr">→</span>
                </button>
              )}
            </div>
          </RevealSection>
        )}
      </div>
    </div>
  );
}

/* ── Reveal wrapper ─────────────────────────────────────── */
function RevealSection({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`reveal ${visible ? "in" : ""}`}>
      {children}
    </div>
  );
}

/* ── Section Router ─────────────────────────────────────── */
function SectionRenderer({ section, meta }: {
  section: Section;
  meta: { label: string; icon: string; color: string; glow: string; bg: string };
}) {
  switch (section.type) {
    case "story":
      return (
        <div className="s-story">
          <div className="story-header">
            <div className="sh-line" style={{ "--cc": meta.color } as any} />
            <div className="sh-label" style={{ color: meta.color }}>✦ {section.title}</div>
            <div className="sh-line r" style={{ "--cc": meta.color } as any} />
          </div>
          <p className="story-body">{section.content}</p>
          <div className="story-foot">
            <span className="story-foot-glyph">❧</span>
          </div>
        </div>
      );

    case "keyFacts":
      return (
        <div className="s-facts">
          <div className="facts-head">
            <div className="facts-head-icon">📋</div>
            <div className="facts-head-label">{section.title}</div>
          </div>
          {section.facts.map((f, i) => (
            <div key={i} className="fact-row">
              <div className="fact-n">{String(i + 1).padStart(2, "0")}</div>
              <div className="fact-t">{f}</div>
            </div>
          ))}
        </div>
      );

    case "character":
      return (
        <div className="s-char">
          <div className="char-stripe" />
          <div className="char-inner">
            <div className="char-kicker">👤 {section.title}</div>
            <div className="char-name">{section.name}</div>
            <p className="char-desc">{section.description}</p>
            {section.traits?.length > 0 && (
              <div className="traits">
                {section.traits.map((t, i) => (
                  <span key={i} className="trait">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case "lessons":
      return (
        <div className="s-lessons">
          <div className="lessons-hdr">
            <div className="lh-line" />
            <div className="lh-label">🌟 {section.title}</div>
            <div className="lh-line" />
          </div>
          {section.lessons?.map((l, i) => (
            <div key={i} className="lesson">
              <div className="lesson-n">{i + 1}</div>
              <div className="lesson-t">{l}</div>
            </div>
          ))}
        </div>
      );

    case "quiz":
      return (
        <div className="s-quiz">
          <div className="qp-icon">📝</div>
          <div className="qp-kicker">Knowledge Check</div>
          <div className="qp-title">{section.title}</div>
          <div className="qp-sub">{section.questions?.length ?? 0} questions await</div>
        </div>
      );

    default:
      return null;
  }
}

/* ── XP Toast ───────────────────────────────────────────── */
function XPToast({ xp, color }: { xp: number; color: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4200);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="xp-toast" style={{ "--cc": color } as any}>
      ✦ +{xp} XP · Chapter Read ✦
    </div>
  );
}

/* ── Loading / Not Found ────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="loading-em">📖</div>
      <div className="loading-lbl">Loading Chapter</div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--text-secondary)" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
      <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "0.7rem", letterSpacing: "0.15em" }}>Chapter Not Found</div>
    </div>
  );
}
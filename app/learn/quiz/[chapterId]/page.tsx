"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { markQuizCompleted } from "@/lib/ChapterLocks";
import { useAuth } from "@/context/AuthContext";

/* ── Types ─────────────────────────────────────────────── */
interface Question {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}
interface Chapter {
  _id: string;
  title: string;
  category: string;
  sections: any[];
}
interface QuizResult {
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  seerah:        { label: "Seerah",        color: "#c9a84c" },
  prophets:      { label: "Prophets",      color: "#7eb8e0" },
  sahabah:       { label: "Sahabah",       color: "#b07fd4" },
  history:       { label: "History",       color: "#d4845a" },
  islamic_facts: { label: "Islamic Facts", color: "#c9a84c" },
  hadith:        { label: "Hadith",        color: "#4db8a8" },
};

type Phase = "loading" | "quiz" | "submitting" | "results" | "error";

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,400&family=Cormorant+SC:wght@300;400;500;600&display=swap');
`;

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function QuizPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [chapter, setChapter]   = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase]       = useState<Phase>("loading");
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults]   = useState<any>(null);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get(`/chapters/${chapterId}`)
      .then(r => {
        const ch: Chapter = r.data.chapter;
        setChapter(ch);
        const qs = ch.sections.filter(s => s.type === "quiz").flatMap(s => s.questions ?? []);
        if (qs.length === 0) { setError("No quiz found in this chapter."); setPhase("error"); return; }
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(-1));
        setPhase("quiz");
      })
      .catch(() => { setError("Failed to load chapter."); setPhase("error"); });
  }, [chapterId]);

  const meta = CATEGORY_META[chapter?.category ?? ""] ?? { label: "", color: "#c9a84c" };
  const q = questions[current];
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;

  const choose = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const a = [...answers];
    a[current] = idx;
    setAnswers(a);
  };

  const next = () => {
    setSelected(null);
    setRevealed(false);
    if (current < questions.length - 1) setCurrent(c => c + 1);
    else submitQuiz();
  };

  const submitQuiz = async () => {
    setPhase("submitting");
    try {
      const res = await api.post("/quiz/submit", { chapterId, answers });
      markQuizCompleted(chapterId, user?.id ?? "");
      setResults(res.data);
      setPhase("results");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Submission failed.");
      setPhase("error");
    }
  };

  if (phase === "loading")    return <Splash text="Loading Quiz" />;
  if (phase === "submitting") return <Splash text="Calculating Results" />;
  if (phase === "error")      return <ErrorScreen msg={error} onBack={() => router.back()} />;
  if (phase === "results" && results) {
    return (
      <ResultsScreen
        results={results}
        chapter={chapter!}
        meta={meta}
        onReview={() => router.push(`/learn/chapters/${chapterId}`)}
        onHome={() => router.push(`/learn/categories/${chapter?.category}`)}
      />
    );
  }

  if (phase === "quiz" && q) {
    const isCorrect = selected === q.answerIndex;
    const letters = ["A", "B", "C", "D"];

    return (
      <div className="qp-root" style={{ "--cc": meta.color } as any}>
        <style>{`
          ${SHARED_STYLES}

          .qp-root {
            min-height: 100vh;
            background: var(--bg-base);
            color: var(--text-primary);
            font-family: 'EB Garamond', Georgia, serif;
            position: relative;
            overflow-x: hidden;
          }
          .qp-root::before {
            content: '';
            position: fixed; inset: 0;
            background:
              radial-gradient(ellipse 55% 40% at 0% 0%, color-mix(in srgb, var(--cc) 10%, transparent), transparent 55%),
              radial-gradient(ellipse 45% 55% at 100% 100%, color-mix(in srgb, var(--cc) 5%, transparent), transparent 55%);
            pointer-events: none; z-index: 0;
          }
          .qp-root::after {
            content: '';
            position: fixed; inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.028)' stroke-width='0.6'%3E%3Crect x='14' y='14' width='28' height='28' transform='rotate(45 28 28)'/%3E%3Ccircle cx='28' cy='28' r='18'/%3E%3C/g%3E%3C/svg%3E");
            background-size: 56px 56px;
            pointer-events: none; z-index: 0;
          }

          /* ── Nav ── */
          .qp-nav {
            position: sticky; top: 0; z-index: 100;
            display: flex; align-items: center; gap: 1rem;
            padding: 0.9rem 2rem;
            background: var(--bg-overlay, rgba(10,10,14,0.8));
            backdrop-filter: blur(24px) saturate(1.4);
            border-bottom: 1px solid rgba(255,255,255,0.04);
          }
          .qp-exit {
            background: none; border: none; cursor: pointer;
            font-family: 'Cormorant SC', serif;
            font-size: 0.85rem; letter-spacing: 0.14em;
            color: var(--text-muted);
            display: flex; align-items: center; gap: 0.4rem;
            transition: color 0.2s; padding: 0; white-space: nowrap;
          }
          .qp-exit:hover { color: var(--cc); }
          .qp-track {
            flex: 1; height: 4px;
            background: var(--bg-elevated);
            border-radius: 999px; overflow: hidden;
          }
          .qp-fill {
            height: 100%; border-radius: 999px;
            background: var(--cc);
            box-shadow: 0 0 8px color-mix(in srgb, var(--cc) 55%, transparent);
            transition: width 0.45s cubic-bezier(0.22,1,0.36,1);
          }
          .qp-counter {
            font-family: 'Cormorant SC', serif;
            font-size: 0.72rem; letter-spacing: 0.1em;
            color: var(--text-muted); white-space: nowrap;
          }

          /* ── Question area ── */
          .qp-body {
            position: relative; z-index: 1;
            max-width: 620px; margin: 0 auto;
            padding: 3.5rem 1.5rem 5rem;
          }

          .qp-eyebrow {
            font-family: 'Cormorant SC', serif;
            font-size: 0.72rem; letter-spacing: 0.22em;
            color: var(--cc); opacity: 0.75;
            margin-bottom: 1.5rem;
          }

          .qp-question {
            font-family: 'Cormorant Garamond', serif;
            font-size: clamp(1.25rem, 3.5vw, 1.65rem);
            font-weight: 600; line-height: 1.45;
            color: var(--text-primary);
            margin-bottom: 2.25rem;
          }

          /* ── Options ── */
          .opt {
            width: 100%; text-align: left;
            padding: 1rem 1.25rem;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: var(--text-primary);
            font-family: 'EB Garamond', Georgia, serif;
            font-size: 1.1rem; line-height: 1.55;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s, transform 0.2s;
            display: flex; align-items: flex-start; gap: 1rem;
            margin-bottom: 0.65rem;
          }
          .opt:last-child { margin-bottom: 0; }
          .opt:not(.revealed):hover {
            border-color: color-mix(in srgb, var(--cc) 45%, transparent);
            background: color-mix(in srgb, var(--cc) 5%, var(--bg-surface));
            transform: translateX(3px);
          }
          .opt.correct {
            border-color: rgba(78,205,130,0.5);
            background: rgba(78,205,130,0.07);
          }
          .opt.wrong {
            border-color: rgba(220,80,80,0.4);
            background: rgba(220,80,80,0.06);
            opacity: 0.7;
          }
          .opt.missed {
            border-color: rgba(78,205,130,0.35);
          }

          .opt-letter {
            width: 28px; height: 28px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Cormorant SC', serif;
            font-size: 0.75rem; font-weight: 600;
            flex-shrink: 0; margin-top: 1px;
            border: 1px solid color-mix(in srgb, var(--cc) 30%, transparent);
            color: var(--cc);
            background: color-mix(in srgb, var(--cc) 8%, transparent);
            transition: background 0.2s, border-color 0.2s, color 0.2s;
          }
          .opt.correct .opt-letter {
            background: rgba(78,205,130,0.15);
            border-color: rgba(78,205,130,0.5);
            color: #4ecd82;
          }
          .opt.wrong .opt-letter {
            background: rgba(220,80,80,0.12);
            border-color: rgba(220,80,80,0.4);
            color: #dc5050;
          }
          .opt-check {
            margin-left: auto; flex-shrink: 0;
            font-size: 1rem; line-height: 1;
            margin-top: 3px;
          }

          /* ── Feedback box ── */
          @keyframes revealIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .feedback {
            margin-top: 1.25rem;
            padding: 1.1rem 1.25rem;
            border-radius: 12px;
            animation: revealIn 0.3s ease forwards;
          }
          .feedback-correct {
            background: rgba(78,205,130,0.07);
            border: 1px solid rgba(78,205,130,0.22);
          }
          .feedback-wrong {
            background: rgba(220,80,80,0.06);
            border: 1px solid rgba(220,80,80,0.18);
          }
          .feedback-verdict {
            font-family: 'Cormorant SC', serif;
            font-size: 0.8rem; letter-spacing: 0.18em;
            margin-bottom: 0.4rem;
          }
          .feedback-text {
            font-family: 'EB Garamond', serif;
            font-size: 1.05rem; line-height: 1.7;
            color: var(--text-secondary);
          }

          /* ── Next button ── */
          .next-btn {
            width: 100%;
            padding: 1rem;
            margin-top: 1.25rem;
            background: var(--cc);
            color: #0e0e0e;
            font-family: 'Cormorant SC', serif;
            font-size: 0.85rem; letter-spacing: 0.2em;
            font-weight: 600;
            border: none; border-radius: 12px;
            cursor: pointer;
            transition: all 0.22s;
            box-shadow: 0 4px 20px color-mix(in srgb, var(--cc) 30%, transparent);
            display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          }
          .next-btn:hover {
            filter: brightness(1.08);
            transform: translateY(-2px);
            box-shadow: 0 8px 32px color-mix(in srgb, var(--cc) 40%, transparent);
          }
          .next-btn:active { transform: translateY(0); }
          .nb-arr { transition: transform 0.2s; }
          .next-btn:hover .nb-arr { transform: translateX(4px); }

          /* ── Slide-in animation ── */
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .slide-in { animation: slideIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }

          /* Ornament */
          .q-ornament {
            display: flex; align-items: center; gap: 0.75rem;
            margin-bottom: 2rem; opacity: 0.2;
          }
          .q-ornament::before, .q-ornament::after {
            content: ''; flex: 1; height: 1px; background: var(--cc);
          }
          .q-ornament-glyph { color: var(--cc); font-size: 0.65rem; letter-spacing: 0.3em; }
        `}</style>
  

        {/* Body */}
        <div className="qp-body slide-in" key={current}>
          <div className="qp-eyebrow">{meta.label} · Question {current + 1}</div>

          <div className="q-ornament">
            <span className="q-ornament-glyph">✦ ✦ ✦</span>
          </div>

          <h2 className="qp-question">{q.question}</h2>

          {/* Options */}
          <div>
            {q.options.map((opt: string, i: number) => {
              let cls = "opt" + (revealed ? " revealed" : "");
              if (revealed) {
                if (i === q.answerIndex) cls += " correct";
                else if (i === selected) cls += " wrong";
              }
              return (
                <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
                  <div className="opt-letter">{letters[i]}</div>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {revealed && i === q.answerIndex && <span className="opt-check" style={{ color: "#4ecd82" }}>✓</span>}
                  {revealed && i === selected && i !== q.answerIndex && <span className="opt-check" style={{ color: "#dc5050" }}>✗</span>}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {revealed && (
            <div>
              <div className={`feedback ${isCorrect ? "feedback-correct" : "feedback-wrong"}`}>
                <div className="feedback-verdict" style={{ color: isCorrect ? "#4ecd82" : "#dc5050" }}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </div>
                {q.explanation && <p className="feedback-text">{q.explanation}</p>}
                {!isCorrect && (
                  <p className="feedback-text" style={{ marginTop: q.explanation ? "0.5rem" : 0 }}>
                    The correct answer is{" "}
                    <strong style={{ color: "#4ecd82", fontStyle: "italic" }}>{q.options[q.answerIndex]}</strong>
                  </p>
                )}
              </div>
              <button className="next-btn" onClick={next}>
                <span>{current < questions.length - 1 ? "Next Question" : "See Results"}</span>
                <span className="nb-arr">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/* ══════════════════════════════════════
   RESULTS SCREEN
══════════════════════════════════════ */
function ResultsScreen({ results, chapter, meta, onReview, onHome }: any) {
  const { score, total, percentage, xpEarned, levelUp, newLevel, levelTitle, totalXP } = results;
  const grade = percentage >= 80 ? "excellent" : percentage >= 60 ? "good" : "retry";

  const gradeConfig = {
    excellent: { label: "Excellent",     color: "#c9a84c",  msg: "Mashallah — outstanding knowledge." },
    good:      { label: "Well Done",     color: "#4ecd82",  msg: "Good effort. Keep learning." },
    retry:     { label: "Keep Going",    color: "#d4845a",  msg: "Review the chapter and try again." },
  }[grade];

  const C = 2 * Math.PI * 42;
  const dash = (percentage / 100) * C;

  return (
    <div className="rs-root" style={{ "--cc": meta.color, "--gc": gradeConfig.color } as any}>
      <style>{`
        ${SHARED_STYLES}

        .rs-root {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'EB Garamond', Georgia, serif;
          position: relative; overflow-x: hidden;
        }
        .rs-root::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 55% 40% at 50% 0%, color-mix(in srgb, var(--gc) 10%, transparent), transparent 55%),
            radial-gradient(ellipse 40% 50% at 100% 100%, color-mix(in srgb, var(--cc) 6%, transparent), transparent 55%);
          pointer-events: none; z-index: 0;
        }
        .rs-root::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='rgba(255,255,255,0.028)' stroke-width='0.6'%3E%3Crect x='14' y='14' width='28' height='28' transform='rotate(45 28 28)'/%3E%3Ccircle cx='28' cy='28' r='18'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 56px 56px;
          pointer-events: none; z-index: 0;
        }

        .rs-inner {
          position: relative; z-index: 1;
          max-width: 600px; margin: 0 auto;
          padding: 4rem 1.5rem 6rem;
        }

        /* Grade hero */
        @keyframes popIn {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pop-in  { animation: popIn  0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .fade-up { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .d1 { animation-delay: 0.15s; }
        .d2 { animation-delay: 0.3s; }
        .d3 { animation-delay: 0.45s; }
        .d4 { animation-delay: 0.6s; }

        .rs-grade-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.75rem; font-weight: 700; line-height: 1;
          color: var(--gc);
          margin-bottom: 0.5rem;
        }
        .rs-grade-msg {
          font-family: 'EB Garamond', serif;
          font-style: italic; font-size: 1.1rem;
          color: var(--text-muted);
        }

        /* Score ring */
        .rs-ring { position: relative; width: 108px; height: 108px; margin: 0 auto; }
        .rs-ring svg { transform: rotate(-90deg); }
        .rs-ring-val {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.65rem; font-weight: 700;
          color: var(--gc);
        }

        /* Divider */
        .rs-sep {
          display: flex; align-items: center; gap: 0.75rem;
          margin: 2rem 0; opacity: 0.2;
        }
        .rs-sep::before, .rs-sep::after {
          content: ''; flex: 1; height: 1px; background: var(--gc);
        }
        .rs-sep-glyph { color: var(--gc); font-size: 0.65rem; letter-spacing: 0.3em; }

        /* Stat cards */
        .rs-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
        .rs-stat {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 1rem 0.75rem; text-align: center;
          position: relative; overflow: hidden;
        }
        .rs-stat::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: var(--sc, var(--gc)); opacity: 0.4;
        }
        .rs-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.65rem; font-weight: 700; line-height: 1;
          margin-bottom: 0.3rem;
        }
        .rs-stat-lbl {
          font-family: 'Cormorant SC', serif;
          font-size: 0.72rem; letter-spacing: 0.14em; color: var(--text-muted);
        }

        /* Level up banner */
        .levelup-banner {
          background: color-mix(in srgb, var(--cc) 8%, var(--bg-surface));
          border: 1px solid color-mix(in srgb, var(--cc) 30%, transparent);
          border-radius: 14px; padding: 1.1rem 1.5rem;
          text-align: center; margin-bottom: 1.5rem;
        }
        .levelup-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem; font-weight: 700;
          color: var(--cc); margin-bottom: 0.25rem;
        }
        .levelup-sub {
          font-family: 'EB Garamond', serif;
          font-style: italic; font-size: 0.95rem; color: var(--text-muted);
        }

        /* Review list */
        .rs-review-hdr {
          font-family: 'Cormorant SC', serif;
          font-size: 0.72rem; letter-spacing: 0.2em;
          color: var(--text-muted); margin-bottom: 0.85rem;
        }
        .rs-item {
          display: flex; align-items: flex-start; gap: 0.85rem;
          padding: 0.9rem 1.1rem;
          border-radius: 12px; margin-bottom: 0.5rem;
        }
        .rs-item:last-child { margin-bottom: 0; }
        .rs-item.ok  { background: rgba(78,205,130,0.06);  border: 1px solid rgba(78,205,130,0.15); }
        .rs-item.bad { background: rgba(220,80,80,0.05);   border: 1px solid rgba(220,80,80,0.12); }
        .rs-item-icon { font-size: 0.85rem; flex-shrink: 0; margin-top: 3px; }
        .rs-item-q {
          font-family: 'EB Garamond', serif;
          font-size: 1rem; line-height: 1.55; color: var(--text-primary);
          margin-bottom: 0.2rem;
        }
        .rs-item-ans {
          font-family: 'EB Garamond', serif;
          font-style: italic; font-size: 0.9rem; color: var(--text-muted);
        }

        /* Buttons */
        .rs-btns { display: flex; gap: 0.75rem; margin-top: 2rem; }
        .rs-btn {
          padding: 0.95rem 1.5rem;
          border-radius: 12px;
          font-family: 'Cormorant SC', serif;
          font-size: 0.8rem; letter-spacing: 0.16em;
          cursor: pointer; transition: all 0.22s;
        }
        .rs-btn-primary {
          flex: 1;
          background: var(--cc); color: #0e0e0e;
          border: none; font-weight: 600;
          box-shadow: 0 4px 20px color-mix(in srgb, var(--cc) 28%, transparent);
        }
        .rs-btn-primary:hover {
          filter: brightness(1.08); transform: translateY(-2px);
          box-shadow: 0 8px 32px color-mix(in srgb, var(--cc) 38%, transparent);
        }
        .rs-btn-secondary {
          background: transparent;
          border: 1px solid var(--border); color: var(--text-muted);
        }
        .rs-btn-secondary:hover {
          border-color: color-mix(in srgb, var(--cc) 35%, transparent);
          color: var(--cc);
        }
      `}</style>

      <div className="rs-inner">

        {/* Grade hero */}
        <div className="text-center mb-8 pop-in">
          <div className="rs-grade-label">{gradeConfig.label}</div>
          <p className="rs-grade-msg">{gradeConfig.msg}</p>
        </div>

        {/* Score ring */}
        <div className="fade-up d1 text-center mb-8">
          <div className="rs-ring">
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r="42" fill="none" stroke="var(--bg-elevated)" strokeWidth="7" />
              <circle cx="54" cy="54" r="42" fill="none"
                stroke={gradeConfig.color} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C - dash}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
              />
            </svg>
            <div className="rs-ring-val">{percentage}%</div>
          </div>
        </div>

        {/* Stats */}
        <div className="rs-stats fade-up d2">
          <div className="rs-stat" style={{ "--sc": "#4ecd82" } as any}>
            <div className="rs-stat-val" style={{ color: "#4ecd82" }}>{score}/{total}</div>
            <div className="rs-stat-lbl">Correct</div>
          </div>
          <div className="rs-stat" style={{ "--sc": meta.color } as any}>
            <div className="rs-stat-val" style={{ color: meta.color }}>+{xpEarned}</div>
            <div className="rs-stat-lbl">XP Earned</div>
          </div>
          <div className="rs-stat" style={{ "--sc": gradeConfig.color } as any}>
            <div className="rs-stat-val" style={{ color: gradeConfig.color }}>{newLevel}</div>
            <div className="rs-stat-lbl">Level</div>
          </div>
        </div>

        {/* Level up */}
        {levelUp && (
          <div className="levelup-banner fade-up d2">
            <div className="levelup-title">Level Up — {levelTitle}</div>
            <div className="levelup-sub">{totalXP.toLocaleString()} total XP</div>
          </div>
        )}

        <div className="rs-sep fade-up d3">
          <span className="rs-sep-glyph">· · ·</span>
        </div>

        {/* Review */}
        <div className="fade-up d3">
          <div className="rs-review-hdr">Answers Review</div>
          {results.results?.map((r: QuizResult, i: number) => (
            <div key={i} className={`rs-item ${r.isCorrect ? "ok" : "bad"}`}>
              <span className="rs-item-icon" style={{ color: r.isCorrect ? "#4ecd82" : "#dc5050" }}>
                {r.isCorrect ? "✓" : "✗"}
              </span>
              <div>
                <div className="rs-item-q" style={{ color: r.isCorrect ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {r.question}
                </div>
                {!r.isCorrect && (
                  <div className="rs-item-ans">
                    Correct:{" "}
                    <span style={{ color: "#4ecd82", fontStyle: "normal" }}>{r.correctAnswer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="rs-btns fade-up d4">
          <button className="rs-btn rs-btn-secondary" onClick={onReview}>Re-read Chapter</button>
          <button className="rs-btn rs-btn-primary" onClick={onHome}>Back to {meta.label} →</button>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   UTILITY SCREENS
══════════════════════════════════════ */
function Splash({ text }: { text: string }) {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1rem"
    }}>
      <style>{SHARED_STYLES}</style>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        border: "1px solid var(--border-accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "breathe 2s ease-in-out infinite",
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 6h14M4 11h10M4 16h7" stroke="var(--gold, #c9a84c)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{
        fontFamily: "'Cormorant SC', serif",
        fontSize: "0.75rem", letterSpacing: "0.22em",
        color: "var(--text-muted)",
      }}>{text}</div>
      <style>{`
        @keyframes breathe {
          0%,100% { opacity: 0.4; transform: scale(0.93); }
          50%      { opacity: 1;   transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

function ErrorScreen({ msg, onBack }: { msg: string; onBack: () => void }) {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "1rem", textAlign: "center", padding: "2rem",
    }}>
      <style>{SHARED_STYLES}</style>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "rgba(220,80,80,0.08)",
        border: "1px solid rgba(220,80,80,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.5rem",
      }}>⚠</div>
      <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "0.72rem", letterSpacing: "0.16em", color: "var(--text-muted)" }}>
        {msg}
      </div>
      <button onClick={onBack} style={{
        fontFamily: "'Cormorant SC', serif",
        fontSize: "0.75rem", letterSpacing: "0.14em",
        color: "var(--text-muted)",
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "0.6rem 1.5rem",
        cursor: "pointer",
      }}>Go Back</button>
    </div>
  );
}
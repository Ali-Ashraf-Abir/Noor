"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type { QuizSection, QuizSubmitResponse } from "@/types";

interface QuizProps {
  section: QuizSection;
  chapterId: string;
  onComplete?: (result: QuizSubmitResponse) => void;
}

export default function QuizComponent({ section, chapterId, onComplete }: QuizProps) {
  const [answers, setAnswers]     = useState<(number | null)[]>(section.questions.map(() => null));
  const [result, setResult]       = useState<QuizSubmitResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== null);

  const selectAnswer = (qi: number, ai: number) => {
    if (submitted) return;
    setAnswers((prev) => { const n = [...prev]; n[qi] = ai; return n; });
  };

  const submit = async () => {
    if (!allAnswered) { toast.error("Please answer all questions"); return; }
    setLoading(true);
    try {
      const { data } = await api.post<QuizSubmitResponse>("/quiz/submit", {
        chapterId,
        answers,
      });
      setResult(data);
      setSubmitted(true);
      onComplete?.(data);
      if (data.levelUp) {
        toast.success(`🎉 Level Up! You are now Level ${data.newLevel} — ${data.levelTitle}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Submission failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 space-y-8">
      <div className="ornament-divider">
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>🧠 Quiz</span>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`p-5 rounded-2xl text-center space-y-2 ${result.percentage === 100 ? "prayer-active" : ""}`}
          style={{ background: "var(--bg-elevated)", border: `1px solid ${result.percentage >= 50 ? "var(--border-accent)" : "var(--border)"}` }}
        >
          <div className="text-4xl font-mono font-bold text-gold-gradient">{result.percentage}%</div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {result.score} / {result.total} correct
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="badge badge-gold">+{result.xpEarned} XP</span>
            {result.percentage === 100 && <span className="badge badge-gold">⭐ Perfect Score!</span>}
            {result.levelUp && <span className="badge badge-gold">🎉 Level Up!</span>}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {section.questions.map((q, qi) => {
          const userAnswer   = answers[qi];
          const correctIndex = q.answerIndex;
          const isCorrect    = submitted && userAnswer === correctIndex;
          const isWrong      = submitted && userAnswer !== null && userAnswer !== correctIndex;

          return (
            <div key={qi} className="space-y-3">
              <p className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "var(--gold)" }}>Q{qi + 1}. </span>
                {q.question}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  let bg = "var(--bg-elevated)";
                  let border = "var(--border)";
                  let textColor = "var(--text-secondary)";
                  let icon = "";

                  if (submitted) {
                    if (oi === correctIndex) { bg = "rgba(58,170,138,0.15)"; border = "var(--accent)"; textColor = "var(--accent-hover)"; icon = "✓"; }
                    else if (oi === userAnswer && isWrong) { bg = "rgba(239,68,68,0.1)"; border = "#ef4444"; textColor = "#ef4444"; icon = "✗"; }
                  } else if (userAnswer === oi) {
                    bg = "var(--gold-muted)"; border = "var(--border-accent)"; textColor = "var(--gold-light)";
                  }

                  return (
                    <button key={oi} type="button"
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={submitted}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all text-sm"
                      style={{ background: bg, borderColor: border, color: textColor }}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border"
                        style={{ borderColor: border, color: textColor }}>
                        {icon || String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && result?.results[qi] && (
                <p className="text-xs px-1" style={{ color: result.results[qi].isCorrect ? "var(--accent)" : "#ef4444" }}>
                  {result.results[qi].isCorrect
                    ? "✓ Correct!"
                    : `✗ Correct answer: ${result.results[qi].correctAnswer}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button type="button" onClick={submit} disabled={!allAnswered || loading}
          className="btn-gold w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          {loading ? <><div className="spinner" /> Submitting...</> : `Submit Quiz (${answers.filter(a => a !== null).length}/${section.questions.length})`}
        </button>
      )}
    </div>
  );
}
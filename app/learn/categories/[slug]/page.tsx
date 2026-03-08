"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiCategory, fetchCategories, getCategoryMeta } from "@/lib/Categories";
import { useAuth } from "@/context/AuthContext";

interface Chapter {
  _id: string;
  title: string;
  subtitle?: string;
  order: number;
  estimatedReadingTime?: number;
  era?: string;
  isLocked: boolean;
  isCompleted: boolean;
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

const load = useCallback(async () => {
  setLoading(true);
  try {
    const [cats, chapRes, progressRes] = await Promise.all([
      fetchCategories(),
      api.get(`/chapters/category/${slug}`),
      api.get("/progress"),
    ]);

    const found = cats.find((c) => c.slug === slug) ?? null;
    setCategory(found);

    // Build a Set of completed chapter IDs from the user's progress
    const completedIds = new Set<string>(
      (progressRes.data.progress.completedChapters ?? []).map((c: any) => c._id ?? c)
    );

    // Map chapters and derive isCompleted + isLocked
    const rawChapters = (chapRes.data.chapters ?? []) as Omit<Chapter, "isCompleted" | "isLocked">[];
    const enriched: Chapter[] = rawChapters
      .sort((a, b) => a.order - b.order)
      .map((ch, i, arr) => {
        const isCompleted = completedIds.has(ch._id);
        // First chapter is always unlocked; subsequent ones require previous to be completed
        const isLocked = i === 0 ? false : !completedIds.has(arr[i - 1]._id);
        return { ...ch, isCompleted, isLocked };
      });

    setChapters(enriched);
  } finally {
    setLoading(false);
  }
}, [slug]);

  // Re-fetch when slug or user changes (user changes after completing a chapter)
  useEffect(() => {
    void load();
  }, [load, user]);

  const handleClick = (ch: Chapter) => {
    if (ch.isLocked) return;
    router.push(`/learn/chapters/${ch._id}`);
  };

  const meta = category
    ? getCategoryMeta(category)
    : { label: slug, icon: "📚", color: "var(--gold)" };

  const completedCount = chapters.filter((ch) => ch.isCompleted).length;
  const pct =
    chapters.length > 0
      ? Math.round((completedCount / chapters.length) * 100)
      : 0;

  return (
    <div
      className="category-root"
      style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Nunito:wght@400;500;600;700&display=swap');

        .category-root {
          min-height: 100vh;
          background: var(--bg-surface);
          position: relative;
          overflow-x: hidden;
        }

        .category-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.012) 40px,
              rgba(255,255,255,0.012) 41px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.012) 40px,
              rgba(255,255,255,0.012) 41px
            );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Hero ── */
        .cat-hero {
          position: relative;
          z-index: 1;
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          overflow: hidden;
        }

        .cat-hero-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 300px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
        }

        .cat-hero-icon {
          font-size: 3.5rem;
          margin-bottom: 1.25rem;
          display: inline-block;
          animation: iconFloat 4s ease-in-out infinite;
          filter: drop-shadow(0 4px 20px rgba(0,0,0,0.4));
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-6px) rotate(2deg); }
        }

        .cat-title {
          font-family: 'Amiri', serif;
          font-size: clamp(2rem, 6vw, 3rem);
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }

        .cat-desc {
          font-family: 'Nunito', sans-serif;
          font-size: 1rem;
          color: var(--text-muted);
          max-width: 380px;
          margin: 0 auto 0.5rem;
          line-height: 1.6;
        }

        .cat-count-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          font-family: 'Nunito', sans-serif;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.75rem;
        }

        /* ── Ornamental divider ── */
        .ornament {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin: 0.5rem auto;
          max-width: 300px;
          opacity: 0.35;
        }
        .ornament-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-accent));
        }
        .ornament-line.right {
          background: linear-gradient(90deg, var(--border-accent), transparent);
        }
        .ornament-diamond {
          width: 6px;
          height: 6px;
          background: var(--border-accent);
          transform: rotate(45deg);
        }

        /* ── Progress ── */
        .progress-section {
          max-width: 340px;
          margin: 1.75rem auto 0;
        }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-family: 'Nunito', sans-serif;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .progress-pct {
          font-weight: 700;
          color: var(--text-secondary);
        }
        .progress-track {
          height: 7px;
          background: var(--bg-elevated);
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }
        .progress-fill::after {
          content: '';
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 20px;
          background: rgba(255,255,255,0.25);
          border-radius: 999px;
          filter: blur(4px);
        }

        /* ── Chapter list ── */
        .chapter-list {
          position: relative;
          z-index: 1;
          max-width: 640px;
          margin: 0 auto;
          padding: 2rem 1rem 4rem;
        }

        /* ── Chapter card ── */
        .chapter-card {
          position: relative;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          display: flex;
          align-items: center;
          gap: 1rem;
          overflow: hidden;
          margin-bottom: 0;
        }

        .chapter-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 14px 0 0 14px;
          background: var(--gold);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .chapter-card.unlocked:hover,
        .chapter-card.unlocked:focus-visible {
          background: var(--card-bg-hover);
          border-color: var(--border-accent);
          transform: translateX(5px);
          box-shadow: 0 8px 32px var(--shadow-color), 0 2px 8px rgba(0,0,0,0.2);
          outline: none;
        }
        .chapter-card.unlocked:hover::before,
        .chapter-card.unlocked:focus-visible::before { opacity: 1; }

        .chapter-card.locked {
          opacity: 0.45;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }

        .chapter-card.completed {
          border-color: rgba(78, 205, 130, 0.25);
          background: linear-gradient(135deg, var(--card-bg), rgba(78,205,130,0.04));
        }
        .chapter-card.completed::before { background: #4ecd82; }
        .chapter-card.completed:hover::before { opacity: 1; }

        /* ── Number badge ── */
        .num-badge {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: 'Amiri', serif;
          font-weight: 700;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .chapter-card.unlocked:hover .num-badge { transform: scale(1.08); }

        .badge-unlocked {
          background: var(--gold-muted);
          border: 1.5px solid var(--border-accent);
          color: var(--gold);
        }
        .badge-locked {
          background: var(--bg-elevated);
          border: 1.5px solid var(--border);
          color: var(--text-muted);
        }
        .badge-completed {
          background: rgba(78, 205, 130, 0.1);
          border: 1.5px solid rgba(78, 205, 130, 0.4);
          color: #4ecd82;
          font-size: 18px;
        }

        /* ── Card content ── */
        .chapter-info { flex: 1; min-width: 0; }

        .chapter-title {
          font-family: 'Amiri', serif;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 0.2rem;
        }

        .chapter-subtitle {
          font-family: 'Nunito', sans-serif;
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 0.35rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chapter-meta {
          display: flex;
          gap: 0.6rem;
          font-family: 'Nunito', sans-serif;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .chapter-meta span {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }

        /* ── Status chips ── */
        .chip {
          font-family: 'Nunito', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .chip-done {
          background: rgba(78, 205, 130, 0.12);
          color: #4ecd82;
          border: 1px solid rgba(78, 205, 130, 0.3);
        }
        .chip-locked {
          background: var(--bg-elevated);
          color: var(--text-muted);
          border: 1px solid var(--border);
          animation: lockPulse 2.5s ease-in-out infinite;
        }
        .chip-start {
          background: var(--gold-muted);
          color: var(--gold);
          border: 1px solid var(--border-accent);
        }

        @keyframes lockPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }

        /* ── Connector between cards ── */
        .card-connector {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 18px;
          margin: 0 0 0 calc(1.5rem + 21px);
        }
        .connector-line {
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, var(--border-accent), var(--border));
        }
        .connector-line.faded {
          background: linear-gradient(to bottom, var(--border), transparent);
          opacity: 0.3;
        }

        /* ── Chevron ── */
        .chevron {
          color: var(--gold);
          font-size: 1.3rem;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s, transform 0.2s;
          flex-shrink: 0;
          line-height: 1;
        }
        .chapter-card.unlocked:hover .chevron {
          opacity: 0.7;
          transform: translateX(0);
        }

        /* ── Shimmer skeletons ── */
        .shimmer-card {
          background: linear-gradient(
            90deg,
            var(--bg-surface) 25%,
            var(--bg-elevated) 50%,
            var(--bg-surface) 75%
          );
          background-size: 800px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 14px;
          height: 80px;
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }

        .card-wrapper {
          animation: fadeUp 0.35s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Legend ── */
        .legend {
          margin-top: 2.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          font-size: 0.73rem;
          color: var(--text-muted);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="cat-hero">
        <div className="cat-hero-glow" style={{ background: meta.color }} />
        <div className="cat-hero-icon">{meta.icon}</div>

        <h1 className="cat-title">
          {loading ? "Loading…" : meta.label}
        </h1>

        <div className="ornament">
          <div className="ornament-line" />
          <div className="ornament-diamond" />
          <div className="ornament-line right" />
        </div>

        {category?.description && (
          <p className="cat-desc">{category.description}</p>
        )}

        {!loading && (
          <div className="cat-count-pill">
            <span>📖</span>
            <span>{chapters.length} chapters</span>
          </div>
        )}

        {!loading && chapters.length > 0 && (
          <div className="progress-section">
            <div className="progress-labels">
              <span>{completedCount} of {chapters.length} completed</span>
              <span className="progress-pct">{pct}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Chapter list ── */}
      <div className="chapter-list">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="shimmer-card"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "5rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <p style={{ fontFamily: "'Amiri', serif", fontSize: "1.2rem" }}>No chapters yet</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Check back soon — content is on the way.
            </p>
          </div>
        ) : (
          <>
            {chapters.map((ch, i) => {
              const completed = ch.isCompleted;   // ← from backend
              const unlocked = !ch.isLocked;      // ← from backend

              const cardClass = !unlocked ? "locked" : completed ? "completed" : "unlocked";
              const badgeClass = !unlocked ? "badge-locked" : completed ? "badge-completed" : "badge-unlocked";

              return (
                <div
                  key={ch._id}
                  className="card-wrapper"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {i > 0 && (
                    <div className="card-connector">
                      <div className={`connector-line${unlocked ? "" : " faded"}`} />
                    </div>
                  )}

                  <div
                    className={`chapter-card ${cardClass}`}
                    onClick={() => handleClick(ch)}
                    role={unlocked ? "button" : undefined}
                    tabIndex={unlocked ? 0 : undefined}
                    onKeyDown={(e) => e.key === "Enter" && handleClick(ch)}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Number badge */}
                    <div className={`num-badge ${badgeClass}`}>
                      {completed ? "✓" : !unlocked ? "🔒" : i + 1}
                    </div>

                    {/* Content */}
                    <div className="chapter-info">
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                        <h3
                          className="chapter-title"
                          style={{ color: unlocked ? "var(--text-primary)" : "var(--text-muted)" }}
                        >
                          {ch.title}
                        </h3>

                        <div>
                          {completed && <span className="chip chip-done">✓ Done</span>}
                          {!completed && !unlocked && <span className="chip chip-locked">🔒 Locked</span>}
                          {!completed && unlocked && <span className="chip chip-start">▶ Start</span>}
                        </div>
                      </div>

                      {ch.subtitle && (
                        <p className="chapter-subtitle">{ch.subtitle}</p>
                      )}

                      <div className="chapter-meta">
                        {ch.era && <span>🕰 {ch.era}</span>}
                        {ch.estimatedReadingTime && (
                          <span>⏱ {ch.estimatedReadingTime} min read</span>
                        )}
                      </div>
                    </div>

                    {unlocked && !completed && <span className="chevron">›</span>}
                  </div>
                </div>
              );
            })}

            <div className="legend">
              <div className="legend-item">✓ Complete the quiz to unlock the next chapter</div>
              <div className="legend-item">🔒 Finish the previous chapter first</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
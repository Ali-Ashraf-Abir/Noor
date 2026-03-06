"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCategories, getCategoryMeta, type ApiCategory } from "@/lib/Categories";
import api from "@/lib/api";

interface CategoryWithCount extends ApiCategory {
  chapterCount: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cats = await fetchCategories();
        // Fetch chapter counts in parallel
        const withCounts = await Promise.all(
          cats.map(async cat => {
            try {
              const res = await api.get(`/chapters/category/${cat.slug}`);
              return { ...cat, chapterCount: (res.data.chapters ?? []).length as number };
            } catch {
              return { ...cat, chapterCount: 0 };
            }
          })
        );
        setCategories(withCounts);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div
      className="pattern-bg"
      style={{ minHeight: "100vh", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');

        /* ── Hero ── */
        .cat-hero {
          padding: 5rem 1.5rem 4rem;
          text-align: center;
          position: relative;
        }
        .cat-hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 6vw, 3.8rem);
          font-weight: 700;
          line-height: 1.1;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }
        .cat-hero-sub {
          font-size: 1.05rem;
          color: var(--text-muted);
          max-width: 480px;
          margin: 0 auto 0;
          line-height: 1.7;
        }

        /* ── Grid ── */
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 1.25rem;
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 1.25rem 5rem;
        }

        /* ── Card ── */
        .cat-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem 1.75rem;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .cat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--card-accent-color, transparent) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .cat-card:hover {
          transform: translateY(-4px);
          background: var(--card-bg-hover);
          box-shadow: 0 12px 40px var(--shadow-color), 0 0 0 1px var(--card-accent-color, var(--border-accent));
        }
        .cat-card:hover::before { opacity: 0.07; }
        .cat-card:hover .cat-arrow { opacity: 1; transform: translateX(0); }

        .cat-icon-wrap {
          width: 56px; height: 56px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.75rem;
          margin-bottom: 1.25rem;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cat-card:hover .cat-icon-wrap {
          transform: scale(1.08);
          box-shadow: 0 0 24px var(--card-accent-color, var(--shadow-gold));
        }

        .cat-name {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.4rem;
          line-height: 1.2;
        }
        .cat-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.65;
          margin-bottom: 1.25rem;
          min-height: 2.8em;
        }

        .cat-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }
        .cat-count-pill {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          padding: 3px 10px;
          border-radius: 999px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-muted);
          transition: border-color 0.2s, color 0.2s;
        }
        .cat-card:hover .cat-count-pill {
          border-color: var(--card-accent-color, var(--border-accent));
          color: var(--card-accent-color, var(--gold-light));
        }

        .cat-arrow {
          font-size: 1.2rem;
          color: var(--text-muted);
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.2s, transform 0.2s, color 0.2s;
        }
        .cat-card:hover .cat-arrow {
          color: var(--card-accent-color, var(--gold));
        }

        /* ── Color accent bar ── */
        .cat-accent-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .cat-card:hover .cat-accent-bar { opacity: 1; }

        /* ── Skeleton ── */
        @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        .shimmer {
          background: linear-gradient(90deg, var(--card-bg) 25%, var(--bg-elevated) 50%, var(--card-bg) 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.6s infinite;
          border-radius: 16px;
        }

        /* ── Ornament ── */
        .ornament {
          text-align: center;
          color: var(--border-accent);
          font-size: 1rem;
          letter-spacing: 0.6em;
          margin-bottom: 0.5rem;
          opacity: 0.6;
        }

        /* ── Stagger animation ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { opacity: 0; animation: fadeUp 0.45s ease forwards; }
      `}</style>

      {/* Hero */}
      <div className="cat-hero" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="ornament">✦ ✦ ✦</div>
        <h1 className="cat-hero-title">
          <span style={{
            background: "linear-gradient(135deg, var(--gold-dark), var(--gold-light), var(--gold))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Explore Topics
          </span>
        </h1>
        <p className="cat-hero-sub">
          Journey through Islamic history, the lives of Prophets, the Sahabah, and timeless wisdom.
        </p>
      </div>

      {/* Grid */}
      <div className="cat-grid">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 220, animationDelay: `${i * 0.08}s` }} />
            ))
          : categories.length === 0
          ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📭</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>No categories yet</p>
            </div>
          )
          : categories.map((cat, i) => {
              const m = getCategoryMeta(cat);
              return (
                <div
                  key={cat.slug}
                  className="cat-card fade-up"
                  style={{
                    animationDelay: `${i * 0.07}s`,
                    "--card-accent-color": m.color,
                  } as React.CSSProperties}
                  onClick={() => router.push(`/learn/categories/${cat.slug}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && router.push(`/learn/categories/${cat.slug}`)}
                >
                  {/* Top accent bar */}
                  <div className="cat-accent-bar" style={{ background: m.color }} />

                  {/* Icon */}
                  <div className="cat-icon-wrap" style={{ borderColor: `${m.color}40` }}>
                    <span>{m.icon}</span>
                  </div>

                  {/* Text */}
                  <div className="cat-name">{m.label}</div>
                  <div className="cat-desc">
                    {cat.description || defaultDescription(cat.slug)}
                  </div>

                  {/* Footer */}
                  <div className="cat-footer">
                    <span className="cat-count-pill">
                      {cat.chapterCount === 0
                        ? "No chapters yet"
                        : `${cat.chapterCount} chapter${cat.chapterCount !== 1 ? "s" : ""}`}
                    </span>
                    <span className="cat-arrow" style={{ color: m.color }}>→</span>
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

function defaultDescription(slug: string): string {
  const map: Record<string, string> = {
    seerah:        "The life and journey of Prophet Muhammad ﷺ from birth to the final days.",
    prophets:      "Stories of the Prophets sent by Allah to guide humanity through the ages.",
    sahabah:       "The companions of the Prophet ﷺ — their sacrifices, faith, and legacy.",
    history:       "Key events and turning points that shaped the Islamic world.",
    islamic_facts: "Essential knowledge, pillars, and pearls of Islamic wisdom.",
    hadith:        "Authentic narrations and sayings of the Prophet Muhammad ﷺ.",
  };
  return map[slug] ?? "Explore this collection of Islamic knowledge and stories.";
}
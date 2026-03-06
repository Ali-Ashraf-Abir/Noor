"use client";

import type { Section, StorySection, KeyFactsSection, CharacterSection, QuizSection, LessonsSection } from "@/types";

// ── Story ──────────────────────────────────────────────────────────────────────
export function StoryRenderer({ section }: { section: StorySection }) {
  return (
    <div className="card p-8">
      <div className="ornament-divider mb-6">
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>📖 Story</span>
      </div>
      <div className="prose-islamic space-y-4">
        {section.paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}

// ── Key Facts ──────────────────────────────────────────────────────────────────
export function KeyFactsRenderer({ section }: { section: KeyFactsSection }) {
  return (
    <div className="card p-8">
      <div className="ornament-divider mb-6">
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>💎 Key Facts</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {section.facts.map((fact, i) => (
          <div key={i}
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <span className="text-lg flex-shrink-0" style={{ color: "var(--gold-light)" }}>◆</span>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{fact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Character ──────────────────────────────────────────────────────────────────
export function CharacterRenderer({ section }: { section: CharacterSection }) {
  return (
    <div className="card p-8">
      <div className="ornament-divider mb-6">
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>👤 Character</span>
      </div>
      <div className="flex gap-6 items-start">
        <div className="w-16 h-16 rounded-full btn-gold flex items-center justify-center text-2xl flex-shrink-0">
          {section.name[0]}
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--gold-light)" }}>
            {section.name}
          </h3>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {section.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Lessons ────────────────────────────────────────────────────────────────────
export function LessonsRenderer({ section }: { section: LessonsSection }) {
  return (
    <div className="card p-8" style={{ background: "var(--gold-muted)", borderColor: "var(--border-accent)" }}>
      <div className="ornament-divider mb-6">
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>✨ Lessons Learned</span>
      </div>
      <div className="space-y-3">
        {section.points.map((point, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: "var(--gold)", color: "var(--bg-base)" }}>
              {i + 1}
            </div>
            <p className="text-sm leading-relaxed pt-1" style={{ color: "var(--text-secondary)" }}>{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dispatcher ─────────────────────────────────────────────────────────────────
export function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "story":     return <StoryRenderer section={section} />;
    case "keyFacts":  return <KeyFactsRenderer section={section} />;
    case "character": return <CharacterRenderer section={section} />;
    case "lessons":   return <LessonsRenderer section={section} />;
    case "quiz":      return null; // Quiz handled separately
    default:          return null;
  }
}
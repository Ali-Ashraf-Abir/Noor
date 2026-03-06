"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

const EXAMPLE_JSON = JSON.stringify({
  title: "The Birth of Prophet Muhammad ﷺ",
  subtitle: "The blessed beginning",
  category: "seerah",
  era: "Pre-Islamic Arabia",
  order: 1,
  estimatedReadingTime: 7,
  sections: [
    {
      type: "character",
      name: "Prophet Muhammad ﷺ",
      description: "The final messenger of Allah, born in Makkah in 570 CE."
    },
    {
      type: "story",
      paragraphs: [
        "In the city of Makkah, a child was born who would change the world forever..."
      ]
    },
    {
      type: "keyFacts",
      facts: [
        "Born in Makkah in 570 CE",
        "His father Abdullah died before he was born"
      ]
    },
    {
      type: "quiz",
      questions: [
        {
          question: "In what year was Prophet Muhammad ﷺ born?",
          options: ["550 CE", "570 CE", "610 CE", "632 CE"],
          answerIndex: 1
        }
      ]
    },
    {
      type: "lessons",
      points: [
        "Allah prepares His messengers from birth.",
        "Even trials are part of a greater plan."
      ]
    }
  ]
}, null, 2);

export default function AdminUploadPage() {
  const [json, setJson]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setError("Invalid JSON. Please check your formatting.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/chapters", parsed);
      setSuccess(`✓ Chapter "${data.chapter.title}" created successfully!`);
      setJson("");
      toast.success("Chapter uploaded!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJson(ev.target?.result as string);
    reader.readAsText(file);
  };

  const formatJson = () => {
    try {
      setJson(JSON.stringify(JSON.parse(json), null, 2));
    } catch {
      toast.error("Cannot format — invalid JSON");
    }
  };

  return (
    <div className="space-y-8 fade-up max-w-4xl">
      <div>
        <h1 className="font-display text-4xl font-bold text-gold-gradient">Upload Chapter</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Paste your chapter JSON or upload a .json file
        </p>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-5 gap-3">
        {[
          { type: "story",     icon: "📖", desc: "paragraphs: string[]" },
          { type: "keyFacts",  icon: "💎", desc: "facts: string[]" },
          { type: "character", icon: "👤", desc: "name, description" },
          { type: "quiz",      icon: "🧠", desc: "questions with options & answerIndex" },
          { type: "lessons",   icon: "✨", desc: "points: string[]" },
        ].map((s) => (
          <div key={s.type} className="p-3 rounded-xl text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xs font-mono font-semibold" style={{ color: "var(--gold-light)" }}>{s.type}</div>
            <div className="text-[0.65rem] mt-1" style={{ color: "var(--text-muted)" }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Chapter JSON
            </label>
            <div className="flex gap-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs border transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                📁 Load File
                <input type="file" accept=".json" className="sr-only" onChange={handleFileUpload} />
              </label>
              <button type="button" onClick={formatJson}
                className="px-3 py-1.5 rounded-lg text-xs border transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                ✨ Format
              </button>
              <button type="button" onClick={() => setJson(EXAMPLE_JSON)}
                className="px-3 py-1.5 rounded-lg text-xs border transition-all"
                style={{ border: "1px solid var(--border-accent)", color: "var(--gold-light)" }}>
                Load Example
              </button>
            </div>
          </div>
          <textarea
            className="input font-mono text-xs leading-relaxed"
            style={{ minHeight: "500px", resize: "vertical" }}
            placeholder={`Paste your chapter JSON here...\n\n{\n  "title": "...",\n  "category": "seerah",\n  "sections": [...]\n}`}
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />

          {/* Feedback */}
          {error && (
            <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              ✗ {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(58,170,138,0.1)", border: "1px solid var(--accent)", color: "var(--accent-hover)" }}>
              {success}
            </div>
          )}

          <button type="submit" onClick={handleSubmit} disabled={loading || !json.trim()}
            className="btn-gold w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            {loading ? <><div className="spinner" /> Uploading...</> : "⬆️ Upload Chapter"}
          </button>
        </div>

        {/* Example reference */}
        <div className="space-y-4">
          <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            JSON Reference
          </label>
          <div className="card p-5 space-y-4 text-xs font-mono" style={{ maxHeight: "540px", overflowY: "auto" }}>
            <div>
              <p className="text-[var(--gold-light)] font-semibold mb-2">Required Fields:</p>
              <pre className="text-[var(--text-secondary)] whitespace-pre-wrap">{`title: string (required)
category: string (required)
  → seerah | prophets | sahabah
    | history | islamic_facts | hadith
sections: Section[] (required)
subtitle: string (optional)
era: string (optional)
order: number (optional)
estimatedReadingTime: number (optional)
isPublished: boolean (default: true)`}</pre>
            </div>
            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-[var(--gold-light)] font-semibold mb-2">Section Types:</p>
              <pre className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{`// Story
{ "type": "story",
  "paragraphs": ["..."] }

// Key Facts
{ "type": "keyFacts",
  "facts": ["..."] }

// Character
{ "type": "character",
  "name": "...",
  "description": "..." }

// Quiz
{ "type": "quiz",
  "questions": [{
    "question": "...",
    "options": ["A","B","C","D"],
    "answerIndex": 0
  }] }

// Lessons
{ "type": "lessons",
  "points": ["..."] }`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
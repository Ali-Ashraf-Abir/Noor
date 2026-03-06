"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface Chapter {
  _id: string;
  title: string;
  subtitle?: string;
  category: string;
  era?: string;
  order: number;
  estimatedReadingTime?: number;
  isPublished: boolean;
  sections: Section[];
}

interface Section {
  type: string;
  questions?: unknown[];
  [key: string]: unknown;
}

type AdminView = "list" | "upload" | "edit";
type UploadState = "idle" | "error" | "uploading" | "success";

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  seerah:        { label: "Seerah",        icon: "🌙", color: "#c8a84b" },
  prophets:      { label: "Prophets",      icon: "⭐", color: "#7eb8e0" },
  sahabah:       { label: "Sahabah",       icon: "🛡️", color: "#b07fd4" },
  history:       { label: "History",       icon: "📜", color: "#e07b54" },
  islamic_facts: { label: "Islamic Facts", icon: "💎", color: "#e0a030" },
  hadith:        { label: "Hadith",        icon: "📖", color: "#4db8a8" },
};

const VALID_TYPES = ["story", "keyFacts", "character", "quiz", "lessons"];
const VALID_CATS  = Object.keys(CATEGORY_META);

const PROMPT_HINT = `Ask Claude or ChatGPT:

"Convert this story into a JSON chapter for my Islamic learning platform.
Return ONLY valid JSON with this structure:
{
  "title": "...",
  "subtitle": "...",
  "era": "570 CE - 632 CE",
  "order": 1,
  "estimatedReadingTime": 5,
  "isPublished": true,
  "sections": [
    { "type": "story",     "title": "...", "content": "..." },
    { "type": "keyFacts",  "title": "Key Facts", "facts": ["..."] },
    { "type": "character", "title": "...", "name": "...", "description": "...", "traits": ["..."] },
    { "type": "lessons",   "title": "Lessons Learned", "lessons": ["..."] },
    { "type": "quiz",      "title": "Test Your Knowledge",
      "questions": [
        { "question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "..." }
      ]
    }
  ]
}"`;

function validateJSON(raw: string, category: string): { ok: boolean; data: Record<string, unknown> | null; error: string } {
  try {
    const data = JSON.parse(raw.trim()) as Record<string, unknown>;
    if (!data.title)   return { ok: false, data: null, error: "Missing: title" };
    if (!category)     return { ok: false, data: null, error: "Please select a category first." };
    if (!Array.isArray(data.sections) || (data.sections as unknown[]).length === 0)
      return { ok: false, data: null, error: "sections must be a non-empty array" };
    for (const s of data.sections as Record<string, unknown>[]) {
      if (!VALID_TYPES.includes(s.type as string))
        return { ok: false, data: null, error: `Invalid section type "${s.type}". Use: ${VALID_TYPES.join(", ")}` };
    }
    return { ok: true, data: { ...data, category }, error: "" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown parse error";
    return { ok: false, data: null, error: `JSON parse error: ${msg}` };
  }
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [view, setView]                     = useState<AdminView>("list");
  const [editChapter, setEditChapter]       = useState<Chapter | null>(null);
  const [chapters, setChapters]             = useState<Chapter[]>([]);
  const [loadingList, setLoadingList]       = useState(true);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);

  const fetchChapters = useCallback(async () => {
    setLoadingList(true);
    try {
      // Fetch all categories in parallel since backend has no admin=all endpoint
      const results = await Promise.allSettled(
        VALID_CATS.map(cat => api.get(`/chapters/category/${cat}`))
      );
      const all: Chapter[] = [];
      results.forEach(r => {
        if (r.status === "fulfilled") {
          const items = (r.value.data.chapters ?? []) as Chapter[];
          all.push(...items);
        }
      });
      setChapters(all);
    } catch {
      setChapters([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { void fetchChapters(); }, [fetchChapters]);

  const openEdit    = (ch: Chapter) => { setEditChapter(ch); setView("edit"); };
  const openUpload  = () => { setEditChapter(null); setView("upload"); };
  const goList      = () => { setView("list"); setEditChapter(null); void fetchChapters(); };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/chapters/${id}`);
      setDeleteConfirm(null);
      void fetchChapters();
    } catch { /* handled silently */ }
  };

  const grouped = VALID_CATS.reduce<Record<string, Chapter[]>>((acc, cat) => {
    acc[cat] = chapters.filter((c: Chapter) => c.category === cat).sort((a: Chapter, b: Chapter) => a.order - b.order);
    return acc;
  }, {});

  const confirmChapter = chapters.find((c: Chapter) => c._id === deleteConfirm);

  return (
    <div className="min-h-screen" style={{ background: "#0c0f14", color: "#e8d5a3", fontFamily: "'Crimson Text', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@400;600;700&family=Fira+Code:wght@400;500&display=swap');
        .cinzel { font-family: 'Cinzel', serif; }

        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(10,13,18,0.97);
          border-bottom: 1px solid rgba(212,175,55,0.1);
          backdrop-filter: blur(10px);
          padding: 0.85rem 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .topbar-crumb { font-family:'Cinzel',serif; font-size:0.82rem; color:rgba(232,213,163,0.4); letter-spacing:0.08em; }
        .topbar-crumb.active { color:#e8d5a3; }

        .btn { font-family:'Cinzel',serif; border-radius:8px; cursor:pointer; transition:all 0.2s; border:none; }
        .btn-gold { background:linear-gradient(135deg,#b8860b,#d4af37,#b8860b); color:#0c0f14; font-weight:700; font-size:0.82rem; padding:0.55rem 1.2rem; letter-spacing:0.05em; }
        .btn-gold:hover { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 4px 16px rgba(212,175,55,0.25); }
        .btn-gold:disabled { opacity:0.35; cursor:not-allowed; transform:none; filter:none; }
        .btn-outline { background:transparent; border:1px solid rgba(212,175,55,0.3); color:#d4af37; font-size:0.8rem; padding:0.5rem 1rem; }
        .btn-outline:hover { background:rgba(212,175,55,0.07); border-color:rgba(212,175,55,0.55); }
        .btn-outline:disabled { opacity:0.35; cursor:not-allowed; }
        .btn-danger { background:transparent; border:1px solid rgba(220,80,80,0.3); color:#e08080; font-size:0.75rem; padding:0.4rem 0.85rem; font-family:'Cinzel',serif; border-radius:6px; cursor:pointer; transition:all 0.2s; }
        .btn-danger:hover { background:rgba(220,80,80,0.1); border-color:rgba(220,80,80,0.55); }
        .btn-edit { background:transparent; border:1px solid rgba(212,175,55,0.2); color:rgba(212,175,55,0.7); font-size:0.75rem; padding:0.4rem 0.85rem; font-family:'Cinzel',serif; border-radius:6px; cursor:pointer; transition:all 0.2s; }
        .btn-edit:hover { background:rgba(212,175,55,0.07); border-color:rgba(212,175,55,0.5); color:#d4af37; }

        .cat-header { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0; margin-bottom:0.75rem; border-bottom:1px solid rgba(212,175,55,0.08); }
        .cat-count { font-family:'Cinzel',serif; font-size:0.7rem; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.2); color:rgba(232,213,163,0.5); padding:2px 8px; border-radius:999px; }

        .ch-row { display:flex; align-items:center; gap:1rem; background:#111620; border:1px solid rgba(212,175,55,0.1); border-radius:10px; padding:1rem 1.25rem; margin-bottom:0.6rem; transition:border-color 0.2s; }
        .ch-row:hover { border-color:rgba(212,175,55,0.25); }
        .ch-order { font-family:'Cinzel',serif; font-size:0.85rem; font-weight:700; color:rgba(212,175,55,0.4); min-width:24px; text-align:center; }
        .ch-title { font-family:'Cinzel',serif; font-size:0.95rem; color:#e8d5a3; margin-bottom:2px; }
        .ch-sub { font-size:0.85rem; color:rgba(232,213,163,0.4); font-style:italic; }
        .ch-tag { font-family:'Fira Code',monospace; font-size:0.7rem; padding:2px 8px; border-radius:999px; white-space:nowrap; }
        .tag-published { background:rgba(78,205,130,0.08); border:1px solid rgba(78,205,130,0.15); color:#4ecd82; }
        .tag-draft     { background:rgba(220,80,80,0.1);   border:1px solid rgba(220,80,80,0.2);   color:#e08080; }

        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:200; backdrop-filter:blur(4px); }
        .modal-box { background:#111620; border:1px solid rgba(220,80,80,0.3); border-radius:14px; padding:2rem; max-width:360px; width:90%; text-align:center; }

        .json-area { width:100%; background:#07090e; border:1.5px solid rgba(212,175,55,0.18); border-radius:10px; color:#7ec8a0; font-family:'Fira Code',monospace; font-size:13px; line-height:1.75; padding:1.25rem; resize:vertical; min-height:320px; transition:border-color 0.2s; }
        .json-area:focus { outline:none; border-color:rgba(212,175,55,0.45); }
        .json-area::placeholder { color:rgba(126,200,160,0.2); }

        .error-box { background:rgba(220,80,80,0.07); border:1px solid rgba(220,80,80,0.25); border-radius:8px; color:#e8b0a0; padding:0.85rem 1.1rem; font-size:0.95rem; }
        .preview-box { background:#0f1520; border:1px solid rgba(78,205,130,0.2); border-radius:10px; padding:1.25rem 1.5rem; }
        .section-chip { display:inline-block; padding:3px 10px; border-radius:999px; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.25); color:#d4af37; font-size:0.72rem; font-family:'Fira Code',monospace; margin:2px; }
        .cat-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:999px; font-family:'Cinzel',serif; font-size:0.78rem; font-weight:600; }
        .hint-box { background:#07090e; border:1px solid rgba(212,175,55,0.12); border-radius:10px; padding:1.25rem; white-space:pre-wrap; font-family:'Fira Code',monospace; font-size:12px; color:rgba(232,213,163,0.45); line-height:1.7; margin-top:0.75rem; max-height:240px; overflow-y:auto; }

        .stat-pill { background:#111620; border:1px solid rgba(212,175,55,0.12); border-radius:10px; padding:0.75rem 1.25rem; text-align:center; }

        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .shimmer { background:linear-gradient(90deg,#111620 25%,#1a2030 50%,#111620 75%); background-size:800px 100%; animation:shimmer 1.5s infinite; border-radius:10px; height:64px; margin-bottom:0.6rem; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.3s ease forwards; }
      `}</style>

      {/* Topbar */}
      <div className="topbar">
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#d4af37", flexShrink:0 }} />
        <span className="topbar-crumb" style={{ letterSpacing:"0.12em" }}>ADMIN</span>
        <span style={{ color:"rgba(212,175,55,0.2)" }}>›</span>
        <span className={`topbar-crumb ${view === "list" ? "active" : ""}`} style={{ cursor:"pointer" }} onClick={goList}>
          Chapters
        </span>
        {view !== "list" && <>
          <span style={{ color:"rgba(212,175,55,0.2)" }}>›</span>
          <span className="topbar-crumb active">
            {view === "upload" ? "Upload New" : `Edit: ${editChapter?.title ?? ""}`}
          </span>
        </>}
        <div style={{ flex:1 }} />
        {view === "list"
          ? <button className="btn btn-gold" onClick={openUpload}>+ New Chapter</button>
          : <button className="btn btn-outline" onClick={goList}>‹ Back to List</button>
        }
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* LIST VIEW */}
        {view === "list" && (
          <div className="fade-up">
            {/* Stats */}
            <div style={{ display:"flex", gap:"0.75rem", marginBottom:"2rem", flexWrap:"wrap" }}>
              <div className="stat-pill">
                <div className="cinzel" style={{ fontSize:"1.5rem", fontWeight:700, color:"#d4af37" }}>{chapters.length}</div>
                <div style={{ fontSize:"0.72rem", color:"rgba(232,213,163,0.4)", fontFamily:"'Cinzel',serif", letterSpacing:"0.06em" }}>TOTAL</div>
              </div>
              {VALID_CATS.map(cat => {
                const count = grouped[cat].length;
                if (!count) return null;
                const m = CATEGORY_META[cat];
                return (
                  <div key={cat} className="stat-pill" style={{ borderColor:`${m.color}22` }}>
                    <div className="cinzel" style={{ fontSize:"1.2rem", fontWeight:700, color:m.color }}>{count}</div>
                    <div style={{ fontSize:"0.68rem", color:"rgba(232,213,163,0.35)", fontFamily:"'Cinzel',serif", letterSpacing:"0.05em" }}>
                      {m.icon} {m.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {loadingList ? (
              <div>{[...Array(6)].map((_, i) => <div key={i} className="shimmer" />)}</div>
            ) : chapters.length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 0", opacity:0.35 }}>
                <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📭</div>
                <div className="cinzel">No chapters uploaded yet</div>
              </div>
            ) : (
              VALID_CATS.map(cat => {
                const list = grouped[cat];
                if (!list.length) return null;
                const m = CATEGORY_META[cat];
                return (
                  <div key={cat} style={{ marginBottom:"2.5rem" }}>
                    <div className="cat-header">
                      <span style={{ fontSize:"1.2rem" }}>{m.icon}</span>
                      <span className="cinzel" style={{ fontSize:"1rem", fontWeight:600, color:m.color, letterSpacing:"0.05em" }}>{m.label}</span>
                      <span className="cat-count">{list.length}</span>
                    </div>
                    {list.map(ch => (
                      <div key={ch._id} className="ch-row">
                        <div className="ch-order">#{ch.order}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="ch-title">{ch.title}</div>
                          {ch.subtitle && <div className="ch-sub">{ch.subtitle}</div>}
                          <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.4rem", flexWrap:"wrap" }}>
                            {ch.era && (
                              <span className="ch-tag" style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", color:"rgba(232,213,163,0.4)" }}>
                                🕰 {ch.era}
                              </span>
                            )}
                            {ch.estimatedReadingTime && (
                              <span className="ch-tag" style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", color:"rgba(232,213,163,0.4)" }}>
                                ⏱ {ch.estimatedReadingTime}m
                              </span>
                            )}
                            <span className={`ch-tag ${ch.isPublished ? "tag-published" : "tag-draft"}`}>
                              {ch.isPublished ? "Published" : "Draft"}
                            </span>
                            <span className="ch-tag" style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.12)", color:"rgba(232,213,163,0.35)" }}>
                              {ch.sections?.length ?? 0} sections
                            </span>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                          <button className="btn-edit" onClick={() => openEdit(ch)}>Edit</button>
                          <button className="btn-danger" onClick={() => setDeleteConfirm(ch._id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* UPLOAD / EDIT VIEW */}
        {(view === "upload" || view === "edit") && (
          <JSONEditor
            existing={editChapter}
            onSuccess={goList}
            resetKey={editChapter?._id ?? "new"}
          />
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && confirmChapter && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>🗑️</div>
            <div className="cinzel" style={{ fontSize:"1rem", fontWeight:600, marginBottom:"0.5rem", color:"#e8d5a3" }}>
              Delete Chapter?
            </div>
            <p style={{ color:"rgba(232,213,163,0.5)", fontSize:"0.95rem", marginBottom:"1.5rem", fontStyle:"italic" }}>
              &quot;{confirmChapter.title}&quot;
            </p>
            <p style={{ color:"rgba(220,80,80,0.7)", fontSize:"0.85rem", marginBottom:"1.5rem" }}>
              This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background:"rgba(220,80,80,0.8)", color:"#fff", padding:"0.55rem 1.25rem", fontFamily:"'Cinzel',serif", fontSize:"0.82rem" }}
                onClick={() => void handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── JSON Editor ────────────────────────────────────────────────────────────────
interface JSONEditorProps {
  existing: Chapter | null;
  onSuccess: () => void;
  resetKey?: string;
}

function JSONEditor({ existing, onSuccess }: JSONEditorProps) {
  const isEdit = !!existing;
  const [selectedCat, setSelectedCat] = useState<string>(existing?.category ?? "");
  const [json, setJson]               = useState<string>(isEdit ? JSON.stringify(existing, null, 2) : "");
  const [state, setState]             = useState<UploadState>("idle");
  const [error, setError]             = useState<string>("");
  const [preview, setPreview]         = useState<Record<string, unknown> | null>(isEdit ? (existing as unknown as Record<string, unknown>) : null);
  const [showHint, setShowHint]       = useState<boolean>(false);

  const getFinalData = () => validateJSON(json, selectedCat);

  const handleValidate = () => {
    const r = getFinalData();
    if (!r.ok) { setError(r.error); setState("error"); setPreview(null); return; }
    setPreview(r.data); setState("idle"); setError("");
  };

  const handleSubmit = async () => {
    const r = getFinalData();
    if (!r.ok) { setError(r.error); setState("error"); return; }
    setState("uploading"); setError("");
    try {
      if (isEdit && existing) {
        await api.put(`/chapters/${existing._id}`, r.data);
      } else {
        await api.post("/chapters", r.data);
      }
      setState("success");
      setTimeout(onSuccess, 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed.";
      const axiosMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg ?? msg);
      setState("error");
    }
  };

  const catMeta = selectedCat ? CATEGORY_META[selectedCat] : null;

  const sectionSummary: string[] = Array.isArray(preview?.sections)
    ? (preview.sections as Section[]).map(s =>
        s.type === "quiz" ? `quiz (${(s.questions ?? []).length}q)` : s.type
      )
    : [];

  const previewTitle    = typeof preview?.title === "string" ? preview.title : "";
  const previewSubtitle = typeof preview?.subtitle === "string" ? preview.subtitle : "";
  const previewEra      = typeof preview?.era === "string" ? preview.era : "";
  const previewTime     = typeof preview?.estimatedReadingTime === "number" ? preview.estimatedReadingTime : null;
  const previewOrder    = typeof preview?.order === "number" ? preview.order : null;
  const previewPublished = preview?.isPublished !== false;

  return (
    <div className="fade-up">
      <h1 className="cinzel" style={{ fontSize:"1.4rem", fontWeight:700, color:"#f0e0b0", marginBottom:"0.4rem" }}>
        {isEdit ? "Edit Chapter" : "Upload New Chapter"}
      </h1>
      {isEdit && existing && (
        <p style={{ color:"rgba(232,213,163,0.4)", fontSize:"0.9rem", marginBottom:"1.5rem", fontStyle:"italic" }}>
          Editing: &quot;{existing.title}&quot;
        </p>
      )}

      {/* Step 1: Category selector */}
      <div style={{ marginBottom:"1.75rem" }}>
        <label className="cinzel" style={{ fontSize:"0.72rem", letterSpacing:"0.1em", color:"rgba(232,213,163,0.35)", display:"block", marginBottom:"0.75rem" }}>
          STEP 1 — SELECT CATEGORY
        </label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"0.6rem" }}>
          {VALID_CATS.map(cat => {
            const m = CATEGORY_META[cat];
            const active = selectedCat === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCat(cat); setPreview(null); setState("idle"); setError(""); }}
                style={{
                  background: active ? `${m.color}20` : "#111620",
                  border: active ? `1.5px solid ${m.color}` : "1.5px solid rgba(212,175,55,0.12)",
                  borderRadius: 10,
                  padding: "0.65rem 0.5rem",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  gap: "0.3rem",
                  boxShadow: active ? `0 0 14px ${m.color}25` : "none",
                }}
              >
                <span style={{ fontSize:"1.3rem" }}>{m.icon}</span>
                <span className="cinzel" style={{ fontSize:"0.7rem", color: active ? m.color : "rgba(232,213,163,0.45)", fontWeight: active ? 700 : 400 }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Paste JSON */}
      <div style={{ opacity: selectedCat ? 1 : 0.4, transition:"opacity 0.2s", pointerEvents: selectedCat ? "auto" : "none" }}>
        <label className="cinzel" style={{ fontSize:"0.72rem", letterSpacing:"0.1em", color:"rgba(232,213,163,0.35)", display:"block", marginBottom:"0.5rem" }}>
          STEP 2 — {isEdit ? "EDIT JSON" : "PASTE JSON"}
          {catMeta && (
            <span style={{ marginLeft:"0.75rem", color: catMeta.color, opacity:0.8 }}>
              → saving under {catMeta.icon} {catMeta.label}
            </span>
          )}
        </label>

        {!isEdit && (
          <div style={{ marginBottom:"0.75rem" }}>
            <button className="btn btn-outline" style={{ fontSize:"0.72rem", padding:"0.35rem 0.85rem" }} onClick={() => setShowHint((h: boolean) => !h)}>
              {showHint ? "▲ Hide" : "▼ Show"} AI Prompt Template
            </button>
            {showHint && <div className="hint-box">{PROMPT_HINT}</div>}
          </div>
        )}

        <textarea
          className="json-area"
          value={json}
          onChange={(e: { target: { value: string } }) => { setJson(e.target.value); setPreview(null); setState("idle"); setError(""); }}
          placeholder={"{\n  \"title\": \"...\",\n  \"sections\": [...]\n}\n\n// category is set by your selection above"}
          spellCheck={false}
        />
      </div>

      {/* Error */}
      {state === "error" && error && (
        <div className="error-box" style={{ marginTop:"0.75rem" }}>⚠ {error}</div>
      )}

      {/* Preview */}
      {preview && (
        <div className="preview-box" style={{ marginTop:"1rem" }}>
          <div className="cinzel" style={{ fontSize:"0.7rem", letterSpacing:"0.1em", color:"#4ecd82", opacity:0.7, marginBottom:"0.75rem" }}>
            ✓ VALID — PREVIEW
          </div>
          {catMeta && (
            <div style={{ marginBottom:"0.85rem" }}>
              <span className="cat-badge" style={{ background:`${catMeta.color}18`, border:`1.5px solid ${catMeta.color}50`, color:catMeta.color }}>
                <span>{catMeta.icon}</span><span>{catMeta.label}</span>
              </span>
            </div>
          )}
          <div className="cinzel" style={{ fontSize:"1.1rem", fontWeight:700, color:"#f0e0b0", marginBottom:"4px" }}>{previewTitle}</div>
          {previewSubtitle && (
            <p style={{ color:"rgba(232,213,163,0.45)", fontSize:"0.9rem", marginBottom:"0.75rem", fontStyle:"italic" }}>{previewSubtitle}</p>
          )}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem", marginBottom:"0.65rem" }}>
            {previewEra  && <span className="section-chip">🕰 {previewEra}</span>}
            {previewTime && <span className="section-chip">⏱ {previewTime}m</span>}
            {previewOrder !== null && <span className="section-chip">Order #{previewOrder}</span>}
            <span className="section-chip" style={{
              background: previewPublished ? "rgba(78,205,130,0.1)" : "rgba(220,80,80,0.1)",
              borderColor: previewPublished ? "rgba(78,205,130,0.3)" : "rgba(220,80,80,0.3)",
              color: previewPublished ? "#4ecd82" : "#e08080",
            }}>
              {previewPublished ? "Published" : "Draft"}
            </span>
          </div>
          <div style={{ borderTop:"1px solid rgba(212,175,55,0.08)", paddingTop:"0.65rem" }}>
            <div className="cinzel" style={{ fontSize:"0.65rem", letterSpacing:"0.08em", color:"rgba(232,213,163,0.3)", marginBottom:"0.4rem" }}>SECTIONS</div>
            {sectionSummary.map((s, i) => <span key={i} className="section-chip">{s}</span>)}
          </div>
        </div>
      )}

      {/* Success */}
      {state === "success" && (
        <div style={{ marginTop:"1rem", background:"rgba(78,205,130,0.08)", border:"1px solid rgba(78,205,130,0.25)", borderRadius:8, padding:"0.85rem 1.1rem", color:"#4ecd82", fontFamily:"'Cinzel',serif", fontSize:"0.9rem", textAlign:"center" }}>
          ✓ {isEdit ? "Chapter updated!" : "Chapter uploaded!"} Returning…
        </div>
      )}

      {/* Actions */}
      {state !== "success" && (
        <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.25rem" }}>
          <button className="btn btn-outline" onClick={handleValidate} disabled={!json.trim() || !selectedCat}>
            Validate
          </button>
          <button
            className="btn btn-gold"
            style={{ flex:1 }}
            onClick={() => void handleSubmit()}
            disabled={!json.trim() || !selectedCat || state === "uploading"}
          >
            {state === "uploading"
              ? (isEdit ? "Saving…" : "Uploading…")
              : (isEdit ? "Save Changes →" : "Upload Chapter →")
            }
          </button>
        </div>
      )}

      {!selectedCat && (
        <p style={{ marginTop:"0.75rem", color:"rgba(232,213,163,0.25)", fontSize:"0.82rem", textAlign:"center", fontFamily:"'Cinzel',serif" }}>
          Select a category to enable upload
        </p>
      )}
    </div>
  );
}
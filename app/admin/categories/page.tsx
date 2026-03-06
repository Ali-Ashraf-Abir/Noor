"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { fetchCategories, getCategoryMeta, type ApiCategory } from "@/lib/Categories";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Chapter {
  _id: string;
  title: string;
  subtitle?: string;
  category: string;
  era?: string;
  order: number;
  estimatedReadingTime?: number;
  isPublished: boolean;
  sections: { type: string; questions?: unknown[] }[];
}

type AdminView    = "list" | "upload" | "edit";
type UploadState  = "idle" | "error" | "uploading" | "success";

const VALID_TYPES = ["story", "keyFacts", "character", "quiz", "lessons"];

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
    { "type": "quiz", "title": "Test Your Knowledge",
      "questions": [
        { "question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "..." }
      ]
    }
  ]
}"`;

function validateJSON(
  raw: string,
  category: string,
  validSlugs: string[]
): { ok: boolean; data: Record<string, unknown> | null; error: string } {
  try {
    const data = JSON.parse(raw.trim()) as Record<string, unknown>;
    if (!data.title)   return { ok: false, data: null, error: "Missing: title" };
    if (!category)     return { ok: false, data: null, error: "Please select a category first." };
    if (validSlugs.length > 0 && !validSlugs.includes(category))
      return { ok: false, data: null, error: `Invalid category "${category}".` };
    if (!Array.isArray(data.sections) || (data.sections as unknown[]).length === 0)
      return { ok: false, data: null, error: "sections must be a non-empty array" };
    for (const s of data.sections as Record<string, unknown>[]) {
      if (!VALID_TYPES.includes(s.type as string))
        return { ok: false, data: null, error: `Invalid section type "${s.type as string}". Use: ${VALID_TYPES.join(", ")}` };
    }
    return { ok: true, data: { ...data, category }, error: "" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, data: null, error: `JSON parse error: ${msg}` };
  }
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [view, setView]                   = useState<AdminView>("list");
  const [editChapter, setEditChapter]     = useState<Chapter | null>(null);
  const [chapters, setChapters]           = useState<Chapter[]>([]);
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [loadingList, setLoadingList]     = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    try {
      const cats = await fetchCategories();
      setApiCategories(cats);
      const results = await Promise.allSettled(
        cats.map(cat => api.get(`/chapters/category/${cat.slug}`))
      );
      const all: Chapter[] = [];
      results.forEach(r => {
        if (r.status === "fulfilled") {
          all.push(...((r.value.data.chapters ?? []) as Chapter[]));
        }
      });
      setChapters(all);
    } catch {
      setChapters([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const openEdit   = (ch: Chapter) => { setEditChapter(ch); setView("edit"); };
  const openUpload = () => { setEditChapter(null); setView("upload"); };
  const goList     = () => { setView("list"); setEditChapter(null); void fetchAll(); };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/chapters/${id}`);
      setDeleteConfirm(null);
      void fetchAll();
    } catch { /* silent */ }
  };

  const grouped = apiCategories.reduce<Record<string, Chapter[]>>((acc, cat) => {
    acc[cat.slug] = chapters
      .filter((c: Chapter) => c.category === cat.slug)
      .sort((a: Chapter, b: Chapter) => a.order - b.order);
    return acc;
  }, {});

  const confirmChapter = chapters.find((c: Chapter) => c._id === deleteConfirm);

  return (
    <div className="pattern-bg" style={{ minHeight: "100vh", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');

        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: var(--bg-overlay);
          border-bottom: 1px solid var(--border-strong);
          backdrop-filter: blur(12px);
          padding: 0.85rem 1.5rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .crumb { font-family: var(--font-display); font-size: 0.82rem; letter-spacing: 0.08em; color: var(--text-muted); }
        .crumb.active { color: var(--text-primary); }
        .crumb.link { cursor: pointer; transition: color 0.15s; }
        .crumb.link:hover { color: var(--gold-light); }
        .sep { color: var(--border-strong); font-size: 0.9rem; }

        /* Action buttons */
        .action-btn {
          font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 0.06em;
          border-radius: 8px; padding: 0.5rem 1.1rem; cursor: pointer; transition: all 0.2s; border: none;
        }
        .action-btn.primary { background: linear-gradient(135deg, var(--gold-dark), var(--gold-light), var(--gold-dark)); color: var(--bg-base); font-weight: 700; }
        .action-btn.primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 16px var(--shadow-gold); }
        .action-btn.secondary { background: transparent; border: 1px solid var(--border-accent); color: var(--gold); }
        .action-btn.secondary:hover { background: var(--gold-muted); }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Chapter row */
        .ch-row {
          display: flex; align-items: center; gap: 1rem;
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 0.5rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .ch-row:hover { background: var(--card-bg-hover); border-color: var(--border-accent); }
        .ch-order { font-family: var(--font-display); font-size: 0.85rem; font-weight: 700; color: var(--gold-dark); min-width: 24px; text-align: center; }
        .ch-title { font-family: var(--font-display); font-size: 0.95rem; color: var(--text-primary); margin-bottom: 2px; }
        .ch-sub   { font-size: 0.82rem; color: var(--text-muted); font-style: italic; }

        .ch-tag {
          font-family: var(--font-mono); font-size: 0.68rem;
          padding: 2px 8px; border-radius: 999px; white-space: nowrap;
          background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-muted);
        }
        .tag-pub   { background: rgba(58,170,138,0.1); border-color: rgba(58,170,138,0.3); color: var(--accent-hover); }
        .tag-draft { background: rgba(200,80,80,0.08); border-color: rgba(200,80,80,0.25); color: #e08080; }

        /* Inline edit/delete */
        .row-btn {
          font-family: var(--font-display); font-size: 0.72rem; letter-spacing: 0.04em;
          border-radius: 6px; padding: 0.35rem 0.8rem; cursor: pointer; transition: all 0.15s;
        }
        .row-btn.edit   { background: transparent; border: 1px solid var(--border-accent); color: var(--gold); }
        .row-btn.edit:hover   { background: var(--gold-muted); }
        .row-btn.delete { background: transparent; border: 1px solid rgba(200,80,80,0.3); color: #e08080; }
        .row-btn.delete:hover { background: rgba(200,80,80,0.1); border-color: rgba(200,80,80,0.55); }

        /* Category section header */
        .cat-section { margin-bottom: 2.5rem; }
        .cat-header  { display: flex; align-items: center; gap: 0.65rem; padding-bottom: 0.65rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border); }
        .cat-count   { font-family: var(--font-mono); font-size: 0.68rem; background: var(--gold-muted); border: 1px solid var(--border-accent); color: var(--gold-light); padding: 2px 8px; border-radius: 999px; }

        /* Stat pill */
        .stat-pill { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem 1.1rem; text-align: center; }
        .stat-val  { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--gold-light); }
        .stat-lbl  { font-family: var(--font-mono); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-top: 2px; }

        /* Delete modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; }
        .modal-box { background: var(--bg-surface); border: 1px solid rgba(200,80,80,0.3); border-radius: 14px; padding: 2rem; max-width: 360px; width: 90%; text-align: center; }

        /* JSON textarea */
        .json-area {
          width: 100%; background: var(--bg-base);
          border: 1.5px solid var(--border-strong); border-radius: 10px;
          color: var(--accent-hover); font-family: var(--font-mono); font-size: 13px;
          line-height: 1.75; padding: 1.25rem; resize: vertical; min-height: 300px;
          transition: border-color 0.2s; outline: none;
        }
        .json-area:focus { border-color: var(--border-accent); box-shadow: 0 0 0 3px var(--gold-muted); }
        .json-area::placeholder { color: var(--text-muted); opacity: 0.5; }

        /* Preview + error boxes */
        .preview-box { background: var(--bg-elevated); border: 1px solid rgba(58,170,138,0.3); border-radius: 10px; padding: 1.25rem 1.5rem; margin-top: 1rem; }
        .error-box   { background: rgba(200,80,80,0.07); border: 1px solid rgba(200,80,80,0.3); border-radius: 8px; color: #e8b0a0; padding: 0.8rem 1rem; margin-top: 0.75rem; font-size: 0.9rem; }
        .success-box { background: rgba(58,170,138,0.08); border: 1px solid rgba(58,170,138,0.3); border-radius: 8px; color: var(--accent-hover); padding: 0.8rem 1rem; margin-top: 0.75rem; font-size: 0.9rem; text-align: center; font-family: var(--font-display); }

        .section-chip { display: inline-block; padding: 3px 10px; border-radius: 999px; background: var(--gold-muted); border: 1px solid var(--border-accent); color: var(--gold-light); font-size: 0.7rem; font-family: var(--font-mono); margin: 2px; }
        .hint-box { background: var(--bg-base); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; white-space: pre-wrap; font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); line-height: 1.7; margin-top: 0.75rem; max-height: 240px; overflow-y: auto; }

        /* Category selector grid */
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
        .cat-btn {
          background: var(--card-bg); border: 1.5px solid var(--border);
          border-radius: 10px; padding: 0.75rem 0.5rem; cursor: pointer;
          transition: all 0.18s; display: flex; flex-direction: column;
          align-items: center; gap: 0.3rem;
        }
        .cat-btn:hover { background: var(--card-bg-hover); border-color: var(--border-accent); }
        .cat-btn.active { background: var(--gold-muted); border-color: var(--gold); box-shadow: 0 0 16px var(--shadow-gold); }
        .cat-btn-label { font-family: var(--font-display); font-size: 0.72rem; letter-spacing: 0.04em; color: var(--text-muted); transition: color 0.15s; }
        .cat-btn.active .cat-btn-label { color: var(--gold-light); font-weight: 700; }

        /* Loading skeleton */
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .shimmer { background: linear-gradient(90deg, var(--card-bg) 25%, var(--bg-elevated) 50%, var(--card-bg) 75%); background-size: 800px 100%; animation: shimmer 1.5s infinite; border-radius: 10px; height: 64px; margin-bottom: 0.5rem; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.3s ease forwards; }

        .field-label { font-family: var(--font-mono); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); display: block; margin-bottom: 0.5rem; }
        .section-heading { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.3rem; }
        .section-sub { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
      `}</style>

      {/* ── Topbar ── */}
      <div className="topbar">
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
        <span className="crumb" style={{ letterSpacing: "0.12em" }}>ADMIN</span>
        <span className="sep">›</span>
        <span className="crumb link active" onClick={goList}>Chapters</span>
        {view !== "list" && <>
          <span className="sep">›</span>
          <span className="crumb active">{view === "upload" ? "Upload New" : `Edit: ${editChapter?.title ?? ""}`}</span>
        </>}
        <div style={{ flex: 1 }} />
        {view === "list"
          ? <button className="action-btn primary" onClick={openUpload}>+ New Chapter</button>
          : <button className="action-btn secondary" onClick={goList}>‹ Back to List</button>
        }
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "2rem 1rem 4rem" }}>

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div className="fade-up">
            {/* Stats */}
            <div style={{ display: "flex", gap: "0.65rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              <div className="stat-pill">
                <div className="stat-val">{chapters.length}</div>
                <div className="stat-lbl">Total</div>
              </div>
              {apiCategories.map(cat => {
                const count = (grouped[cat.slug] ?? []).length;
                if (!count) return null;
                const m = getCategoryMeta(cat);
                return (
                  <div key={cat.slug} className="stat-pill" style={{ borderColor: `${m.color}40` }}>
                    <div className="stat-val" style={{ color: m.color }}>{count}</div>
                    <div className="stat-lbl">{m.icon} {m.label}</div>
                  </div>
                );
              })}
            </div>

            {loadingList ? (
              [...Array(6)].map((_, i) => <div key={i} className="shimmer" />)
            ) : chapters.length === 0 ? (
              <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📭</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>No chapters yet</div>
              </div>
            ) : (
              apiCategories.map(cat => {
                const list = grouped[cat.slug] ?? [];
                if (!list.length) return null;
                const m = getCategoryMeta(cat);
                return (
                  <div key={cat.slug} className="cat-section">
                    <div className="cat-header">
                      <span style={{ fontSize: "1.15rem" }}>{m.icon}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: m.color, letterSpacing: "0.04em" }}>
                        {m.label}
                      </span>
                      <span className="cat-count">{list.length}</span>
                    </div>
                    {list.map(ch => (
                      <div key={ch._id} className="ch-row">
                        <div className="ch-order">#{ch.order}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ch-title">{ch.title}</div>
                          {ch.subtitle && <div className="ch-sub">{ch.subtitle}</div>}
                          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                            {ch.era && <span className="ch-tag">🕰 {ch.era}</span>}
                            {ch.estimatedReadingTime && <span className="ch-tag">⏱ {ch.estimatedReadingTime}m</span>}
                            <span className={`ch-tag ${ch.isPublished ? "tag-pub" : "tag-draft"}`}>
                              {ch.isPublished ? "Published" : "Draft"}
                            </span>
                            <span className="ch-tag">{ch.sections?.length ?? 0} sections</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                          <button className="row-btn edit" onClick={() => openEdit(ch)}>Edit</button>
                          <button className="row-btn delete" onClick={() => setDeleteConfirm(ch._id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── UPLOAD / EDIT VIEW ── */}
        {(view === "upload" || view === "edit") && (
          <JSONEditor
            existing={editChapter}
            onSuccess={goList}
          />
        )}
      </div>

      {/* ── Delete modal ── */}
      {deleteConfirm && confirmChapter && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🗑️</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Delete Chapter?
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", fontStyle: "italic" }}>
              &quot;{confirmChapter.title}&quot;
            </p>
            <p style={{ color: "#e08080", fontSize: "0.82rem", marginBottom: "1.5rem" }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button className="action-btn secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="action-btn"
                style={{ background: "rgba(200,80,80,0.85)", color: "#fff", fontFamily: "var(--font-display)", fontSize: "0.82rem", border: "none", borderRadius: 8, padding: "0.5rem 1.2rem", cursor: "pointer" }}
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
}

function JSONEditor({ existing, onSuccess }: JSONEditorProps) {
  const isEdit = !!existing;

  // Fetch categories independently — doesn't rely on parent state
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [catsLoading, setCatsLoading]     = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(cats => setApiCategories(cats))
      .catch(() => setApiCategories([]))
      .finally(() => setCatsLoading(false));
  }, []);

  const [selectedCat, setSelectedCat] = useState<string>(existing?.category ?? "");
  const [json, setJson]               = useState<string>(isEdit ? JSON.stringify(existing, null, 2) : "");
  const [state, setState]             = useState<UploadState>("idle");
  const [error, setError]             = useState<string>("");
  const [preview, setPreview]         = useState<Record<string, unknown> | null>(isEdit ? (existing as unknown as Record<string, unknown>) : null);
  const [showHint, setShowHint]       = useState<boolean>(false);

  const validSlugs   = apiCategories.map(c => c.slug);
  const getFinalData = () => validateJSON(json, selectedCat, validSlugs);

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
      const axiosMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg ?? (e instanceof Error ? e.message : "Request failed."));
      setState("error");
    }
  };

  const selectedCatObj = apiCategories.find(c => c.slug === selectedCat) ?? null;
  const catMeta        = selectedCatObj ? getCategoryMeta(selectedCatObj) : null;

  const sectionSummary: string[] = Array.isArray(preview?.sections)
    ? (preview.sections as { type: string; questions?: unknown[] }[]).map(s =>
        s.type === "quiz" ? `quiz (${(s.questions ?? []).length}q)` : s.type
      )
    : [];

  const previewTitle     = typeof preview?.title     === "string"  ? preview.title     : "";
  const previewSubtitle  = typeof preview?.subtitle  === "string"  ? preview.subtitle  : "";
  const previewEra       = typeof preview?.era       === "string"  ? preview.era       : "";
  const previewTime      = typeof preview?.estimatedReadingTime === "number" ? preview.estimatedReadingTime : null;
  const previewOrder     = typeof preview?.order     === "number"  ? preview.order     : null;
  const previewPublished = preview?.isPublished !== false;

  return (
    <div className="fade-up">
      <div className="section-heading">{isEdit ? "Edit Chapter" : "Upload New Chapter"}</div>
      {isEdit && existing && (
        <div className="section-sub">Editing: &quot;{existing.title}&quot;</div>
      )}

      {/* ── Step 1: Category ── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <span className="field-label">Step 1 — Select Category</span>

        {catsLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.6rem" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 72 }} />
            ))}
          </div>
        ) : apiCategories.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "1rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
            No categories found. Add categories first via the API.
          </div>
        ) : (
          <div className="cat-grid">
            {apiCategories.map(cat => {
              const m      = getCategoryMeta(cat);
              const active = selectedCat === cat.slug;
              return (
                <button
                  key={cat.slug}
                  className={`cat-btn${active ? " active" : ""}`}
                  style={active ? { borderColor: m.color, boxShadow: `0 0 16px ${m.color}40` } : {}}
                  onClick={() => { setSelectedCat(cat.slug); setPreview(null); setState("idle"); setError(""); }}
                >
                  <span style={{ fontSize: "1.3rem" }}>{m.icon}</span>
                  <span className="cat-btn-label" style={active ? { color: m.color } : {}}>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Step 2: Paste JSON ── */}
      <div style={{ opacity: selectedCat ? 1 : 0.45, transition: "opacity 0.2s", pointerEvents: selectedCat ? "auto" : "none" }}>
        <span className="field-label">
          Step 2 — {isEdit ? "Edit JSON" : "Paste JSON"}
          {catMeta && (
            <span style={{ marginLeft: "0.75rem", color: catMeta.color, textTransform: "none", letterSpacing: 0 }}>
              → saving under {catMeta.icon} {catMeta.label}
            </span>
          )}
        </span>

        {!isEdit && (
          <div style={{ marginBottom: "0.75rem" }}>
            <button
              className="action-btn secondary"
              style={{ fontSize: "0.72rem", padding: "0.35rem 0.85rem" }}
              onClick={() => setShowHint((h: boolean) => !h)}
            >
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
      {state === "error" && error && <div className="error-box">⚠ {error}</div>}

      {/* Preview */}
      {preview && (
        <div className="preview-box">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-hover)", marginBottom: "0.75rem" }}>
            ✓ Valid — Preview
          </div>
          {catMeta && (
            <div style={{ marginBottom: "0.75rem" }}>
              <span className="badge badge-gold">
                {catMeta.icon} {catMeta.label}
              </span>
            </div>
          )}
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            {previewTitle}
          </div>
          {previewSubtitle && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", fontStyle: "italic", marginBottom: "0.75rem" }}>{previewSubtitle}</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.65rem" }}>
            {previewEra   && <span className="ch-tag">🕰 {previewEra}</span>}
            {previewTime  && <span className="ch-tag">⏱ {previewTime}m</span>}
            {previewOrder !== null && <span className="ch-tag">Order #{previewOrder}</span>}
            <span className={`ch-tag ${previewPublished ? "tag-pub" : "tag-draft"}`}>
              {previewPublished ? "Published" : "Draft"}
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.65rem" }}>
            <span className="field-label">Sections</span>
            {sectionSummary.map((s, i) => <span key={i} className="section-chip">{s}</span>)}
          </div>
        </div>
      )}

      {/* Success */}
      {state === "success" && (
        <div className="success-box">✓ {isEdit ? "Chapter updated!" : "Chapter uploaded!"} Returning…</div>
      )}

      {/* Actions */}
      {state !== "success" && (
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button className="action-btn secondary" onClick={handleValidate} disabled={!json.trim() || !selectedCat}>
            Validate
          </button>
          <button
            className="action-btn primary"
            style={{ flex: 1 }}
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

      {!selectedCat && !catsLoading && apiCategories.length > 0 && (
        <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", fontFamily: "var(--font-mono)" }}>
          Select a category to enable upload
        </p>
      )}
    </div>
  );
}
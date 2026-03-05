"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchHadiths, fetchHadithChapters, fetchRandomHadith, HADITH_BOOKS } from "@/lib/api";
import type { Hadith, HadithChapter } from "@/types";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  ),
  Shuffle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  ),
  ChevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  Copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path strokeLinecap="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M13 16h-2" />
    </svg>
  ),
};

const STATUS_OPTIONS = ["", "Sahih", "Hasan", "Da`eef"];

function HadithCard({ hadith, highlight }: { hadith: Hadith; highlight?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(
      `${hadith.englishNarrator}\n\n${hadith.hadithEnglish}\n\n— ${hadith.book.bookName}, Hadith ${hadith.hadithNumber}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightText = (text: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === highlight.toLowerCase()
        ? <mark key={i} className="bg-[var(--gold-muted)] text-[var(--gold-light)] rounded px-0.5">{p}</mark>
        : p
    );
  };

  const statusColor =
    hadith.status === "Sahih" ? "text-green-400 bg-green-500/10 border-green-500/20" :
    hadith.status === "Hasan" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
    "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <div className="card rounded-2xl overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[var(--gold)] font-mono font-bold text-sm">#{hadith.hadithNumber}</span>
          <span className="text-[var(--text-muted)] text-xs">{hadith.book.bookName}</span>
          <span className="text-[var(--text-muted)] text-xs hidden sm:inline">· {hadith.chapter.chapterEnglish}</span>
          {hadith.status && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
              {hadith.status}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          className="text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors flex items-center gap-1 text-xs"
        >
          {Icons.Copy}
          <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Narrator */}
        {hadith.englishNarrator && (
          <p className="text-[var(--gold)] text-sm font-medium italic">
            {hadith.englishNarrator}
          </p>
        )}

        {/* English text */}
        <p className="text-[var(--text-primary)] text-sm leading-relaxed">
          {highlightText(hadith.hadithEnglish)}
        </p>

        {/* Arabic text */}
        {hadith.hadithArabic && (
          <div className="border-t border-[var(--border)] pt-4">
            <p className="font-arabic text-right text-[var(--text-secondary)] text-base leading-loose" dir="rtl">
              {hadith.hadithArabic.replace(/[\u200f\u200e]/g, "").trim()}
            </p>
          </div>
        )}

        {/* Urdu text */}
        {hadith.hadithUrdu && (
          <div className="border-t border-[var(--border)] pt-3">
            <p className="font-arabic text-right text-[var(--text-muted)] text-sm leading-loose" dir="rtl">
              {hadith.hadithUrdu}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HadithPage() {
  const [hadiths, setHadiths]       = useState<Hadith[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Filters
  const [book, setBook]             = useState("sahih-bukhari");
  const [chapter, setChapter]       = useState("");
  const [hadithNumber, setHadithNumber] = useState("");
  const [status, setStatus]         = useState("");
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Chapters
  const [chapters, setChapters]     = useState<HadithChapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Pagination
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [total, setTotal]           = useState(0);
  const PER_PAGE = 10;

  // Load chapters when book changes
  useEffect(() => {
    setChaptersLoading(true);
    setChapter("");
    fetchHadithChapters(book)
      .then((r) => setChapters(r.chapters ?? []))
      .catch(() => setChapters([]))
      .finally(() => setChaptersLoading(false));
  }, [book]);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHadiths({
        book,
        chapter: chapter || undefined,
        hadithNumber: hadithNumber || undefined,
        status: status || undefined,
        paginate: PER_PAGE,
        page: p,
      });
      if (res.status === 200) {
        setHadiths(res.hadiths.data);
        setLastPage(res.hadiths.last_page);
        setTotal(res.hadiths.total ?? 0);
        setPage(p);
      } else {
        setError("No hadiths found for these filters.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [book, chapter, hadithNumber, status]);

  // Initial load
  useEffect(() => { load(1); }, [load]);

  const handleRandom = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRandomHadith();
      if (res.status === 200 && res.hadiths.data.length) {
        setHadiths(res.hadiths.data);
        setLastPage(1);
        setTotal(1);
        setPage(1);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    load(1);
  };

  const filtered = search
    ? hadiths.filter(
        (h) =>
          h.hadithEnglish.toLowerCase().includes(search.toLowerCase()) ||
          h.englishNarrator.toLowerCase().includes(search.toLowerCase())
      )
    : hadiths;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">
            Hadith Explorer
          </h1>
          <p className="text-[var(--text-muted)]">Browse and search from 9 authenticated hadith collections</p>
        </div>

        {/* Filters */}
        <div className="card rounded-2xl p-5 space-y-4">
          {/* Row 1: book + chapter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Book
              </label>
              <select value={book} onChange={(e) => { setBook(e.target.value); setPage(1); }} className="input">
                {HADITH_BOOKS.map((b) => (
                  <option key={b.slug} value={b.slug}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Chapter {chaptersLoading && <span className="text-[var(--gold)] ml-1">loading…</span>}
              </label>
              <select value={chapter} onChange={(e) => { setChapter(e.target.value); setPage(1); }} className="input">
                <option value="">All Chapters</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.chapterNumber}>
                    {c.chapterNumber}. {c.chapterEnglish}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: hadith number + status + search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Hadith Number
              </label>
              <input
                type="number"
                value={hadithNumber}
                onChange={(e) => setHadithNumber(e.target.value)}
                placeholder="e.g. 1"
                className="input"
                min={1}
              />
            </div>
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Authenticity
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s || "All"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Search in results
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Keyword…"
                  className="input"
                />
                <button type="button" onClick={handleSearch} className="btn-gold px-3 rounded-lg flex-shrink-0">
                  {Icons.Search}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => load(1)}
              disabled={loading}
              className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {Icons.Filter}
              {loading ? "Loading…" : "Apply Filters"}
            </button>
            <button
              type="button"
              onClick={handleRandom}
              disabled={loading}
              className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)]
                         px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:border-[var(--border-accent)] transition-all disabled:opacity-50"
            >
              {Icons.Shuffle}
              Random Hadith
            </button>
            {total > 0 && (
              <span className="ml-auto self-center text-[var(--text-muted)] text-xs">
                {total.toLocaleString()} hadiths
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card rounded-xl p-4 border-red-500/30 bg-red-500/5 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card rounded-2xl overflow-hidden animate-pulse">
                <div className="h-10 bg-[var(--bg-elevated)]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/2" />
                  <div className="h-3 bg-[var(--bg-elevated)] rounded w-full" />
                  <div className="h-3 bg-[var(--bg-elevated)] rounded w-4/5" />
                  <div className="h-3 bg-[var(--bg-elevated)] rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hadith list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((h) => (
              <HadithCard key={h.id} hadith={h} highlight={search} />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card rounded-xl p-10 text-center text-[var(--text-muted)]">
            No hadiths found. Try adjusting your filters.
          </div>
        )}

        {/* Pagination */}
        {!loading && lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="card px-4 py-2 rounded-xl text-sm flex items-center gap-1 hover:border-[var(--border-accent)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {Icons.ChevronLeft} Prev
            </button>
            <span className="text-[var(--text-muted)] text-sm">
              Page <span className="text-[var(--text-primary)] font-medium">{page}</span> of {lastPage}
            </span>
            <button
              type="button"
              onClick={() => load(page + 1)}
              disabled={page >= lastPage}
              className="card px-4 py-2 rounded-xl text-sm flex items-center gap-1 hover:border-[var(--border-accent)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next {Icons.ChevronRight}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
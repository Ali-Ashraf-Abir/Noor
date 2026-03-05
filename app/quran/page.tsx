"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  audio: string;
  translation?: string;
  transliteration?: string;
}

interface Reciter {
  identifier: string;
  englishName: string;
  name: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icons = {
  Bookmark: ({ filled }: { filled?: boolean }) => (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  ),
  Copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path strokeLinecap="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  ),
  ChevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  ),
  BookmarkList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  ),
  Close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
    </svg>
  ),
  Loader: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 animate-spin">
      <path strokeLinecap="round" d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  ),
  Play: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6 4.75a.75.75 0 0 1 1.14-.643l11.5 7.25a.75.75 0 0 1 0 1.286l-11.5 7.25A.75.75 0 0 1 6 19.25V4.75Z" />
    </svg>
  ),
  Pause: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7 0a.75.75 0 0 1 .75-.75H16a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25Z" />
    </svg>
  ),
  PlayCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" />
      <path fill="currentColor" stroke="none" d="M10 8.5 16 12l-6 3.5V8.5Z" />
    </svg>
  ),
  StopCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Volume: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5ZM15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
};

// ── Constants ──────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English",    identifier: "en.sahih" },
  { code: "bn", label: "Bengali",    identifier: "bn.bengali" },
  { code: "ur", label: "Urdu",       identifier: "ur.jalandhry" },
  { code: "fr", label: "French",     identifier: "fr.hamidullah" },
  { code: "tr", label: "Turkish",    identifier: "tr.diyanet" },
  { code: "id", label: "Indonesian", identifier: "id.indonesian" },
  { code: "ru", label: "Russian",    identifier: "ru.kuliev" },
  { code: "de", label: "German",     identifier: "de.aburida" },
];

const FONT_SIZES = [
  { key: "sm", label: "Small",   arabic: "text-2xl", trans: "text-xs"  },
  { key: "md", label: "Medium",  arabic: "text-3xl", trans: "text-sm"  },
  { key: "lg", label: "Large",   arabic: "text-4xl", trans: "text-base"},
  { key: "xl", label: "X-Large", arabic: "text-5xl", trans: "text-lg"  },
] as const;

const BASE = "https://api.alquran.cloud/v1";
const TRANSLITERATION_EDITION = "en.transliteration";

async function fetchJSON(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.status);
  return data.data;
}

// ── Per-ayah inline player ─────────────────────────────────────────────────────
function AyahPlayer({
  audioUrl,
  globalAudioRef,
  playingAyahIdx,
  myIdx,
  onActivate,
}: {
  audioUrl: string;
  globalAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  playingAyahIdx: number | null;
  myIdx: number;
  onActivate: (idx: number, playing: boolean) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);
  const isActive = playingAyahIdx === myIdx;

  // When global state says something else is playing, pause this one
  useEffect(() => {
    if (!isActive && localPlaying) {
      setLocalPlaying(false);
    }
  }, [isActive, localPlaying]);

  const toggle = () => {
    if (!globalAudioRef.current) globalAudioRef.current = new Audio();
    const audio = globalAudioRef.current;

    if (isActive && localPlaying) {
      audio.pause();
      setLocalPlaying(false);
      onActivate(myIdx, false);
    } else {
      // Stop whatever was playing and load this ayah
      audio.pause();
      audio.src = audioUrl;
      audio.load();
      audio.play().catch(console.error);
      setLocalPlaying(true);
      onActivate(myIdx, true);

      audio.ontimeupdate = () => setProgress(audio.currentTime);
      audio.ondurationchange = () => setDuration(audio.duration);
      audio.onended = () => {
        setLocalPlaying(false);
        setProgress(0);
        onActivate(myIdx, false);
      };
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!globalAudioRef.current || !isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const t = pct * duration;
    globalAudioRef.current.currentTime = t;
    setProgress(t);
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const playing = isActive && localPlaying;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          onClick={toggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            playing
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--bg-elevated)] text-[var(--gold)] border border-[var(--border-accent)] hover:bg-[var(--gold-muted)]"
          }`}
          title={playing ? "Pause" : "Play ayah"}
        >
          {playing ? Icons.Pause : Icons.Play}
        </button>

        {/* Progress bar + time */}
        <div className="flex-1 min-w-0">
          <div
            className="relative h-1 rounded-full bg-[var(--bg-elevated)] cursor-pointer mb-1"
            onClick={seek}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                playing ? "bg-[var(--accent)]" : "bg-[var(--gold)]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {formatTime(progress)}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {duration > 0 ? formatTime(duration) : "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Surah audio player ─────────────────────────────────────────────────────────
function SurahAudioPlayer({
  ayahs,
  currentAyahIdx,
  isPlaying,
  onToggle,
  onAyahChange,
  progress,
  duration,
  onSeek,
}: {
  ayahs: Ayah[];
  currentAyahIdx: number;
  isPlaying: boolean;
  onToggle: () => void;
  onAyahChange: (idx: number) => void;
  progress: number;
  duration: number;
  onSeek: (t: number) => void;
}) {
  const current = ayahs[currentAyahIdx];
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="card rounded-xl p-4 mt-4">
      <div className="flex items-center gap-3">
        {/* Play/pause */}
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-full btn-gold flex items-center justify-center flex-shrink-0"
        >
          {isPlaying ? Icons.Pause : Icons.Play}
        </button>

        {/* Info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-muted)]">
              Ayah <span className="text-[var(--gold)] font-semibold">{current?.numberInSurah}</span> / {ayahs.length}
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
          {/* Progress bar */}
          <div
            className="relative h-1.5 rounded-full cursor-pointer bg-[var(--bg-elevated)]"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              onSeek(pct * duration);
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--gold)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Prev / Next ayah */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onAyahChange(Math.max(0, currentAyahIdx - 1))}
            disabled={currentAyahIdx === 0}
            className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          >
            {Icons.ChevronLeft}
          </button>
          <button
            onClick={() => onAyahChange(Math.min(ayahs.length - 1, currentAyahIdx + 1))}
            disabled={currentAyahIdx === ayahs.length - 1}
            className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          >
            {Icons.ChevronRight}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function QuranPage() {
  const [surahs, setSurahs]               = useState<Surah[]>([]);
  const [selected, setSelected]           = useState<Surah | null>(null);
  const [ayahs, setAyahs]                 = useState<Ayah[]>([]);
  const [loading, setLoading]             = useState(false);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [fontKey, setFontKey]             = useState<"sm"|"md"|"lg"|"xl">("md");
  const [language, setLanguage]           = useState(LANGUAGES[0]);
  const [bookmarks, setBookmarks]         = useState<Set<string>>(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [copiedId, setCopiedId]           = useState<string | null>(null);

  // Audio state
  const [reciters, setReciters]           = useState<Reciter[]>([]);
  const [reciter, setReciter]             = useState<Reciter | null>(null);
  const [playingAyahIdx, setPlayingAyahIdx] = useState<number | null>(null);
  const [surahPlaying, setSurahPlaying]   = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [surahPlayerVisible, setSurahPlayerVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const surahPlayerRef = useRef<HTMLDivElement>(null);
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const font = FONT_SIZES.find(f => f.key === fontKey) ?? FONT_SIZES[1];

  // Load surah list
  useEffect(() => {
    fetchJSON(`${BASE}/surah`)
      .then(setSurahs)
      .catch(console.error)
      .finally(() => setLoadingSurahs(false));
  }, []);

  // Load reciters
  useEffect(() => {
    fetchJSON(`${BASE}/edition/format/audio`)
      .then((data: Reciter[]) => {
        setReciters(data);
        // default to Sudais
        const def = data.find((r: Reciter) => r.identifier === "ar.abdurrahmaansudais") ?? data[0];
        setReciter(def);
      })
      .catch(console.error);
  }, []);

  // Persist bookmarks
  useEffect(() => {
    try {
      const saved = localStorage.getItem("quran-bookmarks");
      if (saved) setBookmarks(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const saveBookmarks = useCallback((bm: Set<string>) => {
    try { localStorage.setItem("quran-bookmarks", JSON.stringify([...bm])); } catch {}
  }, []);

  // Stop audio when surah changes
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setPlayingAyahIdx(null);
    setSurahPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
  }, []);

  const loadSurah = useCallback(async (surah: Surah) => {
    stopAudio();
    setSelected(surah);
    setAyahs([]);
    setLoading(true);
    setShowBookmarks(false);
    try {
      const reciterEdition = reciter?.identifier ?? "ar.abdurrahmaansudais";
      const [audioData, translation, translit] = await Promise.all([
        fetchJSON(`${BASE}/surah/${surah.number}/${reciterEdition}`),
        fetchJSON(`${BASE}/surah/${surah.number}/${language.identifier}`),
        fetchJSON(`${BASE}/surah/${surah.number}/${TRANSLITERATION_EDITION}`),
      ]);
      setAyahs(audioData.ayahs.map((a: any, i: number) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        audio: a.audio,
        translation: translation.ayahs[i]?.text,
        transliteration: translit.ayahs[i]?.text,
      })));
      readerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [language, reciter, stopAudio]);

  // Reload on language/reciter change
  useEffect(() => {
    if (selected) loadSurah(selected);
  }, [language, reciter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio playback logic ───────────────────────────────────────────────────
  const playAyah = useCallback((idx: number, continueSurah = false) => {
    const ayah = ayahs[idx];
    if (!ayah) return;

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    audio.src = ayah.audio;
    audio.load();
    audio.play().catch(console.error);
    setPlayingAyahIdx(idx);
    if (continueSurah) setSurahPlaying(true);

    audio.ontimeupdate = () => setAudioProgress(audio.currentTime);
    audio.ondurationchange = () => setAudioDuration(audio.duration);

    audio.onended = () => {
      if (continueSurah && idx + 1 < ayahs.length) {
        playAyah(idx + 1, true);
      } else {
        setPlayingAyahIdx(null);
        setSurahPlaying(false);
        setAudioProgress(0);
      }
    };
  }, [ayahs]);

  const toggleAyahPlay = (idx: number) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    if (playingAyahIdx === idx && !audio.paused) {
      audio.pause();
      setPlayingAyahIdx(null);
      setSurahPlaying(false);
    } else {
      playAyah(idx, surahPlaying);
    }
  };

  const toggleSurahPlay = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    if (surahPlaying && !audio.paused) {
      audio.pause();
      setSurahPlaying(false);
    } else if (surahPlaying && audio.paused) {
      audio.play().catch(console.error);
      setSurahPlaying(true);
    } else {
      const startIdx = playingAyahIdx ?? 0;
      playAyah(startIdx, true);
    }
  };

  const handleSeek = (t: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      setAudioProgress(t);
    }
  };

  const handleAyahChange = (idx: number) => {
    playAyah(idx, surahPlaying);
  };

  // Cleanup on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // Auto-scroll to active ayah during surah playback
  useEffect(() => {
    if (surahPlaying && playingAyahIdx !== null) {
      const el = ayahRefs.current[playingAyahIdx];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [playingAyahIdx, surahPlaying]);

  // Observe surah player visibility to show/hide floating bar
  useEffect(() => {
    const el = surahPlayerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSurahPlayerVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ayahs]); // re-attach when ayahs load

  const toggleBookmark = (key: string) => {
    const next = new Set(bookmarks);
    next.has(key) ? next.delete(key) : next.add(key);
    setBookmarks(next);
    saveBookmarks(next);
  };

  const copyAyah = (ayah: Ayah) => {
    const text = `${ayah.text}\n\n${ayah.translation}\n\n— Surah ${selected?.englishName} ${ayah.numberInSurah}`;
    navigator.clipboard.writeText(text).catch(() => {});
    const key = `${selected?.number}-${ayah.numberInSurah}`;
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const bookmarkedAyahs = ayahs.filter(a => bookmarks.has(`${selected?.number}-${a.numberInSurah}`));
  const displayAyahs = showBookmarks ? bookmarkedAyahs : ayahs;

  return (
    <div ref={readerRef} className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Title ───────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">
            Quran Reader
          </h1>
          <p className="text-[var(--text-muted)]">Read, listen, and bookmark your favourite ayahs</p>
        </div>

        {/* ── Controls card ───────────────────────────────────────── */}
        <div className="card-glass rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Surah */}
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Surah
              </label>
              {loadingSurahs ? (
                <div className="input flex items-center gap-2 text-[var(--text-muted)]">
                  <span className="text-[var(--gold)]">{Icons.Loader}</span> Loading…
                </div>
              ) : (
                <select
                  className="input"
                  value={selected?.number ?? ""}
                  onChange={e => {
                    const s = surahs.find(s => s.number === Number(e.target.value));
                    if (s) loadSurah(s);
                  }}
                >
                  <option value="" disabled>Select a surah…</option>
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.englishName} — {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Reciter */}
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Reciter
              </label>
              {reciters.length === 0 ? (
                <div className="input flex items-center gap-2 text-[var(--text-muted)]">
                  <span className="text-[var(--gold)]">{Icons.Loader}</span> Loading…
                </div>
              ) : (
                <select
                  className="input"
                  value={reciter?.identifier ?? ""}
                  onChange={e => {
                    const r = reciters.find(r => r.identifier === e.target.value);
                    if (r) setReciter(r);
                  }}
                >
                  {reciters.map(r => (
                    <option key={r.identifier} value={r.identifier}>{r.englishName}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Translation */}
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Translation
              </label>
              <select
                className="input"
                value={language.code}
                onChange={e => {
                  const l = LANGUAGES.find(l => l.code === e.target.value);
                  if (l) setLanguage(l);
                }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div>
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Arabic Font Size
              </label>
              <select
                className="input"
                value={fontKey}
                onChange={e => setFontKey(e.target.value as typeof fontKey)}
              >
                {FONT_SIZES.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info + bookmark toggle */}
          {selected && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)] flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="badge badge-gold">{selected.revelationType}</span>
                <span className="text-[var(--text-muted)] text-xs">{selected.numberOfAyahs} ayahs</span>
                <span className="text-[var(--text-muted)] text-xs">·</span>
                <span className="text-[var(--text-muted)] text-xs">{language.label} translation</span>
              </div>
              {bookmarks.size > 0 && (
                <button
                  onClick={() => setShowBookmarks(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    showBookmarks
                      ? "bg-[var(--gold-muted)] text-[var(--gold)] border-[var(--border-accent)]"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {Icons.BookmarkList}
                  {showBookmarks ? "Show all" : `${bookmarks.size} bookmark${bookmarks.size !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          )}

          {!selected && !loadingSurahs && (
            <p className="text-[var(--text-muted)] text-sm text-center mt-4">
              Choose a surah above to start reading.
            </p>
          )}
        </div>

        {/* ── Loading ─────────────────────────────────────────────── */}
        {loading && (
          <div className="card rounded-2xl p-12 flex flex-col items-center gap-3">
            <span className="text-[var(--gold)]">{Icons.Loader}</span>
            <p className="text-sm text-[var(--text-muted)]">Loading {selected?.englishName}…</p>
          </div>
        )}

        {/* ── Surah content ───────────────────────────────────────── */}
        {!loading && ayahs.length > 0 && (
          <>
            {/* Surah header */}
            <div className="card rounded-2xl p-6 text-center" style={{ borderColor: "var(--border-accent)" }}>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest mb-3">
                Surah {selected?.number} · {selected?.revelationType}
              </p>
              <h2 className="font-display text-4xl font-bold text-[var(--text-primary)] mb-1">
                {selected?.englishName}
              </h2>
              <p className="text-[var(--text-muted)] text-sm mb-5">{selected?.englishNameTranslation}</p>
              <p className="font-arabic text-3xl text-[var(--gold-light)]" style={{ lineHeight: 1.8, direction: "rtl" }}>
                {selected?.name}
              </p>
              {selected && selected.number !== 1 && selected.number !== 9 && (
                <>
                  <div className="w-16 h-px bg-[var(--border-accent)] mx-auto my-5" />
                  <p className="font-arabic text-xl text-[var(--gold)]" style={{ opacity: 0.75, direction: "rtl", lineHeight: 1.8 }}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </p>
                </>
              )}

              {/* Surah audio player */}
              <div ref={surahPlayerRef}>
              <SurahAudioPlayer
                ayahs={ayahs}
                currentAyahIdx={playingAyahIdx ?? 0}
                isPlaying={surahPlaying && !!audioRef.current && !audioRef.current.paused}
                onToggle={toggleSurahPlay}
                onAyahChange={handleAyahChange}
                progress={audioProgress}
                duration={audioDuration}
                onSeek={handleSeek}
              />
              </div>
            </div>

            {/* Bookmark banner */}
            {showBookmarks && (
              <div className="card rounded-xl px-4 py-3 flex items-center justify-between" style={{ borderColor: "var(--border-accent)", background: "var(--gold-muted)" }}>
                <span className="text-sm font-medium text-[var(--gold-light)]">
                  Showing {bookmarkedAyahs.length} bookmarked ayah{bookmarkedAyahs.length !== 1 ? "s" : ""}
                </span>
                <button onClick={() => setShowBookmarks(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  {Icons.Close}
                </button>
              </div>
            )}

            {/* Ayah cards */}
            <div className="space-y-4">
              {displayAyahs.map((ayah, displayIdx) => {
                const realIdx = ayahs.indexOf(ayah);
                const key = `${selected?.number}-${ayah.numberInSurah}`;
                const isBookmarked = bookmarks.has(key);
                const isCopied = copiedId === key;
                const isThisPlaying = playingAyahIdx === realIdx && !!audioRef.current && !audioRef.current.paused;
                const isActive = playingAyahIdx === realIdx;

                return (
                  <div
                    key={ayah.number}
                    ref={el => { ayahRefs.current[realIdx] = el; }}
                    className={`card-glass group rounded-2xl p-5 transition-all duration-200 ${
                      isActive ? "border-[var(--border-accent)]" : ""
                    } ${isBookmarked ? "border-[var(--border-accent)]" : ""}`}
                    style={isActive
                      ? { background: "color-mix(in srgb, var(--accent) 8%, var(--card-bg))", boxShadow: "0 0 0 1px var(--border-accent)" }
                      : isBookmarked
                      ? { background: "var(--gold-muted)" }
                      : undefined
                    }
                  >
                    {/* Ayah number + actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border transition-colors ${
                        isActive
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--bg-elevated)] text-[var(--gold)] border-[var(--border-accent)]"
                      }`}>
                        {ayah.numberInSurah}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Bookmark */}
                        <button
                          onClick={() => toggleBookmark(key)}
                          className={`p-1.5 rounded-lg transition-colors bg-[var(--bg-elevated)] ${
                            isBookmarked ? "text-[var(--gold)]" : "text-[var(--text-muted)] hover:text-[var(--gold)]"
                          }`}
                          title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                        >
                          <Icons.Bookmark filled={isBookmarked} />
                        </button>
                        {/* Copy */}
                        <button
                          onClick={() => copyAyah(ayah)}
                          className={`p-1.5 rounded-lg transition-colors bg-[var(--bg-elevated)] ${
                            isCopied ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }`}
                          title="Copy ayah"
                        >
                          {isCopied ? Icons.Check : Icons.Copy}
                        </button>
                      </div>
                    </div>

                    {/* Arabic */}
                    <p
                      className={`font-arabic text-right text-[var(--text-primary)] mb-4 ${font.arabic}`}
                      style={{ direction: "rtl", lineHeight: 2 }}
                    >
                      {ayah.text}
                    </p>

                    <div className="h-px bg-[var(--border)] mb-4" />

                    {/* Transliteration */}
                    {ayah.transliteration && (
                      <p className={`italic text-[var(--text-muted)] mb-2 ${font.trans}`}>
                        {ayah.transliteration}
                      </p>
                    )}

                    {/* Translation */}
                    {ayah.translation && (
                      <p className={`text-[var(--text-secondary)] leading-relaxed ${font.trans}`}>
                        {ayah.translation}
                      </p>
                    )}

                    {/* Per-ayah audio player */}
                    <AyahPlayer
                      audioUrl={ayah.audio}
                      globalAudioRef={audioRef}
                      playingAyahIdx={playingAyahIdx}
                      myIdx={realIdx}
                      onActivate={(idx, playing) => {
                        setPlayingAyahIdx(playing ? idx : null);
                        setSurahPlaying(false);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Prev / Next surah */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const prev = surahs.find(s => s.number === (selected?.number ?? 1) - 1);
                  if (prev) loadSurah(prev);
                }}
                disabled={!selected || selected.number === 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                           bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]
                           hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {Icons.ChevronLeft} Previous Surah
              </button>
              <span className="text-xs text-[var(--text-muted)]">{selected?.number} / 114</span>
              <button
                onClick={() => {
                  const next = surahs.find(s => s.number === (selected?.number ?? 0) + 1);
                  if (next) loadSurah(next);
                }}
                disabled={!selected || selected.number === 114}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                           bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]
                           hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next Surah {Icons.ChevronRight}
              </button>
            </div>
          </>
        )}

      </div>

      {/* ── Floating mini-player ─────────────────────────────── */}
      {(surahPlaying || playingAyahIdx !== null) && !surahPlayerVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-2"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-accent)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--border-accent)",
            }}
          >
            {/* Info */}
            <div className="flex-1 min-w-0 mr-1">
              <p className="text-xs font-semibold text-[var(--gold-light)] truncate leading-tight">
                {selected?.englishName}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                Ayah {playingAyahIdx !== null ? ayahs[playingAyahIdx]?.numberInSurah : "—"} / {ayahs.length}
              </p>
            </div>

            {/* Prev ayah */}
            <button
              onClick={() => handleAyahChange(Math.max(0, (playingAyahIdx ?? 0) - 1))}
              disabled={(playingAyahIdx ?? 0) === 0}
              className="p-2 rounded-lg bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors flex-shrink-0"
              title="Previous ayah"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M9.195 18.44c1.25.714 2.805-.189 2.805-1.629v-2.34l6.945 3.968c1.25.715 2.805-.188 2.805-1.628V8.69c0-1.44-1.555-2.343-2.805-1.628L12 11.029v-2.34c0-1.44-1.555-2.343-2.805-1.628l-7.108 4.061c-1.26.72-1.26 2.536 0 3.256l7.108 4.061Z" />
              </svg>
            </button>

            {/* Play / Pause */}
            <button
              onClick={toggleSurahPlay}
              className="w-10 h-10 rounded-full btn-gold flex items-center justify-center flex-shrink-0"
              title={surahPlaying ? "Pause" : "Play"}
            >
              {surahPlaying && audioRef.current && !audioRef.current.paused ? Icons.Pause : Icons.Play}
            </button>

            {/* Next ayah */}
            <button
              onClick={() => handleAyahChange(Math.min(ayahs.length - 1, (playingAyahIdx ?? 0) + 1))}
              disabled={(playingAyahIdx ?? 0) >= ayahs.length - 1}
              className="p-2 rounded-lg bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors flex-shrink-0"
              title="Next ayah"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.347 12 7.25 12 8.69v2.34L5.055 7.06Z" />
              </svg>
            </button>

            {/* Jump to current ayah */}
            <button
              onClick={() => {
                if (playingAyahIdx !== null) {
                  ayahRefs.current[playingAyahIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="p-2 rounded-lg bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors flex-shrink-0"
              title="Jump to current ayah"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
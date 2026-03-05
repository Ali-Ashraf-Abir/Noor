"use client";

import { useState, useEffect, useRef } from "react";
import { fetchNames, LANGUAGES } from "@/lib/api";
import type { AllahName } from "@/types";
import ErrorBanner from "@/components/ErrorBanner";

const CARD_ACCENTS = [
  "from-teal-500/20",
  "from-indigo-500/20",
  "from-amber-500/20",
  "from-rose-500/20",
  "from-blue-500/20",
  "from-emerald-500/20",
  "from-violet-500/20",
  "from-orange-500/20",
  "from-cyan-500/20",
];

function NameCard({
  name,
  isPlaying,
  onPlay,
}: {
  name: AllahName;
  isPlaying: boolean;
  onPlay: (n: AllahName) => void;
}) {
  const accent = CARD_ACCENTS[(name.number - 1) % CARD_ACCENTS.length];

  return (
    <div
      className={`card rounded-2xl p-5 flex flex-col gap-3 h-full group cursor-pointer
                  ${isPlaying ? "border-[var(--border-accent)] shadow-gold" : ""}`}
      onClick={() => onPlay(name)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPlay(name)}
      aria-label={`Play ${name.transliteration}`}
    >
      {/* Number badge */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} to-transparent
                      border border-[var(--border)] flex items-center justify-center
                      text-[var(--gold)] font-mono font-bold text-xs flex-shrink-0`}
        >
          {name.number}
        </span>
        {/* Play button */}
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0
            ${isPlaying
              ? "bg-[var(--gold)] text-[var(--bg-base)]"
              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:text-[var(--gold)] group-hover:border-[var(--border-accent)]"
            } border border-[var(--border)]`}
          aria-label={isPlaying ? "Stop" : "Play audio"}
          onClick={(e) => { e.stopPropagation(); onPlay(name); }}
        >
          {isPlaying ? "⏹" : "▶"}
        </button>
      </div>

      {/* Arabic name */}
      <p className="font-arabic text-2xl text-[var(--gold)]/90 leading-loose text-right">
        {name.name}
      </p>

      {/* Transliteration */}
      <p className="font-display font-bold text-[var(--text-primary)] text-base">
        {name.transliteration}
      </p>

      {/* Translation */}
      <p className="text-[var(--text-accent)] text-sm font-medium">{name.translation}</p>

      {/* Meaning */}
      <p className="text-[var(--text-muted)] text-xs leading-relaxed line-clamp-3 mt-auto">
        {name.meaning}
      </p>
    </div>
  );
}

export default function NamesPage() {
  const [names, setNames] = useState<AllahName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState<AllahName | null>(null);
  const [playingNum, setPlayingNum] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchNames(language);
        if (res.code === 200 && res.data) setNames(res.data.names);
        else setError(res.message ?? "Failed to fetch names.");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [language]);

  const handlePlay = (name: AllahName) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingNum === name.number) {
      setPlayingNum(null);
      return;
    }
    const audio = new Audio(`https://islamicapi.com${name.audio}`);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingNum(null);
    audioRef.current = audio;
    setPlayingNum(name.number);
  };

  const filtered = names.filter(
    (n) =>
      n.transliteration.toLowerCase().includes(search.toLowerCase()) ||
      n.translation.toLowerCase().includes(search.toLowerCase()) ||
      String(n.number).includes(search)
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <p className="font-arabic text-4xl md:text-5xl text-[var(--gold)]/80 mb-3 leading-loose">
            أَسْمَاءُ اللَّهِ الْحُسْنَى
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">
            99 Names of Allah
          </h1>
          <p className="text-[var(--text-muted)]">
            Explore the beautiful names of Allah with meanings and audio
          </p>
        </div>

        {/* Controls */}
        <div className="card-glass rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Search
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">
           
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, meaning or number…"
                  className="input pl-9"
                />
              </div>
            </div>

            {/* Language */}
            <div className="sm:w-48">
              <label className="block text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-[var(--text-muted)] text-xs">
              Showing{" "}
              <span className="text-[var(--gold-light)] font-semibold">{filtered.length}</span>{" "}
              of {names.length} names
            </p>
            {playingNum !== null && (
              <p className="text-[var(--gold)] text-xs flex items-center gap-1">
                <span className="animate-pulse">▶</span> Playing audio…
              </p>
            )}
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card rounded-2xl p-5 h-52 animate-pulse">
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4 mb-3" />
                <div className="h-8 bg-[var(--bg-elevated)] rounded mb-3" />
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[var(--bg-elevated)] rounded w-full" />
                <div className="h-3 bg-[var(--bg-elevated)] rounded w-4/5 mt-1" />
              </div>
            ))}
          </div>
        )}

        {/* Names grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((name) => (
              <NameCard
                key={name.number}
                name={name}
                isPlaying={playingNum === name.number}
                onPlay={handlePlay}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && names.length > 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-[var(--text-secondary)]">No names match "{search}"</p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-[var(--gold)] text-sm hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Modal for full detail */}
        {selectedName && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/80 backdrop-blur-sm"
            onClick={() => setSelectedName(null)}
          >
            <div
              className="card-glass rounded-3xl p-8 max-w-lg w-full animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <span className="badge badge-gold">#{selectedName.number}</span>
                <button
                  onClick={() => setSelectedName(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="font-arabic text-5xl text-[var(--gold)]/90 text-center mb-4 leading-loose">
                {selectedName.name}
              </p>
              <p className="font-display font-bold text-2xl text-[var(--text-primary)] text-center mb-1">
                {selectedName.transliteration}
              </p>
              <p className="text-[var(--text-accent)] text-center text-sm font-medium mb-6">
                {selectedName.translation}
              </p>
              <div className="bg-[var(--bg-elevated)] rounded-xl p-4">
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {selectedName.meaning}
                </p>
              </div>
              <button
                onClick={() => handlePlay(selectedName)}
                className={`mt-5 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all border ${
                  playingNum === selectedName.number
                    ? "btn-gold"
                    : "border-[var(--border-accent)] text-[var(--gold)] hover:bg-[var(--gold-muted)]"
                }`}
              >
                {playingNum === selectedName.number ? "⏹ Stop Audio" : "▶ Play Pronunciation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
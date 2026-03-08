"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchRandomHadith } from "@/lib/api";
import { InstallButton } from "@/components/InstallButton";

// ── SVG icons ─────────────────────────────────────────────────────────────────
const Icons = {
  ArrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path strokeLinecap="round" d="M8 7h8M8 11h6" />
    </svg>
  ),
  Refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  ChevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Mosque: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V11.5C5 10.1 5.9 9 7 9h10c1.1 0 2 1.1 2 2.5V21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-5a3 3 0 0 1 6 0v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9V6m0 0c0-1.5-1-3-2.5-3.5C10.5 4 11.2 5 12 6Zm0 0c0-1.5 1-3 2.5-3.5C13.5 4 12.8 5 12 6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9C7 7 8.5 5.5 12 5.5S17 7 17 9" />
    </svg>
  ),
  Moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646Z" />
    </svg>
  ),
  Names: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
  Quran: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Hadith: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path strokeLinecap="round" d="M8 7h8M8 11h6M8 15h4" />
    </svg>
  ),
  Learn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  Salah: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Tasbih: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
      <circle cx="12" cy="5" r="2" /><circle cx="19" cy="9" r="2" />
      <circle cx="19" cy="15" r="2" /><circle cx="12" cy="19" r="2" />
      <circle cx="5" cy="15" r="2" /><circle cx="5" cy="9" r="2" />
      <path strokeLinecap="round" d="M12 7v2.5M17.2 10.5l-2 1.3M17.2 13.5l-2-1.3M12 17v-2.5M6.8 13.5l2-1.3M6.8 10.5l2 1.3" />
    </svg>
  ),
};

const FEATURES = [
  // ── Books ──────────────────────────────────────────────────────────────────
  {
    href: "/quran",
    icon: Icons.Quran,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tag: "Full text",
    title: "Quran",
    desc: "Complete Quran with translation, transliteration, and verse-by-verse reading.",
  },
  {
    href: "/hadith",
    icon: Icons.Hadith,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    tag: "Sahih collections",
    title: "Hadith",
    desc: "Browse and search through authentic hadith collections including Bukhari and Muslim.",
  },
  // ── Prayer ─────────────────────────────────────────────────────────────────
  {
    href: "/prayer-times",
    icon: Icons.Mosque,
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/10 border-teal-500/20",
    tag: "Location-aware",
    title: "Prayer Times",
    desc: "Fajr, Dhuhr, Asr, Maghrib & Isha with live countdown, Qibla direction and prohibited times.",
  },
  {
    href: "/fasting",
    icon: Icons.Moon,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    tag: "Full month view",
    title: "Fasting Schedule",
    desc: "Suhoor & Iftar for today, a specific date, or the full month. Includes White Days reminders.",
  },
  {
    href: "/ibadah/salahtracker",
    icon: Icons.Salah,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10 border-green-500/20",
    tag: "Daily tracking",
    title: "Salah Tracker",
    desc: "Log your five daily prayers and build a consistent streak over time.",
  },
  {
    href: "/ibadah/tasbihcounter",
    icon: Icons.Tasbih,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    tag: "Dhikr",
    title: "Tasbih Counter",
    desc: "Digital tasbeeh for your daily dhikr and remembrance of Allah.",
  },
  // ── Learn ──────────────────────────────────────────────────────────────────
  {
    href: "/learn/categories",
    icon: Icons.Learn,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10 border-yellow-500/20",
    tag: "XP & quizzes",
    title: "Seerah & History",
    desc: "Learn Islamic history through chapters and quizzes. Earn XP and level up your knowledge.",
  },
  {
    href: "/asma-ul-husna",
    icon: Icons.Names,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tag: "20+ languages",
    title: "99 Names of Allah",
    desc: "All 99 Asma ul Husna with Arabic script, transliteration, meaning and audio pronunciations.",
  },
] as const;

// ── Feature section groups ────────────────────────────────────────────────────
const FEATURE_GROUPS = [
  { label: "📖  Books", slice: [0, 2] as const },
  { label: "🕌  Prayer & Ibadah", slice: [2, 6] as const },
  { label: "🎓  Learn", slice: [6, 8] as const },
];

interface HadithData {
  text: string;
  source: string;
  narrator?: string;
}

function HadithBox() {
  const [hadith, setHadith] = useState<HadithData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHadith = async () => {
    setLoading(true);
    try {
      const res = await fetchRandomHadith();
      if (res.status === 200 && res.hadiths?.data?.length) {
        const h = res.hadiths.data[0];
        setHadith({
          text: h.hadithEnglish,
          source: `${h.book.bookName} ${h.hadithNumber}`,
          narrator: h.englishNarrator,
        });
      }
    } catch (err) {
      console.error("Failed to load hadith", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHadith(); }, []);

  return (
    <div className="card rounded-2xl overflow-hidden w-full max-w-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2.5 text-[var(--gold)] text-xs font-semibold uppercase tracking-widest">
          <span>{Icons.Book}</span>
          Hadith of the Day
        </div>
        <button
          type="button"
          onClick={fetchHadith}
          disabled={loading}
          className="text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors disabled:opacity-40 p-1"
          aria-label="Refresh hadith"
        >
          <span className={loading ? "animate-spin inline-block" : ""}>{Icons.Refresh}</span>
        </button>
      </div>

      <div className="px-6 py-6 max-h-52 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-[var(--bg-elevated)] rounded w-full" />
            <div className="h-3 bg-[var(--bg-elevated)] rounded w-4/5" />
            <div className="h-3 bg-[var(--bg-elevated)] rounded w-3/5" />
          </div>
        ) : hadith ? (
          <>
            <p className="font-arabic text-3xl text-[var(--gold)]/30 leading-none mb-3 select-none">"</p>
            <p className="text-[var(--text-primary)] text-sm leading-relaxed mb-5">{hadith.text}</p>
            <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-[var(--border)]">
              {hadith.narrator && (
                <span className="text-[var(--text-muted)] text-xs">— {hadith.narrator}</span>
              )}
              <span className="text-[var(--gold)] text-xs font-medium ml-auto">{hadith.source}</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ── Section 1: Bismillah + Hadith ────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24 overflow-hidden">
        {[500, 380, 260, 150].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border border-[var(--border-accent)] pointer-events-none"
            style={{ width: size, height: size, opacity: 0.05 + i * 0.025 }}
          />
        ))}
        <div className="absolute w-96 h-96 rounded-full bg-[var(--accent)]/8 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center gap-10 w-full max-w-xl mx-auto">
          <div className="animate-fade-in">
            <p
              className="font-arabic text-4xl sm:text-5xl md:text-6xl text-[var(--gold-light)]"
              style={{ lineHeight: 1.5 }}
            >
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <p className="text-[var(--text-muted)] text-xs tracking-widest uppercase mt-3">
              In the name of Allah, the Most Gracious, the Most Merciful
            </p>
          </div>

          <div className="animate-slide-up w-full text-left" style={{ animationDelay: "0.1s" }}>
            <HadithBox />
          </div>
        </div>
        <div className="animate-fade-in">
          <div className="flex justify-center mt-5 md:hidden">
            <InstallButton />
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[var(--text-muted)] animate-bounce">
          <span className="text-xs tracking-widest uppercase">Explore</span>
          {Icons.ChevronDown}
        </div>
      </section>

      {/* ── Section 2: All Features grouped ─────────────────────────────── */}
      <section className="relative px-4 py-20 overflow-hidden">
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-16">

          <div className="text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
              Everything in one place
            </h2>
            <p className="text-[var(--text-muted)] text-base">
              Comprehensive Islamic tools designed with care
            </p>
          </div>

          {FEATURE_GROUPS.map(({ label, slice }) => (
            <div key={label} className="flex flex-col gap-5">
              <h3 className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-widest px-1">
                {label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.slice(slice[0], slice[1]).map((f, i) => (
                  <Link
                    key={f.href}
                    href={f.href}
                    className="card group p-6 rounded-2xl flex flex-col gap-5 animate-slide-up"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-13 h-13 rounded-xl border flex items-center justify-center
                                    ${f.iconBg} ${f.iconColor}
                                    group-hover:scale-110 transition-transform duration-200`}
                        style={{ width: 52, height: 52 }}
                      >
                        {f.icon}
                      </div>
                      <span className="text-[var(--text-muted)] text-xs border border-[var(--border)] rounded-full px-2.5 py-1 mt-1">
                        {f.tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1.5">
                        {f.title}
                      </h4>
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                        {f.desc}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center gap-2 text-[var(--gold)] text-sm font-medium group-hover:gap-3 transition-all duration-200">
                      Explore {Icons.ArrowRight}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Quran verse + Footer ──────────────────────────────── */}
      <section className="relative px-4 py-20 overflow-hidden">
        <div className="flex flex-col items-center gap-16 w-full max-w-2xl mx-auto">
          <div className="card rounded-2xl p-8 md:p-16 text-center w-full">
            <p
              className="font-arabic text-2xl md:text-3xl text-[var(--gold-light)] mb-6"
              style={{ lineHeight: 1.9 }}
            >
              إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا
            </p>
            <div className="w-16 h-px bg-[var(--border-accent)] mx-auto my-6" />
            <p className="text-[var(--text-secondary)] italic text-sm md:text-base leading-relaxed mb-4">
              "Indeed, prayer has been decreed upon the believers a decree of specified times."
            </p>
            <p className="text-[var(--gold)] text-xs font-semibold uppercase tracking-widest">
              Quran 4:103
            </p>
          </div>

          <footer className="text-center text-[var(--text-muted)] text-xs space-y-1.5 pb-8">
            <p className="font-arabic text-base text-[var(--gold)]/50">الحمد لله</p>
            <p>Built with care · All times are approximate</p>
            <p className="opacity-60">© {new Date().getFullYear()} · May Allah accept from all of us</p>
          </footer>
        </div>
      </section>
    </>
  );
}
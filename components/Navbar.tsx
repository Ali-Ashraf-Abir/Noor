"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { THEME_OPTIONS } from "@/lib/api";
import type { Theme } from "@/types";

// ── Theme SVG icons (one per theme value) ─────────────────────────────────────
const ThemeIcons: Record<string, React.ReactNode> = {
  // Deep Teal — sun with rays
  dark: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="10" cy="10" r="3.2" />
      <path strokeLinecap="round" d="M10 2v1.8M10 16.2V18M2 10h1.8M16.2 10H18M4.1 4.1l1.3 1.3M14.6 14.6l1.3 1.3M4.1 15.9l1.3-1.3M14.6 5.4l1.3-1.3" />
    </svg>
  ),
  // Parchment — crescent moon
  light: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 13.5A7.5 7.5 0 0 1 6.5 3a7.5 7.5 0 1 0 10.5 10.5Z" />
    </svg>
  ),
  // Warm Night — flame / candle
  warm: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 17c-3 0-5-2-5-4.5 0-2 1.5-3.5 2-5 .5 1.5 1 2 1.5 2C8 7 9 4.5 10 3c0 2.5 3 4 3 6.5 0 1-.4 1.9-1 2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 17c1.5 0 2.5-1 2.5-2.5 0-1-.5-1.8-1-2.5-.3.8-.8 1.2-1.5 1.2S8.8 11.8 8.5 11c-.5.7-1 1.5-1 2.5C7.5 16 8.5 17 10 17Z" />
    </svg>
  ),
  // Midnight Blue — star cluster
  midnight: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3l1.2 3.6H18l-3.1 2.3 1.2 3.6L13 10.2 10 17l-3-6.8-3.1 2.3 1.2-3.6L2 6.6h6.8L10 3Z" />
    </svg>
  ),
};

// ── Nav link icons ─────────────────────────────────────────────────────────────
const NavIcons = {
  PrayerTimes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V11.5C5 10.1 5.9 9 7 9h10c1.1 0 2 1.1 2 2.5V21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-5a3 3 0 0 1 6 0v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9V6m0 0C12 4.5 11 3 9.5 2.5 10.5 4 11.2 5 12 6Zm0 0c0-1.5 1-3 2.5-3.5C13.5 4 12.8 5 12 6Z" />
    </svg>
  ),
  Fasting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646Z" />
    </svg>
  ),
  Names: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
  Hadith: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path strokeLinecap="round" d="M8 7h8M8 11h6M8 15h4" />
    </svg>
  ),
  Quran: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Learn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  Profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  SignIn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 8l4 4 7-7" />
    </svg>
  ),
  Chevron: (
    <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
      <path d="M6 8L1 3h10L6 8z" />
    </svg>
  ),
};

// ── Nav links ──────────────────────────────────────────────────────────────────
const BASE_NAV_LINKS = [
  { href: "/prayer-times",     label: "Prayer Times", icon: NavIcons.PrayerTimes },
  { href: "/fasting",          label: "Fasting",      icon: NavIcons.Fasting     },
  { href: "/asma-ul-husna",    label: "99 Names",     icon: NavIcons.Names       },
  { href: "/hadith",           label: "Hadith",       icon: NavIcons.Hadith      },
  { href: "/quran",            label: "Quran",        icon: NavIcons.Quran       },
  { href: "/learn/categories", label: "Learn",        icon: NavIcons.Learn       },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen]   = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const navLinks = isAuthenticated
    ? [...BASE_NAV_LINKS, { href: "/profile", label: user?.username ?? "Profile", icon: NavIcons.Profile }]
    : BASE_NAV_LINKS;

  const currentTheme = THEME_OPTIONS.find(t => t.value === theme);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setThemeOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg-overlay)] backdrop-blur-xl shadow-card border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-[4.5rem] flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-full btn-gold flex items-center justify-center text-lg font-bold font-arabic">
            ن
          </div>
          <span className="font-display text-xl font-bold tracking-wide text-gold-gradient hidden sm:block">
            Noor
          </span>
        </Link>

        {/* ── Desktop links ── */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-[var(--gold-light)] bg-[var(--gold-muted)] border border-[var(--border-accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <span className={active ? "text-[var(--gold)]" : "text-[var(--text-muted)]"}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2">

          {/* Sign In — desktop, logged out only */}
          {!isAuthenticated && (
            <Link
              href="/auth/login"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                         bg-[var(--gold-muted)] border border-[var(--border-accent)]
                         text-[var(--gold-light)] hover:brightness-110 transition-all flex-shrink-0"
            >
              {NavIcons.SignIn}
              Sign In
            </Link>
          )}

          {/* Theme picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                         bg-[var(--bg-elevated)] border border-[var(--border)]
                         text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                         hover:border-[var(--border-accent)] transition-all"
            >
              <span className="text-[var(--text-secondary)]">
                {ThemeIcons[theme] ?? ThemeIcons.dark}
              </span>
              <span className="hidden sm:inline text-xs font-medium">
                {currentTheme?.label ?? "Theme"}
              </span>
              <span className={`transition-transform duration-200 ${themeOpen ? "rotate-180" : ""}`}>
                {NavIcons.Chevron}
              </span>
            </button>

            {/* Dropdown */}
            <div
              className={`absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden
                          bg-[var(--bg-surface)] border border-[var(--border)] shadow-card z-[999]
                          transition-all duration-200 origin-top-right
                          ${themeOpen
                            ? "opacity-100 scale-100 pointer-events-auto"
                            : "opacity-0 scale-95 pointer-events-none"}`}
            >
              {THEME_OPTIONS.map((opt) => {
                const selected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setTheme(opt.value as Theme); setThemeOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      selected
                        ? "bg-[var(--gold-muted)] text-[var(--gold-light)] font-semibold"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span className={selected ? "text-[var(--gold)]" : "text-[var(--text-muted)]"}>
                      {ThemeIcons[opt.value]}
                    </span>
                    <span>{opt.label}</span>
                    {selected && (
                      <span className="ml-auto text-[var(--gold)]">
                        {NavIcons.Check}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5
                       rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`block w-5 h-0.5 bg-[var(--gold-light)] rounded transition-all duration-300 ${
                  mobileOpen
                    ? i === 0 ? "rotate-45 translate-y-[7px]"
                    : i === 1 ? "opacity-0"
                    : "-rotate-45 -translate-y-[7px]"
                    : ""
                }`}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-[40rem]" : "max-h-0"
        } bg-[var(--bg-overlay)] backdrop-blur-xl border-b border-[var(--border)]`}
      >
        <div className="px-4 py-3 flex flex-col gap-1">

          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--gold-muted)] text-[var(--gold-light)] border border-[var(--border-accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className={active ? "text-[var(--gold)]" : "text-[var(--text-muted)]"}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}

          {/* Sign In — mobile, logged out only */}
          {!isAuthenticated && (
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mt-1
                         bg-[var(--gold-muted)] border border-[var(--border-accent)]
                         text-[var(--gold-light)] transition-all"
            >
              {NavIcons.SignIn}
              Sign In
            </Link>
          )}

          {/* Theme switcher */}
          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider px-4 mb-2">
              Theme
            </p>
            <div className="grid grid-cols-2 gap-2 px-1">
              {THEME_OPTIONS.map((opt) => {
                const selected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setTheme(opt.value as Theme); setMobileOpen(false); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      selected
                        ? "bg-[var(--gold-muted)] text-[var(--gold-light)] border border-[var(--border-accent)] font-semibold"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]"
                    }`}
                  >
                    <span className={selected ? "text-[var(--gold)]" : "text-[var(--text-muted)]"}>
                      {ThemeIcons[opt.value]}
                    </span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { THEME_OPTIONS } from "@/lib/api";
import type { Theme } from "@/types";

const NAV_LINKS = [
  { href: "/",               label: "Home",         icon: "⌂" },
  { href: "/prayer-times",   label: "Prayer Times", icon: "🕌" },
  { href: "/fasting",        label: "Fasting",      icon: "🌙" },
  { href: "/asma-ul-husna", label: "99 Names",     icon: "✨" },
  { href: "/hadith",         label: "Hadith",       icon: "📖" },
];

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [themeOpen, setThemeOpen]     = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg-overlay)] backdrop-blur-xl shadow-card border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-[4.5rem] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-full btn-gold flex items-center justify-center text-lg font-bold font-arabic">
            ن
          </div>
          <span className="font-display text-xl font-bold tracking-wide text-gold-gradient hidden sm:block">
            Noor
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-[var(--gold-light)] bg-[var(--gold-muted)] border border-[var(--border-accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Theme toggle button — opens panel below */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                         bg-[var(--bg-elevated)] border border-[var(--border)]
                         text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                         hover:border-[var(--border-accent)] transition-all"
            >
              <span>{THEME_OPTIONS.find((t) => t.value === theme)?.icon ?? "🌿"}</span>
              <span className="hidden sm:inline text-xs font-medium">
                {THEME_OPTIONS.find((t) => t.value === theme)?.label ?? "Theme"}
              </span>
              <svg className={`w-3 h-3 transition-transform ${themeOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10L6 8z" />
              </svg>
            </button>

            {/* Theme panel — rendered as a portal-like absolute block, NOT conditionally unmounted via state race */}
            <div
              className={`absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden
                          bg-[var(--bg-surface)] border border-[var(--border)] shadow-card z-[999]
                          transition-all duration-200 origin-top-right
                          ${themeOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
            >
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value as Theme);
                    setThemeOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    theme === opt.value
                      ? "bg-[var(--gold-muted)] text-[var(--gold-light)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.label}</span>
                  {theme === opt.value && <span className="ml-auto text-[var(--gold)]">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
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

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-96" : "max-h-0"
        } bg-[var(--bg-overlay)] backdrop-blur-xl border-b border-[var(--border)]`}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
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
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}

          {/* Theme switcher inside mobile menu — always visible, no dropdown needed */}
          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider px-4 mb-2">Theme</p>
            <div className="grid grid-cols-2 gap-2 px-1">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value as Theme);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    theme === opt.value
                      ? "bg-[var(--gold-muted)] text-[var(--gold-light)] border border-[var(--border-accent)] font-semibold"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
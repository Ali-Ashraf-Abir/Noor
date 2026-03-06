"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";


export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { clearError(); }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[var(--bg-base)] font-[var(--font-body)]">

      {/* ── Left decorative panel ── */}
      <div className="hidden md:flex relative flex-col items-center justify-center px-10 py-16 bg-[var(--bg-surface)] border-r border-[var(--border-strong)] overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,var(--gold-muted),transparent_70%)]" />

        {/* Islamic geometric pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[var(--pattern-opacity)]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='white' stroke-width='0.5' opacity='1'%3E%3Cpolygon points='60,8 72,22 88,22 98,35 98,52 110,60 98,68 98,85 88,98 72,98 60,112 48,98 32,98 22,85 22,68 10,60 22,52 22,35 32,22 48,22'/%3E%3Cpolygon points='60,24 70,34 82,34 90,44 90,56 100,60 90,64 90,76 82,86 70,86 60,96 50,86 38,86 30,76 30,64 20,60 30,56 30,44 38,34 50,34'/%3E%3Cpolygon points='60,40 72,52 60,64 48,52'/%3E%3Cline x1='60' y1='8' x2='60' y2='40'/%3E%3Cline x1='110' y1='60' x2='72' y2='52'/%3E%3Cline x1='60' y1='112' x2='60' y2='64'/%3E%3Cline x1='10' y1='60' x2='48' y2='52'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "120px 120px",
          }}
        />

        <div className="relative z-10 max-w-sm w-full text-center space-y-6 animate-[fadeDown_0.7s_ease_both]">
          {/* Basmala */}
          <p className="font-[var(--font-arabic)] text-2xl text-[var(--gold-light)] opacity-90 tracking-wide">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </p>

          {/* Brand */}
          <div className="space-y-1">
            <div className="text-4xl text-[var(--gold)]">☪</div>
            <h1 className="font-[var(--font-display)] text-5xl font-bold text-[var(--text-primary)] tracking-wide leading-none">
              NoorPath
            </h1>
            <p className="text-xs text-[var(--text-muted)] tracking-[0.2em] uppercase">
              Your Islamic Learning Journey
            </p>
          </div>

          {/* Ornament */}
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--gold)] text-base">✦</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Features */}
          <ul className="text-left space-y-1">
            {[
              ["🌙", "Daily Prayer Times"],
              ["📖", "Hadith Collections"],
              ["⭐", "Prophets & Seerah"],
              ["🏆", "XP & Level System"],
              ["🔥", "Daily Streaks"],
            ].map(([icon, label]) => (
              <li
                key={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] text-sm hover:bg-[var(--gold-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
              >
                <span className="w-6 text-center text-base">{icon}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex items-center justify-center px-6 py-12 md:px-14 bg-[var(--bg-base)]">
        <div className="w-full max-w-md animate-[fadeUp_0.65s_ease_both]">

          {/* Header */}
          <div className="mb-8">
            <p className="font-[var(--font-display)] text-xs tracking-[0.22em] uppercase text-[var(--gold)] mb-1.5">
              Welcome back
            </p>
            <h2 className="font-[var(--font-display)] text-5xl font-bold text-[var(--text-primary)] tracking-wide leading-none">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)] italic">
              Continue your path of knowledge
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm mb-6 animate-[shake_0.35s_ease]">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block font-[var(--font-display)] text-[0.7rem] tracking-[0.18em] uppercase text-[var(--text-muted)] font-semibold">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]/50 outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--gold-muted)] transition-all duration-200 font-[var(--font-body)]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-[var(--font-display)] text-[0.7rem] tracking-[0.18em] uppercase text-[var(--text-muted)] font-semibold">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[var(--text-muted)] italic hover:text-[var(--gold-light)] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-3 pr-11 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]/50 outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--gold-muted)] transition-all duration-200 font-[var(--font-body)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base opacity-50 hover:opacity-100 transition-opacity"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-3.5 rounded-xl font-[var(--font-display)] font-bold text-sm tracking-[0.12em] uppercase text-[var(--bg-base)] bg-gradient-to-br from-[var(--gold-dark)] via-[var(--gold-light)] to-[var(--gold-dark)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_var(--shadow-gold)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-[var(--bg-base)]/30 border-t-[var(--bg-base)] animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Switch */}
          <p className="text-center text-sm text-[var(--text-muted)]">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-[var(--gold-light)] italic hover:text-[var(--text-primary)] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
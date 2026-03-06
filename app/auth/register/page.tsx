"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";


function getPasswordStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Weak",   color: "#e05555" },
    { label: "Fair",   color: "#e09055" },
    { label: "Good",   color: "var(--gold)" },
    { label: "Strong", color: "var(--accent)" },
    { label: "Strong", color: "var(--accent)" },
  ];
  return { score: s, ...map[s] };
}

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setValidationError(null);
    clearError();
  };

  const strength = getPasswordStrength(form.password);
  const displayError = validationError || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setValidationError("Passwords do not match"); return; }
    if (form.password.length < 6) { setValidationError("Password must be at least 6 characters"); return; }
    await register(form.username, form.email, form.password);
  };

  const inputClass = "w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]/50 outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--gold-muted)] transition-all duration-200 font-[var(--font-body)]";

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[var(--bg-base)] font-[var(--font-body)]">

      {/* ── Left form panel ── */}
      <div className="flex items-center justify-center px-6 py-12 md:px-14 bg-[var(--bg-base)] border-r border-[var(--border-strong)]">
        <div className="w-full max-w-md animate-[fadeUp_0.65s_ease_both]">

          {/* Header */}
          <div className="mb-8">
            <p className="font-[var(--font-display)] text-[0.7rem] tracking-[0.22em] uppercase text-[var(--gold)] mb-1.5">
              Begin your journey
            </p>
            <h2 className="font-[var(--font-display)] text-5xl font-bold text-[var(--text-primary)] tracking-wide leading-none">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)] italic">
              Join thousands of seekers of knowledge
            </p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm mb-6 animate-[shake_0.35s_ease]">
              <span>⚠</span>
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block font-[var(--font-display)] text-[0.7rem] tracking-[0.18em] uppercase text-[var(--text-muted)] font-semibold">
                Username
              </label>
              <input
                type="text"
                placeholder="your_name"
                value={form.username}
                onChange={update("username")}
                required
                minLength={3}
                autoComplete="username"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block font-[var(--font-display)] text-[0.7rem] tracking-[0.18em] uppercase text-[var(--text-muted)] font-semibold">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block font-[var(--font-display)] text-[0.7rem] tracking-[0.18em] uppercase text-[var(--text-muted)] font-semibold">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update("password")}
                  required
                  autoComplete="new-password"
                  className={`${inputClass} pr-11`}
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

              {/* Strength meter */}
              {form.password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i < strength.score ? strength.color : "var(--bg-elevated)" }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[0.68rem] font-semibold uppercase tracking-wider"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block font-[var(--font-display)] text-[0.7rem] tracking-[0.18em] uppercase text-[var(--text-muted)] font-semibold">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirm}
                onChange={update("confirm")}
                required
                autoComplete="new-password"
                className={inputClass}
                style={{
                  borderColor: form.confirm && form.confirm !== form.password
                    ? "rgba(220,80,60,0.5)" : undefined
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1.5 py-3.5 rounded-xl font-[var(--font-display)] font-bold text-sm tracking-[0.12em] uppercase text-[var(--bg-base)] bg-gradient-to-br from-[var(--gold-dark)] via-[var(--gold-light)] to-[var(--gold-dark)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_var(--shadow-gold)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-[var(--bg-base)]/30 border-t-[var(--bg-base)] animate-spin" />
                  Creating account…
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <p className="text-center text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[var(--gold-light)] italic hover:text-[var(--text-primary)] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right decorative panel ── */}
      <div className="hidden md:flex relative flex-col items-center justify-center px-10 py-16 bg-[var(--bg-surface)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,var(--gold-muted),transparent_70%)]" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[var(--pattern-opacity)]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='white' stroke-width='0.5' opacity='1'%3E%3Cpolygon points='60,8 72,22 88,22 98,35 98,52 110,60 98,68 98,85 88,98 72,98 60,112 48,98 32,98 22,85 22,68 10,60 22,52 22,35 32,22 48,22'/%3E%3Cpolygon points='60,24 70,34 82,34 90,44 90,56 100,60 90,64 90,76 82,86 70,86 60,96 50,86 38,86 30,76 30,64 20,60 30,56 30,44 38,34 50,34'/%3E%3Cpolygon points='60,40 72,52 60,64 48,52'/%3E%3Cline x1='60' y1='8' x2='60' y2='40'/%3E%3Cline x1='110' y1='60' x2='72' y2='52'/%3E%3Cline x1='60' y1='112' x2='60' y2='64'/%3E%3Cline x1='10' y1='60' x2='48' y2='52'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "120px 120px",
          }}
        />

        <div className="relative z-10 max-w-sm w-full text-center space-y-6 animate-[fadeDown_0.7s_ease_both]">
          <div>
            <p className="font-[var(--font-arabic)] text-3xl text-[var(--gold-light)] opacity-90 mb-0.5">
              الْعِلْمُ نُورٌ
            </p>
            <p className="text-xs text-[var(--text-muted)] tracking-[0.2em] uppercase">
              Knowledge is Light
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--gold)] text-base">✦</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {[
              { step: "01", title: "Create your account", desc: "Set up your profile in seconds" },
              { step: "02", title: "Choose your path", desc: "Seerah, Hadith, Islamic facts & more" },
              { step: "03", title: "Earn & grow", desc: "Gain XP, level up, maintain streaks" },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-strong)] hover:border-[var(--border-accent)] hover:bg-[var(--card-bg-hover)] transition-all duration-200"
              >
                <span className="font-[var(--font-mono)] text-[0.68rem] font-bold text-[var(--gold)] bg-[var(--gold-muted)] border border-[var(--border-accent)] rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* XP badge */}
          <div className="flex items-center gap-3 bg-[var(--gold-muted)] border border-[var(--border-accent)] rounded-xl p-4 text-left">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-sm font-semibold text-[var(--gold-light)]">Start at Level 1</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Earn XP with every lesson completed</p>
            </div>
          </div>
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
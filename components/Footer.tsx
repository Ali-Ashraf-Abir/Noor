import Link from "next/link";

const LINKS = [
  { href: "/prayer-times",   label: "Prayer Times" },
  { href: "/fasting",        label: "Fasting Schedule" },
  { href: "/names-of-allah", label: "99 Names of Allah" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] card-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full btn-gold flex items-center justify-center text-sm font-bold font-arabic">
                ن
              </div>
              <span className="font-display text-lg font-bold text-gold-gradient">Noor</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              Your Islamic companion for prayer times, fasting schedules, and spiritual knowledge.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[var(--gold)] text-xs font-semibold uppercase tracking-widest mb-4">
              Features
            </h4>
            <ul className="space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--gold-light)] text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Arabic verse */}
          <div className="sm:text-right">
            <p className="font-arabic text-2xl text-[var(--gold)]/70 mb-2 leading-loose">
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              In the name of Allah,<br />the Most Gracious, the Most Merciful
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[var(--text-muted)] text-xs">
            © {new Date().getFullYear()} Noor · Prayer data via{" "}
            <a
              href="https://islamicapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--gold-light)] transition-colors"
            >
              IslamicAPI
            </a>
          </p>
          <p className="text-[var(--text-muted)] text-xs">
            May Allah accept our prayers 🤲
          </p>
        </div>
      </div>
    </footer>
  );
}
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pattern-bg relative">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
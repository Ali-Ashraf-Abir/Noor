"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace("/auth/login"); return; }
    if (adminOnly && !user?.isAdmin) router.replace("/profile");
  }, [isAuthenticated, isLoading, user, adminOnly, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--gold-muted)] border-t-[var(--gold)] animate-spin" />
          <span className="text-sm text-[var(--text-muted)] tracking-widest uppercase font-[var(--font-display)]">
            Loading…
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (adminOnly && !user?.isAdmin) return null;

  return <>{children}</>;
}
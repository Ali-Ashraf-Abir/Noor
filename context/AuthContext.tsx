"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  const logout = useCallback(() => {
    Cookies.remove("token");
    setUser(null);
    setToken(null);
    router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    const savedToken = Cookies.get("token");
    if (!savedToken) { setIsLoading(false); return; }
    setToken(savedToken);
    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => { Cookies.remove("token"); setToken(null); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true); setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token: t, user: u } = res.data;
      Cookies.set("token", t, { expires: 30, sameSite: "lax" });
      setToken(t); setUser(u);
      router.push(u.isAdmin ? "/admin/categories" : "/profile");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setIsLoading(false); }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true); setError(null);
    try {
      const res = await api.post("/auth/register", { username, email, password });
      const { token: t, user: u } = res.data;
      Cookies.set("token", t, { expires: 30, sameSite: "lax" });
      setToken(t); setUser(u);
      router.push("/profile");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setIsLoading(false); }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, register, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
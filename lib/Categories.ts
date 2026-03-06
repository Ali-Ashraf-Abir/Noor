// Shared category fetching + display meta fallback
// All pages import from here — never hardcode categories again

import api from "@/lib/api";

export interface ApiCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

// Display meta fallback for icon/color if not set in DB
const FALLBACK_META: Record<string, { icon: string; color: string }> = {
  seerah:        { icon: "🌙", color: "#c8a84b" },
  prophets:      { icon: "⭐", color: "#7eb8e0" },
  sahabah:       { icon: "🛡️", color: "#b07fd4" },
  history:       { icon: "📜", color: "#e07b54" },
  islamic_facts: { icon: "💎", color: "#e0a030" },
  hadith:        { icon: "📖", color: "#4db8a8" },
};

const DEFAULT = { icon: "📚", color: "#c8a84b" };

export function getCategoryMeta(cat: ApiCategory) {
  const fallback = FALLBACK_META[cat.slug] ?? DEFAULT;
  return {
    label: cat.name,
    icon:  cat.icon  || fallback.icon,
    color: cat.color || fallback.color,
  };
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await api.get("/categories");
  return (res.data.categories ?? []) as ApiCategory[];
}
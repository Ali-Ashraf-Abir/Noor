"use client";
import { useTheme } from "@/context/ThemeContext";
import { THEME_OPTIONS } from "@/lib/api";
import type { Theme } from "@/types";

export default function ThemeTest() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999, background: "#000", padding: 16, borderRadius: 12, border: "2px solid yellow" }}>
      <p style={{ color: "yellow", marginBottom: 8, fontSize: 12 }}>Current theme: <strong>{theme}</strong></p>
      <p style={{ color: "yellow", marginBottom: 8, fontSize: 12 }}>data-theme on html: <strong id="dt"></strong></p>
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          style={{
            display: "block",
            width: "100%",
            marginBottom: 4,
            padding: "6px 12px",
            background: theme === opt.value ? "gold" : "#333",
            color: theme === opt.value ? "#000" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
          onClick={() => {
            console.log("Clicking theme:", opt.value);
            setTheme(opt.value as Theme);
            // manually show data-theme value
            const el = document.getElementById("dt");
            if (el) el.textContent = document.documentElement.getAttribute("data-theme") ?? "none";
          }}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
}
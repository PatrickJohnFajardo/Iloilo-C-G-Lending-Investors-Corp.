"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "2.25rem",
        height: "2.25rem",
        borderRadius: "50%",
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s",
        color: "var(--text-muted)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--accent-primary)";
        el.style.color = "var(--accent-primary)";
        el.style.transform = "scale(1.05)";
        el.style.boxShadow = "0 0 12px rgba(212, 175, 55, 0.2)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--border-color)";
        el.style.color = "var(--text-muted)";
        el.style.transform = "scale(1)";
        el.style.boxShadow = "none";
      }}
    >
      <span
        style={{
          position: "absolute",
          transition: "opacity 0.3s, transform 0.3s",
          opacity: theme === "dark" ? 1 : 0,
          transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.6)",
        }}
      >
        <Moon size={15} />
      </span>
      <span
        style={{
          position: "absolute",
          transition: "opacity 0.3s, transform 0.3s",
          opacity: theme === "light" ? 1 : 0,
          transform: theme === "light" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.6)",
        }}
      >
        <Sun size={15} />
      </span>
    </button>
  );
}

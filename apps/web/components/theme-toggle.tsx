"use client";

import { useEffect, useState } from "react";

// The labeled, persisted theme control (REFERENCE-DESIGN §3): pl.theme.v1 wins over the
// system preference forever after; the pre-paint script in the root layout reads the
// same key, so first paint and this control can never disagree.
const THEME_KEY = "pl.theme.v1";

export function ThemeToggle() {
  // Render a stable placeholder until mounted: the server cannot know the resolved
  // theme, and guessing would flash the wrong label.
  const [theme, setTheme] = useState<"light" | "dark" | undefined>(undefined);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private-mode storage failure only costs persistence, never the switch itself.
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-8 items-center gap-1.5 border border-rule px-2.5 font-data text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
    >
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
        {theme === "dark" ? (
          <circle cx="6" cy="6" r="3.5" fill="none" stroke="currentColor" />
        ) : (
          <path d="M9.5 7.2A4 4 0 1 1 4.8 2.5a3.2 3.2 0 1 0 4.7 4.7z" fill="currentColor" />
        )}
      </svg>
      {theme === undefined ? "theme" : theme}
    </button>
  );
}

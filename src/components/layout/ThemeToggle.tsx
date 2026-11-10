"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { globalUI } from "@/i18n/global-ui";
import type { Locale } from "@/i18n/locales";
import { applyTheme, getServerTheme, getTheme, restoreTheme, subscribeTheme, themeStorageKey } from "@/lib/theme";

export function ThemeToggle({ locale }: { locale: Locale }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  // Also restores React's development Strict Mode document remount before paint.
  useLayoutEffect(restoreTheme, [locale]);
  const label = theme === "dark" ? globalUI[locale].switchToLight : globalUI[locale].switchToDark;
  return <button type="button" className="theme-toggle" aria-label={label} title={label} aria-pressed={theme === "light"}
    onClick={() => {
      const next = getTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem(themeStorageKey, next); } catch { /* Apply for this document even without persistence. */ }
      applyTheme(next);
    }}>
    <svg className="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false"><path d="M20.5 14A8.7 8.7 0 0 1 10 3.5 8.7 8.7 0 1 0 20.5 14Z" /></svg>
    <svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
  </button>;
}

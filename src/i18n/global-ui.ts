import type { Locale } from "./locales";
import { canonicalPublicPath, isPublishedDedicatedPath, type SiteNavigationId } from "@/data/page-publication";
import { isPublishedCase } from "@/data/project-publication";
import { isPublishedLog } from "@/data/security-log-publication";
// Generated from publishedWriteups() at build time. Never bundle review metadata.
import writeupPublicRoutes from "@/data/writeup-public-routes.json";
import { homeChapters, homeLabels } from "@/data/home";

export const sectionIds = homeChapters;
export type SectionId = (typeof sectionIds)[number];

export const globalUI = {
  en: {
    menu: "Menu", close: "Close", navigation: "Primary navigation", language: "Language",
    sectionLabels: homeLabels.en.chapters,
    navigationLabels: { home: "Home", projects: "Projects", writeups: "Writeups", about: "About", terminal: "Terminal", contact: "Contact" },
    translationUnavailable: "Translation not yet published",
    online: "SYSTEM ONLINE", compactOnline: "ONLINE", location: "VIETNAM / UTC+7", system: "SYSTEM",
    initializing: "INITIALIZING CARWYN.SEC", ready: "INTERFACE READY", home: "carwyn.sec — Home",
  },
  vi: {
    menu: "Menu", close: "Đóng", navigation: "Điều hướng chính", language: "Ngôn ngữ",
    sectionLabels: homeLabels.vi.chapters,
    navigationLabels: { home: "Home", projects: "Projects", writeups: "Writeups", about: "About", terminal: "Terminal", contact: "Contact" },
    translationUnavailable: "Bản dịch chưa được công bố",
    online: "HỆ THỐNG TRỰC TUYẾN", compactOnline: "TRỰC TUYẾN", location: "VIỆT NAM / UTC+7", system: "HỆ THỐNG",
    initializing: "KHỞI TẠO CARWYN.SEC", ready: "GIAO DIỆN SẴN SÀNG", home: "carwyn.sec — Trang chủ",
  },
} satisfies Record<Locale, { menu: string; close: string; navigation: string; language: string; sectionLabels: readonly string[]; navigationLabels: Record<SiteNavigationId, string>; translationUnavailable: string; online: string; compactOnline: string; location: string; system: string; initializing: string; ready: string; home: string }>;

export const publicPath = canonicalPublicPath;

// Explicit publication registry. Future content adds reviewed equivalents here.
// Unknown equivalents remain unavailable rather than silently falling back.
export function localizedPath(path: string, locale: Locale): string | undefined {
  const canonical = publicPath(path);
  const logRoute = canonical === "/log" || (canonical.startsWith("/log/") && isPublishedLog(canonical.slice("/log/".length), locale));
  const dedicatedRoute = isPublishedDedicatedPath(canonical, locale);
  const writeupRoute = canonical.startsWith("/writeups/") && (writeupPublicRoutes as readonly string[]).includes(canonical.slice("/writeups/".length));
  if (canonical !== "/" && canonical !== "/dev/design-system" && !dedicatedRoute && !logRoute && !writeupRoute && !(canonical.startsWith("/operations/") && isPublishedCase(canonical.slice("/operations/".length), locale))) return undefined;
  return locale === "en" ? canonical : `/vi${canonical === "/" ? "" : canonical}`;
}

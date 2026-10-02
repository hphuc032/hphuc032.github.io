import type { Locale } from "./locales";
import { isPublishedDedicatedPath } from "@/data/page-publication";
import { isPublishedCase } from "@/data/project-publication";
import { isPublishedLog } from "@/data/security-log-publication";

export const sectionIds = ["identity", "expertise", "operations", "experience", "achievements", "log", "contact"] as const;
export type SectionId = (typeof sectionIds)[number];

export const globalUI = {
  en: {
    menu: "Index", close: "Close", navigation: "Site navigation", language: "Language",
    labels: ["Identity", "Expertise", "Operations", "Experience", "Achievements", "Log", "Contact"],
    unavailable: "This section is not published yet.", translationUnavailable: "Translation not yet published",
    online: "SYSTEM ONLINE", compactOnline: "ONLINE", location: "VIETNAM / UTC+7", system: "SYSTEM",
    initializing: "INITIALIZING CARWYN.SEC", ready: "INTERFACE READY", home: "carwyn.sec — Home",
  },
  vi: {
    menu: "Mục lục", close: "Đóng", navigation: "Điều hướng trang", language: "Ngôn ngữ",
    labels: ["Giới thiệu", "Chuyên môn", "Dự án", "Kinh nghiệm", "Thành tựu", "Security Log", "Liên hệ"],
    unavailable: "Mục này chưa được công bố.", translationUnavailable: "Bản dịch chưa được công bố",
    online: "HỆ THỐNG TRỰC TUYẾN", compactOnline: "TRỰC TUYẾN", location: "VIỆT NAM / UTC+7", system: "HỆ THỐNG",
    initializing: "KHỞI TẠO CARWYN.SEC", ready: "GIAO DIỆN SẴN SÀNG", home: "carwyn.sec — Trang chủ",
  },
} satisfies Record<Locale, { menu: string; close: string; navigation: string; language: string; labels: readonly string[]; unavailable: string; translationUnavailable: string; online: string; compactOnline: string; location: string; system: string; initializing: string; ready: string; home: string }>;

export function publicPath(path: string) {
  const unprefixed = path.replace(/^\/(en|vi)(?=\/|$)/, "") || "/";
  return unprefixed === "/" ? unprefixed : unprefixed.replace(/\/+$/, "");
}

// Explicit publication registry. Future content adds reviewed equivalents here.
// Unknown equivalents remain unavailable rather than silently falling back.
export function localizedPath(path: string, locale: Locale): string | undefined {
  const canonical = publicPath(path);
  const logRoute = canonical === "/log" || (canonical.startsWith("/log/") && isPublishedLog(canonical.slice("/log/".length), locale));
  const dedicatedRoute = isPublishedDedicatedPath(canonical, locale);
  if (canonical !== "/" && canonical !== "/dev/design-system" && !dedicatedRoute && !logRoute && !(canonical.startsWith("/operations/") && isPublishedCase(canonical.slice("/operations/".length), locale))) return undefined;
  return locale === "en" ? canonical : `/vi${canonical === "/" ? "" : canonical}`;
}

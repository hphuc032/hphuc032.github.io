import type { Locale } from "@/i18n/locales";

export const dedicatedPagePublication = [
  { id: "projects", segment: "projects", locales: ["en", "vi"] },
  { id: "writeups", segment: "writeups", locales: ["en", "vi"] },
  { id: "about", segment: "about", locales: ["en", "vi"] },
  { id: "terminal", segment: "terminal", locales: ["en", "vi"] },
  { id: "contact", segment: "contact", locales: ["en", "vi"] },
] as const satisfies readonly {
  id: string;
  segment: string;
  locales: readonly Locale[];
}[];

export type DedicatedPageId = (typeof dedicatedPagePublication)[number]["id"];
export type SiteNavigationId = "home" | DedicatedPageId;

export const siteNavigationIds: readonly SiteNavigationId[] = [
  "home",
  ...dedicatedPagePublication.map(record => record.id),
];

export type PageIdentity =
  | "home"
  | DedicatedPageId
  | "operation"
  | "security-log"
  | "security-log-entry";

export function dedicatedPagePath(id: DedicatedPageId, locale: Locale) {
  const page = dedicatedPagePublication.find(record => record.id === id);
  if (!page || !(page.locales as readonly Locale[]).includes(locale)) return undefined;
  return `${locale === "vi" ? "/vi" : ""}/${page.segment}`;
}

export function canonicalPublicPath(path: string) {
  const unprefixed = path.replace(/^\/(en|vi)(?=\/|$)/, "") || "/";
  return unprefixed === "/" ? unprefixed : unprefixed.replace(/\/+$/, "");
}

export function siteNavigationPath(id: SiteNavigationId, locale: Locale) {
  if (id === "home") return locale === "vi" ? "/vi" : "/";
  const path = dedicatedPagePath(id, locale);
  if (!path) throw new Error(`Navigation route ${id} is not published for ${locale}.`);
  return path;
}

export function activeNavigationItem(path: string): SiteNavigationId | undefined {
  const canonical = canonicalPublicPath(path);
  if (canonical === "/") return "home";
  if (canonical === "/projects" || canonical.startsWith("/operations/")) return "projects";
  if (canonical === "/writeups" || canonical === "/log" || canonical.startsWith("/log/")) return "writeups";
  return dedicatedPagePublication.find(record => canonical === `/${record.segment}`)?.id;
}

export function isPublishedDedicatedPath(path: string, locale: Locale) {
  const segment = path.replace(/^\/+|\/+$/g, "");
  return dedicatedPagePublication.some(record =>
    record.segment === segment && (record.locales as readonly Locale[]).includes(locale),
  );
}


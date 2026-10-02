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

export function isPublishedDedicatedPath(path: string, locale: Locale) {
  const segment = path.replace(/^\/+|\/+$/g, "");
  return dedicatedPagePublication.some(record =>
    record.segment === segment && (record.locales as readonly Locale[]).includes(locale),
  );
}


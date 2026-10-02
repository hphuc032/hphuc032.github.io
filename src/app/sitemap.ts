import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
import { dedicatedPagePath, dedicatedPagePublication } from "@/data/page-publication";
import { publishedCase, projects } from "@/data/projects";
import { casePath } from "@/data/project-publication";
import { logArticlePath, logIndexPath, securityLogPublication } from "@/data/security-log-publication";
import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-metadata";
import { writeupSitemapPaths } from "@/lib/writeups/publication";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return [];
  const localizedEntry = (paths: Record<(typeof locales)[number], string>, locale: (typeof locales)[number]) => ({
    url: absoluteSiteUrl(paths[locale], siteUrl)!,
    alternates: { languages: Object.fromEntries(locales.map(language => [language, absoluteSiteUrl(paths[language], siteUrl)!])) },
  });
  const homePaths = { en: "/", vi: "/vi" };
  const homeRoutes = locales.map(locale => localizedEntry(homePaths, locale));
  const dedicatedRoutes = dedicatedPagePublication.flatMap(page => {
    const paths = {
      en: dedicatedPagePath(page.id, "en")!,
      vi: dedicatedPagePath(page.id, "vi")!,
    };
    return locales.filter(locale => (page.locales as readonly string[]).includes(locale)).map(locale => localizedEntry(paths, locale));
  });
  const projectRoutes = projects.flatMap(project => {
    const paths = { en: casePath(project.slug, "en"), vi: casePath(project.slug, "vi") };
    return locales.filter(locale => publishedCase(project.slug, locale)).map(locale => localizedEntry(paths, locale));
  });
  const logIndexPaths = { en: logIndexPath("en"), vi: logIndexPath("vi") };
  const logRoutes = [
    ...locales.map(locale => localizedEntry(logIndexPaths, locale)),
    ...securityLogPublication.flatMap(entry => {
      const paths = { en: logArticlePath(entry.slug, "en"), vi: logArticlePath(entry.slug, "vi") };
      return locales.filter(locale => (entry.locales as readonly string[]).includes(locale)).map(locale => localizedEntry(paths, locale));
    }),
  ];
  const writeupRoutes = writeupSitemapPaths().flatMap(paths => locales.map(locale => localizedEntry(paths, locale)));
  return [...homeRoutes, ...dedicatedRoutes, ...projectRoutes, ...logRoutes, ...writeupRoutes];
}

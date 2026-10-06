import "server-only";
import { notFound } from "next/navigation";
import { WriteupArticle } from "@/components/writeups/WriteupArticle";
import { loadPublishedWriteup } from "@/lib/writeups/load-writeup";
import { publishedWriteupSummaries, writeupArticlePath } from "@/lib/writeups/publication";
import { localizedMetadata } from "@/lib/site-metadata";
import type { Locale } from "@/i18n/locales";
export { writeupStaticParams } from "@/lib/writeups/publication";

export async function writeupMetadata(locale: Locale, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const entry = publishedWriteupSummaries().find(item => item.slug === slug);
  if (!entry) notFound();
  return localizedMetadata({
    locale, title: `${entry.title} — carwyn.sec`, type: "article",
    description: locale === "vi" ? `Bài giải CTF: ${entry.title}.` : `CTF writeup: ${entry.title}.`,
    paths: { en: writeupArticlePath(slug, "en"), vi: writeupArticlePath(slug, "vi") },
  });
}
export async function WriteupRoute({ locale, params }: { locale: Locale; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WriteupArticle locale={locale} article={await loadPublishedWriteup(slug)} />;
}

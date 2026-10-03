import { TextLink } from "@/components/ui/TextLink";
import { formatLogDate, type getSecurityLogArticle } from "@/data/security-log";
import { logIndexPath } from "@/data/security-log-publication";
import type { Locale } from "@/i18n/locales";
import { profile } from "@/data/profile";

type ArticleRecord = NonNullable<ReturnType<typeof getSecurityLogArticle>>;

export function SecurityLogArticle({ article, locale }: { article: ArticleRecord; locale: Locale }) {
  const vi = locale === "vi";
  const { entry, Content, readingMinutes } = article;
  const content = entry.content[locale]!.value;
  const category = entry.category[locale]!.value;
  const published = entry.publishedAt!;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    author: { "@type": "Person", name: profile.name },
    datePublished: published.value,
    inLanguage: locale,
  };
  // Keep trusted catalog text from ever terminating the JSON-LD script element.
  const structuredDataJson = JSON.stringify(structuredData).replaceAll("<", "\\u003c");
  return <main id="main-content" tabIndex={-1} className="log-article">
    <article className="log-article-inner" aria-labelledby="log-title">
      <TextLink href={logIndexPath(locale)} variant="navigation" prefetch={false}>{vi ? "← Security Log" : "← Security Log"}</TextLink>
      <header className="log-article-opening">
        <p className="log-article-eyebrow">LOG_{entry.logNumber}<span>/</span>{category}</p>
        <h1 id="log-title">{content.title}</h1>
        <p className="log-article-excerpt">{content.excerpt}</p>
        <dl className="log-article-meta">
          <div><dt>{vi ? "Xuất bản" : "Published"}</dt><dd><time dateTime={published.value}>{formatLogDate(published.value, locale)}</time></dd></div>
          <div><dt>{vi ? "Thời gian đọc" : "Reading time"}</dt><dd>{readingMinutes} {vi ? "phút" : readingMinutes === 1 ? "minute" : "minutes"}</dd></div>
          <div><dt>{vi ? "Loại" : "Type"}</dt><dd>{vi ? "Ghi chép kỹ thuật" : "Field note"}</dd></div>
        </dl>
      </header>
      <div className="log-prose" lang={locale}><Content /></div>
      <footer className="log-article-footer"><TextLink href={logIndexPath(locale)} variant="editorial" prefetch={false}>{vi ? "← QUAY LẠI SECURITY LOG" : "← BACK TO SECURITY LOG"}</TextLink></footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson }} />
    </article>
  </main>;
}

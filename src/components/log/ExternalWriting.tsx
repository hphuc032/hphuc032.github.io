import { TextLink } from "@/components/ui/TextLink";
import { publishedExternalArticles } from "@/data/external-writing";
import type { Locale } from "@/i18n/locales";
import "@/styles/external-writing.css";

const copy = {
  en: { english: "English article", vietnamese: "Vietnamese article", read: "READ ON" },
  vi: { english: "Bài viết tiếng Anh", vietnamese: "Bài viết tiếng Việt", read: "ĐỌC TRÊN" },
} as const;

export function ExternalWriting({ locale }: { locale: Locale }) {
  const content = copy[locale];
  return <div className="external-writing">
    {publishedExternalArticles().map(article => <article className="external-writing-record" key={article.id}>
      <p className="external-writing-label">{article.platform} / {article.language === "en" ? content.english : content.vietnamese}</p>
      <h3 lang={article.language}><a href={article.url} data-cursor="open">{article.title}</a></h3>
      <TextLink href={article.url} variant="editorial" arrow="external" data-cursor="open">
        {content.read} {article.platform.toUpperCase()}<span className="sr-only">: <span lang={article.language}>{article.title}</span></span>
      </TextLink>
    </article>)}
  </div>;
}

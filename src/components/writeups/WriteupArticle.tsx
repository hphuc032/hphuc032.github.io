import { EndSystem } from "@/components/home/EndSystem";
import { TextLink } from "@/components/ui/TextLink";
import { SafeMarkdown } from "@/components/writeups/SafeMarkdown";
import { logIndexPath } from "@/data/security-log-publication";
import type { Locale } from "@/i18n/locales";
import type { loadPublishedWriteup } from "@/lib/writeups/load-writeup";
import { renderArticleContent } from "@/lib/writeups/render-markdown";
import "@/styles/writeups.css";

export function WriteupArticle({ locale, article }: { locale: Locale; article: Awaited<ReturnType<typeof loadPublishedWriteup>> }) {
  const entry = article.publication;
  return <>
    {renderArticleContent({ publication: entry,
      body: <SafeMarkdown markdown={article.markdown} policy={article.policy} />,
      backLink: <TextLink href={locale === "vi" ? "/vi/writeups" : "/writeups"} prefetch={false}>{locale === "vi" ? "← VỀ WRITEUPS" : "← BACK TO WRITEUPS"}</TextLink>,
      footer: <>
          <TextLink href={locale === "vi" ? "/vi/writeups" : "/writeups"} arrow="right" prefetch={false}>{locale === "vi" ? "VỀ WRITEUPS" : "BACK TO WRITEUPS"}</TextLink>
          <TextLink href={logIndexPath(locale)} arrow="right" prefetch={false}>SECURITY LOG</TextLink>
        </>,
    })}
    <EndSystem locale={locale} topId="main-content" />
  </>;
}

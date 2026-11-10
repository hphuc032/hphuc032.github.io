/* eslint-disable @next/next/no-head-element -- App Router document owner: the documented parser-blocking theme bootstrap must run in head before paint. */
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import { getDictionary } from "@/i18n/dictionaries";
import { editorialFont, technicalFont } from "@/styles/fonts";
import { SkipLink } from "@/components/layout/SkipLink";
import { PageShell } from "@/components/layout/PageShell";
import { themeBootstrap } from "@/lib/theme";

export function LocaleDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dictionary = getDictionary(locale);

  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning className={`dark ${editorialFont.variable} ${technicalFont.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>
        <SkipLink>{dictionary.skipToContent}</SkipLink>
        <PageShell locale={locale}>{children}</PageShell>
      </body>
    </html>
  );
}

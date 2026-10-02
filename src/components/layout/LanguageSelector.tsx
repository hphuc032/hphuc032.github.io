"use client";

import { usePathname, useRouter } from "next/navigation";
import { globalUI, localizedPath, sectionIds } from "@/i18n/global-ui";
import type { Locale } from "@/i18n/locales";
import { isStaticExport, publicRoutePath } from "@/lib/deployment-path";
import { DeploymentLink } from "@/components/ui/DeploymentLink";

export function LanguageSelector({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const copy = globalUI[locale];
  return <nav className="language-selector" aria-label={copy.language}>
    {(["en", "vi"] as const).map((language) => {
      const href = localizedPath(pathname, language);
      if (!href) return <span key={language} aria-disabled="true" title={copy.translationUnavailable}>{language.toUpperCase()}</span>;
      return <DeploymentLink key={language} href={href} hrefLang={language} lang={language} prefetch={false}
        aria-label={language === "en" ? "English" : "Tiếng Việt"}
        aria-current={language === locale ? "page" : undefined}
        onClick={(event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          if (language === locale) return;
          let id = "";
          try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { /* Ignore malformed hashes. */ }
          const hash = id && (sectionIds.some((section) => section === id) || document.getElementById(id)) ? window.location.hash : "";
          onNavigate?.();
          if (isStaticExport) {
            window.location.assign(publicRoutePath(href) + window.location.search + hash);
            return;
          }
          router.push(href + window.location.search + hash, { scroll: false });
        }}>{language.toUpperCase()}</DeploymentLink>;
    })}
  </nav>;
}

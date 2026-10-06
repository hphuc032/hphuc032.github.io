import type { ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import { GlobalInterface } from "./GlobalInterface";
import { Initialization } from "./Initialization";
import { ContextCursor } from "./ContextCursor";
import { GlobalAtmosphere } from "@/components/atmosphere/GlobalAtmosphere";
import { PageMotion } from "@/components/motion/PageMotion";
import { ChapterMotion } from "@/components/home/ChapterMotion";
import { PointerAtmosphere } from "@/components/home/PointerAtmosphere";

/** Server boundary: pages own their semantic main; the shell owns persistent chrome. */
export function PageShell({ locale, children, footer }: { locale: Locale; children: ReactNode; footer?: ReactNode }) {
  return <>
    <GlobalInterface locale={locale} />
    <div className="page-content">{children}</div>
    <GlobalAtmosphere />
    <PageMotion />
    <ChapterMotion locale={locale} />
    <PointerAtmosphere locale={locale} />
    {footer && <footer className="footer-slot">{footer}</footer>}
    <Initialization locale={locale} />
    <ContextCursor />
  </>;
}

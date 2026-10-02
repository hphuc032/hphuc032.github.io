import type { Locale } from "@/i18n/locales";
import { Hero } from "@/components/home/Hero";
import { HomeTeasers } from "@/components/home/HomeTeasers";
import { HomeHashCompatibility } from "@/components/home/HomeHashCompatibility";
import { EndSystem } from "@/components/home/EndSystem";
import { ChapterMotion } from "@/components/home/ChapterMotion";
import { PointerAtmosphere } from "@/components/home/PointerAtmosphere";

export function PortfolioPage({ locale }: { locale: Locale }) {
  return <>
    <main id="main-content" tabIndex={-1}>
      <Hero locale={locale} />
      <HomeTeasers locale={locale} />
    </main>
    <EndSystem locale={locale} number="06" />
    <HomeHashCompatibility locale={locale} />
    <ChapterMotion locale={locale} />
    <PointerAtmosphere locale={locale} />
  </>;
}

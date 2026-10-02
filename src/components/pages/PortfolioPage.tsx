import type { Locale } from "@/i18n/locales";
import { Hero } from "@/components/home/Hero";
import { HomeTeasers } from "@/components/home/HomeTeasers";
import { HomeHashCompatibility } from "@/components/home/HomeHashCompatibility";
import { EndSystem } from "@/components/home/EndSystem";

export function PortfolioPage({ locale }: { locale: Locale }) {
  return <>
    <main id="main-content" tabIndex={-1}>
      <Hero locale={locale} />
      <HomeTeasers locale={locale} />
    </main>
    <EndSystem locale={locale} number="06" />
    <HomeHashCompatibility locale={locale} />
  </>;
}

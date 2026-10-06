import type { Locale } from "@/i18n/locales";
export function HeroScrollCue({ locale }: { locale: Locale }) {
  return <a className="hero-scroll" href="#about" aria-label={locale === "en" ? "Scroll to About" : "Cuộn đến phần giới thiệu"}>
    {locale === "en" ? "SCROLL" : "CUỘN"}<span aria-hidden="true">↓</span>
  </a>;
}

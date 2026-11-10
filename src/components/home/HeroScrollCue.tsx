import type { Locale } from "@/i18n/locales";
export function HeroScrollCue({ locale }: { locale: Locale }) {
  return <a className="hero-scroll" href="#about" aria-label={locale === "en" ? "Scroll to About" : "Cuộn đến phần giới thiệu"}>
    <span>{locale === "en" ? "SCROLL DOWN" : "CUỘN XUỐNG"}</span><span className="hero-scroll-arrows" aria-hidden="true">↓ ↓</span>
  </a>;
}

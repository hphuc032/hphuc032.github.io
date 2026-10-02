import { SectionLabel } from "@/components/ui/SectionLabel";
import { StaticNetwork } from "@/components/webgl/StaticNetwork";
import { NetworkSphere } from "@/components/webgl/NetworkSphere";
import type { Locale } from "@/i18n/locales";
import { HeroScrollCue } from "./HeroScrollCue";
import { LiquidLight } from "@/components/motion/LiquidLight";
import { profile } from "@/data/profile";

export function Hero({ locale }: { locale: Locale }) {
  return <section id="hero" className="hero" aria-labelledby="hero-title" data-liquid="1">
    <LiquidLight />
    <div className="hero-topline" data-hero-detail>
      <SectionLabel number="01">HERO</SectionLabel>
      <span className="hero-signature" lang="en">{profile.name}</span>
    </div>
    <div className="hero-composition">
    <h1 id="hero-title" className="hero-heading" lang="en" aria-label="UNDERSTAND SYSTEMS. DEFEND THEM.">
      <span className="hero-statement hero-understand" aria-hidden="true"><span className="hero-line"><span data-hero-line>UNDERSTAND</span></span><span className="hero-line"><span data-hero-line>SYSTEMS.</span></span></span>
      <span className="hero-statement hero-defend" aria-hidden="true"><span className="hero-line"><span data-hero-line>DEFEND</span></span><span className="hero-line"><span data-hero-line>THEM.</span></span></span>
    </h1>
    <NetworkSphere locale={locale}><StaticNetwork /></NetworkSphere>
    </div>
    <div className="hero-bottomline" data-hero-detail>
      <p className="hero-field">{locale === "en" ? "INFORMATION SECURITY" : "AN TOÀN THÔNG TIN"}<span>2026</span></p>
      <HeroScrollCue locale={locale} />
    </div>
  </section>;
}

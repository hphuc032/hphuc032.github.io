import { Achievements } from "@/components/home/Achievements";
import { Experience } from "@/components/home/Experience";
import { Expertise } from "@/components/home/Expertise";
import { Identity } from "@/components/home/Identity";
import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import { TextLink } from "@/components/ui/TextLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { publicCv } from "@/data/contact";
import type { Locale } from "@/i18n/locales";
import "@/styles/about.css";

const copy = {
  en: {
    eyebrow: "PROFILE / ABOUT",
    title: "About",
    description: "Security practice, software testing, and the person behind carwyn.sec.",
    cvTitle: "The profile, on paper.",
    cvDescription: "Nguyen Hoang Phuc / Curriculum vitae / PDF",
    cvAction: "VIEW CV",
    newTab: "opens in a new tab",
  },
  vi: {
    eyebrow: "HỒ SƠ / GIỚI THIỆU",
    title: "Giới thiệu",
    description: "Thực hành bảo mật, kiểm thử phần mềm và con người phía sau carwyn.sec.",
    cvTitle: "Hồ sơ, trên trang giấy.",
    cvDescription: "Nguyen Hoang Phuc / Hồ sơ nghề nghiệp / PDF",
    cvAction: "XEM CV",
    newTab: "mở trong thẻ mới",
  },
} as const;

export function AboutPage({ locale }: { locale: Locale }) {
  const content = copy[locale];
  return <DedicatedPageFrame locale={locale} page="about" eyebrow={content.eyebrow} title={content.title} description={content.description}>
    <Identity locale={locale} />
    <Expertise locale={locale} />
    <Experience locale={locale} />
    <Achievements locale={locale} />
    <section id="cv" className="about-cv" aria-labelledby="about-cv-title">
      <div>
        <SectionLabel number="05">CV</SectionLabel>
        <h2 id="about-cv-title">{content.cvTitle}</h2>
        <p>{content.cvDescription}</p>
      </div>
      <TextLink href={publicCv.url} variant="editorial" arrow="external" newTab newTabLabel={content.newTab}>{content.cvAction}</TextLink>
    </section>
  </DedicatedPageFrame>;
}


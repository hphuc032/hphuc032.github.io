import { Achievements } from "@/components/home/Achievements";
import { Experience } from "@/components/home/Experience";
import { Expertise } from "@/components/home/Expertise";
import { Identity } from "@/components/home/Identity";
import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import { TextLink } from "@/components/ui/TextLink";
import { publicCv } from "@/data/contact";
import type { Locale } from "@/i18n/locales";

const copy = {
  en: {
    eyebrow: "ROUTE / ABOUT",
    title: "About",
    description: "Identity, practical capability, work experience, and verified progression.",
    cvTitle: "Curriculum vitae.",
    cvDescription: "The approved public CV is available as a PDF.",
    cvAction: "VIEW CV",
    newTab: "opens in a new tab",
  },
  vi: {
    eyebrow: "TUYẾN / GIỚI THIỆU",
    title: "Giới thiệu",
    description: "Danh tính, năng lực thực hành, kinh nghiệm làm việc và quá trình đã được xác minh.",
    cvTitle: "Hồ sơ nghề nghiệp.",
    cvDescription: "CV công khai đã được phê duyệt hiện có dưới dạng PDF.",
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
    <section className="about-cv" aria-labelledby="about-cv-title">
      <div>
        <h2 id="about-cv-title">{content.cvTitle}</h2>
        <p>{content.cvDescription}</p>
      </div>
      <TextLink href={publicCv.url} variant="editorial" arrow="external" newTab newTabLabel={content.newTab}>{content.cvAction}</TextLink>
    </section>
  </DedicatedPageFrame>;
}


import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import { TextLink } from "@/components/ui/TextLink";
import { logIndexPath } from "@/data/security-log-publication";
import type { Locale } from "@/i18n/locales";

const copy = {
  en: {
    eyebrow: "ROUTE / WRITEUPS",
    title: "Writeups",
    description: "A dedicated route for reviewed CTF and challenge writeups.",
    state: "No CTF writeups are published here yet.",
    note: "Technical notes and lab analysis remain available in the separate Security Log.",
    action: "OPEN SECURITY LOG",
  },
  vi: {
    eyebrow: "TUYẾN / WRITEUPS",
    title: "Writeups",
    description: "Tuyến nội dung riêng dành cho các bài CTF và thử thách đã được rà soát.",
    state: "Hiện chưa có bài CTF writeup nào được công bố tại đây.",
    note: "Ghi chép kỹ thuật và phân tích bài lab vẫn được lưu trong Security Log riêng.",
    action: "MỞ SECURITY LOG",
  },
} as const;

export function WriteupsPage({ locale }: { locale: Locale }) {
  const content = copy[locale];
  return <DedicatedPageFrame locale={locale} page="writeups" eyebrow={content.eyebrow} title={content.title} description={content.description}>
    <section className="writeups-foundation" aria-labelledby="writeups-state-title">
      <p className="writeups-foundation-index" aria-hidden="true">00 / ARCHIVE</p>
      <h2 id="writeups-state-title">{content.state}</h2>
      <p>{content.note}</p>
      <TextLink href={logIndexPath(locale)} variant="editorial" arrow="right" prefetch={false}>{content.action}</TextLink>
    </section>
  </DedicatedPageFrame>;
}


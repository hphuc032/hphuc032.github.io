import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import { WriteupsIndex } from "@/components/writeups/WriteupsIndex";
import type { Locale } from "@/i18n/locales";
import "@/styles/writeups.css";

const copy = {
  en: {
    eyebrow: "FIELD NOTES / CTF",
    title: "Writeups",
    description: "CTF and challenge writeups from hands-on security practice.",
  },
  vi: {
    eyebrow: "GHI CHÉP / CTF",
    title: "Writeups",
    description: "Bài giải CTF và thử thách từ quá trình thực hành an toàn thông tin.",
  },
} as const;

export function WriteupsPage({ locale }: { locale: Locale }) {
  const content = copy[locale];
  return <DedicatedPageFrame locale={locale} page="writeups" eyebrow={content.eyebrow} title={content.title} description={content.description}>
    <WriteupsIndex locale={locale} />
  </DedicatedPageFrame>;
}

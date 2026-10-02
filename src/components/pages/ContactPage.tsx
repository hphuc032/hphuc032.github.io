import { Contact } from "@/components/home/Contact";
import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import type { Locale } from "@/i18n/locales";

const copy = {
  en: {
    eyebrow: "ROUTE / CONTACT",
    title: "Contact",
    description: "Approved public channels for professional enquiries, technical conversations, and project discussions.",
  },
  vi: {
    eyebrow: "TUYẾN / LIÊN HỆ",
    title: "Liên hệ",
    description: "Các kênh công khai đã được phê duyệt cho trao đổi nghề nghiệp, kỹ thuật và dự án.",
  },
} as const;

export function ContactPage({ locale }: { locale: Locale }) {
  return <DedicatedPageFrame locale={locale} page="contact" {...copy[locale]}>
    <Contact locale={locale} />
  </DedicatedPageFrame>;
}


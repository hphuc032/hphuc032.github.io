import { Terminal } from "@/components/home/Terminal";
import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import type { Locale } from "@/i18n/locales";

const copy = {
  en: {
    eyebrow: "INTERFACE / LOCAL CONSOLE",
    title: "Terminal",
    description: "Explore the published portfolio through nine predefined commands. Responses stay local; navigation is always your choice.",
  },
  vi: {
    eyebrow: "GIAO DIỆN / BẢNG LỆNH CỤC BỘ",
    title: "Terminal",
    description: "Khám phá portfolio qua chín lệnh định sẵn. Kết quả được xử lý cục bộ; bạn chủ động chọn liên kết để điều hướng.",
  },
} as const;

export function TerminalPage({ locale }: { locale: Locale }) {
  return <DedicatedPageFrame locale={locale} page="terminal" {...copy[locale]}>
    <Terminal locale={locale} />
  </DedicatedPageFrame>;
}


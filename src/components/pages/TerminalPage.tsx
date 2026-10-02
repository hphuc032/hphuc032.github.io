import { Terminal } from "@/components/home/Terminal";
import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import type { Locale } from "@/i18n/locales";

const copy = {
  en: {
    eyebrow: "ROUTE / TERMINAL",
    title: "Terminal",
    description: "A safe, predefined interaction layer for navigating the published portfolio record.",
  },
  vi: {
    eyebrow: "TUYẾN / TERMINAL",
    title: "Terminal",
    description: "Lớp tương tác an toàn, định sẵn để điều hướng các nội dung portfolio đã công bố.",
  },
} as const;

export function TerminalPage({ locale }: { locale: Locale }) {
  return <DedicatedPageFrame locale={locale} page="terminal" {...copy[locale]}>
    <Terminal locale={locale} />
  </DedicatedPageFrame>;
}


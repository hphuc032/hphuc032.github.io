import { Operations } from "@/components/home/Operations";
import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import type { Locale } from "@/i18n/locales";

const copy = {
  en: {
    eyebrow: "ROUTE / PROJECTS",
    title: "Projects",
    description: "Published security work drawn from the same evidence-conscious project catalog used across carwyn.sec.",
  },
  vi: {
    eyebrow: "TUYẾN / DỰ ÁN",
    title: "Dự án",
    description: "Các dự án bảo mật đã công bố, dùng chung danh mục chú trọng bằng chứng trên toàn bộ carwyn.sec.",
  },
} as const;

export function ProjectsPage({ locale }: { locale: Locale }) {
  return <DedicatedPageFrame locale={locale} page="projects" {...copy[locale]}>
    <Operations locale={locale} />
  </DedicatedPageFrame>;
}


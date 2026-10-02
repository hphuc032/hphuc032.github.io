import { ProjectsIndex } from "@/components/projects/ProjectsIndex";
import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import type { Locale } from "@/i18n/locales";
import "@/styles/projects.css";

const copy = {
  en: {
    eyebrow: "SELECTED OPERATIONS",
    title: "Projects",
    description: "Three projects exploring API security, assessment labs, and network traffic analysis.",
  },
  vi: {
    eyebrow: "DỰ ÁN TIÊU BIỂU",
    title: "Dự án",
    description: "Ba dự án từ thực hành bảo mật API, đánh giá lỗ hổng đến phân tích lưu lượng mạng.",
  },
} as const;

export function ProjectsPage({ locale }: { locale: Locale }) {
  return <DedicatedPageFrame locale={locale} page="projects" {...copy[locale]}>
    <ProjectsIndex locale={locale} />
  </DedicatedPageFrame>;
}

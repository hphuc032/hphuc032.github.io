import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { dedicatedPagePath, type DedicatedPageId } from "@/data/page-publication";
import type { Locale } from "@/i18n/locales";
import { localizedMetadata } from "@/lib/site-metadata";

const metadataCopy = {
  projects: {
    en: { title: "Projects — carwyn.sec", description: "Published information-security projects by Nguyen Hoang Phuc." },
    vi: { title: "Dự án — carwyn.sec", description: "Các dự án an toàn thông tin đã công bố của Nguyen Hoang Phuc." },
  },
  writeups: {
    en: { title: "Writeups — carwyn.sec", description: "The reviewed CTF and challenge writeup archive for carwyn.sec." },
    vi: { title: "Writeups — carwyn.sec", description: "Kho bài giải CTF và thử thách đã được rà soát của carwyn.sec." },
  },
  about: {
    en: { title: "About Nguyen Hoang Phuc — carwyn.sec", description: "Identity, practical security capability, work experience, and verified progression." },
    vi: { title: "Giới thiệu Nguyen Hoang Phuc — carwyn.sec", description: "Giới thiệu, năng lực bảo mật thực hành, kinh nghiệm làm việc và tiến trình đã được xác minh." },
  },
  terminal: {
    en: { title: "Terminal — carwyn.sec", description: "A predefined local interface into the published carwyn.sec portfolio record." },
    vi: { title: "Terminal — carwyn.sec", description: "Giao diện cục bộ định sẵn để xem nội dung portfolio carwyn.sec đã công bố." },
  },
  contact: {
    en: { title: "Contact — carwyn.sec", description: "Public contact channels and the approved CV for Nguyen Hoang Phuc." },
    vi: { title: "Liên hệ — carwyn.sec", description: "Các kênh liên hệ công khai và CV đã được phê duyệt của Nguyen Hoang Phuc." },
  },
} as const satisfies Record<DedicatedPageId, Record<Locale, { title: string; description: string }>>;

export function dedicatedPageMetadata(page: DedicatedPageId, locale: Locale): Metadata {
  const paths = { en: dedicatedPagePath(page, "en"), vi: dedicatedPagePath(page, "vi") };
  if (!paths.en || !paths.vi) notFound();
  return localizedMetadata({ locale, ...metadataCopy[page][locale], paths: { en: paths.en, vi: paths.vi } });
}

// Each route supplies its server composition, keeping unrelated client/CSS
// dependencies out of the route graph. Metadata and publication stay shared.
export function DedicatedPageRoute({ page, locale, component: Page }: { page: DedicatedPageId; locale: Locale; component: ComponentType<{ locale: Locale }> }) {
  if (!dedicatedPagePath(page, locale)) notFound();
  return <Page locale={locale} />;
}


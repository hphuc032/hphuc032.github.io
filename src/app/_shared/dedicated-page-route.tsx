import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPage } from "@/components/pages/AboutPage";
import { ContactPage } from "@/components/pages/ContactPage";
import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { TerminalPage } from "@/components/pages/TerminalPage";
import { WriteupsPage } from "@/components/pages/WriteupsPage";
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
    vi: { title: "Writeups — carwyn.sec", description: "Kho bài CTF và thử thách đã được rà soát của carwyn.sec." },
  },
  about: {
    en: { title: "About Nguyen Hoang Phuc — carwyn.sec", description: "Identity, practical security capability, work experience, and verified progression." },
    vi: { title: "Giới thiệu Nguyen Hoang Phuc — carwyn.sec", description: "Danh tính, năng lực bảo mật thực hành, kinh nghiệm và quá trình đã được xác minh." },
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

const pages = {
  projects: ProjectsPage,
  writeups: WriteupsPage,
  about: AboutPage,
  terminal: TerminalPage,
  contact: ContactPage,
} as const satisfies Record<DedicatedPageId, typeof ProjectsPage>;

export function dedicatedPageMetadata(page: DedicatedPageId, locale: Locale): Metadata {
  const paths = { en: dedicatedPagePath(page, "en"), vi: dedicatedPagePath(page, "vi") };
  if (!paths.en || !paths.vi) notFound();
  return localizedMetadata({ locale, ...metadataCopy[page][locale], paths: { en: paths.en, vi: paths.vi } });
}

export function DedicatedPageRoute({ page, locale }: { page: DedicatedPageId; locale: Locale }) {
  const Page = pages[page];
  if (!dedicatedPagePath(page, locale)) notFound();
  return <Page locale={locale} />;
}


import type { ReactNode } from "react";
import { EndSystem } from "@/components/home/EndSystem";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { SystemLabel } from "@/components/ui/SystemLabel";
import type { DedicatedPageId } from "@/data/page-publication";
import type { Locale } from "@/i18n/locales";

type Props = {
  locale: Locale;
  page: DedicatedPageId;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function DedicatedPageFrame({ locale, page, eyebrow, title, description, children }: Props) {
  return <>
    <main id="main-content" className="dedicated-page" data-page={page} tabIndex={-1}>
      <header className="dedicated-page-opening">
        <SystemLabel>{eyebrow}</SystemLabel>
        <EditorialHeading as="h1" size="heading-1">{title}</EditorialHeading>
        <p>{description}</p>
      </header>
      {children}
    </main>
    <EndSystem locale={locale} topId="main-content" />
  </>;
}


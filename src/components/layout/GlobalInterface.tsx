"use client";

import { DeploymentLink } from "@/components/ui/DeploymentLink";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { globalUI, sectionIds } from "@/i18n/global-ui";
import type { Locale } from "@/i18n/locales";
import { useSectionIndex } from "@/hooks/use-section-index";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { activeNavigationItem, siteNavigationIds, siteNavigationPath } from "@/data/page-publication";
import { LanguageSelector } from "./LanguageSelector";

export function GlobalInterface({ locale }: { locale: Locale }) {
  const copy = globalUI[locale];
  const pathname = usePathname();
  const routeActive = activeNavigationItem(pathname);
  const { active: activeSection } = useSectionIndex(pathname);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const activeSectionIndex = routeActive === "home" && activeSection ? sectionIds.indexOf(activeSection) : -1;
  const routeIndex = routeActive ? siteNavigationIds.indexOf(routeActive) : -1;
  const statusIndex = activeSectionIndex >= 0 ? activeSectionIndex : routeIndex;
  const statusLabel = activeSectionIndex >= 0 && activeSection
    ? copy.sectionLabels[activeSectionIndex]
    : routeActive ? copy.navigationLabels[routeActive] : copy.system;

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const returnTarget = trigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.querySelector<HTMLAnchorElement>(".index-links a")?.focus();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      returnTarget?.focus({ preventScroll: true });
    };
  }, [open]);

  return <>
    <header className="site-header">
      <DeploymentLink className="site-brand" href={siteNavigationPath("home", locale)} aria-label={copy.home} aria-current={routeActive === "home" ? "page" : undefined}>carwyn.sec</DeploymentLink>
      <nav className="desktop-navigation" aria-label={copy.navigation}>
        {siteNavigationIds.filter(id => id !== "home").map(id => <DeploymentLink
          key={id}
          href={siteNavigationPath(id, locale)}
          aria-current={routeActive === id ? "page" : undefined}
        >{copy.navigationLabels[id]}</DeploymentLink>)}
      </nav>
      <div className="header-controls">
        <div className="header-language"><LanguageSelector locale={locale} /></div>
        <button ref={trigger} className="menu-trigger header-menu-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls="site-index" data-cursor="open" onClick={() => setOpen(true)}>{copy.menu}<span aria-hidden="true"> +</span></button>
      </div>
    </header>
    <dialog ref={dialog} id="site-index" className="site-index" aria-labelledby="index-title"
      onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <div className="index-topline"><h2 id="index-title" className="system-label">{copy.navigation}</h2>
        <button type="button" className="menu-trigger" onClick={() => setOpen(false)}>{copy.close}<span aria-hidden="true"> ×</span></button>
      </div>
      <nav aria-label={copy.navigation} className="index-links">
        {siteNavigationIds.map((id, index) => <DeploymentLink
          key={id}
          href={siteNavigationPath(id, locale)}
          aria-current={routeActive === id ? "page" : undefined}
          onClick={() => setOpen(false)}
        ><span className="index-number">{String(index + 1).padStart(2, "0")}</span><span>{copy.navigationLabels[id]}</span></DeploymentLink>)}
      </nav>
      <div className="index-language"><LanguageSelector locale={locale} onNavigate={() => setOpen(false)} /></div>
    </dialog>
    <aside className="system-status" aria-label={copy.system}>
      <StatusIndicator state="active"><span className="status-desktop">{copy.online}</span><span className="status-mobile">{copy.compactOnline}</span></StatusIndicator>
      <span className="status-location">{copy.location}</span>
      <span className="status-section">{String(statusIndex + 1).padStart(2, "0")} / {statusLabel}</span>
    </aside>
  </>;
}

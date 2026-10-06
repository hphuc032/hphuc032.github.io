"use client";

import type { MouseEvent, ReactNode } from "react";

export function BackToTopLink({ children, targetId = "hero" }: { children: ReactNode; targetId?: string }) {
  function moveToTop(event: MouseEvent<HTMLAnchorElement>) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const main = document.getElementById("main-content");
    const target = document.getElementById(targetId);
    if (!main || !target) return;
    event.preventDefault();
    history.pushState(null, "", `#${targetId}`);
    target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    main.focus({ preventScroll: true });
  }

  return <a href={`#${targetId}`} onClick={moveToTop}>{children}</a>;
}

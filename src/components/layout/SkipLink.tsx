"use client";

import type { MouseEvent, ReactNode } from "react";

export function SkipLink({ children }: { children: ReactNode }) {
  function skip(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const main = document.getElementById("main-content");
    if (!main) return;
    event.preventDefault();
    // Move focus without adding a native hash-only history entry that the
    // client router cannot restore when the user later presses Back.
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start", behavior: "instant" });
  }

  return <a className="skip-link" href="#main-content" onClick={skip}>{children}</a>;
}

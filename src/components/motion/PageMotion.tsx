"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motionIdentity } from "@/data/motion-config";
import { motionTiming } from "@/lib/motion";

/** Progressive CSS enhancement. Native/Next navigation, focus and history stay authoritative. */
export function PageMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resolve = () => {
      clearTimeout(timer);
      delete main.dataset.pageMotion;
      document.dispatchEvent(new CustomEvent("carwyn:motion-busy", { detail: false }));
    };
    const start = (phase: "enter" | "exit") => {
      resolve();
      if (reduced.matches || document.hidden || location.hash) return;
      main.dataset.pageMotion = phase;
      document.dispatchEvent(new CustomEvent("carwyn:motion-busy", { detail: true }));
      // No awaited exit or navigation interception; always settle even when navigation fails.
      const timing = motionTiming();
      timer = setTimeout(resolve, (phase === "enter" ? timing.reveal : timing.fast) * 1000 + 20);
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.download || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin || !["http:", "https:"].includes(destination.protocol) || /\.pdf$/i.test(destination.pathname)) return;
      if (destination.pathname.replace(/\/$/, "") === location.pathname.replace(/\/$/, "")) return;
      if (motionIdentity(destination.pathname) === "unavailable") return;
      start("exit");
    };
    const restore = (event: PageTransitionEvent) => { if (event.persisted) resolve(); };
    if (motionIdentity(pathname) !== "home") start("enter");
    document.addEventListener("click", click, true);
    window.addEventListener("pageshow", restore);
    window.addEventListener("pagehide", resolve);
    window.addEventListener("hashchange", resolve);
    main.addEventListener("focusin", resolve);
    document.addEventListener("visibilitychange", resolve);
    reduced.addEventListener("change", resolve);
    return () => {
      resolve();
      document.removeEventListener("click", click, true);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("pagehide", resolve);
      window.removeEventListener("hashchange", resolve);
      main.removeEventListener("focusin", resolve);
      document.removeEventListener("visibilitychange", resolve);
      reduced.removeEventListener("change", resolve);
    };
  }, [pathname]);
  return null;
}

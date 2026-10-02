"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { gsap } from "gsap";
import type { Locale } from "@/i18n/locales";
import { useReducedMotion } from "@/hooks/use-motion-preference";
import { motionTiming } from "@/lib/motion";

const visited = new Set<string>();

/** Scoped, once-per-session arrivals. Content is never hidden until GSAP is ready. */
export function ChapterMotion({ locale }: { locale: Locale }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  useEffect(() => {
    if (reduced) return;
    const main = document.getElementById("main-content");
    if (!main) return;
    const contexts = new Map<HTMLElement, gsap.Context>();
    const ready = new Map<HTMLElement, () => void>();
    let cancelled = false;
    const settle = (element: HTMLElement) => {
      contexts.get(element)?.revert();
      contexts.delete(element);
      ready.delete(element);
      element.dataset.arrivalState = "settled";
    };
    // Armed offscreen; start shortly after the first line enters, before center.
    const entrance = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          if (entry.boundingClientRect.top < innerHeight * .45) settle(element);
          else ready.get(element)?.();
        }
      }
    }, { rootMargin: `0px 0px -${Math.round(innerHeight * .08)}px 0px`, threshold: 0 });
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (!entry.isIntersecting) { if (contexts.has(element)) settle(element); continue; }
        const key = element.dataset.arrival ?? element.dataset.revealKey!;
        const visitKey = `${pathname}:${key}`;
        if (visited.has(visitKey)) continue;
        visited.add(visitKey);
        // Direct hash jumps, restored scroll, and fast scrolling stay fully resolved.
        if (document.hidden || entry.boundingClientRect.top < innerHeight) { settle(element); continue; }
        void import("gsap").then(({ gsap }) => {
          if (cancelled || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const bounds = element.getBoundingClientRect();
          // Never dim content the visitor has already seen while the chunk loaded.
          if (bounds.top < innerHeight || bounds.top > innerHeight + 192) { settle(element); return; }
          const timing = motionTiming();
          const compact = matchMedia("(max-width: 1023px)").matches;
          const portrait = key === "portrait";
          const pattern = element.dataset.reveal;
          const targets = key === "conclusion" ? element.querySelectorAll("span") : element;
          const context = gsap.context(() => {
            const statement = key === "conclusion";
            const from = statement
              ? { opacity: .9, yPercent: compact ? 8 : 16, rotationX: compact ? 3 : 8, transformPerspective: 1000, transformOrigin: "50% 100%", clipPath: "inset(-25% -5% 65% -5%)" }
              : pattern === "chapter"
                ? { clipPath: "inset(-15% -5% 100% -5%)", y: compact ? 6 : 12, skewY: compact ? 0 : .6, transformOrigin: "0% 100%" }
                : pattern === "record"
                  ? { clipPath: "inset(-20% 100% -20% -5%)", x: compact ? -3 : -6 }
                  : { opacity: portrait ? .86 : .9, y: portrait ? 0 : compact ? 4 : 8 };
            const tween = gsap.fromTo(targets, from,
              { opacity: 1, x: 0, y: 0, yPercent: 0, rotationX: 0, skewY: 0,
                ...(pattern || statement ? { clipPath: "inset(-25% -5% -25% -5%)" } : {}),
                duration: compact || pattern === "chapter" || element.closest(".achievement-record") ? timing.normal : timing.reveal,
                stagger: statement && !compact ? timing.stagger : 0,
                ease: timing.ease, paused: Boolean(pattern), onComplete: () => settle(element) });
            if (pattern) {
              element.dataset.arrivalState = "armed";
              ready.set(element, () => { element.dataset.arrivalState = "running"; ready.delete(element); tween.play(); });
              entrance.observe(element);
            } else element.dataset.arrivalState = "running";
          }, element);
          contexts.set(element, context);
        }).catch(() => settle(element));
      }
    }, { rootMargin: "0px 0px 192px 0px", threshold: 0 });

    for (const element of main.querySelectorAll<HTMLElement>("[data-arrival], [data-reveal]")) {
      const key = element.dataset.arrival ?? element.dataset.revealKey!;
      const visitKey = `${pathname}:${key}`;
      if (visited.has(visitKey) || element.getBoundingClientRect().top < innerHeight) {
        visited.add(visitKey);
        continue;
      }
      observer.observe(element);
    }
    const hide = () => { if (document.hidden) for (const element of contexts.keys()) settle(element); };
    // Hash jumps, focus and resizing must never leave destination copy masked.
    const resolve = () => { for (const element of contexts.keys()) settle(element); };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("hashchange", resolve);
    window.addEventListener("resize", resolve, { passive: true });
    main.addEventListener("focusin", resolve);
    return () => {
      cancelled = true;
      observer.disconnect();
      entrance.disconnect();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("hashchange", resolve);
      window.removeEventListener("resize", resolve);
      main.removeEventListener("focusin", resolve);
      for (const element of contexts.keys()) settle(element);
    };
  }, [locale, pathname, reduced]);
  return null;
}

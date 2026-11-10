"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";

/** CSS owns the loop. React only handles pause, visibility and section lifecycle. */
export function HeroMarquee({ name, signature, locale }: { name: string; signature: string; locale: Locale }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const element = root.current;
    const hero = element?.closest(".hero");
    if (!element || !hero) return;
    let visible = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { element.dataset.running = String(visible && !document.hidden && !reduced.matches && !paused); };
    const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); update(); });
    observer.observe(hero);
    element.dataset.ready = "true";
    document.addEventListener("visibilitychange", update);
    reduced.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
      delete element.dataset.ready;
      element.dataset.running = "false";
    };
  }, [paused]);
  return <div ref={root} className="hero-marquee" data-running="false">
    <p className="hero-marquee-signature" lang="en">{signature}</p>
    <div className="hero-marquee-window" aria-hidden="true"><div className="hero-marquee-track">
      <span>{name}</span><span>{name}</span>
    </div></div>
    <button className="hero-marquee-control" type="button" aria-pressed={paused}
      aria-label={locale === "en" ? "Pause moving name" : "Dừng chuyển động tên"}
      title={locale === "en" ? "Pause moving name" : "Dừng chuyển động tên"}
      onClick={() => setPaused(value => !value)}>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
        {paused ? <path d="m7 4 8 6-8 6Z" /> : <path d="M7 4v12m6-12v12" />}
      </svg>
    </button>
  </div>;
}

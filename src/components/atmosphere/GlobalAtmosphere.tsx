"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { atmosphereIntensity } from "@/data/atmosphere-config";
import { AtmosphereField, type ProtectedRegion } from "@/lib/atmosphere/field";
import { sessionSeed } from "@/lib/atmosphere/random";

type Controller = { route: (pathname: string) => void };
const protectedSelector = ".identity,.contact,.security-log,.log-index,.log-article,.terminal-console,.site-header,.system-status,.initialization,main h1,main h2,main h3,main h4,main p,main a,main button,main input,main pre,main table,main img,main svg,.section-label,.system-label";

/** Shared viewport-sized decoration; page content stays server-rendered. */
export function GlobalAtmosphere() {
  const pathname = usePathname();
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<Controller | null>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let context: CanvasRenderingContext2D | null;
    try { context = element.getContext("2d", { alpha: true }); } catch { return; }
    if (!context) return;
    const field = new AtmosphereField(sessionSeed());
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(forced-colors: active)");
    let intensity = atmosphereIntensity(window.location.pathname);
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastDraw = 0;
    let width = 1, height = 1, scroll = window.scrollY;
    let regions: ProtectedRegion[] = [];
    let covered = false;
    let menuOpen = Boolean(document.querySelector("dialog[open]"));
    let transition = Boolean(document.querySelector("main[data-page-motion]"));
    let disposed = false;

    const stop = () => {
      cancelAnimationFrame(frame); frame = 0;
      clearTimeout(timer); timer = undefined;
      element.dataset.running = "false";
    };
    const visible = () => !document.hidden && !contrast.matches && !covered && !menuOpen && !transition;
    const paint = (now: number) => field.draw(context, now, !reduced.matches, regions, scroll);
    const schedule = () => {
      if (disposed || !visible() || reduced.matches) return;
      if (field.active) {
        if (!frame) { element.dataset.running = "true"; frame = requestAnimationFrame(tick); }
      } else {
        clearTimeout(timer);
        timer = setTimeout(() => { timer = undefined; tick(performance.now()); }, Math.max(20, field.nextEvent - performance.now()));
      }
    };
    const tick = (now: number) => {
      frame = 0;
      if (!visible() || reduced.matches) { stop(); return; }
      // Rare opacity changes and short meteor flights need only a 30fps drawing budget.
      if (now - lastDraw >= 32) {
        field.tick(now); paint(now); lastDraw = now;
        const count = String(field.meteorCount);
        if (element.dataset.meteors !== count) element.dataset.meteors = count;
      }
      if (!field.active) element.dataset.running = "false";
      schedule();
    };
    const checkCoverage = () => {
      covered = regions.some(region => region.x <= 0 && region.width >= width && region.y <= scroll && region.y + region.height >= scroll + height);
    };
    const measure = () => {
      scroll = window.scrollY;
      regions = [];
      for (const target of document.querySelectorAll<HTMLElement>(protectedSelector)) {
        if (target.closest(".sr-only,dialog") || getComputedStyle(target).display === "none") continue;
        const bounds = target.getBoundingClientRect();
        if (!bounds.width || !bounds.height) continue;
        const paper = target.matches(".identity,.contact,.security-log,.log-index,.log-article");
        const padding = paper ? 0 : 5;
        regions.push({ x: bounds.left - padding, y: bounds.top + scroll - padding, width: bounds.width + padding * 2, height: bounds.height + padding * 2 });
      }
      checkCoverage();
    };
    const reconcile = (resetSchedule = true) => {
      stop();
      if (resetSchedule) field.suspend(performance.now());
      element.dataset.mode = contrast.matches ? "off" : reduced.matches ? "static" : "animated";
      element.dataset.meteors = "0";
      if (!visible()) context.clearRect(0, 0, width, height);
      else { paint(performance.now()); schedule(); }
    };
    const resize = () => {
      stop(); width = innerWidth; height = innerHeight;
      // Match the wake's conservative DPR convention and bound large desktop allocations.
      const resolution = Math.min(devicePixelRatio || 1, 1, 1280 / width, 900 / height);
      element.width = Math.ceil(width * resolution); element.height = Math.ceil(height * resolution);
      context.setTransform(resolution, 0, 0, resolution, 0, 0);
      field.configure(intensity, width, height, performance.now());
      element.dataset.intensity = intensity; element.dataset.stars = String(field.starCount);
      element.dataset.resolution = String(resolution);
      measure(); reconcile(false);
    };
    const onScroll = () => {
      const previouslyCovered = covered;
      scroll = window.scrollY; checkCoverage();
      if (previouslyCovered !== covered) reconcile();
      else if (visible()) paint(performance.now());
    };
    const route = (path: string) => {
      intensity = atmosphereIntensity(path);
      resizeObserver?.disconnect();
      const main = document.querySelector("main");
      if (main) resizeObserver?.observe(main);
      resize();
    };
    const resizeObserver = new ResizeObserver(() => { measure(); reconcile(false); });
    const menuObserver = new MutationObserver(() => { menuOpen = Boolean(document.querySelector("dialog[open]")); reconcile(); });
    const dialog = document.querySelector("dialog");
    if (dialog) menuObserver.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    controller.current = { route };
    route(window.location.pathname);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    const onPreference = () => reconcile();
    const onTransition = (event: Event) => { transition = Boolean((event as CustomEvent<boolean>).detail); reconcile(); };
    document.addEventListener("carwyn:motion-busy", onTransition);
    document.addEventListener("visibilitychange", onPreference);
    reduced.addEventListener("change", onPreference);
    contrast.addEventListener("change", onPreference);
    void document.fonts.ready.then(() => { if (!disposed) { measure(); reconcile(false); } });
    return () => {
      disposed = true; stop(); controller.current = null;
      resizeObserver?.disconnect(); menuObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onPreference);
      document.removeEventListener("carwyn:motion-busy", onTransition);
      reduced.removeEventListener("change", onPreference);
      contrast.removeEventListener("change", onPreference);
      element.width = element.height = 1;
    };
  }, []);

  useEffect(() => { controller.current?.route(pathname); }, [pathname]);
  return <canvas ref={canvas} className="global-atmosphere" width={1} height={1} aria-hidden="true" />;
}

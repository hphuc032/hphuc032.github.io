"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { useReducedMotion } from "@/hooks/use-motion-preference";
import type { WaterWake } from "@/lib/water-wake";
import { motionIdentity, motionProfile } from "@/data/motion-config";

/** One bounded wake and RAF, with the approved DOM depth response kept intact. */
export function PointerAtmosphere({ locale }: { locale: Locale }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  useEffect(() => {
    if (reduced) return;
    const main = document.getElementById("main-content");
    const profile = motionProfile(pathname);
    if (!main || !profile.wake) return;
    const media = matchMedia("(hover: hover) and (pointer: fine)");
    const contrast = matchMedia("(forced-colors: active)");
    const home = motionIdentity(pathname) === "home";
    // Reuse the one wake renderer in empty page space, never an article/portrait/input.
    if (!home) main.dataset.liquid = String(profile.wake);
    const surfaces = [...document.querySelectorAll<HTMLElement>("[data-liquid]")];
    let ownedSurface: HTMLDivElement | undefined;
    let disposed = false;
    let loading = false;
    let menuOpen = Boolean(document.querySelector("dialog[open]"));
    let transitioning = Boolean(document.querySelector("main[data-page-motion]"));
    let wake: WaterWake | undefined;
    let current: HTMLElement | undefined;
    let field: HTMLCanvasElement | null = null;
    let context: CanvasRenderingContext2D | null = null;
    let width = 0, height = 0, top = 0;
    let bounds: DOMRect | undefined;
    let statements: HTMLElement[] = [];
    let row: HTMLElement | null = null;
    let preview: SVGSVGElement | null = null;
    let rowBounds: DOMRect | undefined;
    let tiltX = 0, tiltY = 0, targetTiltX = 0, targetTiltY = 0;
    let frame = 0, time = 0, lastMove = 0, lastX = 0, lastY = 0;
    let x = 0, y = 0, tx = 0, ty = 0, strength = 0, energy = 0;
    let interrupted = false;
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0;
      wake?.clear();
      if (field) { field.width = field.height = 1; }
      field?.removeAttribute("style");
      for (const statement of statements) { statement.style.removeProperty("transform"); statement.style.removeProperty("will-change"); }
      preview?.style.removeProperty("transform");
      preview?.style.removeProperty("will-change");
      statements = []; preview = null; row = null; rowBounds = undefined;
      tiltX = tiltY = targetTiltX = targetTiltY = 0;
      current = undefined; field = null; context = null; bounds = undefined; strength = energy = 0; interrupted = false;
    };
    const draw = (now: number) => {
      frame = 0;
      if (!current || !field || !context || !wake || document.hidden || !media.matches || contrast.matches || menuOpen || transitioning) { reset(); return; }
      const dt = Math.min(now - (time || now - 16), 40); time = now;
      const follow = 1 - Math.exp(-dt / 110);
      x += (tx - x) * follow; y += (ty - y) * follow;
      energy *= Math.exp(-dt / 260);
      const desired = now - lastMove < 70 ? .26 + energy * .3 : 0;
      strength += (desired - strength) * (1 - Math.exp(-dt / (desired ? 90 : 260)));
      context.clearRect(0, top, width, height);
      const flowing = wake.draw(context, now, Number(current.dataset.liquid || 1));
      const depth = strength / .56;
      for (let index = 0; index < statements.length; index++) {
        const separation = index === 0 ? 1.5 : -2.5;
        statements[index]!.style.transform = `translate3d(${(x / bounds!.width * 2 - 1) * separation * depth}px,${(y / bounds!.height * 2 - 1) * depth}px,0)`;
      }
      tiltX += (targetTiltX * depth - tiltX) * follow;
      tiltY += (targetTiltY * depth - tiltY) * follow;
      if (preview) preview.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${depth * 8}px)`;
      // A busy frame must not extend an invisible wake's lifetime through clamped depth easing.
      if (!flowing && (strength < .002 || now - lastMove > 1200) && now - lastMove > 100) { reset(); return; }
      frame = requestAnimationFrame(draw);
    };
    const calm = () => { lastMove = 0; energy = 0; interrupted = true; };
    const move = (event: PointerEvent) => {
      if (!media.matches || contrast.matches || event.pointerType !== "mouse" || document.hidden) return;
      if (menuOpen || transitioning) { reset(); return; }
      if (event.buttons || getSelection()?.isCollapsed === false) { reset(); return; }
      const target = event.target instanceof Element ? event.target : null;
      const next = target?.closest<HTMLElement>("[data-liquid]");
      if (target?.closest('[data-native-cursor],input,textarea,select,[contenteditable="true"],.terminal-console')) { reset(); return; }
      if (!home && target?.closest(".identity,article,.log-prose,.writeup-prose,p,pre,table,figure,img,button")) { calm(); return; }
      if (!next || target?.closest("p")) { calm(); return; }
      if (!wake) {
        // Touch/reduced motion never request this renderer. No per-event React state.
        if (!loading) {
          loading = true;
          void import("@/lib/water-wake").then(({ WaterWake }) => {
            if (!disposed) wake = new WaterWake();
          }).catch(() => { loading = false; });
        }
        return;
      }
      const now = performance.now();
      if (next !== current) {
        reset(); current = next; bounds = next.getBoundingClientRect();
        field = next.querySelector<HTMLCanvasElement>(".liquid-light");
        if (!field && !home && next === main) {
          ownedSurface ??= document.createElement("div");
          ownedSurface.className = "liquid-surface";
          ownedSurface.setAttribute("aria-hidden", "true");
          field = document.createElement("canvas");
          field.className = "liquid-light";
          field.width = field.height = 1;
          ownedSurface.append(field);
          next.prepend(ownedSurface);
        }
        statements = [...next.querySelectorAll<HTMLElement>(".hero-statement")];
        if (!field) { reset(); return; }
        try { context = field.getContext("2d", { alpha: true }); } catch { reset(); return; }
        if (!context) { reset(); return; }
        // Only the visible section slice has a buffer. Never a full-page/high-DPR canvas.
        width = bounds.width; top = Math.max(0, -bounds.top);
        height = Math.min(bounds.height - top, innerHeight - Math.max(0, bounds.top));
        const resolution = Math.min(devicePixelRatio || 1, 1, 1024 / width, 640 / height);
        field.width = Math.ceil(width * resolution); field.height = Math.ceil(height * resolution);
        field.style.width = `${width}px`; field.style.height = `${height}px`;
        field.style.top = `${top}px`; field.style.opacity = "1";
        context.setTransform(resolution, 0, 0, resolution, 0, -top * resolution);
        for (const statement of statements) statement.style.willChange = "transform";
        x = event.clientX - bounds.left; y = event.clientY - bounds.top;
        lastX = event.clientX; lastY = event.clientY; time = now;
      }
      // Resume with a fresh stroke; never bridge a path across a menu/reading surface.
      if (interrupted) { wake!.clear(); interrupted = false; lastX = event.clientX; lastY = event.clientY; lastMove = now; }
      const speed = Math.hypot(event.clientX - lastX, event.clientY - lastY) / Math.max(now - lastMove, 12);
      energy = Math.min(1, energy + speed * .15);
      tx = event.clientX - bounds!.left; ty = event.clientY - bounds!.top;
      wake!.add(tx, ty, now, speed / 1.1);
      const nextRow = target?.closest<HTMLElement>(".operation-row") ?? null;
      if (nextRow !== row) {
        preview?.style.removeProperty("transform"); preview?.style.removeProperty("will-change"); row = nextRow;
        preview = row?.querySelector<SVGSVGElement>(".project-visual svg") ?? null;
        if (preview) preview.style.willChange = "transform";
        rowBounds = row?.getBoundingClientRect(); tiltX = tiltY = 0;
      }
      if (rowBounds) {
        targetTiltX = Math.max(-3, Math.min(3, -(event.clientY - rowBounds.top) / rowBounds.height * 6 + 3));
        targetTiltY = Math.max(-3, Math.min(3, (event.clientX - rowBounds.left) / rowBounds.width * 6 - 3));
      }
      lastX = event.clientX; lastY = event.clientY; lastMove = now;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.target === current && !entry.isIntersecting)) reset();
    });
    for (const surface of surfaces) observer.observe(surface);
    const visibility = () => { if (document.hidden) reset(); };
    const menu = new MutationObserver(() => { menuOpen = Boolean(document.querySelector("dialog[open]")); if (menuOpen) reset(); });
    const dialog = document.querySelector("dialog");
    if (dialog) menu.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    const transition = (event: Event) => { transitioning = Boolean((event as CustomEvent<boolean>).detail); if (transitioning) reset(); };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", calm);
    window.addEventListener("blur", reset);
    window.addEventListener("keydown", calm);
    window.addEventListener("scroll", reset, { capture: true, passive: true });
    window.addEventListener("resize", reset, { passive: true });
    document.addEventListener("selectionchange", calm);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("carwyn:motion-busy", transition);
    media.addEventListener("change", reset);
    contrast.addEventListener("change", reset);
    return () => {
      disposed = true; reset(); observer.disconnect(); menu.disconnect();
      ownedSurface?.remove();
      if (!home) delete main.dataset.liquid;
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", calm);
      window.removeEventListener("blur", reset);
      window.removeEventListener("keydown", calm);
      window.removeEventListener("scroll", reset, true);
      window.removeEventListener("resize", reset);
      document.removeEventListener("selectionchange", calm);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("carwyn:motion-busy", transition);
      media.removeEventListener("change", reset);
      contrast.removeEventListener("change", reset);
    };
  }, [locale, pathname, reduced]);
  return null;
}

"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type PointerEvent } from "react";
import { getInitializationState, getServerInitializationState, subscribeInitialization } from "@/lib/initialization-state";
import { useReducedMotion } from "@/hooks/use-motion-preference";
import { sphereSkills, sphereCategories } from "@/data/sphere-skills";
import { homeLabels } from "@/data/home";
import { createSphereController, skillPoints } from "@/lib/skill-sphere";
import { projectPoint } from "@/lib/network-topology";
import type { Locale } from "@/i18n/locales";

const NetworkCanvas = dynamic(() => import("./NetworkCanvas").catch(() => ({ default: () => null })), { ssr: false });
class NetworkBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
export function NetworkSphere({ children, locale }: { children: ReactNode; locale: Locale }) {
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const focused = useRef(-1);
  const controller = useRef(createSphereController());
  const reduced = useReducedMotion();
  const initialization = useSyncExternalStore(subscribeInitialization, getInitializationState, getServerInitializationState);
  const [eligible, setEligible] = useState(false);
  const [mobile, setMobile] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [requested, setRequested] = useState(false);
  const onReady = useCallback((value: boolean) => setReady(value), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  const enhanced = requested && eligible && !reduced && !failed;
  const live = enhanced && ready;
  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const check = () => { setMobile(!media.matches); setEligible(!connection?.saveData); };
    check(); media.addEventListener("change", check);
    return () => media.removeEventListener("change", check);
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: .05 });
    observer.observe(element);
    const visibility = () => setHidden(document.hidden);
    visibility(); document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (initialization !== "ready" || !eligible || reduced || !visible || hidden || requested || failed) return;
    // The actual renderer owns capability detection; no second probe context.
    const timer = window.setTimeout(() => setRequested(true), 250);
    return () => clearTimeout(timer);
  }, [initialization, eligible, reduced, visible, hidden, requested, failed]);
  useEffect(() => {
    const controls = controller.current;
    controls.project = (index, x, y, depth, width) => {
      const button = buttons.current[index];
      if (!button) return;
      if (button.style.left !== "0px") { button.style.left = "0"; button.style.top = "0"; }
      button.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      button.style.setProperty("--skill-depth", String(.3 + Math.max(0, Math.min(1, (depth + 1.02) / 2.04)) * .7));
      const edge = x < 80 ? "left" : x > width - 80 ? "right" : "center";
      if (button.dataset.edge !== edge) button.dataset.edge = edge;
    };
    return () => { controls.project = () => {}; };
  }, [controller]);
  useEffect(() => {
    if (live) return;
    buttons.current.forEach((button, index) => {
      if (!button) return;
      const [x, y] = projectPoint(skillPoints[index]!);
      button.style.left = `${x / 5}%`; button.style.top = `${y / 5}%`;
      button.style.transform = "translate(-50%, -50%)";
      button.dataset.edge = x < 125 ? "left" : x > 375 ? "right" : "center";
    });
  }, [live]);
  const activate = (index: number, center = false) => {
    controller.current.activeSkill = index;
    buttons.current.forEach((button, i) => { if (button) button.dataset.active = String(i === index); });
    if (center && live) {
      const [x, y, z] = skillPoints[index]!;
      controller.current.yaw = -Math.atan2(x, z);
      controller.current.pitch = Math.atan2(y, Math.hypot(x, z));
    }
    controller.current.invalidate();
  };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!live || event.button !== 0) return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    controller.current.dragging = true; activate(-1);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "true";
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointer.current;
    if (!previous || previous.id !== event.pointerId) return;
    controller.current.yaw += Math.max(-40, Math.min(40, event.clientX - previous.x)) * .006;
    controller.current.pitch = Math.max(-1.2, Math.min(1.2, controller.current.pitch + (event.clientY - previous.y) * .006));
    previous.x = event.clientX; previous.y = event.clientY;
    controller.current.invalidate();
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    pointer.current = null; controller.current.dragging = false; controller.current.releasedAt = performance.now();
    event.currentTarget.dataset.dragging = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div ref={root} className="network-object" role="group" aria-label={homeLabels[locale].skillSphere}
    data-network-mode={live ? "webgl" : "static"} data-network-topology={mobile ? "mobile" : "desktop"} data-native-cursor>
    <div className="network-stage" aria-hidden="true">
      {children}
      {enhanced && <NetworkBoundary onFailure={onFailure}><NetworkCanvas controllerRef={controller} mobile={mobile}
        active={visible && !hidden} paused={paused} onReady={onReady} onFailure={onFailure} /></NetworkBoundary>}
    </div>
    <div className="network-controls" onPointerDown={start} onPointerMove={drag} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      {sphereSkills.map((skill, index) => {
        const [x, y] = projectPoint(skillPoints[index]!);
        const category = sphereCategories[skill.category][locale];
        return <button key={skill.name} ref={element => { buttons.current[index] = element; }} type="button"
          className="skill-node" data-edge={x < 125 ? "left" : x > 375 ? "right" : "center"} aria-label={`${skill.name} — ${category}`} style={{ left: `${x / 5}%`, top: `${y / 5}%` }}
          onPointerEnter={() => { if (!controller.current.dragging && focused.current < 0) activate(index); }}
          onPointerLeave={() => { if (focused.current < 0) activate(-1); }}
          onFocus={() => { focused.current = index; activate(index, true); }}
          onBlur={() => { focused.current = -1; activate(-1); }}
          onClick={() => { if (!controller.current.dragging) activate(index, true); }}>
          <span className="skill-dot" aria-hidden="true" /><span className="skill-label" aria-hidden="true"><strong>{skill.name}</strong><span>{category}</span></span>
        </button>;
      })}
    </div>
    <p className="network-instruction">{homeLabels[locale].drag}</p>
    {live && <button className="network-pause" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {locale === "en" ? (paused ? "RESUME MOTION" : "PAUSE MOTION") : (paused ? "TIẾP TỤC CHUYỂN ĐỘNG" : "DỪNG CHUYỂN ĐỘNG")}
    </button>}
    <div className="sr-only"><p>{homeLabels[locale].skills}</p><ul data-sphere-skills>{sphereSkills.map(skill =>
      <li key={skill.name}>{skill.name} — {sphereCategories[skill.category][locale]}</li>)}</ul></div>
  </div>;
}

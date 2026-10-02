import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { publishedRoutes } from "./test-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3034";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [], results = [];
const drawTimes = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await context.addInitScript(() => {
  sessionStorage.setItem("carwyn:initialized", "1"); sessionStorage.setItem("carwyn:atmosphere-seed", "23");
  window.__atmosphereDraws = 0; window.__atmosphereContexts = []; window.__atmosphereDrawMs = [];
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...options) {
    if (this.classList.contains("global-atmosphere")) window.__atmosphereContexts.push(type);
    return getContext.call(this, type, ...options);
  };
  const clear = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function(...args) {
    if (this.canvas.classList.contains("global-atmosphere")) { window.__atmosphereDraws++; window.__atmosphereDrawStart = performance.now(); }
    return clear.apply(this, args);
  };
  const composite = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "globalCompositeOperation");
  Object.defineProperty(CanvasRenderingContext2D.prototype, "globalCompositeOperation", {
    ...composite,
    set(value) {
      composite.set.call(this, value);
      if (value === "source-over" && this.canvas.classList.contains("global-atmosphere")) {
        window.__atmosphereDrawMs.push(performance.now() - window.__atmosphereDrawStart);
        if (window.__atmosphereDrawMs.length > 500) window.__atmosphereDrawMs.shift();
      }
    },
  });
});
const page = await context.newPage();
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (["error", "warning"].includes(message.type())) errors.push(message.text()); });
const expectedIntensity = path => {
  const canonical = path.replace(/^\/vi(?=\/|$)/, "") || "/";
  if (canonical === "/") return "home";
  if (canonical.startsWith("/log/")) return "very-light";
  if (["/projects", "/terminal"].includes(canonical)) return "medium";
  if (canonical === "/contact") return "medium-low";
  return "light";
};
const state = () => page.locator(".global-atmosphere").evaluate(canvas => ({
  intensity: canvas.dataset.intensity, mode: canvas.dataset.mode, running: canvas.dataset.running,
  stars: Number(canvas.dataset.stars), width: canvas.width, height: canvas.height,
  resolution: Number(canvas.dataset.resolution), pointer: getComputedStyle(canvas).pointerEvents,
}));
try {
  await mkdir("test-results/atmosphere", { recursive: true });
  for (const route of publishedRoutes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".global-atmosphere").count(), 1, `${route}: shared canvas only`);
    const current = await state();
    assert.equal(current.intensity, expectedIntensity(route), route);
    assert.equal(current.mode, "static"); assert.equal(current.running, "false");
    assert.equal(current.pointer, "none"); assert.ok(current.width <= 1280 && current.height <= 900);
    assert.equal(await page.locator(".global-atmosphere").getAttribute("aria-hidden"), "true");
    assert.equal(await page.locator(".global-atmosphere").getAttribute("tabindex"), null);
    const draws = await page.evaluate(() => window.__atmosphereDraws);
    await page.waitForTimeout(120);
    assert.equal(await page.evaluate(() => window.__atmosphereDraws), draws, `${route}: reduced motion has no scheduled drawing`);
    assert.ok(await page.evaluate(() => window.__atmosphereContexts.every(type => type === "2d")), "no atmosphere WebGL context");
    results.push({ route, ...current });
  }
  console.log(`PASS ${publishedRoutes.length} routes: one decorative Canvas2D, intensity, static reduced motion, no WebGL`);

  for (const [width, stars] of [[375, 54], [430, 54], [768, 81], [1024, 108], [1440, 108], [1920, 108]]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(base);
    assert.equal((await state()).stars, stars, `${width}: responsive density`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  console.log("PASS density and overflow at six responsive widths");

  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(base + "/projects");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => document.querySelector(".global-atmosphere").dataset.mode === "animated");
  await page.waitForFunction(() => Number(document.querySelector(".global-atmosphere").dataset.meteors) > 0, null, { timeout: 25000 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: "test-results/atmosphere/projects-meteor-1440.png" });
  const cdp = await context.newCDPSession(page); await cdp.send("Performance.enable");
  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(item => [item.name, item.value]));
  const before = await metrics();
  await page.waitForTimeout(1200); const after = await metrics();
  assert.equal(after.LayoutCount - before.LayoutCount, 0, "atmosphere frames cause no layout");
  results.push({ activeIntervalTaskMs: (after.TaskDuration - before.TaskDuration) * 1000, activeIntervalLayouts: after.LayoutCount - before.LayoutCount });
  drawTimes.push(...await page.evaluate(() => window.__atmosphereDrawMs));
  await page.waitForFunction(() => document.querySelector(".global-atmosphere").dataset.running === "false", null, { timeout: 12000 });
  const idleDraws = await page.evaluate(() => window.__atmosphereDraws);
  const idleBefore = await metrics(); await page.waitForTimeout(400); const idleAfter = await metrics();
  assert.equal(await page.evaluate(() => window.__atmosphereDraws), idleDraws, "calm interval has no drawing RAF");
  results.push({ idleIntervalTaskMs: (idleAfter.TaskDuration - idleBefore.TaskDuration) * 1000 });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => {
    const state = document.querySelector(".global-atmosphere").dataset;
    return state.mode === "static" && state.running === "false";
  });
  const staticDraws = await page.evaluate(() => window.__atmosphereDraws); await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => window.__atmosphereDraws), staticDraws, "live reduced-motion stops both scheduling and RAF");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => document.querySelector(".global-atmosphere").dataset.mode === "animated");
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  const hiddenDraws = await page.evaluate(() => window.__atmosphereDraws); await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => window.__atmosphereDraws), hiddenDraws, "hidden document stops drawing");
  assert.equal((await state()).running, "false");
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  assert.equal((await state()).mode, "animated");
  console.log("PASS meteor flight, layout-free drawing, live reduced-motion and visibility lifecycle");

  await page.setViewportSize({ width: 430, height: 812 });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  assert.equal((await state()).running, "false");
  assert.equal(await page.locator("dialog .index-links a").count(), 6);
  await page.keyboard.press("Escape");
  assert.ok(await page.getByRole("button", { name: "Menu", exact: true }).evaluate(element => element === document.activeElement));
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/atmosphere/menu-mobile-430.png" });
  await page.keyboard.press("Escape");
  console.log("PASS mobile modal remains functional and pauses atmosphere");

  await page.setViewportSize({ width: 1440, height: 900 });
  for (let index = 0; index < 4; index++) {
    await page.locator('.desktop-navigation a').filter({ hasText: /^About$/ }).click();
    await page.waitForFunction(() => document.querySelector(".global-atmosphere").dataset.intensity === "light");
    await page.locator('.desktop-navigation a').filter({ hasText: /^Projects$/ }).click();
    await page.waitForFunction(() => document.querySelector(".global-atmosphere").dataset.intensity === "medium");
    assert.equal(await page.locator(".global-atmosphere").count(), 1);
  }
  console.log("PASS repeated navigation without duplicate atmosphere canvases");
  await page.goto(base); await page.screenshot({ path: "test-results/atmosphere/home-stars-1440.png" });
  await page.setViewportSize({ width: 430, height: 812 }); await page.screenshot({ path: "test-results/atmosphere/home-stars-430.png" });
  const blocked = await browser.newContext({ reducedMotion: "reduce" });
  await blocked.addInitScript(() => Object.defineProperty(window, "sessionStorage", { get() { throw new Error("storage unavailable"); } }));
  const blockedPage = await blocked.newPage(); await blockedPage.goto(base + "/projects");
  assert.equal(await blockedPage.locator(".global-atmosphere").getAttribute("data-intensity"), "medium"); await blocked.close();
  assert.deepEqual(errors, []);
  drawTimes.sort((a, b) => a - b);
  const drawing = { samples: drawTimes.length, p95Ms: drawTimes[Math.floor(drawTimes.length * .95)] ?? 0, maxMs: drawTimes.at(-1) ?? 0 };
  await writeFile("test-results/atmosphere/results.json", JSON.stringify({ results, drawing, errors }, null, 2));
  console.log("Atmosphere laboratory drawing cost", drawing);
  console.log("PASS storage fallback, console and hydration");
} finally { await browser.close(); }

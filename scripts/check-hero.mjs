import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const sharp = require("sharp"); // Existing Next transitive dependency; reads test pixels only.
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (["error", "warning"].includes(message.type())) errors.push(`${message.text()} ${message.location().url}`); });
await context.addInitScript(() => {
  window.__draws = 0; window.__contexts = 0; window.__shifts = 0;
  new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shifts += e.value; }).observe({ type: "layout-shift", buffered: true });
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...args) {
    const result = original.apply(this, args);
    if (args[0] === "webgl2" && result && !result.__counted) {
      result.__counted = true; window.__contexts++;
      for (const name of ["drawArrays", "drawElements"]) { const draw = result[name]; result[name] = function (...values) { window.__draws++; return draw.apply(this, values); }; }
    }
    return result;
  };
});
try {
  await page.goto(base);
  await page.waitForTimeout(2400);
  console.log("Initial network", await page.locator(".network-object").getAttribute("data-network-mode"));
  const initialCls = await page.evaluate(() => window.__shifts);
  assert.ok(initialCls < .002, `fresh-load Hero CLS ${initialCls}`);
  console.log("Fresh-load Hero CLS", initialCls);
  for (const locale of ["en", "vi"]) {
    if (locale === "vi") { await page.locator(".site-header").getByRole("link", { name: "Tiếng Việt", exact: true }).click(); await page.waitForFunction(() => document.documentElement.lang === "vi"); }
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(100);
      const metrics = await page.evaluate(() => {
        const hero = document.querySelector(".hero").getBoundingClientRect();
        const heading = document.querySelector("h1").getBoundingClientRect();
        return { width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, lines: [...document.querySelectorAll("[data-hero-line]")].map(e => ({ width: e.getBoundingClientRect().width, content: e.scrollWidth, height: e.getBoundingClientRect().height })), heroTop: hero.top, headingTop: heading.top, headerBottom: document.querySelector("header").getBoundingClientRect().bottom };
      });
      assert.equal(metrics.overflow, false, `${locale} ${width} horizontal overflow`);
      assert.ok(metrics.lines.every(line => line.content <= line.width + 1), `${locale} ${width} clipped word`);
      assert.ok(metrics.headingTop >= metrics.headerBottom, "header overlap");
      console.log(`PASS ${locale} ${width}: heading, overflow, header`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator(".site-header").getByRole("link", { name: "English", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.waitForTimeout(1000);
  const mode = await page.locator(".network-object").getAttribute("data-network-mode");
  assert.equal(mode, "webgl", "desktop enhancement must initialize in QA browser");
  const { data, info } = await sharp(await page.locator(".network-stage").screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let accentPixels = 0;
  for (let i = 0; i < data.length; i += info.channels) if (data[i + 1] > 80 && data[i + 1] > data[i] * 2 && data[i + 2] > data[i] * 1.3) accentPixels++;
  assert.ok(accentPixels > 5, "live canvas must actually draw the network, not only report readiness");
  console.log("PASS live network pixels", accentPixels);
  await mkdir("test-results/hero", { recursive: true });
  await page.screenshot({ path: "test-results/hero/desktop-1440.png" });
  const origin = await page.evaluate(() => performance.timeOrigin);
  const contexts = await page.evaluate(() => window.__contexts);
  await page.locator(".site-header").getByRole("link", { name: "Tiếng Việt", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === "vi");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.equal(await page.evaluate(() => window.__contexts), contexts, "locale must preserve canvas");
  await page.getByRole("button", { name: "DỪNG CHUYỂN ĐỘNG", exact: true }).click();
  await page.waitForTimeout(500);
  const paused = await page.evaluate(() => window.__draws);
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(() => window.__draws), paused, "paused GPU work");
  await page.getByRole("button", { name: "TIẾP TỤC CHUYỂN ĐỘNG", exact: true }).click();
  await page.mouse.move(200, 350);
  await page.waitForTimeout(1500);
  const resting = await page.evaluate(() => window.__draws);
  await page.waitForTimeout(1200);
  assert.ok(await page.evaluate(() => window.__draws) - resting > 2, "R4 slow auto-rotation renders while visible and unpaused");
  console.log("PASS canvas locale persistence, pause and idle draws", { contexts, paused, resting });

  // Exercise the visibility-event branch deterministically in headless Chromium.
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.waitForTimeout(250);
  const hiddenDraws = await page.evaluate(() => window.__draws);
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => window.__draws), hiddenDraws);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  console.log("PASS hidden-document render suspension");

  // Offscreen fixture exists only in this test DOM, not in portfolio content.
  await page.evaluate(() => { const el = document.createElement("div"); el.id = "qa-spacer"; el.style.height = "200vh"; document.querySelector("main").append(el); });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const offscreen = await page.evaluate(() => window.__draws);
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => window.__draws), offscreen);
  await page.evaluate(() => { document.getElementById("qa-spacer").remove(); window.scrollTo(0, 0); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { const canvas = document.querySelector(".network-live canvas"); canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext(); });
  await page.waitForFunction(() => document.querySelector(".network-object").dataset.networkMode === "static");
  assert.ok(await page.getByRole("heading", { name: "UNDERSTAND SYSTEMS. DEFEND THEM.", exact: true }).isVisible());
  console.log("PASS offscreen idle and context-loss fallback");

  const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });
  const staticPage = await reduced.newPage();
  await staticPage.goto(base);
  await staticPage.waitForTimeout(1000);
  assert.equal(await staticPage.locator(".network-live canvas").count(), 0);
  assert.ok(await staticPage.locator(".network-static-desktop").isVisible());
  await mkdir("test-results/hero", { recursive: true });
  await staticPage.screenshot({ path: "test-results/hero/desktop-static-1440.png" });
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } });
  const mobile = await touch.newPage();
  await mobile.goto(base);
  await mobile.waitForTimeout(2400);
  assert.equal(await mobile.locator(".network-live canvas").count(), 1);
  assert.equal(await mobile.locator(".network-object").getAttribute("data-network-topology"), "mobile");
  assert.equal(await mobile.locator("[data-sphere-skills] li").count(), 13);
  await mobile.screenshot({ path: "test-results/hero/mobile-430.png" });
  console.log("PASS reduced motion and touch; screenshots saved");
  // This later accumulator includes scripted viewport changes and DOM fixtures;
  // it is a lifecycle diagnostic, not the fresh-load CLS above.
  console.log("Cumulative test layout shifts", await page.evaluate(() => window.__shifts));
  // THREE logs informational context-loss messages, but no warning/error is expected.
  assert.deepEqual(errors, []);
  await reduced.close(); await touch.close();
} finally { await browser.close(); }

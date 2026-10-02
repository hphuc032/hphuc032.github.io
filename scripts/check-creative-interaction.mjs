import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3016";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [], layouts = [], pointer = {};
const watch = page => {
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
};
const instrument = async context => context.addInitScript(() => {
  window.__commits = 0; window.__cls = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => window.__commits++, onCommitFiberUnmount: () => {} };
  new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
});
const paint = (page, selector, count = 45, amplitude = 110) => page.evaluate(async ({ selector, count, amplitude }) => {
  const el = document.querySelector(selector), bounds = el.getBoundingClientRect();
  const intervals = []; let last = performance.now();
  for (let i = 0; i < count; i++) {
    await new Promise(requestAnimationFrame); const now = performance.now(); intervals.push(now - last); last = now;
    el.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse", buttons: 0,
      clientX: bounds.left + bounds.width * .5 + Math.sin(i * .27) * amplitude,
      clientY: bounds.top + Math.min(bounds.height * .55, 520) + Math.cos(i * .27) * amplitude * .3 }));
  }
  return intervals.slice(1);
}, { selector, count, amplitude });
const calm = async page => {
  await page.waitForTimeout(1850);
  assert.equal(await page.locator(".liquid-light").evaluateAll(els => els.some(el => parseFloat(getComputedStyle(el).opacity) > .001)), false);
  assert.equal(await page.locator(".hero-statement,.operation-preview svg").evaluateAll(els => els.some(el => el.style.transform)), false);
};
const wakeInk = page => page.locator("#hero .liquid-light").evaluate(canvas => {
  if (canvas.width === 1) return 0;
  const scratch = new OffscreenCanvas(canvas.width, canvas.height);
  const context = scratch.getContext("2d", { willReadFrequently: true });
  context.drawImage(canvas, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let ink = 0;
  for (let i = 3; i < pixels.length; i += 16) ink += pixels[i];
  return ink;
});
try {
  await mkdir("test-results/creative-interaction", { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await instrument(context);
  const page = await context.newPage(); watch(page);
  await page.goto(base); await page.waitForTimeout(2800);
  assert.equal(await page.locator("[data-liquid]").count(), 3);
  assert.equal(await page.locator("#identity [data-liquid],#contact [data-liquid]").count(), 0);
  const pause = page.locator(".network-pause");
  if (await pause.count()) await pause.click();
  await page.waitForTimeout(350);
  const cdp = await context.newCDPSession(page); await cdp.send("Performance.enable");
  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
  const activation = await metrics();
  // Separate the cursor's once-on-entry size change from the ongoing pointer loop.
  await paint(page, "#hero", 10);
  const before = await metrics(), commits = await page.evaluate(() => window.__commits);
  pointer.activationLayouts = before.LayoutCount - activation.LayoutCount;
  const nodes = await page.locator("body *").count();
  const intervals = await paint(page, "#hero", 120);
  const after = await metrics();
  pointer.frameP95Ms = intervals.toSorted((a, b) => a - b)[Math.floor(intervals.length * .95)];
  pointer.framesOver25ms = intervals.filter(value => value > 25).length;
  pointer.frames = intervals.length;
  pointer.layoutCount = after.LayoutCount - before.LayoutCount;
  pointer.reactCommits = await page.evaluate(() => window.__commits) - commits;
  pointer.taskMs = (after.TaskDuration - before.TaskDuration) * 1000;
  assert.equal(await page.locator("body *").count(), nodes, "pointer movement cannot grow the DOM");
  assert.equal(pointer.reactCommits, 0, "pointer movement must not commit React renders");
  assert.equal(pointer.layoutCount, 0, "pointer loop must not lay out the document");
  const fast = await wakeInk(page);
  assert.ok(fast > 100, "visible path disturbance");
  assert.ok(await page.locator(".hero-statement").first().evaluate(el => Boolean(el.style.transform)));
  await page.screenshot({ path: "test-results/creative-interaction/hero-desktop-1440.png" });
  await calm(page);
  await paint(page, "#hero", 70, 12);
  const slow = await wakeInk(page);
  assert.ok(slow > 0, "slow movement beyond the jitter threshold still disturbs water");
  assert.ok(slow < fast, "velocity increases disturbance");
  await page.evaluate(() => document.dispatchEvent(new PointerEvent("pointerleave")));
  await page.waitForTimeout(80);
  const fading = await wakeInk(page);
  assert.ok(fading > 0, "leave preserves the dissipating wake rather than snapping off");
  await calm(page);
  const idleBefore = await metrics(); await page.waitForTimeout(1000); const idleAfter = await metrics();
  pointer.idleMsPerSecond = (idleAfter.TaskDuration - idleBefore.TaskDuration) * 1000;
  console.log("PASS pointer velocity, settling, mouse leave, no React commits/layouts", pointer);

  await paint(page, "#hero", 20);
  await page.evaluate(() => {
    const selection = getSelection(), range = document.createRange(); range.selectNodeContents(document.querySelector("h1")); selection.removeAllRanges(); selection.addRange(range);
  });
  await paint(page, "#hero", 12); await calm(page);
  await page.evaluate(() => getSelection().removeAllRanges());
  await page.locator("#terminal").scrollIntoViewIfNeeded();
  await paint(page, "#terminal", 25);
  await page.locator("#terminal input").hover();
  await calm(page);
  assert.equal(await page.locator(".context-cursor").getAttribute("data-visible"), "false");
  await page.locator("#terminal input").fill("help"); await page.keyboard.press("Enter");
  assert.ok(await page.locator("#terminal input").evaluate(el => el === document.activeElement));
  console.log("PASS selection/native input deferral and immediate Terminal interaction");

  await page.goto(base + "/#operations");
  await page.locator("#operations").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  const operation = page.locator(".operation-link").first(); await operation.hover();
  await paint(page, ".operation-row", 35, 200);
  assert.ok(await page.locator(".operation-preview svg").first().evaluate(el => el.style.transform.includes("perspective")));
  await page.screenshot({ path: "test-results/creative-interaction/operations-desktop-1440.png" });
  await calm(page); await operation.focus(); await page.waitForTimeout(400);
  assert.equal(await page.locator(".operation-preview").first().evaluate(el => getComputedStyle(el).opacity), "1");
  await page.keyboard.press("Enter"); await page.locator(".case-study").waitFor();
  assert.equal(await page.locator(".liquid-surface,[data-reveal],canvas:not(.global-atmosphere)").count(), 0);
  assert.equal(await page.locator(".global-atmosphere").count(), 1);
  await page.goto(base + "/#operations"); await page.locator("#operations").waitFor();
  await page.locator(".site-header a[lang=vi]").click(); await page.waitForFunction(() => document.documentElement.lang === "vi");
  assert.equal(new URL(page.url()).hash, "#operations");
  await paint(page, ".operation-row", 20);
  await page.emulateMedia({ reducedMotion: "reduce" }); await calm(page);
  assert.equal(await page.locator('[data-arrival-state="running"],[data-arrival-state="armed"]').count(), 0);
  assert.equal(await page.locator("[data-reveal], [data-arrival] span").evaluateAll(els => els.some(el => el.style.clipPath || el.style.transform)), false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.locator("#operations").scrollIntoViewIfNeeded(); await paint(page, ".operation-row", 20);
  await page.setViewportSize({ width: 1440, height: 1000 }); await calm(page);
  console.log("PASS preview depth/keyboard parity, route/locale cleanup, live reduced motion and resize");
  await context.close();

  for (const locale of ["en", "vi"]) for (const width of [375, 430, 768, 1024, 1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width < 1024, isMobile: width < 1024 });
    await instrument(ctx); const p = await ctx.newPage(); watch(p);
    await p.goto(base + (locale === "vi" ? "/vi" : "/")); await p.waitForTimeout(1500);
    const targets = await p.locator("[data-reveal]").evaluateAll(els => els.map(el => el.dataset.revealKey));
    for (const key of targets) {
      const target = p.locator(`[data-reveal-key="${key}"]`);
      await target.evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight - 80));
      await p.waitForTimeout(100);
      await p.evaluate(() => scrollBy(0, 300));
      await p.waitForFunction(key => getComputedStyle(document.querySelector(`[data-reveal-key="${key}"]`)).clipPath === "none", key, { timeout: 2200 });
      assert.equal(await target.evaluate(el => getComputedStyle(el).clipPath), "none", `${locale}/${width}/${key}: settled mask`);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await p.locator('[data-arrival="conclusion"]').evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight - 80));
    await p.waitForTimeout(80); await p.evaluate(() => scrollBy(0, 500)); await p.waitForTimeout(850);
    assert.equal(await p.locator('[data-arrival="conclusion"] span').evaluateAll(els => els.some(el => el.style.transform || el.style.clipPath)), false);
    if (width === 430) await p.screenshot({ path: `test-results/creative-interaction/contact-${locale}-430.png` });
    if (width < 1024) { await paint(p, "#terminal", 4); assert.equal(await p.locator(".liquid-light").evaluateAll(els => els.some(el => el.style.opacity)), false, "touch cannot start pointer effect"); }
    const cls = await p.evaluate(() => window.__cls); assert.ok(cls < .01, `CLS ${cls}`);
    layouts.push({ locale, width, cls, titles: targets.length });
    console.log(`PASS ${locale}/${width}: title masks, diacritics/wrap, Contact depth, touch gates, CLS ${cls}`);
    await ctx.close();
  }
  await writeFile("test-results/creative-interaction/measurements.json", JSON.stringify({ layouts, pointer }, null, 2));
  // Synthetic visibility is isolated from real browser-history tests.
  const hidden = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const p = await hidden.newPage(); watch(p); await p.goto(base); await p.waitForTimeout(1800); await paint(p, "#hero", 20);
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  assert.equal(await p.locator(".liquid-light").first().evaluate(el => Boolean(el.style.transform || el.style.opacity)), false);
  await p.waitForTimeout(500); await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  await paint(p, "#hero", 20); assert.ok(Number(await p.locator("#hero .liquid-light").evaluate(el => el.style.opacity)) > 0);
  await hidden.close();
  assert.deepEqual(errors, []);
  await writeFile("test-results/creative-interaction/validation.json", JSON.stringify({ layouts, pointer, errors }, null, 2));
  console.log("PASS hidden-tab stop/return, console and hydration");
} finally { await browser.close(); }

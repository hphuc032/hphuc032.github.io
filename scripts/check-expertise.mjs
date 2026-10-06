import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
await context.addInitScript(() => {
  sessionStorage.setItem("carwyn:initialized", "1");
  window.__shifts = 0;
  new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shifts += e.value; }).observe({ type: "layout-shift", buffered: true });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
const results = [];
try {
  await mkdir("test-results/expertise", { recursive: true });
  for (const locale of ["en", "vi"]) {
    await page.goto(base + (locale === "vi" ? "/vi" : "/") + "#expertise");
    await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("02"));
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator("#expertise").scrollIntoViewIfNeeded();
      assert.equal(await page.locator(".expertise-row").count(), 4);
      const metrics = await page.locator("#expertise").evaluate(section => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...section.querySelectorAll("h2,h3,p,li")].some(el => el.scrollWidth > el.clientWidth + 1),
        hidden: [...section.querySelectorAll("h3,.expertise-description,.expertise-evidence ul")].some(el => getComputedStyle(el).display === "none" || getComputedStyle(el).visibility === "hidden" || getComputedStyle(el).opacity === "0"),
        height: Math.round(section.getBoundingClientRect().height),
      }));
      assert.equal(metrics.overflow, false, `${locale}/${width}: horizontal overflow`);
      assert.equal(metrics.clipped, false, `${locale}/${width}: clipped text`);
      assert.equal(metrics.hidden, false, `${locale}/${width}: hidden information`);
      results.push({ locale, width, ...metrics });
      if (locale === "vi" && [430, 1440].includes(width)) {
        await page.locator("#expertise").screenshot({ path: `test-results/expertise/vi-${width}.png`, style: ".site-header, .system-status, .initialization, .context-cursor, .skip-link { visibility: hidden !important; }" });
      }
    }
    assert.equal(await page.locator('#expertise button, #expertise a, #expertise [data-cursor], #expertise canvas, #expertise img').count(), 0);
    console.log(`PASS ${locale}: six widths, four semantic rows, visible scope/tools, no overflow or fake controls`);
  }
  await page.goto(base + "/#expertise");
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator("#expertise").focus();
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("02"));
  assert.ok(await page.locator("#expertise").evaluate(el => el.matches(":focus-visible") && getComputedStyle(el).outlineStyle !== "none"));
  await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
  await page.waitForURL("**/vi#expertise");
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("02"));
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.equal(await page.locator(".expertise-row h3").first().textContent(), "An toàn mạng");
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await page.waitForURL("**/#expertise");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  await page.reload();
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("02"));
  assert.equal(await page.locator('.initialization[data-play]').count(), 0);
  console.log("PASS keyboard focus-visible destination, active 02 status, EN/VI hash SPA, refresh");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator(".expertise-row").first().evaluate(el => getComputedStyle(el).animationName), "none");
  assert.equal(await page.locator(".expertise-description").count(), 4);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator("#expertise").scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1000);
  const captureStyle = ".site-header, .system-status, .initialization, .context-cursor, .skip-link { visibility: hidden !important; }";
  await mkdir("test-results/expertise", { recursive: true });
  await page.locator("#expertise").screenshot({ path: "test-results/expertise/desktop-1440.png", style: captureStyle });
  await page.evaluate(() => scrollTo(0, document.getElementById("expertise").offsetTop - 480));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/expertise/identity-to-expertise-1440.png" });
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } });
  const mobile = await touch.newPage();
  mobile.on("pageerror", e => errors.push(e.message));
  await mobile.goto(base + "#expertise");
  await mobile.waitForTimeout(1500);
  await mobile.locator("#expertise").screenshot({ path: "test-results/expertise/mobile-430.png", style: captureStyle });
  assert.equal(await mobile.locator(".expertise-description").count(), 4);
  await touch.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(base + "/vi#expertise");
  assert.equal(await staticPage.locator(".expertise-row").count(), 4);
  assert.ok(await staticPage.locator("#expertise").getByText("Wireshark", { exact: true }).isVisible());
  await staticContext.close();
  await writeFile("test-results/expertise/validation.json", JSON.stringify({ results, observedLayoutShift: await page.evaluate(() => window.__shifts), errors }, null, 2));
  assert.deepEqual(errors, [], "console and hydration");
  console.log("PASS reduced motion, touch, no-JS bilingual content, console/hydration; review captures saved");
} finally { await browser.close(); }

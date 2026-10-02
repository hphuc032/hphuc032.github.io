import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  sessionStorage.setItem("carwyn:initialized", "1"); window.__experienceCls = 0;
  new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__experienceCls += entry.value; }).observe({ type: "layout-shift", buffered: true });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (["error", "warning"].includes(message.type())) errors.push(message.text()); });
const results = [];
const captureStyle = ".site-header,.system-status,.initialization,.context-cursor,.skip-link{visibility:hidden!important}";
try {
  await mkdir("test-results/experience", { recursive: true });
  for (const locale of ["en", "vi"]) {
    await page.goto(base + (locale === "vi" ? "/vi" : "/") + "#experience");
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator("#experience").scrollIntoViewIfNeeded();
      assert.equal(await page.locator(".experience-record").count(), 2);
      const metrics = await page.locator("#experience").evaluate(section => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...section.querySelectorAll("h2,h3,p,li")].some(element => element.scrollWidth > element.clientWidth + 1),
        hidden: [...section.querySelectorAll("h3,.experience-description,.experience-detail li")].some(element => getComputedStyle(element).display === "none" || getComputedStyle(element).visibility === "hidden" || getComputedStyle(element).opacity === "0"),
        height: Math.round(section.getBoundingClientRect().height),
      }));
      assert.equal(metrics.overflow, false, `${locale}/${width}: overflow`);
      assert.equal(metrics.clipped, false, `${locale}/${width}: clipped text`);
      assert.equal(metrics.hidden, false, `${locale}/${width}: hidden information`);
      assert.equal(await page.locator(".experience-record").nth(0).locator(".experience-detail li").count(), 4);
      assert.equal(await page.locator(".experience-record").nth(1).locator("time").count(), 0, "Memory Flower date must remain unpublished");
      results.push({ locale, width, ...metrics });
      if (locale === "vi" && [430, 1440].includes(width)) await page.locator("#experience").screenshot({ path: `test-results/experience/vi-${width}.png`, style: captureStyle });
    }
    const recordText = await page.locator("#experience").textContent();
    assert.ok(recordText.includes("Memory Flower"));
    assert.ok(!/Floral (Assistant|Designer)|Florist/.test(recordText));
    assert.equal(await page.locator('#experience a,#experience button,#experience [data-cursor],#experience canvas,#experience img').count(), 0);
    console.log(`PASS ${locale}: two records, six widths, complete visible content, withheld Memory Flower fields`);
  }
  await page.goto(base + "/#experience");
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator("#experience").focus();
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("04"));
  assert.ok(await page.locator("#experience").evaluate(element => element.matches(":focus-visible") && getComputedStyle(element).outlineStyle !== "none"));
  await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
  await page.waitForURL("**/vi#experience");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.ok((await page.locator(".experience-record").first().textContent()).includes("Tháng 8 2026"));
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await page.waitForURL("**/#experience");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  console.log("PASS keyboard focus, active 04 status, equivalent EN/VI hash navigation");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator(".experience-record").first().evaluate(element => getComputedStyle(element).animationName), "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator("#experience").scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
  await page.locator("#experience").screenshot({ path: "test-results/experience/desktop-1440.png", style: captureStyle });
  await page.evaluate(() => scrollTo(0, document.getElementById("experience").offsetTop - 510));
  await page.screenshot({ path: "test-results/experience/operations-to-experience.png" });
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } });
  const mobile = await touch.newPage();
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(base + "#experience");
  await mobile.waitForTimeout(1400);
  await mobile.locator("#experience").screenshot({ path: "test-results/experience/mobile-430.png", style: captureStyle });
  await touch.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(base + "/vi#experience");
  assert.equal(await staticPage.locator(".experience-record").count(), 2);
  assert.equal(await staticPage.locator(".experience-detail li").count(), 4);
  await staticContext.close();
  const layoutShift = await page.evaluate(() => window.__experienceCls);
  await writeFile("test-results/experience/validation.json", JSON.stringify({ results, layoutShift, errors }, null, 2));
  assert.deepEqual(errors, []);
  console.log(`PASS reduced motion, touch, no-JS content, console/hydration; layout shift ${layoutShift}`);
} finally { await browser.close(); }

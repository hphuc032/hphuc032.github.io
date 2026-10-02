import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { operationSlugs, responsiveWidths } from "./test-fixtures.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => { sessionStorage.setItem("carwyn:initialized", "1"); window.__cls = 0; new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
const page = await context.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
const slugs = operationSlugs;
const chrome = ".site-header,.system-status,.initialization,.context-cursor,.skip-link{visibility:hidden!important}";
try {
  await mkdir("test-results/operations", { recursive: true });
  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    await page.goto(base + prefix + "/#operations");
    for (const width of responsiveWidths) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.locator(".operation-link").count(), 3);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${locale}/${width} homepage overflow`);
      assert.equal(await page.locator(".operation-copy h3").evaluateAll(els => els.some(el => el.scrollWidth > el.clientWidth + 1)), false);
      if (width >= 768) assert.ok(await page.locator(".operation-row").evaluateAll(rows => rows.every(row => {
        // Measure glyph lines, excluding the reveal wrapper's full-width block box.
        const range = document.createRange(); range.selectNodeContents(row.querySelector(".record-reveal") ?? row.querySelector("h3"));
        return Math.max(...[...range.getClientRects()].map(rect => rect.right)) + 8 < row.querySelector(".operation-preview").getBoundingClientRect().left;
      })), `${locale}/${width}: preview must not cover title`);
    }
    for (const slug of slugs) {
      await page.goto(base + prefix + "/operations/" + slug);
      assert.equal(await page.locator(".case-study h1").count(), 1);
      assert.equal(await page.locator("canvas,.network-object").count(), 0, "no homepage WebGL on detail routes");
      for (const width of [375, 430, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${locale}/${slug}/${width} overflow`);
        assert.equal(await page.locator(".case-study h1").evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
      }
      assert.equal(await page.locator(".case-study h2").evaluateAll(els => els.some(el => !el.textContent.trim())), false);
      assert.ok((await page.title()).endsWith("— carwyn.sec"));
    }
    console.log(`PASS ${locale}: index and three cases at six widths, headings, metadata, no WebGL`);
  }
  await page.goto(base + "/#operations");
  await page.locator("#operations").focus();
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("03"));
  await page.locator(".operation-link").first().focus();
  await page.waitForTimeout(400);
  assert.equal(await page.locator(".operation-preview").first().evaluate(el => getComputedStyle(el).opacity), "1");
  assert.ok(await page.locator(".operation-link").first().evaluate(el => el.matches(":focus-visible")));
  await page.locator(".operation-link").first().press("Enter");
  await page.waitForURL("**/operations/secure-api-gateway");
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
  await page.waitForURL("**/vi/operations/secure-api-gateway");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.ok((await page.locator(".case-summary").textContent()).startsWith("Dự án"));
  await page.goto(base + "/vi#operations");
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("03"));
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await page.waitForURL("**/#operations");
  console.log("PASS keyboard preview/links, active section and EN/VI equivalent routes/hash");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator(".operation-preview").first().evaluate(el => getComputedStyle(el).clipPath), "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator(".operation-link").first().focus();
  await page.waitForTimeout(500);
  await page.locator("#operations").screenshot({ path: "test-results/operations/desktop-1440.png", style: chrome, animations: "disabled" });
  await page.evaluate(() => scrollTo(0, document.getElementById("operations").offsetTop - 430));
  await page.mouse.move(0, 0);
  await page.screenshot({ path: "test-results/operations/expertise-to-operations.png" });
  await page.goto(base + "/operations/secure-api-gateway");
  await page.locator(".case-study").screenshot({ path: "test-results/operations/gateway-desktop-1440.png", style: chrome });
  const resources = await page.evaluate(() => performance.getEntriesByType("resource").filter(e => e.name.includes(".js")).map(e => ({ url: e.name, bytes: e.encodedBodySize })));
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } });
  const mobile = await touch.newPage();
  await mobile.goto(base + "/#operations");
  await mobile.waitForTimeout(1500);
  await mobile.locator("#operations").screenshot({ path: "test-results/operations/mobile-430.png", style: chrome });
  await mobile.locator(".operation-link").first().tap();
  await mobile.waitForURL("**/operations/secure-api-gateway");
  await mobile.locator(".case-study").screenshot({ path: "test-results/operations/gateway-mobile-430.png", style: chrome });
  await touch.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(base + "/vi/operations/secure-api-gateway");
  assert.equal(await staticPage.locator(".case-technologies li").count(), 9);
  await staticContext.close();
  assert.deepEqual(errors, []);
  await writeFile("test-results/operations/runtime.json", JSON.stringify({ errors, layoutShift: await page.evaluate(() => window.__cls), caseJavaScript: resources }, null, 2));
  console.log("PASS reduced motion, touch navigation, no-JS case content, console/hydration; screenshots saved");
} finally { await browser.close(); }

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  sessionStorage.setItem("carwyn:initialized", "1"); window.__achievementCls = 0;
  new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__achievementCls += entry.value; }).observe({ type: "layout-shift", buffered: true });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (["error", "warning"].includes(message.type())) errors.push(message.text()); });
const results = [];
const captureStyle = ".site-header,.system-status,.initialization,.context-cursor,.skip-link{visibility:hidden!important}";
try {
  await mkdir("test-results/achievements", { recursive: true });
  for (const locale of ["en", "vi"]) {
    await page.goto(base + (locale === "vi" ? "/vi" : "/") + "#achievements");
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator("#achievements").scrollIntoViewIfNeeded();
      assert.equal(await page.locator(".achievement-record").count(), 4);
      assert.equal(await page.locator(".achievement-group").count(), 4);
      const metrics = await page.locator("#achievements").evaluate(section => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...section.querySelectorAll("h2,h3,h4,p,span,strong,a")].some(element => !element.classList.contains("sr-only") && element.scrollWidth > element.clientWidth + 1),
        hidden: [...section.querySelectorAll("h4,.achievement-descriptor,.achievement-status strong")].some(element => getComputedStyle(element).display === "none" || getComputedStyle(element).visibility === "hidden" || getComputedStyle(element).opacity === "0"),
        height: Math.round(section.getBoundingClientRect().height),
      }));
      assert.equal(metrics.overflow, false, `${locale}/${width}: overflow`);
      assert.equal(metrics.clipped, false, `${locale}/${width}: clipped text`);
      assert.equal(metrics.hidden, false, `${locale}/${width}: hidden content`);
      results.push({ locale, width, ...metrics });
      if (locale === "vi" && [430, 1440].includes(width)) await page.locator("#achievements").screenshot({ path: `test-results/achievements/vi-${width}.png`, style: captureStyle });
    }
    const text = await page.locator("#achievements").textContent();
    assert.ok(text.includes("AWS Student Builder Group HCMUTE"));
    assert.ok(text.includes("CEH"));
    assert.ok(text.includes("Top 4") && text.includes("HCMUTE CTF 2025"));
    assert.ok(text.includes(locale === "vi" ? "THAM DỰ VÒNG SƠ KHẢO" : "QUALIFYING ROUND PARTICIPANT"));
    assert.ok(text.includes(locale === "vi" ? "Hiệp hội An ninh quốc gia (NCA)" : "National Cybersecurity Association (NCA)"));
    assert.ok(!/finalist|winner|champion|qualified for final|vào chung kết|quán quân/i.test(text));
    assert.deepEqual(await page.locator(".achievement-index").allTextContents(), ["001", "002", "003", "004"]);
    assert.equal(await page.locator('#achievements a[href="https://cscv.vn"]').count(), 1);
    assert.equal(await page.locator('#achievements button,#achievements [data-cursor],#achievements canvas,#achievements img').count(), 0);
    console.log(`PASS ${locale}: four verified records across four non-empty categories`);
  }
  await page.goto(base + "/#achievements");
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator("#achievements").focus();
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("05"));
  assert.ok(await page.locator("#achievements").evaluate(element => element.matches(":focus-visible") && getComputedStyle(element).outlineStyle !== "none"));
  await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
  await page.waitForURL("**/vi#achievements");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.ok((await page.locator("#achievements").textContent()).includes("Đang học"));
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await page.waitForURL("**/#achievements");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  console.log("PASS keyboard focus, active 05, equivalent EN/VI hash navigation");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator(".achievement-record").first().evaluate(element => getComputedStyle(element).animationName), "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator("#achievements").scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await page.locator("#achievements").screenshot({ path: "test-results/achievements/desktop-1440.png", style: captureStyle });
  await page.evaluate(() => scrollTo(0, document.getElementById("achievements").offsetTop - 510));
  await page.screenshot({ path: "test-results/achievements/experience-to-achievements.png" });
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } });
  const mobile = await touch.newPage();
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(base + "#achievements");
  await mobile.waitForTimeout(1000);
  await mobile.locator("#achievements").screenshot({ path: "test-results/achievements/mobile-430.png", style: captureStyle });
  await touch.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(base + "/vi#achievements");
  assert.equal(await staticPage.locator(".achievement-record").count(), 4);
  const staticText = await staticPage.locator("#achievements").textContent();
  assert.ok(staticText.includes("Đang học") && staticText.includes("Tham dự vòng sơ khảo") && staticText.includes("Top 4"));
  await staticContext.close();
  const layoutShift = await page.evaluate(() => window.__achievementCls);
  await writeFile("test-results/achievements/validation.json", JSON.stringify({ results, layoutShift, errors }, null, 2));
  assert.deepEqual(errors, []);
  console.log(`PASS reduced motion, touch, no-JS content, console/hydration; layout shift ${layoutShift}`);
} finally { await browser.close(); }

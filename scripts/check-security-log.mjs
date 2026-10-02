import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { responsiveWidths, securityLogSlug } from "./test-fixtures.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const slug = securityLogSlug;
const widths = responsiveWidths;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  sessionStorage.setItem("carwyn:initialized", "1"); window.__logCls = 0;
  new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__logCls += entry.value; }).observe({ type: "layout-shift", buffered: true });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  if (["error", "warning"].includes(message.type())) errors.push(`${message.location().url || "document"}: ${message.text()}`);
});
const results = [];
const captureStyle = ".site-header,.system-status,.initialization,.context-cursor,.skip-link{visibility:hidden!important}";

function pathFor(locale, suffix = "") { return `${locale === "vi" ? "/vi" : ""}${suffix}`; }
async function layoutMetrics(locator) {
  return locator.evaluate(root => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    // Screen-reader-only heading/link context intentionally uses a 1px box.
    clipped: [...root.querySelectorAll("h1,h2,h3,p,span,strong,dd,dt")].filter(element => !element.closest(".sr-only")).some(element => element.scrollWidth > element.clientWidth + 1),
    hidden: [...root.querySelectorAll("h1,h2,h3,.log-entry-copy,.log-entry-action")].some(element => getComputedStyle(element).display === "none" || getComputedStyle(element).visibility === "hidden" || getComputedStyle(element).opacity === "0"),
    height: Math.round(root.getBoundingClientRect().height),
  }));
}

async function measureRoute(path) {
  const measurementContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await measurementContext.addInitScript(() => sessionStorage.setItem("carwyn:initialized", "1"));
  const measurementPage = await measurementContext.newPage();
  await measurementPage.goto(base + path, { waitUntil: "networkidle" });
  const measurement = await measurementPage.evaluate(() => {
    const resources = performance.getEntriesByType("resource");
    const bytes = type => resources.filter(entry => entry.initiatorType === type).reduce((sum, entry) => sum + entry.encodedBodySize, 0);
    return {
      resourceCount: resources.length,
      scriptBytes: bytes("script"),
      styleBytes: bytes("css") || bytes("link"),
      imageBytes: bytes("img"),
      canvasCount: document.querySelectorAll("canvas").length,
    };
  });
  await measurementContext.close();
  return measurement;
}

try {
  await mkdir("test-results/security-log", { recursive: true });
  for (const locale of ["en", "vi"]) {
    const homePath = pathFor(locale, "/") + "#latest-writing";
    const indexPath = pathFor(locale, "/log");
    const articlePath = pathFor(locale, `/log/${slug}`);
    for (const [kind, path, selector] of [["home", homePath, "#latest-writing"], ["index", indexPath, ".log-index"], ["article", articlePath, ".log-article"]]) {
      await page.goto(base + path);
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        const root = page.locator(selector);
        await root.scrollIntoViewIfNeeded();
        const metrics = await layoutMetrics(root);
        assert.equal(metrics.overflow, false, `${locale}/${kind}/${width}: overflow`);
        assert.equal(metrics.clipped, false, `${locale}/${kind}/${width}: clipped text`);
        assert.equal(metrics.hidden, false, `${locale}/${kind}/${width}: hidden content`);
        results.push({ locale, kind, width, ...metrics });
      }
      assert.equal(await page.locator(`${selector} ${kind === "home" ? ".home-note" : ".log-entry"}`).count(), kind === "article" ? 0 : 1);
    }
    await page.goto(base + articlePath);
    assert.equal(await page.locator(".log-prose h2").count(), 5);
    assert.equal(await page.locator(".log-callout").count(), 2);
    assert.equal(await page.locator(".log-prose table caption").count(), 1);
    assert.equal(await page.locator(".log-prose pre").count(), 1);
    assert.equal(await page.locator(".log-article img,.log-article canvas,.log-article .network-object").count(), 0);
    const articleText = await page.locator(".log-prose").textContent();
    assert.ok(articleText.includes("TLS Application Data"));
    assert.ok(!/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(articleText), "no invented IP addresses");
    assert.ok(!articleText.includes("tcp.stream =="), "no invented stream number");
    const filters = await page.locator(".log-prose pre").textContent();
    assert.deepEqual(filters.trim().split(/\s+/), ["dns", "tcp", "http", "tls"]);
    console.log(`PASS ${locale}: homepage, index and one evidence-bounded MDX article at six widths`);
  }

  await page.goto(base + "/#latest-writing");
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator("#latest-writing").focus();
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("04"));
  assert.ok(await page.locator("#latest-writing").evaluate(element => element.matches(":focus-visible") && getComputedStyle(element).outlineStyle !== "none"));
  await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
  await page.waitForURL("**/vi#latest-writing");
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  await page.locator(".home-note h3 a").click();
  await page.waitForURL(`**/vi/log/${slug}`);
  await page.waitForFunction(() => document.querySelector(".status-section").textContent.includes("03"));
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await page.waitForURL(`**/log/${slug}`);
  await page.getByRole("heading", { level: 1, name: "Analyzing HTTP and HTTPS Traffic with Wireshark", exact: true }).waitFor();
  assert.equal(await page.locator("h1").textContent(), "Analyzing HTTP and HTTPS Traffic with Wireshark");
  await page.getByRole("link", { name: "← Security Log", exact: true }).click();
  await page.waitForURL("**/log");
  assert.equal(await page.locator(".log-index .log-entry").count(), 1);
  console.log("PASS keyboard navigation, active Writeups route, article/back routes and equivalent EN/VI switching");

  const missing = await page.request.get(base + "/log/not-published", { maxRedirects: 0 });
  assert.equal(missing.status(), 404);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/log");
  assert.ok(await page.locator(".log-entry-action").evaluate(element => parseFloat(getComputedStyle(element).transitionDuration) <= .001));
  assert.equal(await page.locator(".log-index .log-entry").count(), 1);
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await page.goto(base + "/#latest-writing");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator("#latest-writing").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator("#latest-writing").screenshot({ path: "test-results/security-log/home-desktop-1440.png", style: captureStyle });
  await page.evaluate(() => scrollTo(0, document.getElementById("latest-writing").offsetTop - 510));
  await page.screenshot({ path: "test-results/security-log/projects-to-writing.png" });
  await page.goto(base + "/log");
  await page.locator(".log-index").screenshot({ path: "test-results/security-log/index-desktop-1440.png", style: captureStyle });
  await page.goto(base + `/log/${slug}`);
  await page.locator(".log-article").screenshot({ path: "test-results/security-log/article-desktop-1440.png", style: captureStyle });

  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } });
  const mobile = await touch.newPage();
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(base + "/#latest-writing");
  await mobile.waitForTimeout(800);
  await mobile.locator("#latest-writing").screenshot({ path: "test-results/security-log/home-mobile-430.png", style: captureStyle });
  await mobile.goto(base + `/log/${slug}`);
  await mobile.locator(".log-article").screenshot({ path: "test-results/security-log/article-mobile-430.png", style: captureStyle });
  await touch.close();

  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(base + `/vi/log/${slug}`);
  assert.equal(await staticPage.locator(".log-prose h2").count(), 5);
  assert.ok((await staticPage.locator(".log-prose").textContent()).includes("TLS Application Data"));
  await staticContext.close();

  const layoutShift = await page.evaluate(() => window.__logCls);
  const performance = {
    homepage: await measureRoute("/"),
    article: await measureRoute(`/log/${slug}`),
  };
  assert.equal(performance.article.canvasCount, 1, "article has only the shared decorative atmosphere canvas");
  await writeFile("test-results/security-log/validation.json", JSON.stringify({ results, layoutShift, performance, errors }, null, 2));
  assert.deepEqual(errors, []);
  console.log(`PASS 404, reduced motion, touch, no-JS article, console/hydration; layout shift ${layoutShift}`, performance);
} finally { await browser.close(); }

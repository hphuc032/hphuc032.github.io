import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { publishedRoutes, responsiveWidths } from "./test-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const output = "test-results/cinematic-theme";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [], findings = [], layouts = [];
let imageFaultInjection = false;
const watch = page => {
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (imageFaultInjection && message.text() === "Failed to load resource: the server responded with a status of 404 (Not Found)" && message.location().url.startsWith(base + "/images/identity/")) return;
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
};

// Text contrast over actual computed surfaces, including local paper/panel overrides.
async function contrast(page) {
  return page.evaluate(() => {
    const rgba = value => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = channels => channels.slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return [...document.querySelectorAll("body *")].flatMap(element => {
      const style = getComputedStyle(element), rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || style.display === "none" || style.visibility === "hidden" || element.closest(".sr-only,.hero-marquee-window,svg,script,style")) return [];
      if (![...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) return [];
      const layers = [];
      for (let node = element; node; node = node.parentElement) layers.unshift(rgba(getComputedStyle(node).backgroundColor));
      const background = layers.reduce((bg, fg) => bg.map((v, i) => (fg[i] || 0) * (fg[3] ?? 1) + v * (1 - (fg[3] ?? 1))), [255, 255, 255]);
      const color = rgba(style.color);
      const foreground = background.map((v, i) => color[i] * (color[3] ?? 1) + v * (1 - (color[3] ?? 1)));
      const a = luminance(background), b = luminance(foreground), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      const required = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
      return ratio + .01 >= required ? [] : [{ text: element.textContent.trim().slice(0, 70), selector: `${element.tagName}.${element.className}`, ratio, required }];
    });
  });
}

async function contextFor(theme, options = {}) {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 }, ...options });
  await context.addInitScript(value => {
    if (value && localStorage.getItem("carwyn:theme") === null) localStorage.setItem("carwyn:theme", value);
    sessionStorage.setItem("carwyn:initialized", "1");
    window.__firstPaintTheme = null;
    requestAnimationFrame(() => { window.__firstPaintTheme = document.documentElement.dataset.theme; });
  }, theme);
  return context;
}

try {
  await mkdir(output, { recursive: true });
  for (const theme of ["dark", "light"]) {
    const context = await contextFor(theme);
    const page = await context.newPage(); watch(page);
    for (const route of publishedRoutes) {
      assert.equal((await page.goto(base + route)).status(), 200);
      await page.waitForFunction(() => document.documentElement.style.getPropertyValue("--header-height"));
      await page.waitForFunction(() => window.__firstPaintTheme !== null);
      assert.equal(await page.evaluate(() => window.__firstPaintTheme), theme, `${route}: initial paint`);
      assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
      assert.equal(await page.locator(".theme-toggle").getAttribute("aria-pressed"), String(theme === "light"));
      findings.push(...(await contrast(page)).map(issue => ({ route, theme, ...issue })));
      assert.equal(await page.locator("h1").count(), 1, route);
      if (route !== "/" && route !== "/vi") assert.equal(await page.locator(".network-live").count(), 0, "no content-route Sphere");
    }
    assert.deepEqual(findings, [], "all published routes: text contrast");
    for (const locale of ["en", "vi"]) {
      await page.goto(base + (locale === "vi" ? "/vi/" : "/"));
      for (const width of responsiveWidths) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(() => document.fonts.ready);
        // Let responsive CSS and the existing chrome ResizeObserver settle together.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const layout = await page.evaluate(() => {
          const header = document.querySelector(".site-header").getBoundingClientRect();
          const controls = [...document.querySelectorAll('.site-header a,.site-header button')].filter(el => el.getBoundingClientRect().width).map(el => el.getBoundingClientRect().toJSON());
          const image = document.querySelector(".hero-portrait img");
          const portrait = image.getBoundingClientRect();
          const title = document.querySelector(".hero-heading").getBoundingClientRect();
          return { width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, header: header.toJSON(), controls, portrait: portrait.toJSON(), title: title.toJSON(), imageLoaded: image.complete && image.naturalWidth > 0, source: image.currentSrc };
        });
        assert.equal(layout.overflow, false, `${locale}/${theme}/${width}`);
        assert.ok(layout.imageLoaded && layout.source.includes(".webp"), "optimized real portrait loaded");
        assert.ok(layout.portrait.width > 180 && layout.portrait.height > 200, `${locale}/${theme}/${width}: ${JSON.stringify(layout.portrait)}`);
        assert.ok(layout.controls.every(rect => rect.left >= 0 && rect.right <= width + 1 && rect.height >= 43.99));
        assert.equal(layout.header.height, 80, "existing header height preserved at base text size");
        if (width < 900) assert.ok(layout.title.bottom <= layout.portrait.top + 1, "mobile/tablet portrait does not cover slogan");
        layouts.push({ theme, locale, ...layout });
        if ([430, 1440].includes(width)) await page.screenshot({ path: `${output}/${theme}-${locale}-${width}.png` });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base);
    await page.locator(".theme-toggle").focus();
    await page.keyboard.press("Space");
    const next = theme === "light" ? "dark" : "light";
    await page.waitForFunction(value => document.documentElement.dataset.theme === value, next);
    assert.equal(await page.evaluate(() => localStorage.getItem("carwyn:theme")), next);
    await page.reload();
    await page.waitForFunction(() => window.__firstPaintTheme !== null);
    assert.equal(await page.evaluate(() => window.__firstPaintTheme), next);
    // Real navigation, including normal Next soft routes and Pages document routes.
    await page.locator('.desktop-navigation a[href*="/projects"]').click();
    await page.waitForURL(/\/projects\/?$/);
    assert.equal(await page.locator("html").getAttribute("data-theme"), next);
    await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
    await page.waitForURL(/\/vi\/projects\/?$/);
    assert.equal(await page.locator("html").getAttribute("data-theme"), next);
    await page.goto(base + "/vi/terminal/");
    assert.equal(await page.locator("html").getAttribute("data-theme"), next);
    await context.close();
    console.log(`PASS ${theme}: all ${publishedRoutes.length} routes, contrast, six widths, keyboard, first paint and route/locale persistence`);
  }

  const optional = await contextFor(null);
  await optional.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("storage blocked"); } }); });
  const page = await optional.newPage(); watch(page);
  await page.goto(base);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.locator(".theme-toggle").click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  await optional.close();

  for (const theme of ["dark", "light"]) {
    const context = await contextFor(theme, { reducedMotion: "no-preference", viewport: { width: 430, height: 932 } });
    const page = await context.newPage(); watch(page);
    await page.goto(base);
    await page.waitForFunction(() => document.querySelector(".hero-marquee")?.dataset.running === "true");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForFunction(() => document.querySelector(".hero-marquee").dataset.running === "false");
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForFunction(() => document.querySelector(".hero-marquee").dataset.running === "true");
    await page.locator("#latest-writing").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".hero-marquee").dataset.running === "false");
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => document.querySelector(".hero-marquee").dataset.running === "true");
    await page.locator(".hero-marquee-control").click();
    await page.waitForFunction(() => document.querySelector(".hero-marquee").dataset.running === "false");
    assert.equal(await page.locator(".network-live canvas").count(), 0, "mobile uses static Sphere");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".hero-marquee-track").evaluate(el => getComputedStyle(el).animationName), "none");
    imageFaultInjection = true;
    await page.route("**/images/identity/*", route => route.fulfill({ status: 404, body: "" }));
    await page.reload();
    await page.locator('.hero-portrait[data-unavailable="true"]').waitFor();
    assert.ok(await page.getByRole("heading", { name: "UNDERSTAND SYSTEMS. DEFEND THEM.", exact: true }).isVisible());
    await context.close();
    imageFaultInjection = false;
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 430, height: 932 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base);
  assert.equal(await noJsPage.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await noJsPage.locator(".theme-toggle").isVisible(), false);
  assert.equal(await noJsPage.locator(".hero-marquee-track").evaluate(el => getComputedStyle(el).animationPlayState), "paused");
  assert.ok(await noJsPage.locator(".hero-portrait img").evaluate(el => el.complete && el.naturalWidth > 0));
  assert.ok(await noJsPage.locator(".no-js-navigation").isVisible());
  await noJs.close();
  // Fault-injected image requests intentionally produce HTTP console errors, not hydration errors.
  assert.deepEqual(errors, []);
  const png = await readFile("public/images/identity/nguyen-hoang-phuc-hero.png");
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  await writeFile(`${output}/results.json`, JSON.stringify({ base, layouts, findings, errors }, null, 2));
  console.log("PASS storage unavailable, default Dark, native mobile fallback, pause/reduced motion, missing portrait fallback, no-JS and clean hydration");
} finally { await browser.close(); }

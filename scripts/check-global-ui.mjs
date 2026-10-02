import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Uses an existing QA runtime, not an application dependency.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const production = process.argv.includes("--production");
const staticExport = process.argv.includes("--static-export");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const desktopLabels = ["PROJECTS", "WRITEUPS", "ABOUT", "TERMINAL", "CONTACT"];
const mobileLabels = ["HOME", ...desktopLabels];
const activeCases = [
  ["/", "home"],
  ["/projects", "projects"],
  ["/operations/secure-api-gateway", "projects"],
  ["/writeups", "writeups"],
  ["/log", "writeups"],
  ["/log/analyzing-http-and-https-traffic-with-wireshark", "writeups"],
  ["/about", "about"],
  ["/terminal", "terminal"],
  ["/contact", "contact"],
  ["/vi", "home"],
  ["/vi/projects", "projects"],
  ["/vi/operations/network-traffic-analysis", "projects"],
  ["/vi/writeups", "writeups"],
  ["/vi/log", "writeups"],
  ["/vi/log/analyzing-http-and-https-traffic-with-wireshark", "writeups"],
  ["/vi/about", "about"],
  ["/vi/terminal", "terminal"],
  ["/vi/contact", "contact"],
];

function watch(page, label) {
  page.on("pageerror", error => errors.push(`${label}: ${error.message}`));
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) errors.push(`${label}: ${message.type()}: ${message.text()}`);
  });
}

async function assertActive(page, path, expected) {
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  const current = page.locator('.site-brand[aria-current="page"],.desktop-navigation a[aria-current="page"]');
  assert.equal(await current.count(), 1, `${path}: exactly one current header destination`);
  if (expected === "home") {
    assert.ok(await current.first().evaluate(element => element.classList.contains("site-brand")), `${path}: brand is current`);
  } else {
    assert.equal((await current.first().textContent()).trim().toLowerCase(), expected, `${path}: ${expected} is current`);
  }
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    window.__introPlays = 0;
    new MutationObserver(entries => {
      for (const entry of entries) {
        if (entry.target instanceof Element && entry.target.matches('.initialization[data-play="true"]')) window.__introPlays++;
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-play"] });
  });
  const page = await context.newPage();
  watch(page, "desktop");

  await page.goto(base);
  await page.waitForFunction(() => window.__introPlays > 0);
  await page.waitForFunction(() => !document.querySelector(".initialization").hasAttribute("data-play"));
  assert.equal(await page.evaluate(() => window.__introPlays), 1);
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.evaluate(() => history.replaceState(null, "", "?review=global#about"));
  await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/vi" && url.search === "?review=global" && url.hash === "#about");
  await page.waitForFunction(() => document.documentElement.lang === "vi");
  if (!staticExport) {
    assert.equal(await page.evaluate(() => performance.timeOrigin), origin, "locale switch must not reload in normal mode");
    assert.equal(await page.evaluate(() => window.__introPlays), 1);
  }
  await page.getByRole("link", { name: "English", exact: true }).first().click();
  await page.waitForFunction(() => document.documentElement.lang === "en");
  if (!staticExport) assert.equal(await page.evaluate(() => window.__introPlays), 1);
  await page.reload();
  await page.waitForTimeout(1400);
  assert.equal(await page.evaluate(() => window.__introPlays), 0, "refresh skips session intro");
  console.log("PASS initialization and homepage locale/hash preservation");

  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    const labels = await page.locator(".desktop-navigation a").allTextContents();
    assert.deepEqual(labels.map(label => label.trim().toUpperCase()), desktopLabels, `${width}: desktop labels`);
    assert.equal(await page.locator(".header-menu-trigger").evaluate(element => getComputedStyle(element).display), "none", `${width}: Menu hidden`);
    assert.ok(await page.locator(".header-language").isVisible(), `${width}: language selector visible`);
    const layout = await page.evaluate(() => {
      const header = document.querySelector(".site-header").getBoundingClientRect();
      const brand = document.querySelector(".site-brand").getBoundingClientRect();
      const nav = document.querySelector(".desktop-navigation").getBoundingClientRect();
      const language = document.querySelector(".header-language").getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        brandNavGap: nav.left - brand.right,
        navLanguageGap: language.left - nav.right,
        headerRight: header.right,
        languageRight: language.right,
      };
    });
    assert.ok(layout.overflow <= 1, `${width}: no desktop overflow`);
    assert.ok(layout.brandNavGap >= 0 && layout.navLanguageGap >= 0, `${width}: header regions do not collide`);
    assert.ok(layout.languageRight <= layout.headerRight + 1, `${width}: selector stays inside header`);
  }
  console.log("PASS desktop structure at 1024, 1440 and 1920");

  for (const [path, expected] of activeCases) await assertActive(page, path, expected);
  console.log("PASS active route families including Operations and Security Log");

  await page.goto(base);
  for (const [name, expectedPath] of [
    ["Projects", "/projects"],
    ["Writeups", "/writeups"],
    ["About", "/about"],
    ["Terminal", "/terminal"],
    ["Contact", "/contact"],
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === expectedPath);
  }
  await page.getByRole("link", { name: /carwyn\.sec — Home/i }).click();
  await page.waitForURL(url => url.pathname === "/");
  console.log("PASS desktop route chain and Home brand");

  for (const [path, translatedPath] of [
    ["/projects", "/vi/projects"],
    ["/about", "/vi/about"],
    ["/terminal", "/vi/terminal"],
    ["/contact", "/vi/contact"],
    ["/operations/secure-api-gateway", "/vi/operations/secure-api-gateway"],
    ["/log/analyzing-http-and-https-traffic-with-wireshark", "/vi/log/analyzing-http-and-https-traffic-with-wireshark"],
  ]) {
    await page.goto(base + path);
    await page.getByRole("link", { name: "Tiếng Việt", exact: true }).first().click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === translatedPath);
    await page.getByRole("link", { name: "English", exact: true }).first().click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === path);
  }
  console.log("PASS equivalent EN/VI route switching");

  await page.goto(base);
  await page.locator("#featured-projects").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector(".status-section")?.textContent?.includes("03"));
  assert.equal(await page.locator(".site-brand").getAttribute("aria-current"), "page");
  await page.goto(base + "/operations/secure-api-gateway");
  assert.match((await page.locator(".status-section").textContent()).toUpperCase(), /02 \/ PROJECTS/);
  await page.goto(base + "/log");
  assert.match((await page.locator(".status-section").textContent()).toUpperCase(), /03 \/ WRITEUPS/);
  console.log("PASS Home chapter status and dedicated route status");

  for (const locale of ["en", "vi"]) {
    for (const width of [375, 430, 768]) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(base + (locale === "vi" ? "/vi" : "/"));
      const menu = page.getByRole("button", { name: "Menu", exact: true });
      assert.ok(await menu.isVisible(), `${locale} ${width}: Menu visible`);
      assert.equal(await page.locator(".desktop-navigation").evaluate(element => getComputedStyle(element).display), "none");
      assert.equal(await page.locator(".header-language").evaluate(element => getComputedStyle(element).display), "none");
      await menu.click();
      const dialog = page.locator("dialog");
      assert.ok(await dialog.evaluate(element => element.open && element.matches(":modal")));
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
      assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${locale} ${width}: dialog fits`);
      const labels = await dialog.locator(".index-links a").allTextContents();
      assert.deepEqual(labels.map(label => label.replace(/^\s*\d+\s*/, "").trim().toUpperCase()), mobileLabels);
      assert.equal(await page.evaluate(() => document.activeElement?.closest(".index-links")?.querySelector("a") === document.activeElement), true, "Home receives initial focus");
      await page.keyboard.press("Escape");
      assert.ok(await menu.evaluate(element => element === document.activeElement), `${locale} ${width}: focus returns`);
      assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    }
  }
  console.log("PASS mobile menu layout, content, scroll lock, Escape and focus return");

  await page.setViewportSize({ width: 430, height: 812 });
  await page.goto(base);
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  const dialog = page.locator("dialog");
  const controls = dialog.locator('a[href],button:not(:disabled)');
  await controls.first().focus();
  await page.keyboard.press("Shift+Tab");
  assert.ok(await controls.last().evaluate(element => element === document.activeElement), "reverse focus wraps");
  await page.keyboard.press("Escape");
  await menu.click();
  await dialog.getByRole("link", { name: /02.*Projects/i }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/projects");
  assert.equal(await dialog.evaluate(element => element.open), false);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  console.log("PASS mobile focus trap and route navigation");

  await page.goto(base + "/projects");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await dialog.getByRole("link", { name: "Tiếng Việt", exact: true }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/vi/projects");
  assert.equal(await page.locator("html").getAttribute("lang"), "vi");
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  console.log("PASS mobile locale switching");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.setViewportSize({ width: 1440, height: 900 });
  assert.ok(await page.locator(".desktop-navigation a").first().evaluate(element => parseFloat(getComputedStyle(element).transitionDuration) <= .001));
  await page.setViewportSize({ width: 430, height: 812 });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  assert.ok(await page.locator("dialog").evaluate(element => parseFloat(getComputedStyle(element).animationDuration) <= .001));
  await page.keyboard.press("Escape");
  console.log("PASS reduced-motion navigation");

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base, { waitUntil: "domcontentloaded" });
  assert.deepEqual((await noJsPage.locator(".desktop-navigation a").allTextContents()).map(value => value.trim().toUpperCase()), desktopLabels);
  assert.equal(await noJsPage.locator(".desktop-navigation a").evaluateAll(links => links.filter(link => new URL(link.href).pathname.replace(/\/$/, "") === "/projects").length), 1);
  await noJs.close();
  console.log("PASS no-JavaScript desktop route links");

  const touch = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });
  const touchPage = await touch.newPage();
  await touchPage.goto(base);
  await touchPage.getByRole("button", { name: "Menu", exact: true }).tap();
  assert.ok(await touchPage.locator("dialog").evaluate(element => element.open));
  assert.equal(await touchPage.locator(".context-cursor").evaluate(element => getComputedStyle(element).display), "none");
  await touchPage.getByRole("button", { name: "Close", exact: true }).tap();
  await touch.close();
  console.log("PASS touch menu and cursor isolation");

  if (!production) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + "/dev/design-system#typography");
    await page.locator(".site-header").getByRole("link", { name: "Tiếng Việt", exact: true }).click();
    await page.waitForURL("**/vi/dev/design-system#typography");
    assert.ok(await page.locator(".design-specimen").isVisible());
    console.log("PASS development specimen equivalent locale/hash");
  }

  assert.deepEqual(errors, [], "runtime console and hydration");
  console.log("PASS console and hydration");
  await context.close();
} finally {
  await browser.close();
}

import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.argv[2] ?? "http://127.0.0.1:3002";
try {
  for (const mode of ["no-webgl", "save-data", "blocked-enhancements", "no-javascript"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: mode !== "no-javascript" });
    if (mode === "no-webgl") await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === "webgl2" ? null : original.call(this, type, ...args); };
    });
    if (mode === "save-data") await context.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }));
    let blocked = 0;
    if (mode === "blocked-enhancements") await context.route("**/_next/static/chunks/*.js", async route => {
      const response = await route.fetch();
      const body = await response.text();
      if (body.includes("THREE.WebGLRenderer") || body.includes("GSAP")) { blocked++; await route.abort(); }
      else await route.fulfill({ response });
    });
    const page = await context.newPage();
    await page.goto(base);
    await page.waitForTimeout(2600);
    assert.ok(await page.getByRole("heading", { name: "UNDERSTAND SYSTEMS. DEFEND THEM.", exact: true }).isVisible());
    assert.equal(await page.locator(".network-object").getAttribute("data-network-mode"), "static");
    assert.equal(await page.locator(".network-live canvas").count(), 0);
    assert.equal(await page.locator(".liquid-light").evaluateAll(els => els.some(el => el.width !== 1 || el.height !== 1)), false);
    assert.equal(await page.locator(".network-static-desktop").evaluate(el => getComputedStyle(el).opacity), "1");
    if (mode === "blocked-enhancements") {
      // Chapter GSAP is now requested only as the About teaser approaches the viewport.
      await page.locator('[data-reveal-key="home-about"]').evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight - 80));
      await page.waitForTimeout(800);
      assert.ok(blocked >= 2, "WebGL and chapter GSAP were fault-injected");
      assert.equal(await page.locator('[data-reveal-key="home-about"]').evaluate(el => getComputedStyle(el).opacity), "1");
    }
    assert.equal(await page.locator("[data-sphere-skills] li").count(), 13);
    console.log(`PASS ${mode}: readable heading and complete static sphere`);
    await context.close();
  }
} finally { await browser.close(); }

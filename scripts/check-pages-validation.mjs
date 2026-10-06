import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, relative, sep, extname } from "node:path";
import { publishedRoutes } from "./test-fixtures.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const origin = new URL(base).origin;
const production = "https://hphuc032.github.io";
const expectedCV = "f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9";
const routes = publishedRoutes.map(p => p === "/" ? p : `${p}/`);
const report = { base, production, routes, assets: [], direct: [], history: [], errors: [], warnings: [], requests: [] };
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(join(directory, e.name)) : join(directory, e.name)))).flat();
}
const files = (await walk("out")).map(p => relative("out", p).split(sep).join("/"));
assert.equal(new Set(files.map(p => p.toLowerCase())).size, files.length, "no case-folding filename collisions");
report.hashedChunks = files.filter(p => p.startsWith("_next/static/chunks/") && /\.(js|css)$/.test(p));
const publicHTML = routes.map(p => p === "/" ? "index.html" : `${p.slice(1)}index.html`);
const framework404 = ["404.html", "404/index.html", "_not-found/index.html"];
assert.deepEqual(new Set(files.filter(p => p.endsWith(".html"))), new Set([...publicHTML, ...framework404]), "exact public HTML and framework 404 inventory");
assert.equal(files.some(p => /(?:^|\/)(?:en|src|scripts|test-results|node_modules|\.git)(?:\/|$)|\.(?:md|mdx|map)$/.test(p)), false, "no unsupported alias or source/test exports");
const cv = await readFile("out/cv/nguyen-hoang-phuc-cv.pdf");
report.cvSHA256 = createHash("sha256").update(cv).digest("hex");
assert.equal(report.cvSHA256, expectedCV, "approved CV bytes");
const sitemap = await readFile("out/sitemap.xml", "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.equal(urls.length, routes.length); assert.deepEqual(new Set(urls), new Set(routes.map(p => production + p)));
assert.match(await readFile("out/robots.txt", "utf8"), /Allow: \/[\s\S]*Sitemap: https:\/\/hphuc032\.github\.io\/sitemap\.xml/);
// Check every physical artifact, with exact case-sensitive URLs; the host supplies
// no SPA rewrite. MIME expectations describe this local server, not Pages CDN headers.
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".pdf": "application/pdf", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
for (let i = 0; i < files.length; i += 12) await Promise.all(files.slice(i, i + 12).map(async p => {
  const r = await fetch(new URL(`/${p}`, base)); assert.equal(r.status, 200, p);
  if (mime[extname(p)]) assert.ok(r.headers.get("content-type")?.startsWith(mime[extname(p)]), `${p}: MIME`);
  assert.equal(Buffer.compare(Buffer.from(await r.arrayBuffer()), await readFile(join("out", p))), 0, `${p}: served bytes`);
  report.assets.push({ path: p, type: r.headers.get("content-type"), cacheControl: r.headers.get("cache-control"), encoding: r.headers.get("content-encoding") });
}));
console.log(`PASS exact ${routes.length}-route HTML inventory, sitemap, robots, CV and ${files.length} case-sensitive artifact requests`);
const browser = await chromium.launch({ channel: "msedge", headless: true });
function observe(page) {
  page.on("pageerror", e => report.errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") report.errors.push(m.text()); if (m.type() === "warning") report.warnings.push(m.text()); });
  page.on("request", r => { if (/^https?:/.test(r.url())) { report.requests.push({ url: r.url(), method: r.method(), type: r.resourceType() }); if (new URL(r.url()).origin !== origin || r.method() !== "GET") report.errors.push(`unexpected request ${r.method()} ${r.url()}`); } });
  page.on("requestfailed", r => report.errors.push(`failed request ${r.url()} ${r.failure()?.errorText}`));
  page.on("response", r => { if (r.status() >= 400) report.errors.push(`HTTP ${r.status()} ${r.url()}`); });
}
const path = p => new URL(p.url()).pathname.replace(/\/$/, "") || "/";
async function settled(page) {
  await page.waitForLoadState("load");
  await page.waitForFunction(() => Boolean(document.documentElement.style.getPropertyValue("--header-height")));
  await page.evaluate(() => document.fonts.ready);
}
try {
  for (const route of routes) {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await context.newPage(); observe(page);
    assert.equal((await page.goto(base + route)).status(), 200); await settled(page);
    assert.equal(await page.locator("h1:visible").count(), 1);
    assert.equal(await page.locator("main").count(), 1);
    assert.equal(await page.locator("html").getAttribute("lang"), route.startsWith("/vi") ? "vi" : "en");
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), production + route);
    const metadata = await page.evaluate(() => ({
      title: document.title,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content,
      ogURL: document.querySelector('meta[property="og:url"]')?.content,
      ogImages: [...document.querySelectorAll('meta[property="og:image"]')].map(e => e.content),
      structured: [...document.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent)),
    }));
    assert.ok(metadata.title.trim() && metadata.ogTitle?.trim() && metadata.ogDescription?.trim(), `${route}: title/social metadata`);
    assert.equal(metadata.ogURL, production + route);
    for (const image of metadata.ogImages) {
      assert.equal(new URL(image).origin, production);
      assert.equal((await context.request.get(origin + new URL(image).pathname)).status(), 200, "social asset");
    }
    for (const data of metadata.structured) {
      assert.ok(data && typeof data === "object", "structured JSON object/array");
      assert.equal(/https?:\/\/(?:localhost|127\.0\.0\.1)/.test(JSON.stringify(data)), false);
    }
    const englishCanonical = route.replace(/^\/vi(?=\/|$)/, "") || "/";
    assert.equal(await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute("href"), production + englishCanonical);
    for (const lang of ["en", "vi"]) {
      const english = route.replace(/^\/vi(?=\/|$)/, "") || "/";
      const equivalent = lang === "en" ? english : english === "/" ? "/vi/" : "/vi" + english;
      assert.equal(await page.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute("href"), production + equivalent);
    }
    for (const image of await page.locator("img").all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(i => i.decode()); }
    assert.equal(await page.locator("img").evaluateAll(items => items.every(i => i.complete && i.naturalWidth > 0 && i.getAttribute("width") && i.getAttribute("height"))), true, `${route}: images and declared dimensions`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route);
    report.direct.push({ route, ...metadata });
    // Fresh context per route; reload every route rather than only deep examples.
    assert.equal((await page.reload()).status(), 200); await settled(page);
    await context.close();
  }
  console.log("PASS fresh direct loads/reloads, EN/VI lang/canonical/hreflang, image dimensions and runtime network/console audit");
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage(); observe(page);
  for (const destination of ["", "/projects", "/about", "/terminal", "/contact", "/operations/secure-api-gateway", "/log/analyzing-http-and-https-traffic-with-wireshark"]) {
    await page.goto(base + destination + "/"); await settled(page);
    await page.locator('.header-language a[lang="vi"]').click(); await page.waitForURL(u => u.pathname === "/vi" + destination + "/"); await settled(page);
    await page.goBack(); await settled(page); assert.equal(path(page), destination || "/");
    await page.goForward(); await settled(page); assert.equal(path(page), "/vi" + destination);
    report.history.push(destination);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base); await settled(page);
  const menu = page.locator(".header-menu-trigger"); await menu.press("Enter");
  assert.ok(await page.locator("dialog").evaluate(e => e.matches(":modal")));
  await page.keyboard.press("Escape"); assert.ok(await menu.evaluate(e => e === document.activeElement));
  await menu.click(); await page.locator('dialog a[href="/terminal/"]').click(); await page.waitForURL("**/terminal/"); await settled(page);
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
  await page.goBack(); await settled(page); assert.equal(path(page), "/");
  await page.goForward(); await settled(page); assert.equal(path(page), "/terminal");
  const input = page.locator("#terminal-command");
  const countBefore = report.requests.length;
  for (const payload of ["$(id)", "<script>alert(1)</script>", "curl https://example.com", "clear", "help"]) {
    await input.fill(payload); await input.press("Enter"); assert.ok(await input.evaluate(e => e === document.activeElement));
  }
  assert.equal(report.requests.length, countBefore, "commands do not initiate requests");
  assert.equal(await page.locator(".terminal-form > span").innerText(), "carwyn@sec:~$");
  await page.setViewportSize({ width: 390, height: 450 }); await input.focus();
  for (const control of [input, page.locator('.terminal-form button')]) {
    await control.scrollIntoViewIfNeeded();
    assert.ok(await control.evaluate(e => {
      const r = e.getBoundingClientRect(), h = document.querySelector('.site-header').getBoundingClientRect(), f = document.querySelector('.system-status').getBoundingClientRect();
      return r.top >= h.bottom - 1 && r.bottom <= f.top + 1 && r.left >= 0 && r.right <= innerWidth + 1;
    }), "shortened touch viewport keeps input/submit clear of fixed chrome");
  }
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  // This is a shortened touch viewport, not a physical OS keyboard assertion.
  const legacy = { profile: "/about#identity", identity: "/about#identity", expertise: "/about#expertise", experience: "/about#experience", achievements: "/about#achievements", operations: "/projects", log: "/log", terminal: "/terminal#terminal", contact: "/contact#contact" };
  for (const prefix of ["", "/vi"]) for (const [hash, target] of Object.entries(legacy)) {
    await page.goto(base + prefix + "/#" + hash);
    const [targetPath, fragment] = target.split("#");
    await page.waitForURL(u => u.pathname === prefix + targetPath + "/" && u.hash === (fragment ? "#" + fragment : "")); await settled(page);
  }
  console.log("PASS static locale history, menu/Escape/Back/Forward, inert Terminal payloads, shortened touch viewport and 18 legacy hashes");
  await context.close();
  // Expected 404 document failures are observed separately, without classifying
  // their intentional HTTP status as a successful-resource runtime failure.
  for (const route of ["/missing/", "/vi/missing/", "/writeups/cookiearena-upload-file-via-url/", "/log/not-published/", "/en/"]) {
    const c = await browser.newContext({ reducedMotion: "reduce" }); const p = await c.newPage();
    p.on("pageerror", e => report.errors.push(e.message));
    p.on("console", m => {
      if (m.type() === "warning") report.warnings.push(m.text());
      if (m.type() === "error") {
        const expectedDocument404 = m.text() === "Failed to load resource: the server responded with a status of 404 (Not Found)" && m.location().url === base + route;
        if (!expectedDocument404) report.errors.push(`${route}: ${m.text()} ${m.location().url}`);
      }
    });
    p.on("response", r => { if (r.status() >= 400 && !(r.request().resourceType() === "document" && r.url() === base + route && r.status() === 404)) report.errors.push(`404-page asset failure ${r.status()} ${r.url()}`); });
    assert.equal((await p.goto(base + route)).status(), 404);
    assert.equal(new URL(p.url()).pathname, route, "404 must not redirect to Home");
    assert.equal(await p.locator("h1:visible").count(), 1);
    if (route.startsWith("/vi/")) { await p.waitForFunction(() => document.documentElement.lang === "vi"); assert.match(await p.title(), /Không tìm thấy/); }
    const icon = await p.locator('link[rel="icon"]').first().getAttribute("href"); assert.equal((await c.request.get(new URL(icon, base).href)).status(), 200);
    await c.close();
  }
  assert.deepEqual(report.errors, [], "application/request errors"); assert.deepEqual(report.warnings, [], "reduced-motion release smoke warnings");
  console.log("PASS actual 404s, unsupported /en, unpublished slug and localized recovery; no application/network errors");
} finally {
  await mkdir("test-results/pages-validation", { recursive: true });
  await writeFile("test-results/pages-validation/report.json", JSON.stringify(report, null, 2));
  await browser.close();
}

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { publishedRoutes } from "./test-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const expectedOrigin = process.argv[3];
if (!expectedOrigin) throw new Error("Usage: check-metadata <review-origin> <expected-public-origin>");

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
try {
  for (const [path, locale] of [
    ["/", "en"],
    ["/vi", "vi"],
    ["/projects", "en"],
    ["/vi/about", "vi"],
    ["/terminal", "en"],
    ["/operations/secure-api-gateway", "en"],
    ["/vi/log/analyzing-http-and-https-traffic-with-wireshark", "vi"],
  ]) {
    await page.goto(`${base}${path}`);
    const metadata = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      languages: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => [link.hreflang, link.href]),
      openGraphUrl: document.querySelector('meta[property="og:url"]')?.content,
      openGraphLocale: document.querySelector('meta[property="og:locale"]')?.content,
      robots: document.querySelector('meta[name="robots"]')?.content,
    }));
    assert.ok(metadata.canonical?.startsWith(expectedOrigin), `${path}: canonical URL`);
    assert.deepEqual(metadata.languages.map(([language]) => language).toSorted(), ["en", "vi", "x-default"]);
    assert.ok(metadata.openGraphUrl?.startsWith(expectedOrigin), `${path}: Open Graph URL`);
    assert.equal(metadata.openGraphLocale, locale === "vi" ? "vi_VN" : "en_US");
    assert.equal(metadata.robots, "index, follow");
    console.log(`PASS ${path}: canonical, EN/VI/x-default alternates, Open Graph and robots`);
  }

  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  assert.equal((sitemap.match(/<url>/g) ?? []).length, publishedRoutes.length);
  assert.equal(sitemap.includes("dev/design-system"), false);
  assert.equal(sitemap.includes("not-published"), false);
  assert.ok(sitemap.includes(`${expectedOrigin}/vi/log/analyzing-http-and-https-traffic-with-wireshark`));
  assert.ok(sitemap.includes(`${expectedOrigin}/projects`) && sitemap.includes(`${expectedOrigin}/vi/contact`));
  console.log(`PASS sitemap: exactly ${publishedRoutes.length} published localized routes and no draft/development entries`);
} finally {
  await browser.close();
}

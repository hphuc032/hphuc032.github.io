import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const viewports = [[1920, 1080], [1440, 900], [1280, 800], [1024, 768], [768, 1024], [430, 812], [390, 844], [360, 800], [320, 800]];
const expectedCvHash = "f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9";
const expectedLinks = ["mailto:nhpntd@gmail.com", "https://github.com/hphuc032", "https://www.linkedin.com/in/nguyen-phuc-71217332a/", "/cv/nguyen-hoang-phuc-cv.pdf"];
const unsupported = /available for work|available now|open to hire|freelance available|cybersecurity expert|security consultant|penetration testing services|CEH certified|24\/7|responds within 24 hours|chuyên gia an ninh mạng|dịch vụ kiểm thử xâm nhập/i;
const privateData = /\b(?:student[_ -]?id|account[_ -]?id|api[_ -]?key|access[_ -]?token)\b|\/workspace\/|\/home\/|process\.env|\btel:/i;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext();
await context.addInitScript(() => sessionStorage.setItem("carwyn:initialized", "1"));
const page = await context.newPage();
const errors = [];
const unexpectedRequests = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  if (["error", "warning"].includes(message.type())) errors.push(message.text());
});
page.on("request", request => {
  const url = new URL(request.url());
  if (url.origin !== new URL(base).origin && !["data:", "blob:"].includes(url.protocol)) unexpectedRequests.push(request.url());
  if (/^\/api(?:\/|$)/.test(url.pathname)) unexpectedRequests.push(request.url());
});
const measurements = [];
try {
  await mkdir("test-results/contact", { recursive: true });
  for (const locale of ["en", "vi"]) {
    const path = `${locale === "vi" ? "/vi" : ""}/contact`;
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      const response = await page.goto(`${base}${path}`);
      assert.equal(response.status(), 200, path);
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("html").getAttribute("lang"), locale);
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.locator("h1").textContent(), "LET'S CONNECT.");
      const metrics = await page.locator(".contact-destination").evaluate(root => ({
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        sectionOverflow: root.scrollWidth > root.clientWidth + 1,
        minTarget: Math.min(...[...root.querySelectorAll("a")].map(a => a.getBoundingClientRect().height)),
        headingOverflow: document.querySelector("h1").scrollWidth > document.querySelector("h1").clientWidth + 1,
      }));
      assert.equal(metrics.pageOverflow, false, `${locale}/${width}: page overflow`);
      assert.equal(metrics.sectionOverflow, false, `${locale}/${width}: contact overflow`);
      assert.equal(metrics.headingOverflow, false, `${locale}/${width}: heading clipping`);
      assert.ok(metrics.minTarget >= 44, `${locale}/${width}: touch targets`);
      measurements.push({ locale, width, height, ...metrics });
    }
    const mainText = await page.locator("main").textContent();
    assert.ok(mainText.includes("nhpntd@gmail.com") && mainText.includes("Nguyen Hoang Phuc"));
    assert.ok(mainText.includes(locale === "vi" ? "Sẵn sàng trao đổi về an toàn thông tin" : "Open to conversations about information security"));
    assert.equal(await page.title(), `${locale === "vi" ? "Liên hệ" : "Contact"} — carwyn.sec`);
    assert.ok((await page.locator('meta[name="description"]').getAttribute("content")).includes("Nguyen Hoang Phuc"));
    assert.equal(await page.locator('meta[property="og:locale"]').getAttribute("content"), locale === "vi" ? "vi_VN" : "en_US");
    const canonical = page.locator('link[rel="canonical"]');
    if (await canonical.count()) {
      const url = new URL(await canonical.getAttribute("href"));
      assert.equal(url.origin, "https://hphuc032.github.io");
      assert.equal(url.pathname.replace(/\/$/, ""), path);
      assert.deepEqual((await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links => links.map(a => a.hreflang))).sort(), ["en", "vi", "x-default"]);
    }
    assert.equal(unsupported.test(mainText), false);
    assert.equal(privateData.test(await page.locator("main").innerHTML()), false);
    assert.deepEqual((await page.locator("main").innerText()).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi), ["nhpntd@gmail.com"]);
    assert.equal(await page.locator("main form,main textarea,main iframe,main input,main button").count(), 0);
    const links = page.locator(".contact-record > a");
    assert.deepEqual(await links.evaluateAll(elements => elements.map(a => a.getAttribute("href"))), expectedLinks);
    assert.equal(await page.locator('.contact-destination a[target="_blank"][rel="noopener noreferrer"]').count(), 3);
    assert.equal(await links.first().getAttribute("target"), null);
    assert.equal(await page.locator("main canvas,main video,main .network-object").count(), 0);
    assert.equal(await page.locator("canvas").count(), 1);
    assert.equal(await page.locator("canvas.global-atmosphere").count(), 1);
    assert.equal(await page.locator("footer#end-system").count(), 1);
    // Focus the first channel, then reach the rest using the keyboard.
    await links.first().focus();
    for (let index = 0; index < 4; index++) {
      const link = links.nth(index);
      assert.equal(await link.evaluate(a => document.activeElement === a), true);
      assert.equal(await link.evaluate(a => a.matches(":focus-visible")), true);
      const outline = await link.evaluate(a => ({ style: getComputedStyle(a).outlineStyle, width: parseFloat(getComputedStyle(a).outlineWidth) }));
      assert.ok(outline.style !== "none" && outline.width >= 2);
      if (index < 3) await page.keyboard.press("Tab");
    }
    const target = locale === "en" ? "vi" : "en";
    const expectedPath = `${target === "vi" ? "/vi" : ""}/contact`;
    // The shared mobile header places language controls inside its menu.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(`.site-header a[lang="${target}"]`).click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === expectedPath);
    await page.waitForFunction(language => document.documentElement.lang === language, target);
    const home = page.locator(".site-brand");
    assert.equal(new URL(await home.getAttribute("href"), base).pathname.replace(/\/$/, ""), target === "vi" ? "/vi" : "");
    await page.locator('#end-system a[href="#main-content"]').click();
    await page.waitForURL(url => url.hash === "#main-content");
    console.log(`PASS ${locale}: nine viewports, content/privacy, secure links, keyboard focus, locale navigation and footer`);
  }
  const localCv = await readFile("public/cv/nguyen-hoang-phuc-cv.pdf");
  const pdf = await fetch(`${base}${expectedLinks[3]}`);
  assert.equal(pdf.status, 200);
  assert.ok(pdf.headers.get("content-type")?.includes("application/pdf"));
  assert.equal(createHash("sha256").update(localCv).digest("hex"), expectedCvHash);
  assert.equal(createHash("sha256").update(Buffer.from(await pdf.arrayBuffer())).digest("hex"), expectedCvHash);
  assert.deepEqual((await readdir("public", { recursive: true })).filter(p => p.endsWith(".pdf")), ["cv/nguyen-hoang-phuc-cv.pdf"]);
  console.log("PASS immutable CV bytes and sole public PDF");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}/contact`);
  await page.locator(".contact-record > a").first().focus();
  const motion = await page.locator(".contact-action").first().evaluate(a => ({ transition: parseFloat(getComputedStyle(a).transitionDuration), transform: getComputedStyle(a).transform }));
  assert.ok(motion.transition <= .001);
  assert.equal(motion.transform, "none");
  // 200% text scaling and narrow reflow, in addition to the 320px viewport above.
  await page.setViewportSize({ width: 640, height: 800 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
  const noJs = await noJsContext.newPage();
  for (const path of ["/contact", "/vi/contact"]) {
    assert.equal((await noJs.goto(`${base}${path}`)).status(), 200);
    assert.equal(await noJs.locator(".contact-destination").isVisible(), true);
    assert.equal(await noJs.locator(".contact-record > a").count(), 4);
    assert.equal(await noJs.locator("#end-system").isVisible(), true);
  }
  await noJsContext.close();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const locale of ["en", "vi"]) {
    for (const [width, height] of [[1440, 900], [320, 800]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}${locale === "vi" ? "/vi" : ""}/contact`);
      await page.waitForLoadState("networkidle");
      // Keep fixed status chrome from obscuring a row in a full-page capture.
      await page.screenshot({ path: `test-results/contact/${locale}-${width}.png`, fullPage: true, style: ".system-status { visibility: hidden !important; }" });
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpectedRequests, []);
  await writeFile("test-results/contact/validation.json", JSON.stringify({ measurements, errors, unexpectedRequests, cvSha256: expectedCvHash }, null, 2));
  console.log("PASS reduced motion, 200% text scaling, no-JS, one global canvas, no runtime APIs/external requests, clean console and screenshots");
} finally {
  await browser.close();
}

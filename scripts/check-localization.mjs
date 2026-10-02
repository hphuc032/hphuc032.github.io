import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dedicatedPageSegments, homepageHashSections, operationSlugs, responsiveWidths, securityLogSlug } from "./test-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const staticExport = process.argv.includes("--static-export");
const widths = responsiveWidths;
const sections = homepageHashSections;
const cases = operationSlugs;
const logSlug = securityLogSlug;
const forbiddenClaims = /finalist|winner|champion|qualified for (?:the )?final|vào (?:vòng )?chung kết|quán quân|vô địch|giành giải/i;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => sessionStorage.setItem("carwyn:initialized", "1"));
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  if (["error", "warning"].includes(message.type())) errors.push(`${message.location().url || "document"}: ${message.text()}`);
});
const measurements = [];

async function switchStaticLocale(locale, path, hash = "") {
  // A static anchor replaces the document. An existing <main> is not evidence
  // that the destination has loaded; wait for its URL and document language.
  await page.waitForLoadState("networkidle");
  await Promise.all([
    page.waitForURL(url => url.pathname.replace(/\/$/, "") === path.replace(/\/$/, "") && url.hash === hash, { waitUntil: "load" }),
    page.locator(`.site-header .language-selector a[lang="${locale}"]`).click(),
  ]);
  await page.waitForFunction(language => document.documentElement.lang === language, locale);
}

async function assertMetadata(locale, expectedTitle, descriptionFragment, type = "website") {
  assert.equal(await page.title(), expectedTitle);
  assert.ok((await page.locator('meta[name="description"]').getAttribute("content"))?.includes(descriptionFragment));
  assert.equal(await page.locator('meta[property="og:title"]').getAttribute("content"), expectedTitle);
  assert.equal(await page.locator('meta[property="og:type"]').getAttribute("content"), type);
  assert.equal(await page.locator('meta[property="og:locale"]').getAttribute("content"), locale === "vi" ? "vi_VN" : "en_US");
  const canonical = page.locator('link[rel="canonical"]');
  if (await canonical.count()) assert.ok((await canonical.getAttribute("href"))?.startsWith("https://"));
}

try {
  await mkdir("test-results/localization", { recursive: true });

  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}${prefix}/`);
      await page.waitForLoadState("networkidle");
      const metrics = await page.evaluate(() => ({
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        lang: document.documentElement.lang,
        headings: document.querySelectorAll("main h1, main h2").length,
        visibleSections: [...document.querySelectorAll("main > section")].filter(section => {
          const style = getComputedStyle(section);
          return style.display !== "none" && style.visibility !== "hidden";
        }).length,
      }));
      assert.equal(metrics.pageOverflow, false, `${locale}/${width}: horizontal overflow`);
      assert.equal(metrics.lang, locale, `${locale}/${width}: document language`);
      assert.ok(metrics.headings === 5, `${locale}/${width}: semantic headings`);
      assert.equal(metrics.visibleSections, 5, `${locale}/${width}: all homepage sections visible`);
      measurements.push({ locale, width, ...metrics });
    }

    const homeText = await page.locator("main").textContent();
    assert.equal(await page.locator("#hero-title").getAttribute("aria-label"), "UNDERSTAND SYSTEMS. DEFEND THEM.");
    assert.ok(homeText.includes("LET'SCONNECT."));
    assert.equal(await page.locator(".home-project").count(), 3);
    assert.equal(await page.locator("[data-sphere-skills] li").count(), 13);
    await assertMetadata(locale, "carwyn.sec — Cyber Security Portfolio", locale === "vi" ? "Portfolio An toàn thông tin" : "personal Information Security portfolio");
    await page.goto(`${base}${prefix}/about`);
    const aboutText = await page.locator("main").textContent();
    assert.ok(aboutText.includes("AWS Student Builder Group HCMUTE"));
    assert.ok(aboutText.includes("HCMUTE CTF 2025"));
    assert.ok(aboutText.includes(locale === "vi" ? "THAM DỰ VÒNG SƠ KHẢO" : "QUALIFYING ROUND PARTICIPANT"));
    assert.ok(aboutText.includes(locale === "vi" ? "Đang học" : "In progress"));
    assert.equal(forbiddenClaims.test(aboutText), false, `${locale}: unsupported achievement claim`);
    assert.equal(await page.locator("#achievements .achievement-group").count(), 4);
    assert.equal(await page.locator("#identity img").getAttribute("alt"), locale === "vi"
      ? "Chân dung Nguyen Hoang Phuc ngồi trong không gian tự nhiên."
      : "Portrait of Nguyen Hoang Phuc seated in a natural setting.");
    assert.equal(await page.locator(".skip-link").textContent(), locale === "vi" ? "Chuyển đến nội dung" : "Skip to content");
    console.log(`PASS ${locale}: homepage content, claims, accessibility text, metadata and six widths`);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const section of sections) {
    await page.goto(`${base}/#${section}`);
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    if (staticExport) {
      await switchStaticLocale("vi", "/vi", `#${section}`);
    } else {
      await Promise.all([
        page.waitForURL(`**/vi#${section}`),
        page.locator('.site-header .language-selector a[lang="vi"]').click(),
      ]);
    }
    await page.locator("main").waitFor();
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ""), "/vi");
    assert.equal(new URL(page.url()).hash, `#${section}`);
    if (!staticExport) assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin, `${section}: client transition`);
    assert.equal(await page.locator(".initialization").getAttribute("data-play"), null, `${section}: initialization replay`);
    if (staticExport) {
      await switchStaticLocale("en", "/", `#${section}`);
    } else {
      await Promise.all([
        page.waitForURL(`**/#${section}`),
        page.locator('.site-header .language-selector a[lang="en"]').click(),
      ]);
    }
    await page.locator("main").waitFor();
    assert.equal(new URL(page.url()).pathname, "/");
    assert.equal(new URL(page.url()).hash, `#${section}`);
  }
  console.log("PASS all five meaningful homepage hashes survive EN/VI switching without replaying initialization");

  for (const segment of dedicatedPageSegments) {
    await page.goto(`${base}/${segment}`);
    assert.equal(await page.locator("main").getAttribute("data-page"), segment);
    if (staticExport) {
      await switchStaticLocale("vi", `/vi/${segment}`);
    } else {
      await Promise.all([
        page.waitForURL(`**/vi/${segment}`),
        page.locator('.site-header .language-selector a[lang="vi"]').click(),
      ]);
    }
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ""), `/vi/${segment}`);
    assert.equal(await page.locator("main").getAttribute("data-page"), segment);
    assert.equal(await page.locator("html").getAttribute("lang"), "vi");
  }
  console.log("PASS five dedicated route pairs preserve page identity and locale switching");

  for (const slug of cases) {
    for (const locale of ["en", "vi"]) {
      const prefix = locale === "vi" ? "/vi" : "";
      await page.goto(`${base}${prefix}/operations/${slug}`);
      assert.equal(await page.locator(".case-study").isVisible(), true);
      assert.equal(await page.locator("#results,#architecture").count(), 0);
      assert.equal(forbiddenClaims.test(await page.locator("main").textContent()), false);
      await assertMetadata(locale, `${await page.locator("#case-title").textContent()} — carwyn.sec`, slug === "secure-api-gateway" ? (locale === "vi" ? "xác thực" : "authentication") : "");
      const targetLocale = locale === "en" ? "vi" : "en";
      const expectedPath = `/${targetLocale === "vi" ? `vi/operations/${slug}` : `operations/${slug}`}`;
      if (staticExport) {
        await switchStaticLocale(targetLocale, expectedPath);
      } else {
        await Promise.all([
          page.waitForURL(url => url.pathname.replace(/\/$/, "") === expectedPath),
          page.locator(`.site-header .language-selector a[lang="${targetLocale}"]`).click(),
        ]);
      }
      await page.locator("main").waitFor();
      assert.equal(new URL(page.url()).pathname.replace(/\/$/, ""), expectedPath);
    }
  }
  console.log("PASS three case studies: equivalent stable routes and matched publication boundaries");

  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    await page.goto(`${base}${prefix}/log`);
    assert.equal(await page.locator(".log-entry").count(), 1);
    await assertMetadata(locale, "Security Log — carwyn.sec", locale === "vi" ? "Ghi chép kỹ thuật" : "Technical field notes");
    await page.goto(`${base}${prefix}/log/${logSlug}`);
    const text = await page.locator("article").textContent();
    assert.ok(text.includes("TLS Application Data"));
    assert.ok(text.includes(locale === "vi" ? "không tiết lộ thông điệp HTTP" : "does not reveal the HTTP message"));
    await assertMetadata(locale, `${await page.locator("#log-title").textContent()} — carwyn.sec`, locale === "vi" ? "dữ liệu giao thức" : "observable protocol data", "article");
  }
  console.log("PASS Security Log index/article parity and HTTP versus encrypted HTTPS/TLS boundary");

  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    await page.goto(`${base}${prefix}/terminal`);
    const input = page.locator("#terminal-command");
    await input.fill("help");
    await input.press("Enter");
    assert.deepEqual(await page.locator(".terminal-response li strong").allTextContents(), ["help", "whoami", "skills", "projects", "experience", "achievements", "logs", "contact", "clear"]);
    await input.fill("whoami");
    await input.press("Enter");
    const output = await page.locator(".terminal-response").last().textContent();
    assert.ok(output.includes(locale === "vi" ? "An toàn thông tin / Cyber Security" : "Information Security / Cyber Security"));
    assert.ok(output.includes(locale === "vi" ? "Việt Nam" : "Vietnam"));
    assert.ok((await page.locator(".terminal-console-bar").textContent()).includes(locale === "vi" ? "GIAO DIỆN CỤC BỘ" : "LOCAL INTERFACE"));
  }
  console.log("PASS shared Terminal commands with localized UI and whoami output");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}/vi/contact#contact`);
  assert.ok(await page.locator("#contact a").first().evaluate(link => parseFloat(getComputedStyle(link).transitionDuration) <= .001));
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 430, height: 932 } });
  const noJs = await noJsContext.newPage();
  for (const path of ["/", "/vi", "/projects", "/vi/about", "/terminal", "/vi/contact", "/writeups", "/operations/secure-api-gateway", "/vi/operations/secure-api-gateway", "/log", "/vi/log", `/log/${logSlug}`, `/vi/log/${logSlug}`]) {
    const response = await noJs.goto(`${base}${path}`);
    assert.equal(response.status(), 200, `${path}: no-JavaScript response`);
    assert.equal(await noJs.locator("main").isVisible(), true, `${path}: no-JavaScript content`);
  }
  await noJsContext.close();
  console.log("PASS representative EN/VI routes remain readable without JavaScript");

  for (const [locale, width, path] of [["en", 1440, "/"], ["vi", 1440, "/vi"], ["en", 430, "/"], ["vi", 430, "/vi"]]) {
    await page.setViewportSize({ width, height: width === 430 ? 932 : 1000 });
    await page.goto(`${base}${path}#about`);
    await page.locator("#about").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/localization/${locale}-${width}.png`, fullPage: false });
  }

  assert.deepEqual(errors, []);
  await writeFile("test-results/localization/validation.json", JSON.stringify({ measurements, errors }, null, 2));
  console.log("PASS clean console/hydration and localization review screenshots");
} finally {
  await browser.close();
}

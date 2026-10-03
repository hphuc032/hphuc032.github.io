import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dedicatedPageSegments, homepageHashSections, operationSlugs, publishedRoutes, responsiveWidths, securityLogSlug } from "./test-fixtures.mjs";
import { publishedWriteups, writeupPublication } from "../src/data/writeup-publication.ts";

// Exercise the actual pure locale policy without importing a browser component.
execFileSync(process.execPath, ["--input-type=module", "--eval", `
  import assert from 'node:assert/strict';
  import { readFileSync } from 'node:fs';
  import { registerHooks } from 'node:module';
  registerHooks({ resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) return nextResolve(new URL('./src/' + specifier.slice(2) + (specifier.endsWith('.json') ? '' : '.ts'), import.meta.url).href, context);
    if (specifier.startsWith('./') && context.parentURL?.endsWith('/src/i18n/locale-navigation.ts')) return nextResolve(specifier + '.ts', context);
    return nextResolve(specifier, context);
  }, load(url, context, nextLoad) {
    if (url.endsWith('/writeup-public-routes.json')) return { format: 'module', source: 'export default ' + readFileSync(new URL(url), 'utf8'), shortCircuit: true };
    return nextLoad(url, context);
  }});
  const { localeDestination, legacyHomeDestination } = await import('./src/i18n/locale-navigation.ts');
  const { localizedPath } = await import('./src/i18n/global-ui.ts');
  assert.equal(localeDestination('/projects', 'vi', '#hero', () => false), '/vi/projects');
  assert.equal(localeDestination('/about', 'vi', '#experience', id => id === 'experience'), '/vi/about#experience');
  assert.equal(localeDestination('/about', 'en', '#%E0%A4', () => true), '/about');
  assert.equal(legacyHomeDestination('#profile', 'vi'), '/vi/about#identity');
  assert.equal(legacyHomeDestination('#constructor', 'vi'), undefined);
  assert.equal(legacyHomeDestination('#toString', 'en'), undefined);
  assert.equal(localeDestination('/', 'vi', '#operations', () => true), '/vi/projects');
  for (const path of ['/writeups/not-a-real-entry', '/writeups/cookiearena-upload-file-via-url', '/writeups/dailyalpacahack-small-n', '/operations/unknown', '/log/unknown']) {
    assert.equal(localizedPath(path, 'en'), undefined); assert.equal(localizedPath(path, 'vi'), undefined);
  }
`], { stdio: ["ignore", "pipe", "pipe"] });

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
const expected404Urls = new Set();
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  // Deliberate unknown-page requests still assert HTTP 404 below. Ignore only
  // their document resource message; broken assets and runtime errors remain failures.
  if (expected404Urls.has(message.location().url) && /^Failed to load resource:.*404/.test(message.text())) return;
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

  const normalize = path => path.replace(/\/+$/, "") || "/";
  const canonicalPath = path => normalize(path.replace(/^\/vi(?=\/|$)/, "") || "/");
  const articleRoutes = publishedWriteups().flatMap(entry => [`/writeups/${entry.slug}`, `/vi/writeups/${entry.slug}`]);
  const routes = [...publishedRoutes, ...articleRoutes.filter(route => !publishedRoutes.includes(route))];
  for (const route of routes) {
    const locale = route === "/vi" || route.startsWith("/vi/") ? "vi" : "en";
    const canonical = canonicalPath(route);
    const opposite = locale === "en" ? "vi" : "en";
    const equivalent = opposite === "vi" ? `/vi${canonical === "/" ? "" : canonical}` : canonical;
    const response = await page.goto(base + route); await page.waitForLoadState("networkidle");
    assert.equal(response.status(), 200, route);
    assert.equal(await page.locator("html").getAttribute("lang"), locale, route);
    const selector = page.locator(`.site-header .language-selector a[lang="${opposite}"]`);
    assert.equal(normalize(new URL(await selector.getAttribute("href"), base).pathname), equivalent);
    assert.equal(await selector.getAttribute("aria-label"), opposite === "vi" ? "Tiếng Việt" : "English");
    assert.equal(await page.locator(`.site-header .language-selector a[lang="${locale}"]`).getAttribute("aria-current"), "page");
    const group = canonical === "/" ? "home" : canonical.startsWith("/operations/") ? "projects" : canonical.startsWith("/log") || canonical.startsWith("/writeups") ? "writeups" : canonical.slice(1);
    const active = group === "home" ? page.locator('.site-brand[aria-current="page"]') : page.locator('.desktop-navigation a[aria-current="page"]');
    assert.equal(await active.count(), 1, `${route}: active route`);
    assert.equal(normalize(new URL(await active.getAttribute("href"), base).pathname), locale === "vi" ? `/vi${group === "home" ? "" : `/${group}`}` : group === "home" ? "/" : `/${group}`);
    const text = await page.locator("main").innerText();
    assert.doesNotMatch(text, /chuyên gia|thành thạo|chuyên viên bảo mật|đã có chứng chỉ CEH|\b(?:expert|mastery|specialist|finalist|winner|champion)\b|vào (?:vòng )?chung kết|quán quân|vô địch/i);
    assert.doesNotMatch(text, /lorem ipsum|translation pending|TODO|Tiáº¿ng|Viá»‡t|\uFFFD/i);
    for (const record of writeupPublication.filter(entry => entry.state !== "published")) assert.ok(!text.includes(record.title), `${route}: hidden writeup title`);
    const metadata = await page.evaluate(() => ({
      title: document.title, description: document.querySelector('meta[name="description"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      alternates: [...document.querySelectorAll('link[hreflang]')].map(link => [link.hreflang, link.href]),
    }));
    assert.ok(metadata.title && metadata.description);
    assert.equal(metadata.title, metadata.ogTitle); assert.equal(metadata.description, metadata.ogDescription);
    if (metadata.canonical) {
      assert.equal(normalize(new URL(metadata.canonical).pathname), normalize(route));
      assert.equal(new URL(metadata.ogUrl).href, new URL(metadata.canonical).href);
      assert.deepEqual(metadata.alternates.map(([lang]) => lang).sort(), ["en", "vi", "x-default"]);
      for (const [lang, href] of metadata.alternates) assert.equal(normalize(new URL(href).pathname), lang === "vi" ? `/vi${canonical === "/" ? "" : canonical}` : canonical);
    }
    if (canonical.startsWith("/log/")) assert.equal(await page.locator(".log-prose").getAttribute("lang"), locale);
    if (canonical.startsWith("/writeups/")) {
      const record = publishedWriteups().find(entry => canonical.endsWith(`/${entry.slug}`));
      assert.equal(await page.locator(".writeup-body").getAttribute("lang"), record.language === "en-vi" ? "mul" : record.language);
    }
    await Promise.all([page.waitForURL(url => normalize(url.pathname) === equivalent), selector.click()]);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("html").getAttribute("lang"), opposite);
    assert.equal(await page.locator(".initialization").getAttribute("data-play"), null);
    await page.goBack(); await page.waitForLoadState("networkidle");
    assert.equal(normalize(new URL(page.url()).pathname), normalize(route));
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    await page.goForward(); await page.waitForLoadState("networkidle");
    assert.equal(normalize(new URL(page.url()).pathname), equivalent);
    assert.equal(await page.locator("html").getAttribute("lang"), opposite);
  }
  console.log(`PASS ${routes.length} published routes: locale equivalents, active navigation, copy safety, metadata, source language and Back/Forward`);

  for (const [route, fragment, kept] of [["/about", "experience", true], ["/projects", "hero", false], ["/contact", "contact", true]]) {
    await page.goto(`${base}${route}?unused=1#${fragment}`); await page.waitForLoadState("networkidle");
    await page.locator('.site-header .language-selector a[lang="vi"]').click();
    await page.waitForURL(url => normalize(url.pathname) === `/vi${route}` && url.search === "" && url.hash === (kept ? `#${fragment}` : ""));
  }
  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    for (const [hash, target] of [["profile", "/about#identity"], ["operations", "/projects"], ["log", "/log"], ["terminal", "/terminal#terminal"], ["contact", "/contact#contact"]]) {
      await page.goto(`${base}${prefix}/#${hash}`);
      await page.waitForURL(url => normalize(url.pathname) + url.hash === prefix + target);
    }
    await page.goto(`${base}${prefix}/log`); await page.waitForLoadState("networkidle");
    await page.locator('.log-index-inner > a').click();
    await page.waitForURL(url => normalize(url.pathname) === (prefix || "/") && url.hash === "#latest-writing");
    await page.goto(`${base}${prefix}/operations/${cases[0]}`); await page.waitForLoadState("networkidle");
    assert.equal(normalize(new URL(await page.locator('.case-inner > a').getAttribute("href"), base).pathname), `${prefix}/projects`);
  }
  console.log("PASS valid hashes, discarded foreign fragments/queries, legacy Home destinations and canonical back links");

  for (const route of ["/en", "/en/projects"]) {
    const response = await fetch(base + route, { redirect: "manual" });
    if (staticExport) assert.equal(response.status, 404);
    else { assert.equal(response.status, 308); assert.equal(new URL(response.headers.get("location"), base).pathname.includes("/en"), false); }
  }
  for (const prefix of ["", "/vi"]) for (const suffix of ["/unknown-r12", "/writeups/not-a-real-entry", ...writeupPublication.filter(entry => entry.state !== "published").map(entry => `/writeups/${entry.slug}`)]) {
    expected404Urls.add(base + prefix + suffix);
    expected404Urls.add(base + prefix + suffix + "/");
    const response = await page.goto(base + prefix + suffix); await page.waitForLoadState("networkidle");
    assert.equal(response.status(), 404); assert.equal(await page.locator("html").getAttribute("lang"), prefix ? "vi" : "en");
    assert.equal(await page.title(), prefix ? "Không tìm thấy trang — carwyn.sec" : "Page not found — carwyn.sec");
    const icon = await page.locator('link[rel="icon"]').getAttribute("href");
    assert.equal(new URL(icon, base).pathname, "/favicon.svg");
    assert.equal((await fetch(new URL(icon, base))).status, 200);
  }
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => normalize(new URL(match[1]).pathname));
  if (locations.length) {
    assert.deepEqual(locations.sort(), routes.map(normalize).sort());
    assert.equal(locations.some(path => /^\/en(?:\/|$)/.test(path)), false);
  }
  console.log("PASS unpublished EN/VI 404, no public /en alias and published-only sitemap parity");

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

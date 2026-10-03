import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { publishedRoutes } from "./test-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3019";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const output = "test-results/responsive";
const errors = [];
const results = [];

const routes = publishedRoutes;
const viewports = [
  ...[[320,800],[360,800],[375,812],[390,844],[412,915],[430,812],[768,1024],[900,900],[1024,768],[1280,800],[1440,900],[1920,1080]].map(([width,height]) => ({label:`${width}x${height}`,width,height,touch:width<=1024})),
];

function watch(page, key) {
  page.on("pageerror", error => errors.push(`${key}: ${error.message}`));
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) errors.push(`${key}: ${message.type()}: ${message.text()}`);
  });
}

async function inspect(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const visible = element => {
      // Intentional assistive text is clipped to 1px, not visible layout content.
      if (element.closest(".sr-only")) return false;
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    };
    const targetIssues = [...document.querySelectorAll("a,button,input")]
      .filter(element => visible(element) || (element.tagName === "INPUT" && element.getBoundingClientRect().height > 0 && !element.closest(".sr-only")))
      .map(element => {
        const box = element.getBoundingClientRect();
        return { tag: element.tagName, text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 45), width: box.width, height: box.height };
      })
      .filter(item => item.width < 43.99 || item.height < 43.99);
    const clippedText = [...document.querySelectorAll("h1,h2,h3,h4,p,a,dd,dt,figcaption,.hero-line,.skill-label")]
      .filter(visible)
      .filter(element => {
        const style = getComputedStyle(element);
        return element.scrollWidth > element.clientWidth + 1 && ["hidden", "clip"].includes(style.overflowX);
      })
      .map(element => `${element.tagName}.${element.className}`.slice(0, 90));
    const sections = [...document.querySelectorAll("main > section")].map(section => {
      const box = section.getBoundingClientRect();
      return { id: section.id, width: Math.round(box.width), height: Math.round(box.height) };
    });
    const overflowElements = [...document.querySelectorAll("body *")]
      .filter(visible)
      .map(element => {
        const box = element.getBoundingClientRect();
        return { selector: `${element.tagName}.${element.className}`.slice(0, 100), left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width), scrollWidth: element.scrollWidth };
      })
      .filter(item => item.left < -1 || item.right > root.clientWidth + 1 || item.scrollWidth > root.clientWidth + 1)
      .slice(0, 30);
    const tables = [...document.querySelectorAll(".log-prose table,.log-prose pre")].map(element => ({
      className: element.className,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      overflowX: getComputedStyle(element).overflowX,
    }));
    const hero = document.querySelector("#hero");
    const identityImage = document.querySelector(".identity-image-frame");
    const operationOverlaps = [...document.querySelectorAll(".operation-row")].map(row => {
      const title = row.querySelector("h3")?.getBoundingClientRect();
      const preview = row.querySelector(".operation-preview")?.getBoundingClientRect();
      const shown = row.querySelector(".operation-preview") && getComputedStyle(row.querySelector(".operation-preview")).display !== "none";
      if (!title || !preview || !shown) return false;
      return title.left < preview.right && title.right > preview.left && title.top < preview.bottom && title.bottom > preview.top;
    });
    return {
      lang: root.lang,
      rootFontSize: getComputedStyle(root).fontSize,
      overflow: root.scrollWidth - root.clientWidth,
      targetIssues,
      clippedText,
      sections,
      tables,
      heroHeight: hero ? Math.round(hero.getBoundingClientRect().height) : null,
      identityRatio: identityImage ? Number((identityImage.clientWidth / identityImage.clientHeight).toFixed(3)) : null,
      operationOverlaps,
      overflowElements,
      canvasSizes: [...document.querySelectorAll(".liquid-light")].map(canvas => `${canvas.width}x${canvas.height}`),
    };
  });
}

await mkdir(output, { recursive: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch && viewport.width < 768,
      reducedMotion: "reduce",
    });
    for (const route of routes) {
      const key = `${route}:${viewport.label}`;
      const page = await context.newPage();
      watch(page, key);
      await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      const measurement = await inspect(page);
      results.push({ route, viewport: viewport.label, ...measurement });
      if (measurement.overflow > 1 || measurement.clippedText.length) console.log("ROUTE ISSUE", key, measurement.overflow, measurement.clippedText, measurement.overflowElements);
      assert.ok(measurement.overflow <= 1, `${key}: page overflow ${measurement.overflow}px`);
      assert.deepEqual(measurement.clippedText, [], `${key}: clipped text`);
      assert.deepEqual(measurement.targetIssues, [], `${key}: undersized interactive target`);
      if ((route === "/" || route === "/vi") && viewport.touch) {
        assert.equal(measurement.operationOverlaps.includes(true), false, `${key}: touch project preview/title overlap`);
        assert.ok(measurement.canvasSizes.every(size => size === "1x1"), `${key}: touch water canvas remains inert`);
      }
      for (const table of measurement.tables) {
        if (table.scrollWidth > table.clientWidth) assert.equal(table.overflowX, "auto", `${key}: local data overflow must scroll`);
      }
      await page.close();
    }
    await context.close();
    console.log(`PASS ${viewport.label}: ${routes.length} published routes`);
  }

  // Height-constrained homepages: the mobile menu must expose all destinations and the closing content must clear fixed chrome.
  for (const dimensions of [{ width: 375, height: 667 }, { width: 430, height: 740 }, { width: 768, height: 700 }]) {
    const touch = dimensions.width < 768;
    const context = await browser.newContext({ viewport: dimensions, hasTouch: touch, isMobile: touch, reducedMotion: "reduce" });
    const page = await context.newPage();
    watch(page, `constrained:${dimensions.width}x${dimensions.height}`);
    await page.goto(base);
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    await menu.click();
    const dialog = page.locator("dialog");
    assert.equal(await dialog.locator(".index-links a").first().evaluate(e=>getComputedStyle(e).textTransform),"uppercase","approved mobile menu presentation");
    const last = dialog.locator(".index-links a").last();
    await last.scrollIntoViewIfNeeded();
    assert.ok(await last.isVisible(), `${dimensions.width}x${dimensions.height}: last menu item reachable`);
    await page.keyboard.press("Escape");
    await page.locator("#end-system").scrollIntoViewIfNeeded();
    assert.ok(await page.locator(".end-system-copyright").isVisible());
    assert.ok((await inspect(page)).overflow <= 1);
    await context.close();
  }
  console.log("PASS constrained-height navigation and ending clearance");

  const desktopNavigationContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const desktopNavigationPage = await desktopNavigationContext.newPage();
  await desktopNavigationPage.goto(base);
  assert.equal(await desktopNavigationPage.locator(".desktop-navigation a").count(), 5, "desktop exposes five route destinations");
  assert.ok((await inspect(desktopNavigationPage)).overflow <= 1, "desktop navigation does not overflow");
  await desktopNavigationContext.close();
  console.log("PASS desktop route navigation composition");

  // Resize/orientation and text-size stress: client boundaries must recompute without stale overflow.
  const resizeContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const resizePage = await resizeContext.newPage();
  watch(resizePage, "resize");
  await resizePage.goto(base + "/vi");
  for (const dimensions of [
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 430, height: 932 },
    { width: 932, height: 430 },
    { width: 1920, height: 1080 },
  ]) {
    await resizePage.setViewportSize(dimensions);
    await resizePage.waitForTimeout(100);
    assert.ok((await inspect(resizePage)).overflow <= 1, `resize ${dimensions.width}x${dimensions.height}`);
  }
  for (const scale of [125, 150, 200]) {
    await resizePage.evaluate(value => document.documentElement.style.setProperty("font-size", `${value}%`, "important"), scale);
    for (const dimensions of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
      await resizePage.setViewportSize(dimensions);
      await resizePage.waitForTimeout(100);
      const measurement = await inspect(resizePage);
      if (measurement.overflow > 1 || measurement.clippedText.length) console.log("TEXT STRESS", scale, dimensions, measurement.overflow, measurement.clippedText, measurement.overflowElements);
      assert.ok(measurement.overflow <= 1, `${scale}% text ${dimensions.width}`);
      assert.deepEqual(measurement.clippedText, [], `${scale}% text ${dimensions.width}: clipped text`);
    }
  }
  await resizeContext.close();
  console.log("PASS resize, orientation and actual 125%/150%/200% text-size stress");

  // Actual enlarged typography, not device-pixel-ratio emulation, on every public route.
  const textContext = await browser.newContext({viewport:{width:320,height:800},reducedMotion:"reduce"});
  for (const route of routes) {
    const page = await textContext.newPage();
    watch(page, `text200:${route}`);
    await page.goto(base + route);
    const textSize = await page.evaluate(async () => {
      await document.fonts.ready;
      const before=parseFloat(getComputedStyle(document.documentElement).fontSize);
      document.documentElement.style.setProperty("font-size","200%","important");
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await document.fonts.ready;
      return {before,after:parseFloat(getComputedStyle(document.documentElement).fontSize)};
    });
    assert.ok(textSize.after >= textSize.before * 1.99, `${route}: actual root text size doubled`);
    for (const width of [320,768]) {
      await page.setViewportSize({width,height:1024});
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      const measurement = await inspect(page);
      results.push({route,viewport:`${width}:text200`,...measurement});
      if (measurement.overflow > 1) console.log("200% OVERFLOW",route,width,measurement.overflowElements);
      assert.ok(measurement.overflow <= 1, `${route}: 200% text at ${width}: overflow ${measurement.overflow}`);
      assert.deepEqual(measurement.clippedText, [], `${route}: 200% clipped text at ${width}`);
      assert.deepEqual(measurement.targetIssues, [], `${route}: 200% target size at ${width}`);
      assert.ok(await page.locator(".header-menu-trigger").evaluate(element => { const r=element.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth; }), `${route}: 200% menu stays on screen`);
    }
    await page.close();
  }
  await textContext.close();
  console.log(`PASS actual 200% text reflow on ${routes.length} routes at 320/768 CSS pixels`);
  const menuStress = await browser.newContext({viewport:{width:320,height:800},reducedMotion:"reduce"});
  const menuPage=await menuStress.newPage();
  for (const route of ["/","/vi"]) {
    await menuPage.goto(base+route);
    await menuPage.evaluate(async()=>{document.documentElement.style.setProperty("font-size","200%","important");await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    assert.equal(await menuPage.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize)),32,"menu actual 200% root text");
    await menuPage.locator(".header-menu-trigger").click();
    assert.ok(await menuPage.locator("dialog").evaluate(e=>e.scrollWidth<=e.clientWidth+1),`${route}: 200% menu width bounded`);
    const last=menuPage.locator(".index-links a").last();
    await last.scrollIntoViewIfNeeded();
    assert.ok(await last.isVisible());
    await menuPage.keyboard.press("Escape");
    assert.notEqual(await menuPage.evaluate(()=>document.body.style.overflow),"hidden");
  }
  await menuStress.close();
  console.log("PASS 320px/200% EN/VI menu reflow and scroll-lock recovery");


  // Pointer/touch split: no atmospheric framebuffer or hidden preview dependency on touch.
  const touchContext = await browser.newContext({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(base);
  assert.ok((await touchPage.locator(".liquid-light").evaluateAll(items => items.every(canvas => canvas.width === 1 && canvas.height === 1))), "touch canvas remains inert");
  assert.equal(await touchPage.locator(".operation-preview").count(), 0, "Home teaser has no hover-only preview");
  await touchPage.goto(base + "/terminal");
  await touchPage.locator("#terminal input").scrollIntoViewIfNeeded();
  await touchPage.locator("#terminal input").tap();
  assert.ok(await touchPage.locator("#terminal input").evaluate(element => element === document.activeElement));
  assert.ok((await inspect(touchPage)).overflow <= 1);
  await touchContext.close();
  console.log("PASS touch-only behavior and Terminal focus");

  // Server-rendered content remains readable when enhancement JavaScript is unavailable.
  for (const dimensions of [{ width: 320, height: 800 }, { width: 768, height: 1024 }]) {
    const context = await browser.newContext({ viewport: dimensions, javaScriptEnabled: false, reducedMotion: "reduce" });
    for (const route of routes) {
      const page = await context.newPage();
      await page.goto(base + route, { waitUntil: "domcontentloaded" });
      // Force layout before awaiting fonts: a no-JS document may not have
      // requested its used faces yet when DOMContentLoaded fires.
      await page.waitForLoadState("load");
      await page.evaluate(() => { document.body.getBoundingClientRect(); return document.fonts.ready; });
      const measurement = await inspect(page);
      assert.equal(await page.locator(".no-js-navigation > a").count(), 6, `${route}: no-JS primary navigation`);
      if (measurement.overflow > 1) console.log("NO-JS OVERFLOW",dimensions.width,route,measurement);
      assert.ok(measurement.overflow <= 1, `no-JS ${dimensions.width} ${route}`);
      assert.deepEqual(measurement.clippedText, [], `no-JS clipped text ${dimensions.width} ${route}`);
      assert.ok((await page.locator("main").innerText()).trim().length > 200, `no-JS readable content ${route}`);
      if (route === "/terminal" || route === "/vi/terminal") assert.ok(await page.locator(".terminal-noscript").isVisible(), `no-JS Terminal instructions ${route}`);
      await page.close();
    }
    await context.close();
  }
  console.log("PASS no-JavaScript responsive reading at mobile and tablet widths");

  // Focused visual evidence for the corrected breakpoint boundaries.
  const captures = [
    { name: "identity-mobile-430", route: "/about", selector: "#identity", width: 430, height: 932, touch: true },
    { name: "projects-touch-1024", route: "/", selector: "#featured-projects", width: 1024, height: 768, touch: true },
    { name: "terminal-touch-768", route: "/vi/terminal", selector: "#terminal", width: 768, height: 1024, touch: true },
    { name: "contact-mobile-375", route: "/vi/contact", selector: "#contact", width: 375, height: 812, touch: true },
    { name: "article-mobile-430", route: "/vi/log/analyzing-http-and-https-traffic-with-wireshark", selector: ".log-article", width: 430, height: 932, touch: true },
    { name: "r1-projects-1440", route: "/projects", selector: ".dedicated-page", width: 1440, height: 1000, touch: false },
    { name: "r1-writeups-1440", route: "/writeups", selector: ".dedicated-page", width: 1440, height: 1000, touch: false },
    { name: "r1-about-1440", route: "/about", selector: ".dedicated-page", width: 1440, height: 1000, touch: false },
    { name: "r1-terminal-1440", route: "/terminal", selector: ".dedicated-page", width: 1440, height: 1000, touch: false },
    { name: "r1-contact-1440", route: "/contact", selector: ".dedicated-page", width: 1440, height: 1000, touch: false },
  ];
  for (const width of [1440,768,390,320]) {
    for (const [name,route] of [["home","/"],["projects","/projects"],["writeups","/writeups"],["about","/about"],["terminal","/terminal"],["contact","/contact"],["case","/operations/secure-api-gateway"],["article","/log/analyzing-http-and-https-traffic-with-wireshark"]]) {
      captures.push({name:`r13-${name}-${width}`,route,selector:"main",width,height:900,touch:width<1024});
    }
  }
  for (const capture of captures) {
    const context = await browser.newContext({ viewport: { width: capture.width, height: capture.height }, hasTouch: capture.touch, isMobile: capture.width < 768, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(base + capture.route, { waitUntil: "networkidle" });
    await page.locator(capture.selector).evaluate(element => {
      const header = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
      scrollTo(0, scrollY + element.getBoundingClientRect().top - header);
    });
    await page.screenshot({ path: `${output}/${capture.name}.png` });
    await context.close();
  }
  console.log("PASS responsive review captures");

  assert.deepEqual(errors, [], "console and hydration warnings");
  console.log(`PASS responsive QA baseline (${results.length} route/viewport combinations)`);
} finally {
  await writeFile(`${output}/measurements.json`, JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}

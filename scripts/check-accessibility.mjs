import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { publishedRoutes } from "./test-fixtures.mjs";
import { fixtureArticle } from "./lib/writeup-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3021";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const findings = [];
const runtimeErrors = [];
const documents = [];
const routes = publishedRoutes;

function watch(page, label) {
  page.on("pageerror", error => runtimeErrors.push(`${label}: ${error.message}`));
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) runtimeErrors.push(`${label}: ${message.type()}: ${message.text()} ${message.location().url}`);
  });
}

async function auditDocument(page, route) {
  return page.evaluate(currentRoute => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map(element => ({
      level: Number(element.tagName.slice(1)),
      text: (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100),
    }));
    const gaps = headings.flatMap((heading, index) => index && heading.level > headings[index - 1].level + 1
      ? [`${headings[index - 1].level}->${heading.level}: ${heading.text}`]
      : []);
    const controls = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
      .filter(visible)
      .map(element => {
        const label = element instanceof HTMLInputElement && element.labels?.length
          ? [...element.labels].map(item => item.textContent).join(" ")
          : element.getAttribute("aria-label") || element.textContent || element.getAttribute("title") || "";
        return { tag: element.tagName, label: label.trim().replace(/\s+/g, " "), disabled: element.getAttribute("aria-disabled") };
      });
    return {
      route: currentRoute,
      lang: document.documentElement.lang,
      title: document.title,
      h1Count: headings.filter(item => item.level === 1).length,
      headings,
      gaps,
      unnamedControls: controls.filter(item => !item.label),
      mainCount: document.querySelectorAll("main").length,
      unnamedNavigation: [...document.querySelectorAll("nav")].filter(visible).filter(e=>!e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby")).length,
      unsafeNewTabs: [...document.querySelectorAll('a[target="_blank"]')].filter(e=>!e.rel.split(/\s+/).includes("noopener") || !e.rel.split(/\s+/).includes("noreferrer")).map(e=>e.href),

      headerCount: document.querySelectorAll("body > header,.page-content > header").length,
      footerCount: document.querySelectorAll("footer").length,
      duplicateIds: [...document.querySelectorAll("[id]")].map(item => item.id).filter((id, index, ids) => ids.indexOf(id) !== index),
      canvasExposure: [...document.querySelectorAll("canvas")].filter(item => item.getAttribute("aria-hidden") !== "true" && !item.closest('[aria-hidden="true"]')).length,
      imageIssues: [...document.images].filter(image => !image.hasAttribute("alt")).map(image => image.currentSrc || image.src),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      tableIssues: [...document.querySelectorAll("table")].flatMap(table => {
        const issues = [];
        if (!table.querySelector("caption") && !table.closest('[role="region"][aria-label]')) issues.push("missing caption or named scroll region");
        for (const cell of table.querySelectorAll("th")) if (!cell.hasAttribute("scope")) issues.push("header missing scope");
        return issues;
      }),
      focusableInsideHidden: [...document.querySelectorAll('[aria-hidden="true"] a[href],[aria-hidden="true"] button,[aria-hidden="true"] input,[aria-hidden="true"] [tabindex]:not([tabindex="-1"])')].length,
    };
  }, route);
}

async function contrastAudit(page, label) {
  const issues = await page.evaluate(() => {
    function rgba(value) {
      const match = value.match(/[\d.]+/g)?.map(Number);
      return match && match.length >= 3 ? [match[0], match[1], match[2], match[3] ?? 1] : null;
    }
    function composite(fg, bg) {
      const alpha = fg[3] + bg[3] * (1 - fg[3]);
      return [0, 1, 2].map(index => (fg[index] * fg[3] + bg[index] * bg[3] * (1 - fg[3])) / alpha).concat(alpha);
    }
    function background(element) {
      let result = [255, 255, 255, 1];
      const layers = [];
      for (let current = element; current; current = current.parentElement) {
        const value = rgba(getComputedStyle(current).backgroundColor);
        if (value && value[3] > 0) layers.push(value);
      }
      for (const layer of layers.reverse()) result = composite(layer, result);
      return result;
    }
    function luminance(color) {
      const channels = color.slice(0, 3).map(value => {
        const normalized = value / 255;
        return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
      });
      return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
    }
    function contrast(a, b) {
      const one = luminance(a), two = luminance(b);
      return (Math.max(one, two) + .05) / (Math.min(one, two) + .05);
    }
    const candidates = [...document.querySelectorAll("body *")].filter(element => {
      const style = getComputedStyle(element), rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" &&
        [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    });
    return candidates.flatMap(element => {
      const style = getComputedStyle(element);
      const color = rgba(style.color);
      if (!color) return [];
      const bg = background(element);
      const ratio = contrast(composite(color, bg), bg);
      const size = parseFloat(style.fontSize);
      const weight = Number(style.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const required = large ? 3 : 4.5;
      if (ratio + .01 >= required) return [];
      return [{
        selector: `${element.tagName.toLowerCase()}.${String(element.className).replace(/\s+/g, ".")}`.slice(0, 100),
        text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 75),
        ratio: Number(ratio.toFixed(2)), required, color: style.color, background: `rgb(${bg.slice(0, 3).map(Math.round).join(" ")})`, size, weight,
      }];
    });
  });
  return issues.map(issue => ({ label, ...issue }));
}

try {
  await mkdir("test-results/accessibility", { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  for (const route of routes) {
    const page = await context.newPage();
    watch(page, route);
    await page.goto(base + route, { waitUntil: "domcontentloaded" });
    const result = await auditDocument(page, route);
    assert.equal(result.lang, route.startsWith("/vi") ? "vi" : "en", `${route}: document language`);
    assert.ok(result.title.trim().length > 0, `${route}: unique meaningful title`);
    assert.equal(result.h1Count, 1, `${route}: exactly one H1`);
    assert.deepEqual(result.gaps, [], `${route}: heading hierarchy gaps`);
    assert.deepEqual(result.unnamedControls, [], `${route}: unnamed controls`);
    assert.equal(result.mainCount, 1, `${route}: one main landmark`);
    assert.equal(result.headerCount,1,`${route}: one shell header`);
    assert.equal(result.unnamedNavigation,0,`${route}: named navigation landmarks`);
    assert.deepEqual(result.unsafeNewTabs,[],`${route}: secure new-tab links`);

    assert.deepEqual(result.duplicateIds, [], `${route}: duplicate ids`);
    assert.equal(result.canvasExposure, 0, `${route}: decorative canvas accessibility exposure`);
    assert.equal(result.focusableInsideHidden, 0, `${route}: no focusable content inside aria-hidden regions`);
    assert.deepEqual(result.imageIssues, [], `${route}: images have alt attributes`);
    assert.ok(result.overflow <= 1, `${route}: no page overflow`);
    assert.deepEqual(result.tableIssues, [], `${route}: table semantics`);
    documents.push({ route, locale: result.lang, title: result.title });
    findings.push(...await contrastAudit(page, route));
    if (["/", "/vi", "/log/analyzing-http-and-https-traffic-with-wireshark", "/vi/log/analyzing-http-and-https-traffic-with-wireshark"].includes(route)) {
      await writeFile(`test-results/accessibility/${route.replaceAll("/", "-") || "home"}-aria.yml`, await page.locator("body").ariaSnapshot());
    }
    await page.close();
  }
  for (const locale of ["en", "vi"]) {
    const localized = documents.filter(document => document.locale === locale);
    assert.equal(new Set(localized.map(document => document.title)).size, localized.length, `${locale}: every published page has a unique title`);
  }
  console.log(`PASS semantics, names, headings, decorative media and tables across ${routes.length} routes`);

  const page = await context.newPage();
  watch(page, "interactions");
  await page.setViewportSize({ width: 430, height: 812 });
  for (const [path, menuName, closeName] of [["/", "Menu", "Close"], ["/vi", "Menu", "Đóng"]]) {
    await page.goto(base + path);
    const skip = page.locator(".skip-link");
    await page.keyboard.press("Tab");
    assert.ok(await skip.evaluate(element => element === document.activeElement && element.matches(":focus-visible")), `${path}: skip link first and visible`);
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content", `${path}: skip link targets main`);
    const menu = page.getByRole("button", { name: menuName, exact: true });
    await menu.focus();
    await page.keyboard.press("Enter");
    const dialog = page.locator("dialog");
    assert.equal(await menu.getAttribute("aria-expanded"), "true");
    assert.ok(await dialog.evaluate(element => element.open));
    assert.ok(await dialog.evaluate(element => element.matches(":modal")), `${path}: dialog has native modal behavior`);
    assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), `${path}: focus enters modal`);
    const firstDialogControl = dialog.locator('a[href],button:not(:disabled)').first();
    const lastDialogControl = dialog.locator('a[href],button:not(:disabled)').last();
    await firstDialogControl.focus();
    await page.keyboard.press("Shift+Tab");
    assert.ok(await lastDialogControl.evaluate(element => element === document.activeElement), `${path}: reverse focus wraps within modal`);
    await page.keyboard.press("Escape");
    assert.equal(await menu.getAttribute("aria-expanded"), "false");
    assert.ok(await menu.evaluate(element => element === document.activeElement), `${path}: Escape returns focus`);
    await page.keyboard.press("Space");
    assert.ok(await dialog.evaluate(element => element.open), `${path}: Space activates menu button`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: menuName, exact: true }).click();
    await page.getByRole("button", { name: closeName, exact: true }).click();
    assert.ok(await menu.evaluate(element => element === document.activeElement), `${path}: Close returns focus`);
    await menu.click();
    assert.equal(await page.evaluate(()=>document.body.style.overflow),"hidden",`${path}: modal scroll lock`);
    await dialog.locator(".index-links a").nth(1).click();
    await page.waitForURL(url=>url.pathname.includes("projects"));
    assert.ok(await dialog.evaluate(e=>!e.open),`${path}: navigation closes dialog`);
    assert.notEqual(await page.evaluate(()=>document.body.style.overflow),"hidden",`${path}: navigation releases scroll lock`);
    await menu.click();
    await page.goBack();
    await page.waitForFunction(()=>!document.querySelector("dialog").open && document.body.style.overflow!=="hidden");
    assert.equal(await menu.getAttribute("aria-expanded"),"false",`${path}: browser Back closes modal and restores state`);
    await page.waitForSelector("#hero");
    assert.ok(await page.locator("#hero").isVisible(),`${path}: Back restores Home after skip-link navigation`);

  }
  console.log("PASS skip link, modal naming/state, Escape and focus return in EN/VI");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "/");
  const operationName = await page.locator(".home-project a").first().ariaSnapshot();
  assert.match(operationName, /Secure API Gateway/);
  assert.match(operationName, /authentication and authorization/);
  assert.equal(await page.locator('.language-selector').first().getByRole("link", { name: "English", exact: true }).getAttribute("aria-current"), "page");
  await page.locator("#featured-projects").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector(".status-section")?.textContent?.includes("03"));
  assert.equal(await page.locator(".site-brand").getAttribute("aria-current"), "page");
  await page.goto(base + "/operations/secure-api-gateway");
  assert.equal(await page.locator('.desktop-navigation a[aria-current="page"]').textContent(), "Projects");
  await page.goto(base + "/");
  const focusables = page.locator('a[href]:visible,button:visible,input:visible,[tabindex="0"]:visible');
  const focusCount = await focusables.count();
  for (let index = 0; index < focusCount + 2; index++) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      const style = getComputedStyle(element);
      const parentStyle = element.parentElement ? getComputedStyle(element.parentElement) : null;
      return { tag: element.tagName, id: element.id, text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 80), outline: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth), boxShadow: style.boxShadow, parentBoxShadow: parentStyle?.boxShadow ?? "none" };
    });
    if (!focused || focused.tag === "BODY") continue;
    assert.ok((focused.outline !== "none" && focused.outlineWidth >= 1) || focused.boxShadow !== "none" || focused.parentBoxShadow !== "none", `focus indicator: ${focused.tag} ${focused.text}`);
  }
  console.log(`PASS visible focus while tabbing the homepage (${focusCount} focusable controls)`);

  await page.goto(base + "/terminal");
  const input = page.locator("#terminal-command");
  await input.focus();
  await input.fill("help");
  await input.press("Enter");
  assert.ok((await page.locator('[aria-live="polite"]').textContent()).trim().length > 0, "terminal makes concise announcement");
  assert.ok(await input.evaluate(element => element === document.activeElement), "terminal retains focus");
  await input.fill("clear");
  await input.press("Enter");
  assert.equal(await page.locator(".terminal-output > ol > li").count(), 0);
  assert.equal((await page.locator('[aria-live="polite"]').textContent()).trim(), "Terminal history cleared.");
  await input.press("Tab");
  assert.ok(!(await page.evaluate(() => document.activeElement?.id === "terminal-command")), "terminal has no focus trap");
  console.log("PASS Terminal label, concise announcements, clear state, focus retention and exit");

  await page.goto(base + "/#connect");
  const back = page.getByRole("link", { name: /Back to top/i });
  await back.scrollIntoViewIfNeeded();
  await back.focus();
  await back.press("Enter");
  await page.waitForTimeout(100);
  const backState = await page.evaluate(() => ({ hash: location.hash, activeId: document.activeElement?.id || "", activeText: document.activeElement?.textContent?.trim().slice(0, 50) || "", heroTop: document.getElementById("hero")?.getBoundingClientRect().top }));
  if (backState.activeId !== "main-content") findings.push({ label: "back-to-top", issue: "focus-remains-on-offscreen-footer-link", ...backState });

  for (const [cssWidth, deviceScaleFactor, path] of [
    [320, 2, "/"],
    [320, 2, "/vi"],
    [320, 2, "/log/analyzing-http-and-https-traffic-with-wireshark"],
    [320, 1, "/"],
  ]) {
      const stressContext = await browser.newContext({ viewport: { width: cssWidth, height: 900 }, deviceScaleFactor, reducedMotion: "reduce" });
      const stressPage = await stressContext.newPage();
      await stressPage.goto(base + path);
      const stress = await stressPage.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, menu: document.querySelector(".menu-trigger")?.getBoundingClientRect(), input: document.querySelector("#terminal-command")?.getBoundingClientRect() }));
      await stressContext.close();
      assert.ok(stress.overflow <= 1, `${path} at ${cssWidth} CSS px / DPR ${deviceScaleFactor}: no two-dimensional page scroll`);
  }
  console.log("PASS DPR 1/2 and 320 CSS-pixel reflow checks (DPR is not text zoom)");

  const reducedPage = await context.newPage();
  await reducedPage.goto(base + "/");
  assert.equal(await reducedPage.locator(".liquid-light").first().evaluate(element => `${element.width}x${element.height}`), "1x1");
  assert.equal(await reducedPage.locator(".network-object").getAttribute("data-network-mode"), "static");
  assert.equal(await reducedPage.locator(".context-cursor").evaluate(element => getComputedStyle(element).display), "none");
  assert.ok(await reducedPage.locator("#connect h2").isVisible());
  await reducedPage.close();
  console.log("PASS reduced-motion final states, static sphere, inert wake and cursor");

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 430, height: 932 }, reducedMotion: "reduce" });
  for (const route of routes) {
    const noJsPage = await noJs.newPage();
    await noJsPage.goto(base + route, { waitUntil: "domcontentloaded" });
    assert.ok((await noJsPage.locator("main").innerText()).trim().length > 200, `${route}: no-JS content`);
    assert.ok(await noJsPage.locator(".skip-link").count(), `${route}: no-JS skip link`);
    assert.ok(await noJsPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    await noJsPage.close();
  }
  await noJs.close();
  console.log("PASS no-JavaScript core reading and reflow");

  // Walk every public page with the keyboard in both layouts; do not scroll or
  // focus controls manually, which would hide native Tab/fixed-chrome defects.
  let keyboardControls = 0;
  for (const width of [390,1440]) {
    await page.setViewportSize({width,height:900});
    for (const route of routes) {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      const count = await page.locator('a[href]:visible,button:visible,input:visible,[tabindex="0"]:visible').count();
      for (let index=0;index<count;index++) {
        await page.keyboard.press("Tab");
        const state = await page.evaluate(() => {
          const e=document.activeElement;
          if (!(e instanceof HTMLElement) || e.tagName==="BODY") return null;
          const s=getComputedStyle(e), p=e.parentElement ? getComputedStyle(e.parentElement):null, r=e.getBoundingClientRect();
          const h=document.querySelector(".site-header").getBoundingClientRect(), f=document.querySelector(".system-status").getBoundingClientRect();
          return {name:(e.getAttribute("aria-label")||e.textContent||e.id).trim().slice(0,70), indicator:(s.outlineStyle!=="none"&&parseFloat(s.outlineWidth)>=1)||s.boxShadow!=="none"||p?.boxShadow!=="none", exposed:Boolean(e.closest(".site-header")||e.classList.contains("skip-link")|| (r.height > f.top-h.bottom ? r.bottom>h.bottom && r.top<f.top : r.top>=h.bottom-1 && r.bottom<=f.top+1)), outside:r.right<0||r.left>innerWidth};
        });
        if (!state) continue;
        assert.ok(state.indicator, `${route}@${width}: focus indicator ${state.name}`);
        assert.ok(state.exposed && !state.outside, `${route}@${width}: focus hidden behind chrome ${state.name}`);
        keyboardControls++;
      }
    }
  }
  console.log(`PASS keyboard focus visibility and fixed-chrome clearance (${keyboardControls} controls, every public route at 390/1440)`);

  // Shared renderer's unpublished fixture: real CSS and realistic long code/table
  // strings, without publishing a test route or exposing an unapproved writeup.
  await page.goto(base + "/writeups");
  const classes=await page.evaluate(()=>({html:document.documentElement.className,body:document.body.className}));
  const styles=[];
  for (const url of await page.locator('link[rel="stylesheet"]').evaluateAll(items=>items.map(e=>e.href))) {
    const css=await (await context.request.get(url)).text();
    styles.push(css.replace(/url\((["']?)([^)"']+)\1\)/g,(_,quote,asset)=>`url("${new URL(asset,url).href}")`));
  }
  styles.push(await readFile("src/styles/writeups.css","utf8"));
  for (const language of ["en","vi","en-vi"]) for (const width of [320,768]) {
    await page.setViewportSize({width,height:900});
    await page.setContent(`<!doctype html><html lang="${language==='vi'?'vi':'en'}" class="${classes.html}"><head><link rel="icon" href="${new URL("/favicon.svg",base).href}"><style>${styles.join("\n")}</style></head><body class="${classes.body}">${fixtureArticle(language)}</body></html>`);
    await page.evaluate(async()=>{await document.fonts.ready;document.documentElement.style.setProperty("font-size","200%","important");await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    assert.equal(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize)),32,"fixture actual 200% root text");
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), `${language}: Markdown 200% reflow ${width}`);
    for (const scroller of await page.locator("pre,.writeup-table-scroll").all()) {
      assert.equal(await scroller.getAttribute("tabindex"),"0");
      await scroller.focus();
      await scroller.press("ArrowRight");
      await page.waitForTimeout(100);
      assert.ok(await scroller.evaluate(e=>e===document.activeElement));
      if (await scroller.evaluate(e=>e.scrollWidth>e.clientWidth)) assert.ok(await scroller.evaluate(e=>e.scrollLeft>0),"keyboard scrolls long data");
    }
    assert.equal(await page.locator("th:not([scope])").count(),0,"Markdown column header scope");
  }
  console.log("PASS safe Markdown fixture: 200% text and keyboard code/table scrolling at 320/768 in three content languages");

  // Forced-colors uses the browser's native emulation; no platform screen-reader claim.
  const forced = await browser.newContext({viewport:{width:320,height:800},forcedColors:"active",reducedMotion:"reduce"});
  for (const route of ["/","/vi","/terminal","/contact","/log/analyzing-http-and-https-traffic-with-wireshark"]) {
    const fc = await forced.newPage();
    watch(fc, `forced:${route}`);
    await fc.goto(base + route);
    const trigger = fc.locator(".header-menu-trigger");
    await trigger.focus();
    assert.ok(await trigger.evaluate(e => {const s=getComputedStyle(e);return s.outlineStyle!=="none" && parseFloat(s.outlineWidth)>=1;}), `${route}: forced-colors focus`);
    await trigger.press("Enter");
    assert.ok(await fc.locator("dialog").evaluate(e=>e.matches(":modal")), `${route}: forced-colors native menu`);
    await fc.keyboard.press("Escape");
    assert.ok(await trigger.evaluate(e=>e===document.activeElement));
    await fc.close();
  }
  await forced.close();
  console.log("PASS forced-colors focus, menu and recovery on five representative routes");

  await page.goto(base + "/");
  assert.equal(await page.locator("[data-sphere-skills] li").count(), 13, "13 semantic skills independent of WebGL");
  assert.equal(await page.locator(".skill-node").count(), 13, "13 keyboard skill controls");
  await page.setViewportSize({width:320,height:800});
  await page.evaluate(async()=>{document.documentElement.style.setProperty("font-size","200%","important");await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  assert.equal(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize)),32,"Sphere actual 200% root text");
  for (const skill of await page.locator(".skill-node").all()) {
    await skill.focus();
    assert.ok((await skill.getAttribute("aria-label"))?.trim(), "skill has accessible name");
    assert.ok(await skill.locator(".skill-label").evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1 && r.right<=innerWidth+1;}),"200% skill label stays on screen");
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"focused Sphere does not overflow at 200%");

  }
  for (const route of routes.filter(route=>route.includes("/log/"))) {
    await page.goto(base + route);
    for (const scroller of await page.locator(".log-prose pre,.log-prose table").all()) {
      assert.equal(await scroller.getAttribute("tabindex"), "0", `${route}: keyboard data scroller`);
      await scroller.focus();
      assert.ok(await scroller.evaluate(e=>e===document.activeElement));
      await scroller.press("ArrowRight");
    }
  }
  console.log("PASS semantic Sphere skills and keyboard article code/table scrollers");

  for (const [path, locale, homeLabel] of [
    ["/log/not-published", "en", "Return to carwyn.sec"],
    ["/does-not-exist", "en", "Return to carwyn.sec"],
    ["/vi/log/not-published", "vi", "Quay lại carwyn.sec"],
    ["/vi/does-not-exist", "vi", "Quay lại carwyn.sec"],
  ]) {
    const missing = await context.newPage();
    const response = await missing.goto(base + path, { waitUntil: "domcontentloaded" });
    await missing.waitForLoadState("networkidle");
    const missingAudit = { status: response?.status(), title: await missing.title(), text: (await missing.locator("body").innerText()).trim(), links: await missing.locator("a[href]").count(), lang: await missing.locator("html").getAttribute("lang") };
    assert.equal(missingAudit.status, 404, `${path}: HTTP 404`);
    const structure=await auditDocument(missing,path);
    assert.equal(structure.h1Count,1,`${path}: one 404 heading`);
    assert.equal(structure.mainCount,1,`${path}: one 404 main`);
    assert.deepEqual(structure.gaps,[],`${path}: 404 heading order`);
    assert.ok(structure.overflow<=1,`${path}: 404 reflow`);
    const recovery=missing.getByRole("link",{name:homeLabel,exact:true});
    await recovery.focus();
    assert.ok(await recovery.evaluate(e=>e===document.activeElement && getComputedStyle(e).outlineStyle!=="none"),`${path}: recovery keyboard focus`);

    assert.equal(missingAudit.lang, locale, `${path}: localized document language`);
    assert.ok(missingAudit.title.toLowerCase().includes(locale === "vi" ? "không tìm thấy" : "not found"), `${path}: meaningful title`);
    assert.ok(await missing.getByRole("link", { name: homeLabel, exact: true }).count(), `${path}: recovery link`);
    await missing.close();
  }
  console.log("PASS localized EN/VI 404 and unpublished-route recovery");

  await writeFile("test-results/accessibility/audit.json", JSON.stringify({ findings, runtimeErrors }, null, 2));
  assert.deepEqual(runtimeErrors, [], "console, hydration and runtime errors");
  if (findings.length) {
    console.log("ACCESSIBILITY FINDINGS");
    console.log(JSON.stringify(findings, null, 2));
    process.exitCode = 2;
  } else {
    console.log("PASS no actionable automated/manual-browser findings");
  }
} finally {
  await browser.close();
}

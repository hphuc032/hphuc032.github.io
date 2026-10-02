import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { publishedRoutes } from "./test-fixtures.mjs";

// Only the test runner reads server catalogs. The application client never does.
const catalogs = JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--input-type=module", "--eval", `
  import { registerHooks } from 'node:module';
  registerHooks({ resolve(specifier, context, nextResolve) {
    // Application bundlers resolve extensionless TS; native Node needs this test-only adapter.
    if (specifier.startsWith('./') && context.parentURL?.endsWith('.ts') && !specifier.match(/\\.[a-z]+$/i)) {
      return nextResolve(specifier + '.ts', context);
    }
    return nextResolve(specifier, context);
  }});
  const { profile } = await import('./src/data/profile.ts');
  const { publishedExpertise } = await import('./src/data/expertise.ts');
  const { publishedExperience } = await import('./src/data/experience.ts');
  const { publishedAchievements } = await import('./src/data/achievements.ts');
  const { publishedProjects } = await import('./src/data/projects.ts');
  const { securityLogPublication } = await import('./src/data/security-log-publication.ts');
  const { socialLinks, publicCv } = await import('./src/data/contact.ts');
  console.log(JSON.stringify({ profile, socialLinks, publicCv, locales: Object.fromEntries(['en','vi'].map(locale => [locale, {
    skills: publishedExpertise(locale), experience: publishedExperience(locale), achievements: publishedAchievements(locale),
    projects: publishedProjects(locale), logs: securityLogPublication.filter(entry => entry.locales.includes(locale))
  }])) }));
`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const commands = ["help", "whoami", "skills", "projects", "experience", "achievements", "logs", "contact", "clear"];
const dimensions = [[1920,1080],[1440,900],[1280,800],[1024,768],[768,1024],[430,812],[390,844],[360,800],[320,800]];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext();
await context.addInitScript(() => sessionStorage.setItem("carwyn:initialized", "1"));
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
const page = await context.newPage();
const errors = [], measurements = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" || message.type() === "warning") errors.push(message.text()); });
const input = page.locator("#terminal-command");
const records = page.locator(".terminal-output ol > li");
async function run(command) {
  await input.fill(command);
  await input.press("Enter");
  assert.equal(await input.evaluate(element => document.activeElement === element), true, `${command}: focus retained`);
  assert.equal(await input.inputValue(), "");
}
async function open(locale = "en") {
  const response = await page.goto(`${base}${locale === "vi" ? "/vi" : ""}/terminal/`);
  assert.equal(response.status(), 200);
  await page.waitForLoadState("networkidle");
}
function routePath(href) { return new URL(href, base).pathname.replace(/\/$/, ""); }

try {
  await mkdir("test-results/terminal", { recursive: true });
  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    const canonical = catalogs.locales[locale];
    await open(locale);
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    assert.equal(await page.locator("main h1").count(), 1);
    assert.notEqual(await page.evaluate(() => document.activeElement?.id), "terminal-command", "no autofocus");
    assert.equal(await page.locator(".terminal-form > span").innerText(), "carwyn@sec:~$");
    assert.ok(await input.getAttribute("aria-describedby"));
    assert.ok(await input.evaluate(element => !!document.querySelector(`label[for="${element.id}"]`)?.textContent));
    assert.equal(await page.locator('[role="log"]').getAttribute("aria-live"), "off");
    assert.equal(await page.locator('.terminal-console > [aria-live="polite"]').count(), 1);
    assert.deepEqual(await page.locator(".terminal-reference dt").allTextContents(), commands);
    assert.equal(await page.locator("canvas.global-atmosphere").count(), 1);
    assert.equal(await page.locator("main canvas, main video, .network-object, .pointer-atmosphere, .liquid-light").count(), 0);

    // Once hydrated and idle, command execution must not request any resources.
    const requests = [];
    const onRequest = request => requests.push(request.url());
    page.on("request", onRequest);
    await run("   HELP   ");
    assert.deepEqual(await records.last().locator(".terminal-response strong").allTextContents(), commands);
    await run("whoami");
    assert.ok((await records.last().innerText()).includes(catalogs.profile.name));
    await run("skills");
    assert.deepEqual(await records.last().locator(".terminal-response strong").allTextContents(), canonical.skills.map(item => item.content.title));
    for (const { record } of canonical.skills) for (const tool of record.toolIds) assert.ok((await records.last().innerText()).includes(tool));
    await run("projects");
    assert.equal(await records.last().locator(".terminal-response li").count(), canonical.projects.length);
    assert.deepEqual((await records.last().locator(".terminal-response li a").evaluateAll(links => links.map(link => link.getAttribute("href")))).map(routePath), canonical.projects.map(project => `${prefix}/operations/${project.slug}`));
    assert.equal(routePath(await records.last().locator(".terminal-action").getAttribute("href")), `${prefix}/projects`);
    await run("experience");
    for (const { record, content } of canonical.experience) {
      const text = await records.last().innerText();
      assert.ok(text.includes(content.role));
      if (record.organization) assert.ok(text.includes(record.organization));
    }
    const experienceUrl = new URL(await records.last().locator(".terminal-action").getAttribute("href"), base);
    assert.equal(routePath(experienceUrl), `${prefix}/about`); assert.equal(experienceUrl.hash, "#experience");
    await run("achievements");
    assert.equal(await records.last().locator(".terminal-response li").count(), canonical.achievements.length);
    assert.match(await records.last().innerText(), locale === "en" ? /In progress/ : /Đang học/);
    assert.match(await records.last().innerText(), locale === "en" ? /QUALIFYING ROUND PARTICIPANT/ : /THAM DỰ VÒNG SƠ KHẢO/);
    const achievementUrl = new URL(await records.last().locator(".terminal-action").getAttribute("href"), base);
    assert.equal(routePath(achievementUrl), `${prefix}/about`); assert.equal(achievementUrl.hash, "#achievements");
    await run("logs");
    assert.deepEqual((await records.last().locator(".terminal-response li a").evaluateAll(links => links.map(link => link.getAttribute("href")))).map(routePath), canonical.logs.map(entry => `${prefix}/log/${entry.slug}`));
    assert.equal(routePath(await records.last().locator(".terminal-action").getAttribute("href")), `${prefix}/log`);
    await run("contact");
    assert.deepEqual(await records.last().locator(".terminal-response li a").evaluateAll(links => links.map(link => link.getAttribute("href"))), [...catalogs.socialLinks.map(link => link.url), catalogs.publicCv.url]);
    assert.equal(routePath(await records.last().locator(".terminal-action").getAttribute("href")), `${prefix}/contact`);
    const factualText = await page.locator(".terminal-output").innerText();
    assert.doesNotMatch(factualText, /\bexpert\b|mastery|CEH Certified|Finalist|Winner|enterprise-grade|production-proven|critical vulnerabilities found|detected threats|99\.99% uptime/i);
    assert.doesNotMatch(factualText, /cookiearena-upload-file-via-url|dailyalpacahack-small-n|sourcePath|sourceRef|source-meta|\/workspace\//);
    const before = await records.count();
    await run("  "); assert.equal(await records.count(), before);
    const initialUrl = page.url();
    for (const hostile of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', 'help;whoami', 'help && projects', 'help | whoami', '../../etc/passwd', 'javascript:alert(1)', '$(whoami)', '`whoami`', 'projects foo', 'sudo', 'scan']) {
      await run(hostile);
      assert.equal(await records.last().locator("a, img, script").count(), 0);
      assert.ok((await records.last().innerText()).includes(hostile));
      assert.ok((await records.last().innerText()).includes(locale === "en" ? "command not found" : "không tìm thấy lệnh"));
      assert.equal(page.url(), initialUrl);
    }
    page.off("request", onRequest);
    assert.deepEqual(requests, [], "commands must not initiate network requests or prefetches");
    console.log(`PASS ${locale}: nine commands, canonical data/links, inert hostile input, no network or review leakage`);

    for (const [width, height] of dimensions) {
      await page.setViewportSize({ width, height });
      await run("contact");
      const metrics = await page.locator("main").evaluate(root => ({
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        consoleOverflow: root.querySelector(".terminal-console").scrollWidth > root.querySelector(".terminal-console").clientWidth + 2,
        inputWidth: root.querySelector("input").getBoundingClientRect().width,
        fontSize: parseFloat(getComputedStyle(root.querySelector("input")).fontSize),
        smallestControl: Math.min(...[...root.querySelectorAll(".terminal-response a, button, input")].map(element => element.getBoundingClientRect().height)),
      }));
      assert.equal(metrics.pageOverflow, false, `${locale}/${width}: page overflow`);
      assert.equal(metrics.consoleOverflow, false, `${locale}/${width}: console overflow`);
      assert.ok(metrics.inputWidth > 100 && metrics.fontSize >= 16 && metrics.smallestControl >= 44, `${locale}/${width}: usable controls`);
      measurements.push({ locale, width, height, ...metrics });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await run("clear"); await run("whoami"); await run("projects");
    await input.evaluate(element => element.blur());
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `test-results/terminal/${locale}-desktop-1440.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `test-results/terminal/${locale}-mobile-390.png`, fullPage: true });
    console.log(`PASS ${locale}: nine responsive viewports, 320px reflow and 44px controls`);
  }

  await open();
  await run("clear");
  await input.press("ArrowUp"); await input.press("ArrowDown"); assert.equal(await input.inputValue(), "");
  await run("help"); await run("whoami");
  await input.fill("unfinished draft");
  await input.press("ArrowUp"); assert.equal(await input.inputValue(), "whoami");
  await input.press("ArrowUp"); await input.press("ArrowUp"); assert.equal(await input.inputValue(), "help");
  await input.press("ArrowDown"); assert.equal(await input.inputValue(), "whoami");
  await input.press("ArrowDown"); await input.press("ArrowDown"); assert.equal(await input.inputValue(), "unfinished draft");
  // Ctrl+L is registered on input only, not on document/window.
  assert.equal(await page.locator(".terminal-output").evaluate(element => { element.focus(); const e = new KeyboardEvent('keydown', {key:'l', ctrlKey:true, bubbles:true, cancelable:true}); element.dispatchEvent(e); return e.defaultPrevented; }), false);
  assert.equal(await records.count(), 2);
  await input.focus(); await input.press("Control+L"); assert.equal(await records.count(), 0); assert.equal(await input.inputValue(), "");
  await input.fill("x".repeat(100)); assert.equal((await input.inputValue()).length, 64);
  await input.press("Enter"); assert.equal((await records.last().locator(".terminal-command").innerText()).split(" ").at(-1).length, 64);
  // Bypass DOM maxlength deliberately to validate the independent logic cap.
  await input.evaluate(element => { element.maxLength = 1000; });
  await input.fill("y".repeat(100)); assert.equal((await input.inputValue()).length, 64);
  await input.evaluate(element => { element.maxLength = 64; });
  await run("clear");
  await page.evaluate(() => navigator.clipboard.writeText("<img src=x onerror=alert(1)>"));
  await input.press("Control+V"); assert.equal(await records.count(), 0); assert.equal(await input.inputValue(), "<img src=x onerror=alert(1)>");
  await input.press("Enter"); assert.equal(await records.last().locator("img").count(), 0);
  await run("clear");
  for (let index = 0; index < 55; index++) await run(`invalid-${index}`);
  assert.equal(await records.count(), 50);
  assert.ok((await records.first().innerText()).includes("invalid-5"));
  for (let index = 0; index < 55; index++) await input.press("ArrowUp");
  assert.equal(await input.inputValue(), "invalid-5");
  for (let index = 0; index < 55; index++) await input.press("ArrowDown");
  assert.equal(await input.inputValue(), "");
  assert.equal(await page.locator(".terminal-output").evaluate(element => Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 2), true);
  console.log("PASS history bounds/draft/recall, input cap, empty input, safe paste, input-only Ctrl+L and transcript scrolling");

  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    for (const [command, target, hash] of [["projects", "/projects", ""], ["experience", "/about", "#experience"], ["achievements", "/about", "#achievements"], ["logs", "/log", ""], ["contact", "/contact", ""]]) {
      await open(locale); await run(command);
      await records.last().locator(".terminal-action").click();
      await page.waitForURL(url => url.pathname.replace(/\/$/, "") === `${prefix}${target}` && url.hash === hash);
      if (hash) assert.equal(await page.locator(hash).count(), 1);
    }
    await open(locale); await run("projects");
    const firstCase = `${prefix}/operations/${catalogs.locales[locale].projects[0].slug}`;
    await records.last().locator(".terminal-response li a").first().click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === firstCase);
    await page.goto(`${base}${prefix}/#terminal`);
    await page.waitForURL(url => url.pathname.replace(/\/$/, "") === `${prefix}/terminal` && url.hash === "#terminal");
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await open();
  await page.locator('.site-header a[lang="vi"]').click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/vi/terminal");
  assert.equal(await page.locator("html").getAttribute("lang"), "vi");
  console.log("PASS trusted route actions, EN/VI case links, locale switching and old Home #terminal bookmarks");

  await open();
  await input.focus();
  assert.equal(await input.evaluate(element => getComputedStyle(element).outlineStyle), "solid");
  await input.press("Escape"); await input.press("Tab");
  assert.equal(await page.locator('button[type="submit"]').evaluate(element => element === document.activeElement), true, "natural Tab exit, no trap");
  await page.locator('button[type="submit"]').press("Shift+Tab");
  assert.equal(await input.evaluate(element => element === document.activeElement), true);
  await input.fill("help"); await page.locator('button[type="submit"]').click(); assert.equal(await records.count(), 1);
  await page.mouse.move(100, 100); await input.hover();
  assert.equal(await page.locator(".context-cursor").getAttribute("data-visible"), "false");
  assert.equal(await input.evaluate(element => getComputedStyle(element).cursor), "text");
  await page.emulateMedia({ reducedMotion: "reduce" }); await run("projects");
  assert.equal(await records.last().locator("a").first().evaluate(element => parseFloat(getComputedStyle(element).transitionDuration) <= .001), true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "200% text scaling/reflow");
  const mobileContext = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(`${base}/terminal/`);
  await mobile.locator("#terminal-command").tap(); await mobile.locator("#terminal-command").fill("help");
  await mobile.locator('button[type="submit"]').tap(); assert.equal(await mobile.locator(".terminal-output ol > li").count(), 1);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobileContext.close();
  for (const locale of ["en", "vi"]) {
    const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
    const noJs = await noJsContext.newPage();
    await noJs.goto(`${base}${locale === "vi" ? "/vi" : ""}/terminal/`);
    assert.equal(await noJs.locator(".terminal-noscript").isVisible(), true);
    assert.equal(await noJs.locator(".terminal-console").isVisible(), false);
    assert.deepEqual(await noJs.locator(".terminal-reference dt").allTextContents(), commands);
    assert.equal(await noJs.locator(".terminal-noscript a").count(), 5);
    assert.equal(await noJs.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await noJsContext.close();
  }
  console.log("PASS keyboard/focus, submit control, native cursor, reduced motion, touch, no-JS EN/VI and 200% text scaling");

  const clientSource = await readFile("src/components/terminal/TerminalConsole.tsx", "utf8");
  assert.doesNotMatch(clientSource, /\b(?:eval|Function|spawn|exec|readFile|writeFile|fetch)\s*\(|child_process|XMLHttpRequest|WebSocket|dangerouslySetInnerHTML/);
  assert.deepEqual(errors, [], "console/hydration errors");
  await writeFile("test-results/terminal/validation.json", JSON.stringify({ measurements, errors, routeCount: publishedRoutes.length, runtime: "Playwright Chromium", commands }, null, 2));
  console.log(`PASS safe client source and console/hydration; public route fixture unchanged (${publishedRoutes.length} routes)`);
} finally {
  await context.close();
  await browser.close();
}

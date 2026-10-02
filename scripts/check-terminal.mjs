import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { responsiveWidths } from "./test-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const staticExport = process.argv.includes("--static-export");
const widths = responsiveWidths;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  sessionStorage.setItem("carwyn:initialized", "1");
  window.__terminalCls = 0;
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__terminalCls += entry.value;
  }).observe({ type: "layout-shift", buffered: true });
});
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  if (["error", "warning"].includes(message.type())) errors.push(`${message.location().url || "document"}: ${message.text()}`);
});
const measurements = [];
const captureStyle = ".site-header,.system-status,.initialization,.context-cursor,.skip-link{visibility:hidden!important}";

async function run(command) {
  const input = page.locator("#terminal-command");
  await input.fill(command);
  await input.press("Enter");
  assert.equal(await input.evaluate(element => document.activeElement === element), true, `${command}: input focus retained`);
}

try {
  await mkdir("test-results/terminal", { recursive: true });
  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    await page.goto(`${base}${prefix}/terminal`);
    assert.notEqual(await page.evaluate(() => document.activeElement?.id), "terminal-command", `${locale}: no autofocus`);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const section = page.locator("#terminal");
      await section.scrollIntoViewIfNeeded();
      const metrics = await section.evaluate(root => ({
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        sectionOverflow: root.scrollWidth > root.clientWidth + 1,
        inputWidth: Math.round(root.querySelector("input").getBoundingClientRect().width),
        fontSize: parseFloat(getComputedStyle(root.querySelector("input")).fontSize),
      }));
      assert.equal(metrics.pageOverflow, false, `${locale}/${width}: page overflow`);
      assert.equal(metrics.sectionOverflow, false, `${locale}/${width}: section overflow`);
      assert.ok(metrics.inputWidth > 100 && metrics.fontSize >= 16, `${locale}/${width}: usable input`);
      measurements.push({ locale, width, ...metrics });
    }
    console.log(`PASS ${locale}: responsive Terminal at six widths, no autofocus or overflow`);
  }

  await page.goto(`${base}/terminal`);
  await run("help");
  assert.equal(await page.locator(".terminal-response li").count(), 9);
  await run("whoami");
  assert.ok((await page.locator(".terminal-output").textContent()).includes("Nguyen Hoang Phuc"));
  await run("skills");
  assert.equal(await page.locator(".terminal-output ol > li").last().locator(".terminal-response li").count(), 4);
  await run("projects");
  assert.equal(await page.locator(".terminal-output ol > li").last().locator(".terminal-response li a").count(), 3);
  await run("experience");
  assert.equal(await page.locator(".terminal-output ol > li").last().locator(".terminal-response li").count(), 2);
  await run("achievements");
  const achievementText = await page.locator(".terminal-output ol > li").last().textContent();
  assert.ok(achievementText.includes("AWS Student Builder Group HCMUTE") && achievementText.includes("CEH"));
  assert.ok(achievementText.includes("Cybersecurity Student Competition 2025") && achievementText.includes("QUALIFYING ROUND PARTICIPANT"));
  assert.ok(achievementText.includes("Top 4") && achievementText.includes("HCMUTE CTF 2025"));
  assert.ok(!/finalist|winner|champion|qualified for final/i.test(achievementText));
  await run("logs");
  assert.equal(await page.locator(".terminal-output ol > li").last().locator(".terminal-response li").count(), 1);
  await run("contact");
  const contactRecord = page.locator(".terminal-output ol > li").last();
  const contactText = await contactRecord.textContent();
  assert.ok(contactText.includes("nhpntd@gmail.com") && contactText.includes("@hphuc032") && contactText.includes("Nguyen Hoang Phuc / PDF"));
  assert.equal(await contactRecord.locator(".terminal-action").count(), 1);
  await run("invalid-command");
  assert.ok((await page.locator(".terminal-output ol > li").last().textContent()).includes("command not found: invalid-command"));
  await run('<img src=x onerror=alert(1)>');
  assert.equal(await page.locator(".terminal-output img").count(), 0);
  assert.ok((await page.locator(".terminal-output ol > li").last().textContent()).includes("<img src=x onerror=alert(1)>"));
  console.log("PASS all nine commands plus invalid input use shared published content");

  await run("clear");
  assert.equal(await page.locator(".terminal-output ol > li").count(), 0);
  await run("help");
  await run("whoami");
  const input = page.locator("#terminal-command");
  await input.press("ArrowUp"); assert.equal(await input.inputValue(), "whoami");
  await input.press("ArrowUp"); assert.equal(await input.inputValue(), "help");
  await input.press("ArrowDown"); assert.equal(await input.inputValue(), "whoami");
  await input.press("ArrowDown"); assert.equal(await input.inputValue(), "");
  await page.evaluate(() => navigator.clipboard.writeText("skills"));
  await input.press("Control+V");
  assert.equal(await input.inputValue(), "skills");
  await input.press("Enter");
  await input.press("Control+L");
  assert.equal(await page.locator(".terminal-output ol > li").count(), 0);
  for (let index = 0; index < 55; index++) await run(`invalid-${index}`);
  assert.equal(await page.locator(".terminal-output ol > li").count(), 50);
  console.log("PASS history navigation, paste, Ctrl+L and 50-record bound");

  await run("clear");
  await run("projects");
  await page.locator(".terminal-output ol > li").last().locator(".terminal-action").click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/projects");
  await page.goto(`${base}/terminal`);
  await run("logs");
  const logsAction = page.locator(".terminal-output ol > li").last().locator(".terminal-action");
  if (staticExport) {
    await logsAction.click();
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ""), "/log");
  } else {
    await Promise.all([page.waitForURL("**/log"), logsAction.click()]);
  }
  await page.goto(`${base}/terminal`);
  const vietnameseLink = page.locator(".site-header").getByRole("link", { name: "Tiếng Việt", exact: true });
  if (staticExport) {
    await vietnameseLink.click();
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ""), "/vi/terminal");
    assert.equal(new URL(page.url()).hash, "");
  } else {
    await Promise.all([page.waitForURL("**/vi/terminal"), vietnameseLink.click()]);
  }
  await run("contact");
  assert.ok((await page.locator(".terminal-output ol > li").last().textContent()).includes("Các kênh liên hệ công khai"));
  console.log("PASS locale-preserving hash/routes and localized command output");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/terminal`);
  await page.mouse.move(100, 100);
  await page.locator("#terminal-command").hover();
  assert.equal(await page.locator(".context-cursor").getAttribute("data-visible"), "false");
  assert.equal(await page.locator("#terminal-command").evaluate(element => getComputedStyle(element).cursor), "text");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await run("projects");
  assert.equal(await page.locator(".terminal-response a").first().evaluate(element => parseFloat(getComputedStyle(element).transitionDuration) <= .001), true);
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const mobileContext = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } });
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(`${base}/terminal`);
  await mobile.locator("#terminal-command").tap();
  await mobile.locator("#terminal-command").fill("help");
  await mobile.locator("#terminal-command").press("Enter");
  assert.equal(await mobile.locator(".terminal-output ol > li").count(), 1);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobileContext.close();

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 430, height: 932 } });
  const noJs = await noJsContext.newPage();
  await noJs.goto(`${base}/terminal`);
  assert.equal(await noJs.locator(".terminal-noscript").isVisible(), true);
  assert.equal(await noJs.locator(".terminal-console").isVisible(), false);
  assert.equal(await noJs.locator(".terminal-noscript li").count(), 9);
  assert.ok((await noJs.locator("#terminal").textContent()).includes("Ask the portfolio directly."));
  await noJsContext.close();
  console.log("PASS native cursor, reduced motion, touch and no-JavaScript fallback");

  await page.goto(`${base}/terminal`);
  await run("clear");
  await run("whoami"); await run("projects");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator("#terminal").screenshot({ path: "test-results/terminal/desktop-1440.png", style: captureStyle });
  await page.evaluate(() => scrollTo(0, document.getElementById("terminal").offsetTop - 520));
  await page.screenshot({ path: "test-results/terminal/log-to-terminal.png" });
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${base}/terminal`);
  await run("clear");
  await run("whoami");
  await page.locator("#terminal").screenshot({ path: "test-results/terminal/mobile-430.png", style: captureStyle });

  const forbidden = /\b(?:eval|Function|child_process|spawn|exec|readFile|writeFile|fetch)\s*\(/;
  const terminalSource = await readFile("src/components/terminal/TerminalConsole.tsx", "utf8");
  assert.equal(forbidden.test(terminalSource), false, "Terminal client contains no dynamic execution, filesystem or network API");
  const layoutShift = await page.evaluate(() => window.__terminalCls);
  await writeFile("test-results/terminal/validation.json", JSON.stringify({ measurements, layoutShift, errors }, null, 2));
  assert.deepEqual(errors, []);
  console.log(`PASS console/hydration, source safety and screenshots; layout shift ${layoutShift}`);
} finally {
  await browser.close();
}

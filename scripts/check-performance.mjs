import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, readFileSync } from "node:fs";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const label = process.argv[3] ?? "current";
assert.match(label, /^[a-z0-9-]+$/);
const directory = `test-results/performance/${label}`;
await promisify(mkdir)(directory, { recursive: true });
const routes = ["/", "/projects", "/writeups", "/about", "/terminal", "/contact", "/operations/secure-api-gateway", "/log/analyzing-http-and-https-traffic-with-wireshark"];
const report = { base, label, method: "Production HTML script/CSS inventory; local raw and gzip-equivalent bytes, cold Edge contexts without throttling; CDP heap after GC; synthetic document.hidden events. Lab observations, not field metrics or actual Pages compression.", pages: [], lifecycle: [] };
if (process.argv.includes("--lifecycle-only")) Object.assign(report, JSON.parse(readFileSync(`${directory}/report.json`, "utf8")), { lifecycle: [] });
const hash = value => createHash("sha256").update(value).digest("hex");
const bytes = body => ({ raw: body.length, gzip: gzipSync(body).length });
const cache = new Map();
const bodyFor = async path => {
  const url = new URL(path, base).href;
  if (!cache.has(url)) cache.set(url, (async () => { const r = await fetch(url); assert.equal(r.status, 200, url); return Buffer.from(await r.arrayBuffer()); })());
  return cache.get(url);
};
// Pure model work counter and deterministic draw trace, using existing TypeScript.
const ts = require("typescript"), modules = new Map();
function load(path) {
  const filename = resolve(path);
  if (modules.has(filename)) return modules.get(filename);
  const compiledModule = { exports: {} }; modules.set(filename, compiledModule.exports);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, require: specifier => load(specifier.startsWith("@/") ? `src/${specifier.slice(2)}.ts` : resolve(dirname(filename), `${specifier}.ts`)) }, { filename });
  return compiledModule.exports;
}
const { AtmosphereField } = load("src/lib/atmosphere/field.ts");
let reads = 0;
const getter = Object.getOwnPropertyDescriptor(AtmosphereField.prototype, "starCount").get;
Object.defineProperty(AtmosphereField.prototype, "starCount", { get() { reads++; return getter.call(this); } });
const operations = [];
const drawing = new Proxy({}, { get: (_, key) => (...args) => { operations.push([key, ...args]); if (key === "createLinearGradient") return { addColorStop: (...values) => operations.push(["addColorStop", ...values]) }; }, set: (_, key, value) => { operations.push([key, value]); return true; } });
const field = new AtmosphereField(123); field.configure("home", 1440, 900, 0); reads = 0;
field.draw(drawing, 0, false, [], 0);
report.model = { staticDrawStarCountReads: reads };
for (let now = 0; now < 20000; now += 100) { field.tick(now); field.draw(drawing, now, true, [{ x: 200, y: 300, width: 100, height: 30 }], 10); }
report.model.drawTraceSha256 = hash(JSON.stringify(operations));
assert.equal(report.model.drawTraceSha256, "7a5f41f33f9f7ab6f5801be81e22008ca2760ffd2df44883ca2549016ebc83d7", "draw commands preserve the baseline appearance");
if (label.startsWith("after")) assert.equal(report.model.staticDrawStarCountReads, 1);
const browser = await chromium.launch({ channel: "msedge", headless: true });
report.browser = browser.version();
const instrument = () => {
  sessionStorage.setItem("carwyn:initialized", "1");
  sessionStorage.setItem("carwyn:atmosphere-seed", "123");
  const data = window.__performanceAudit = { cls: 0, lcp: 0, longTasks: [], eventDurations: [], rafCallbacks: 0, pending: new Set(), contexts: new Map(), twoD: new Map() };
  for (const [type, handle] of [["layout-shift", e => { if (!e.hadRecentInput) data.cls += e.value; }], ["largest-contentful-paint", e => { data.lcp = e.startTime; }], ["longtask", e => data.longTasks.push(e.duration)], ["event", e => { if (e.interactionId) data.eventDurations.push(e.duration); }]]) {
    new PerformanceObserver(list => list.getEntries().forEach(handle)).observe({ type, buffered: true, ...(type === "event" ? { durationThreshold: 16 } : {}) });
  }
  const raf = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
  window.requestAnimationFrame = callback => { const id = raf(now => { data.pending.delete(id); data.rafCallbacks++; callback(now); }); data.pending.add(id); return id; };
  window.cancelAnimationFrame = id => { data.pending.delete(id); return cancel(id); };
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const result = get.call(this, type, ...args);
    if (result && /^webgl/.test(type) && !data.contexts.has(result)) {
      const count = { draws: 0, canvas: this }; data.contexts.set(result, count);
      for (const method of ["drawArrays", "drawElements"]) { const draw = result[method]; result[method] = function (...values) { count.draws++; return draw.apply(this, values); }; }
    }
    if (result && type === "2d" && !data.twoD.has(result)) {
      const count = { clears: 0, canvas: this }; data.twoD.set(result, count);
      const clear = result.clearRect; result.clearRect = function (...values) { count.clears++; return clear.apply(this, values); };
    }
    return result;
  };
};
const sample = page => page.evaluate(() => {
  const d = window.__performanceAudit;
  // Instrumentation must not retain detached renderers and create its own leak.
  for (const [gl, c] of d.contexts) if (!c.canvas.isConnected) d.contexts.delete(gl);
  for (const [ctx, c] of d.twoD) if (!c.canvas.isConnected) d.twoD.delete(ctx);
  return { cls: d.cls, lcpMs: d.lcp, longTasks: d.longTasks, maxEventMs: Math.max(0, ...d.eventDurations), rafCallbacks: d.rafCallbacks, pendingRaf: d.pending.size, connectedWebgl: [...d.contexts].filter(([gl, v]) => v.canvas.isConnected && !gl.isContextLost()).length, webglDraws: [...d.contexts.values()].reduce((sum, c) => sum + c.draws, 0), atmosphereClears: [...d.twoD.values()].filter(c => c.canvas.classList.contains("global-atmosphere")).reduce((sum, c) => sum + c.clears, 0), canvases: [...document.querySelectorAll("canvas")].map(c => ({ className: c.className, width: c.width, height: c.height })), overflow: document.documentElement.scrollWidth > innerWidth, networkMode: document.querySelector(".network-object")?.dataset.networkMode, atmosphereRunning: document.querySelector(".global-atmosphere")?.dataset.running };
});
try {
  if (!process.argv.includes("--lifecycle-only")) for (const path of routes) {
    const html = (await bodyFor(path)).toString();
    const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]))];
    const styles = [...new Set([...html.matchAll(/<link\b[^>]*>/g)].filter(m => /rel="stylesheet"/.test(m[0])).map(m => m[0].match(/href="([^"]+)"/)[1]))];
    assert.ok(styles.length, `${path}: stylesheet inventory must not be empty`);
    const assets = await Promise.all([...scripts, ...styles].map(async url => ({ url, ...bytes(await bodyFor(url)) })));
    if (label.startsWith("after") && path !== "/terminal") {
      for (const src of scripts) assert.equal((await bodyFor(src)).includes("terminal-command"), false, `${path}: unrelated Terminal implementation`);
    }
    const sum = urls => assets.filter(a => urls.includes(a.url)).reduce((n, a) => ({ raw: n.raw + a.raw, gzip: n.gzip + a.gzip }), { raw: 0, gzip: 0 });
    const record = { path, scripts, styles, js: sum(scripts), css: sum(styles), largestInitialChunk: assets.filter(a => scripts.includes(a.url)).sort((a, b) => b.raw - a.raw)[0], samples: [] };
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 768, isMobile: width < 768 });
      await context.addInitScript(instrument);
      const page = await context.newPage(), errors = [], warnings = [], requests = [], jobs = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("console", m => { if (m.type() === "error") errors.push(m.text()); if (m.type() === "warning") warnings.push(m.text()); });
      page.on("response", r => { if (r.request().resourceType() === "script") jobs.push(r.body().then(body => requests.push({ url: r.url(), bytes: body.length, homeWebgl: body.includes("THREE.WebGLRenderer") || body.includes("network-live") })).catch(() => {})); });
      page.on("request", r => { if (new URL(r.url()).origin !== new URL(base).origin && /^https?:/.test(r.url())) errors.push(`third-party ${r.url()}`); });
      assert.equal((await page.goto(base + path)).status(), 200);
      await page.waitForLoadState("networkidle"); await page.waitForTimeout(700); await Promise.all(jobs);
      const observed = await sample(page);
      assert.equal(observed.overflow, false, `${path}/${width} overflow`);
      assert.ok(observed.connectedWebgl <= 1);
      assert.equal(observed.canvases.filter(c => c.className === "global-atmosphere").length, 1);
      if (path !== "/") { assert.equal(observed.connectedWebgl, 0); assert.equal(requests.some(r => r.homeWebgl), false, `${path}: Home WebGL isolation`); }
      // Keep driver warnings visible in the report; JS/console errors remain hard gates.
      assert.deepEqual(errors, [], `${path}/${width}: runtime errors`);
      await page.screenshot({ path: `${directory}/${path === "/" ? "home" : path.split("/").filter(Boolean).join("-")}-${width}.png`, fullPage: true, style: ".system-status,.context-cursor { visibility:hidden!important; }" });
      record.samples.push({ width, ...observed, warnings, errors, requests, media: await page.evaluate(() => ({
        fonts: performance.getEntriesByType("resource").filter(r => /\.woff2(?:\?|$)/.test(r.name)).map(r => ({ name: r.name, bytes: r.decodedBodySize })),
        images: [...document.images].map(i => ({ src: i.currentSrc, naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, width: i.width, height: i.height, loading: i.loading })),
      })) });
      await context.close();
    }
    report.pages.push(record); console.log(`PASS ${path}: JS ${record.js.gzip}B gzip / CSS ${record.css.gzip}B gzip; 3 viewports and isolated Home WebGL`);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(instrument);
  const page = await context.newPage(), cdp = await context.newCDPSession(page);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await cdp.send("Performance.enable"); await page.goto(base); await page.waitForLoadState("networkidle");
  for (let cycle = 0; cycle < 3; cycle++) {
    // Click real links so normal mode keeps the client document/shell alive.
    for (const path of ["/projects", "/operations/secure-api-gateway", "/about", "/terminal", "/contact", "/writeups", "/log", "/log/analyzing-http-and-https-traffic-with-wireshark", "/"]) {
      const link = page.locator(`a[href="${path}"],a[href="${path}/"]`).first();
      if (await link.count()) { await link.click(); await page.waitForURL(url => (url.pathname.replace(/\/$/, "") || "/") === path); }
      else throw new Error(`No real navigation link to ${path}`);
      await page.waitForLoadState("networkidle"); await page.waitForTimeout(300);
      if (path === "/") {
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForFunction(() => document.querySelector(".network-object")?.dataset.networkMode === "webgl");
      }
      const measured = await sample(page);
      assert.ok(measured.connectedWebgl <= 1); assert.ok(measured.canvases.length <= 3);
      if (path !== "/") assert.equal(measured.connectedWebgl, 0);
    }
    await cdp.send("HeapProfiler.collectGarbage");
    const metrics = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
    report.lifecycle.push({ cycle, ...await sample(page), heap: metrics.JSHeapUsedSize, documents: metrics.Documents, nodes: metrics.Nodes, listeners: metrics.JSEventListeners });
  }
  await page.waitForTimeout(700);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.waitForTimeout(700); const hiddenBefore = await sample(page); await page.waitForTimeout(350); const hiddenAfter = await sample(page);
  assert.equal(hiddenAfter.webglDraws, hiddenBefore.webglDraws, "hidden WebGL pauses");
  assert.equal(hiddenAfter.atmosphereClears, hiddenBefore.atmosphereClears, "hidden atmosphere pauses");
  report.hidden = { before: hiddenBefore, after: hiddenAfter };
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.waitForTimeout(700);
  report.reduced = await sample(page); assert.equal(report.reduced.connectedWebgl, 0); assert.equal(report.reduced.atmosphereRunning, "false");
  const beforeStorm = await sample(page);
  await page.evaluate(() => { for (let index = 0; index < 100; index++) window.dispatchEvent(new Event("scroll")); });
  await page.waitForTimeout(100);
  report.scrollStormClears = (await sample(page)).atmosphereClears - beforeStorm.atmosphereClears;
  if (label.startsWith("after")) assert.ok(report.scrollStormClears <= 2, "scroll redraws are coalesced");
  assert.deepEqual(errors, []); await context.close();
  const cv = await promisify(readFile)("public/cv/nguyen-hoang-phuc-cv.pdf");
  assert.equal(hash(cv), "f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9");
  report.cvSha256 = hash(cv);
  console.log("PASS 3 navigation cycles, bounded canvases/contexts, hidden-tab pause, reduced-motion work and CV integrity");
} finally {
  await promisify(writeFile)(`${directory}/report.json`, JSON.stringify(report, null, 2)); await browser.close();
}

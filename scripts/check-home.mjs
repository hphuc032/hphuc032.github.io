import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { homepageHashSections, operationSlugs, securityLogSlug, dedicatedPageSegments } from "./test-fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const skills = ["Wireshark", "Nmap", "Burp Suite", "OWASP ZAP", "Metasploit", "JWT", "OAuth2", "Keycloak", "Kong", "FastAPI", "Spring Boot", "Docker", "Linux"];
const sizes = [[1920,1080],[1440,900],[1280,800],[1024,768],[768,1024],[430,812],[390,844],[360,800]];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [], layouts = [];
const watch = page => { page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); }); };
const context = await browser.newContext({ viewport: { width:1440, height:900 } });
await context.addInitScript(() => {
  sessionStorage.setItem("carwyn:initialized", "1");
  window.__webglContexts = 0; window.__draws = 0; window.__cls = 0; window.__commits = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber:true, inject:()=>1, onCommitFiberRoot:()=>window.__commits++, onCommitFiberUnmount:()=>{} };
  new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type:"layout-shift", buffered:true });
  const get = HTMLCanvasElement.prototype.getContext;
  const counted = new WeakSet();
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    const result = get.call(this, type, ...args);
    if (type === "webgl2" && result && !counted.has(result)) {
      counted.add(result); window.__webglContexts++;
      for (const name of ["drawArrays", "drawElements"]) { const draw=result[name]; result[name]=function(...values){window.__draws++; return draw.apply(this,values);}; }
    }
    return result;
  };
});
const page = await context.newPage(); watch(page);
const transforms = () => page.locator(".skill-node").evaluateAll(nodes => nodes.map(node => node.style.transform));
try {
  await mkdir("test-results/home", { recursive:true });
  for (const locale of ["en", "vi"]) {
    const prefix = locale === "vi" ? "/vi" : "";
    await page.goto(base + prefix + "/"); await page.waitForLoadState("networkidle");
    assert.deepEqual(await page.locator("main > section").evaluateAll(nodes=>nodes.map(node=>node.id)), homepageHashSections);
    assert.equal(await page.locator("#identity,#expertise,#experience,#achievements,#operations,#log,#terminal,#contact").count(),0);
    assert.deepEqual(await page.locator("[data-sphere-skills] li").allTextContents().then(values=>values.map(value=>value.split(" — ")[0])),skills);
    assert.equal(await page.locator(".skill-node").count(),13);
    assert.equal(await page.locator(".home-project").count(),3);
    const projectLinks=await page.locator(".home-project a").evaluateAll(nodes=>nodes.map(node=>new URL(node.href).pathname.replace(/\/$/,"")));
    assert.deepEqual(projectLinks,operationSlugs.map(slug=>`${prefix}/operations/${slug}`));
    assert.equal(await page.locator(".home-note").count(),1);
    assert.equal(new URL(await page.locator(".home-note h3 a").getAttribute("href"),base).pathname.replace(/\/$/,""),`${prefix}/log/${securityLogSlug}`);
    assert.equal(new URL(await page.locator("#connect a").getAttribute("href"),base).pathname.replace(/\/$/,""),`${prefix}/contact`);
    assert.equal(await page.locator('main a[href*="/writeups/"]').count(),0,"no review-state CTF article links");
    assert.equal(await page.locator(".global-atmosphere").count(),1);
    assert.equal(await page.locator(".liquid-light").count(),1);
    for (const [width,height] of sizes) {
      await page.setViewportSize({width,height}); await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(160);
      const metric=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth, clipped:[...document.querySelectorAll("[data-hero-line]")].some(el=>el.scrollWidth>el.getBoundingClientRect().width+1), cls:window.__cls}));
      assert.equal(metric.overflow,false,`${locale}/${width}: overflow`); assert.equal(metric.clipped,false,`${locale}/${width}: title clipping`);
      layouts.push({locale,width,height,...metric});
      if ([1440,430,768].includes(width)) await page.screenshot({path:`test-results/home/${locale}-${width}.png`});
    }
    console.log(`PASS ${locale}: final composition, canonical links, 13 skills and eight viewports`);
  }
  await page.setViewportSize({width:1440,height:900}); await page.goto(base); await page.evaluate(()=>scrollTo(0,0)); await page.waitForFunction(()=>document.querySelector(".network-object")?.dataset.networkMode === "webgl");
  assert.equal(await page.evaluate(()=>window.__webglContexts),1,"one actual WebGL context, no probe scene");
  const beforeAuto=await transforms(); await page.waitForTimeout(800); assert.notDeepEqual(await transforms(),beforeAuto,"slow auto rotation changes actual projections");
  await page.locator(".skill-node").nth(5).focus(); await page.waitForTimeout(1000);
  assert.equal(await page.locator('.skill-node[data-active="true"]').count(),1);
  assert.ok(await page.locator('.skill-node[data-active="true"] .skill-label').isVisible());
  assert.ok(await page.locator(".skill-node").nth(5).evaluate(node=>node===document.activeElement));
  await page.screenshot({path:"test-results/home/skill-focus.png"});
  await page.locator(".network-pause").click(); await page.waitForTimeout(500);
  const draws=await page.evaluate(()=>window.__draws); await page.waitForTimeout(500); assert.equal(await page.evaluate(()=>window.__draws),draws,"paused renderer idle");
  const area=await page.locator(".network-controls").boundingBox();
  const old=await transforms(); const commits=await page.evaluate(()=>window.__commits);
  await page.mouse.move(area.x+area.width*.5,area.y+area.height*.5); await page.mouse.down();
  await page.mouse.move(area.x+area.width*.65,area.y+area.height*.55,{steps:20}); await page.mouse.up(); await page.waitForTimeout(600);
  assert.notDeepEqual(await transforms(),old,"drag changes actual 3D projections while paused");
  assert.equal(await page.evaluate(()=>window.__commits),commits,"drag cannot rerender React");
  assert.equal(await page.locator(".network-controls").getAttribute("data-dragging"),"false");
  await page.locator(".network-pause").click(); await page.mouse.move(30,150); await page.waitForTimeout(2400);
  const resumed=await transforms(); await page.waitForTimeout(500); assert.notDeepEqual(await transforms(),resumed,"auto rotation resumes gradually");
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));});
  await page.waitForTimeout(150); const hidden=await page.evaluate(()=>window.__draws); await page.waitForTimeout(400); assert.equal(await page.evaluate(()=>window.__draws),hidden);
  await page.evaluate(()=>{delete document.hidden; document.dispatchEvent(new Event("visibilitychange"));});
  await page.locator("#connect").scrollIntoViewIfNeeded(); await page.waitForTimeout(200); const off=await page.evaluate(()=>window.__draws); await page.waitForTimeout(400); assert.equal(await page.evaluate(()=>window.__draws),off);
  console.log("PASS auto rotation, focus parity, drag, single context, pause, hidden and offscreen lifecycle");
  for (const segment of dedicatedPageSegments) {
    await page.goto(`${base}/${segment}/`); assert.equal(await page.locator(".network-object,.network-live canvas").count(),0);
    assert.equal(await page.locator(".liquid-light").evaluateAll(nodes=>nodes.some(canvas=>canvas.width!==1||canvas.height!==1)),false,"dedicated static wake placeholders stay inert");
  }
  for (const [hash,target] of [["identity","/about"],["operations","/projects"],["terminal","/terminal"],["contact","/contact"]]) {
    await page.goto(`${base}/vi/#${hash}`); await page.waitForURL(url=>url.pathname.replace(/\/$/,"")===`/vi${target}`);
  }
  console.log("PASS dedicated WebGL isolation and legacy hash/Terminal destination compatibility");
  const reduced=await browser.newContext({reducedMotion:"reduce",viewport:{width:1440,height:900}}); const r=await reduced.newPage(); watch(r);
  await r.goto(base); await r.waitForTimeout(700); assert.equal(await r.locator(".network-live canvas").count(),0); assert.equal(await r.locator("[data-sphere-skills] li").count(),13);
  await r.locator(".skill-node").nth(12).focus(); assert.ok(await r.locator(".skill-node").nth(12).locator(".skill-label").isVisible()); await reduced.close();
  const touch=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}}); const t=await touch.newPage(); watch(t);
  await t.addInitScript(()=>sessionStorage.setItem("carwyn:initialized","1")); await t.goto(base); await t.waitForFunction(()=>document.querySelector(".network-object")?.dataset.networkMode === "webgl");
  assert.equal(await t.locator(".network-object").getAttribute("data-network-topology"),"mobile"); assert.equal(await t.locator("[data-sphere-skills] li").count(),13);
  const touchBefore=await t.locator(".skill-node").first().getAttribute("style");
  // Real Chromium touch input exercises capture and horizontal drag.
  const touchSession=await touch.newCDPSession(t); const box=await t.locator(".network-controls").boundingBox();
  await touchSession.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:box.x+box.width*.35,y:box.y+box.height*.5}]});
  await touchSession.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:box.x+box.width*.7,y:box.y+box.height*.5}]});
  await touchSession.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await t.waitForTimeout(500);
  assert.notEqual(await t.locator(".skill-node").first().getAttribute("style"),touchBefore); await touch.close();
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:430,height:812}}); const n=await noJS.newPage();
  await n.goto(base); assert.equal(await n.locator("[data-sphere-skills] li").count(),13); assert.equal(await n.locator(".network-live canvas").count(),0); assert.equal(await n.locator("main > section").count(),5); await noJS.close();
  assert.deepEqual(errors,[]); await writeFile("test-results/home/validation.json",JSON.stringify({layouts,errors},null,2));
  console.log("PASS reduced motion, mobile topology, touch input, no-JS and clean console/hydration");
} finally { await browser.close(); }

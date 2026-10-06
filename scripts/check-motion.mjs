import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { publishedRoutes } from './test-fixtures.mjs';
const profiles = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '--eval', `
  import { registerHooks } from 'node:module';
  registerHooks({ resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) return nextResolve(new URL('./src/' + specifier.slice(2) + '.ts', import.meta.url).href, context);
    return nextResolve(specifier, context);
  }});
  const { motionProfiles, motionIdentity } = await import('./src/data/motion-config.ts');
  console.log(JSON.stringify({ profiles: motionProfiles, viCase: motionIdentity('/vi/operations/secure-api-gateway/'), viArticle: motionIdentity('/vi/log/analyzing-http-and-https-traffic-with-wireshark/') }));
`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
assert.deepEqual(Object.fromEntries(Object.entries(profiles.profiles).map(([id, value]) => [id, value.wake])), {
  home: 1, projects: .75, writeups: .25, about: .3, terminal: .6, contact: .45,
  operation: .2, 'security-log': .25, 'security-log-entry': .12, 'writeup-entry': .12, unavailable: 0,
});
assert.equal(profiles.viCase, 'operation'); assert.equal(profiles.viArticle, 'security-log-entry');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? 'playwright');
const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], results = [];
const observe = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()); });
};
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  sessionStorage.setItem('carwyn:initialized', '1');
  window.__motion = { cls: 0, longTasks: [], pending: new Set(), webgl: 0, wakeDraws: 0, transitions: [] };
  new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__motion.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver(list => { for (const e of list.getEntries()) window.__motion.longTasks.push(e.duration); }).observe({ type: 'longtask', buffered: true });
  const raf = requestAnimationFrame, cancel = cancelAnimationFrame;
  window.requestAnimationFrame = callback => { const id = raf(time => { window.__motion.pending.delete(id); callback(time); }); window.__motion.pending.add(id); return id; };
  window.cancelAnimationFrame = id => { window.__motion.pending.delete(id); cancel(id); };
  const get = HTMLCanvasElement.prototype.getContext, counted = new WeakSet();
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    const result = get.call(this, type, ...args);
    if (result && type.startsWith('webgl') && !counted.has(result)) { counted.add(result); window.__motion.webgl++; }
    return result;
  };
  const clear = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function(...args) { if (this.canvas.classList.contains('liquid-light')) window.__motion.wakeDraws++; return clear.apply(this, args); };
  document.addEventListener('carwyn:motion-busy', e => window.__motion.transitions.push({ busy: e.detail, time: performance.now() }));
});
const page = await context.newPage(); observe(page);
const settled = async () => page.waitForFunction(() => !document.querySelector('main[data-page-motion]'));
const path = url => new URL(url).pathname.replace(/\/$/, '') || '/';
const blankStroke = async (selector = 'main') => {
  await page.evaluate(selector => {
    const target = document.querySelector(selector); const b = target.getBoundingClientRect();
    window.__stroke = { selector, x: b.left, y: b.top, width: b.width, height: b.height };
  }, selector);
  // Explicitly dispatch on the empty surface, rather than text or native controls.
  return page.evaluate(async () => {
    const b = window.__stroke, target = document.querySelector(b.selector), intervals = [];
    let last = performance.now();
    for (let i = 0; i < 70; i++) {
      await new Promise(requestAnimationFrame); const now = performance.now(); intervals.push(now-last); last=now;
      target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: b.x + b.width*.5 + Math.sin(i*.18)*120, clientY: Math.max(120,b.y+180)+Math.sin(i*.36)*35 }));
    }
    return intervals.slice(1);
  });
};
try {
  await mkdir('test-results/motion', { recursive: true });
  for (const route of publishedRoutes) {
    await page.goto(base + route); await page.waitForLoadState('networkidle'); await settled();
    assert.equal(await page.locator('h1').count(), 1, route);
    assert.equal(await page.locator('.global-atmosphere').count(), 1);
    assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (route !== '/' && route !== '/vi') assert.equal(await page.locator('.network-live canvas').count(), 0);
    results.push({ route, ...await page.evaluate(() => ({ cls: window.__motion.cls, longTasks: window.__motion.longTasks })) });
  }
  console.log(`PASS ${publishedRoutes.length} routes: title, final visibility, overflow, Home-only WebGL`);

  await page.goto(base+'/projects'); await page.waitForLoadState('networkidle'); await settled();
  const events = await page.evaluate(() => window.__motion.transitions);
  assert.ok(events.some(e=>e.busy), 'incoming transition actually starts');
  const first = events.find(e=>e.busy), end = events.find(e=>!e.busy&&e.time>first.time);
  assert.ok(end.time-first.time >= 250 && end.time-first.time <= 650, 'finite title/route reveal');
  results.push({ arrivalMs:end.time-first.time });
  const cdp = await context.newCDPSession(page);
  const listeners = async () => (await cdp.send('Runtime.evaluate', { expression: '({pointer:(getEventListeners(window).pointermove||[]).length,visibility:(getEventListeners(document).visibilitychange||[]).length,click:(getEventListeners(document).click||[]).length})', includeCommandLineAPI:true, returnByValue:true })).result.value;
  const initial = await listeners();
  for (let cycle=0; cycle<3; cycle++) {
    for (const destination of ['about','terminal','contact','writeups','projects']) {
      await page.locator(`.desktop-navigation a[href$="/${destination}"],.desktop-navigation a[href$="/${destination}/"]`).click();
      await page.waitForURL(u=>path(u.href)==='/'+destination); await settled();
      assert.equal(await page.locator('.global-atmosphere').count(),1);
      assert.ok(await page.locator('canvas').count()<=2);
    }
    assert.deepEqual(await listeners(),initial,'no route listener growth');
    assert.ok(await page.evaluate(()=>window.__motion.pending.size)<=2,'no duplicate idle RAF');
  }
  await page.goBack(); await settled(); assert.equal(path(page.url()),'/writeups');
  await page.goForward(); await settled(); assert.equal(path(page.url()),'/projects');
  console.log('PASS repeated navigation, listener/RAF bounds, Back/Forward');

  const intervals=await blankStroke();
  assert.equal(await page.locator('.liquid-light').count(),1,'one reused wake canvas');
  assert.ok(await page.locator('.liquid-light').evaluate(c=>c.width>1&&c.width<=1024&&c.height<=640));
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('.liquid-light').evaluate(c=>c.width),1,'wake returns to calm');
  const draws=await page.evaluate(()=>window.__motion.wakeDraws); await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.__motion.wakeDraws),draws,'no idle wake drawing');
  results.push({ wakeFrameP95Ms:intervals.sort((a,b)=>a-b)[Math.floor(intervals.length*.95)] });
  console.log('PASS wake activation, bounded buffer, decay and idle stop');

  const expected={projects:.75,about:.3,terminal:.6,contact:.45,writeups:.25};
  for(const [route,intensity] of Object.entries(expected)) {
    await page.goto(base+'/'+route); await page.waitForLoadState('networkidle'); await settled();
    assert.equal(Number(await page.locator('main').getAttribute('data-liquid')),intensity);
  }
  await page.goto(base+'/log/analyzing-http-and-https-traffic-with-wireshark'); await page.waitForLoadState('networkidle'); await settled();
  assert.equal(Number(await page.locator('main').getAttribute('data-liquid')),.12);
  await page.locator('.log-prose p').first().hover(); await page.waitForTimeout(100);
  assert.equal(await page.locator('.liquid-light').count(),0,'no wake over article prose');
  assert.equal(await page.locator('.log-prose [data-page-motion],.log-prose [data-reveal]').count(),0);
  await page.goto(base+'/terminal'); await page.waitForLoadState('networkidle'); await settled();
  await page.locator('input').hover(); assert.equal(await page.locator('.liquid-light').count(),0);
  assert.equal(await page.locator('.context-cursor').getAttribute('data-visible'),'false');
  await page.locator('input').fill('help'); await page.locator('input').press('Enter');
  assert.equal(await page.locator('input').evaluate(el=>el===document.activeElement),true);
  console.log('PASS route wake profiles, protected reading and Terminal input');

  await page.goto(base+'/about#experience'); await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('main[data-page-motion]').count(),0,'hash destination is immediate');
  await page.locator('.site-header a[lang=vi]').click(); await page.waitForFunction(()=>document.documentElement.lang==='vi');
  assert.equal(new URL(page.url()).hash,'#experience'); assert.equal(path(page.url()),'/vi/about');
  assert.equal(await page.locator('.initialization[data-play]').count(),0);
  await page.locator('.site-header a[lang=en]').click(); await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.setViewportSize({width:430,height:812});
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.locator('dialog a[href="/contact"],dialog a[href="/contact/"]').click();
  await page.waitForURL(u=>path(u.href)==='/contact'); await settled();
  assert.equal(await page.locator('dialog[open]').count(),0);
  assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
  await page.getByRole('button',{name:'Menu',exact:true}).click(); await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button',{name:'Menu',exact:true}).evaluate(el=>el===document.activeElement),true);
  for(const link of await page.locator('.contact-record a').all()) assert.ok(await link.getAttribute('href'));
  assert.equal(await page.locator('a[href^="mailto:"]').count(),1);
  assert.equal(await page.locator('a[href$=".pdf"]').getAttribute('target'),'_blank');
  console.log('PASS hash/locale preservation, modal navigation, Escape/focus return, external anchors');

  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto(base+'/about'); await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('main[data-page-motion]').count(),0);
  assert.equal(await page.locator('.global-atmosphere').getAttribute('data-mode'),'static');
  assert.equal(await page.locator('.global-atmosphere').getAttribute('data-running'),'false');
  await blankStroke(); assert.equal(await page.locator('.liquid-light').count(),0);
  assert.equal(await page.locator('[data-arrival-state="armed"],[data-arrival-state="running"]').count(),0);
  await page.emulateMedia({reducedMotion:'no-preference'}); await page.waitForTimeout(500);
  await blankStroke();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('.global-atmosphere').getAttribute('data-running'),'false');
  assert.equal(await page.locator('.liquid-light').evaluate(c=>c.width),1);
  const hidden=await page.evaluate(()=>window.__motion.wakeDraws); await page.waitForTimeout(200); assert.equal(await page.evaluate(()=>window.__motion.wakeDraws),hidden);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await blankStroke(); assert.ok(await page.locator('.liquid-light').evaluate(c=>c.width)>1);
  await page.waitForTimeout(1600);
  console.log('PASS reduced-motion final states, hidden/return cleanup');

  for(const locale of ['en','vi']) for(const width of [375,430,768,1024,1440,1920]) {
    const ctx=await browser.newContext({viewport:{width,height:900},hasTouch:width<1024,isMobile:width<1024});
    await ctx.addInitScript(()=>sessionStorage.setItem('carwyn:initialized','1'));
    const p=await ctx.newPage();observe(p);await p.goto(base+(locale==='vi'?'/vi':'')+'/contact');await p.waitForLoadState('networkidle');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width<1024){await p.locator('main').dispatchEvent('pointermove',{pointerType:'touch',clientX:180,clientY:180});assert.equal(await p.locator('.liquid-light').count(),0);}
    await p.waitForFunction(()=>document.documentElement.style.getPropertyValue('--header-height') && !document.querySelector('main[data-page-motion]') && getComputedStyle(document.querySelector('main')).opacity==='1');
    assert.equal(await p.locator('main').evaluate(el=>getComputedStyle(el).opacity),'1');
    await ctx.close();
  }
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:430,height:812}});const n=await noJS.newPage();
  for(const route of ['/','/projects','/writeups','/about','/terminal','/contact','/vi/about']) {
    await n.goto(base+route); assert.ok(await n.locator('h1').isVisible());assert.equal(await n.locator('main[data-page-motion]').count(),0);assert.equal(await n.locator('main').evaluate(el=>getComputedStyle(el).opacity),'1');
  }await noJS.close();
  console.log('PASS six widths EN/VI, touch gate, no-JS content');
  assert.deepEqual(errors,[]);
  await writeFile('test-results/motion/r11-results.json',JSON.stringify({results,errors,listeners:initial},null,2));
}finally{await browser.close();}

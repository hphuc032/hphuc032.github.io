import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { homepageHashSections, operationSlugs } from './test-fixtures.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? 'playwright');
const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const widths = [[1440,900], [1280,800], [1024,768], [768,1024], [430,812], [390,844], [360,800], [320,800]];
const titles = ['Secure API Gateway', 'Vulnerability Assessment', 'Network Traffic Analysis'];
const tools = [['FastAPI','Keycloak','Kong','JWT','Docker'], ['Kali Linux','Nmap','Metasploit','OWASP ZAP','Burp Suite'], ['Wireshark','TCP/IP','DNS','HTTP / HTTPS']];
const errors = [], measurements = [];
const context = await browser.newContext();
await context.addInitScript(() => sessionStorage.setItem('carwyn:initialized', '1'));
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

async function expectRows(locale) {
  const prefix = locale === 'vi' ? '/vi' : '';
  const rows = page.locator('.projects-index-row');
  assert.equal(await rows.count(), 3);
  assert.deepEqual(await rows.locator('.projects-index-number').allTextContents(), ['01','02','03']);
  assert.deepEqual(await rows.locator('h2').allTextContents(), titles);
  assert.equal(await page.locator('main h1').count(), 1);
  assert.equal(await page.locator('html').getAttribute('lang'), locale);
  assert.equal(await page.title(), locale === 'vi' ? 'Dự án — carwyn.sec' : 'Projects — carwyn.sec');
  assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), locale === 'vi' ? 'vi_VN' : 'en_US');
  const canonical = page.locator('link[rel="canonical"]');
  if (await canonical.count()) {
    assert.equal(new URL(await canonical.getAttribute('href')).pathname.replace(/\/$/, ''), `${prefix}/projects`);
    assert.deepEqual((await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links => links.map(link => link.hreflang))).sort(), ['en','vi','x-default']);
  }
  for (let i = 0; i < 3; i++) {
    const row = rows.nth(i), link = row.locator('.projects-index-link');
    assert.equal(await row.locator('a').count(), 1);
    assert.equal(new URL(await link.getAttribute('href'), base).pathname.replace(/\/$/, ''), `${prefix}/operations/${operationSlugs[i]}`);
    assert.deepEqual(await row.locator('.projects-index-tools li').allTextContents(), tools[i]);
    const accessibleName = await link.evaluate(el => el.getAttribute('aria-labelledby').split(' ').map(id => document.getElementById(id).textContent).join(' '));
    assert.ok(accessibleName.includes(titles[i]));
    assert.ok(accessibleName.includes(locale === 'vi' ? 'XEM CASE STUDY' : 'VIEW CASE'));
    assert.equal(await row.locator('.projects-index-preview').getAttribute('aria-hidden'), 'true');
    assert.ok(await row.locator('.projects-index-description').isVisible());
  }
  const text = await page.locator('main').innerText();
  assert.equal(await rows.nth(2).locator('.projects-index-category').textContent(), locale === 'vi' ? 'AN NINH MẠNG / PHÂN TÍCH' : 'NETWORK SECURITY / ANALYSIS');
  assert.equal(/\b(?:expert|mastery|industry-leading|enterprise-grade|production-proven|detected threats|critical vulnerabilities|fully protected)\b|\d+%|\b(?:RPS|uptime|latency)\b/i.test(text), false);
  assert.ok(text.includes(locale === 'vi' ? 'HTTPS được mã hóa' : 'encrypted HTTPS'));
  assert.equal(await page.locator('.network-object, canvas:not(.global-atmosphere), #operations').count(), 0, 'Projects excludes homepage WebGL and Operations');
  const atmosphere = page.locator('canvas.global-atmosphere');
  assert.equal(await atmosphere.count(), 1, 'exactly one shared R3 atmosphere');
  assert.equal(await atmosphere.getAttribute('data-intensity'), 'medium');
  assert.equal(await atmosphere.getAttribute('aria-hidden'), 'true');
  assert.equal(await atmosphere.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
}

try {
  await mkdir('test-results/projects', { recursive: true });
  for (const locale of ['en','vi']) {
    const prefix = locale === 'vi' ? '/vi' : '';
    for (const [width,height] of widths) {
      await page.setViewportSize({ width,height });
      const response = await page.goto(`${base}${prefix}/projects`);
      assert.equal(response.status(), 200);
      await page.waitForLoadState('networkidle');
      await expectRows(locale);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...document.querySelectorAll('.projects-index-copy h2, .projects-index-category, .projects-index-tools')].some(el => el.scrollWidth > el.clientWidth + 1),
        overlaps: [...document.querySelectorAll('.projects-index-row')].some(row => {
          const number = row.querySelector('.projects-index-number').getBoundingClientRect(), title = row.querySelector('h2').getBoundingClientRect();
          return number.left < title.right && number.right > title.left && number.top < title.bottom && number.bottom > title.top;
        }),
        toolLabelsVisible: [...document.querySelectorAll('.projects-index-tools li')].every(el => el.getBoundingClientRect().width > 0),
        touchTarget: [...document.querySelectorAll('.projects-index-link')].every(el => el.getBoundingClientRect().height >= 44),
      }));
      assert.equal(metrics.overflow, false, `${locale}/${width}: overflow`);
      assert.equal(metrics.clipped, false, `${locale}/${width}: clipped text`);
      assert.equal(metrics.overlaps, false, `${locale}/${width}: number/title overlap`);
      assert.equal(metrics.toolLabelsVisible, true);
      assert.equal(metrics.touchTarget, true);
      measurements.push({ locale,width,height,...metrics });
      await page.screenshot({ path: `test-results/projects/${locale}-${width}.png`, fullPage: true });
    }
    console.log(`PASS ${locale}: 3 ordered projects, truthful copy/tools, localized case links and 8 widths`);
  }

  await page.setViewportSize({ width:1440, height:900 });
  await page.goto(`${base}/projects`); await page.waitForLoadState('networkidle');
  const first = page.locator('.projects-index-link').first();
  const preview = first.locator('.projects-index-preview svg');
  await page.mouse.move(0,0);
  const idle = await preview.evaluate(el => Number(getComputedStyle(el).opacity));
  await first.hover();
  await page.waitForTimeout(300);
  const hovered = await preview.evaluate(el => Number(getComputedStyle(el).opacity));
  assert.ok(hovered > idle, 'hover preview emphasis');
  await page.mouse.move(0,0); await page.waitForTimeout(300);
  await page.locator('.projects-index-link').first().focus();
  assert.ok(await first.evaluate(el => el.matches(':focus-visible')));
  const focus = await first.evaluate(el => ({ width:getComputedStyle(el).outlineWidth, style:getComputedStyle(el).outlineStyle }));
  assert.equal(focus.width, '2px'); assert.equal(focus.style, 'solid');
  await page.waitForTimeout(300);
  assert.equal(await preview.evaluate(el => Number(getComputedStyle(el).opacity)), hovered);
  for (let i = 0; i < 3; i++) {
    if (i) await page.keyboard.press('Tab');
    assert.ok(await page.locator('.projects-index-link').nth(i).evaluate(el => el === document.activeElement));
  }
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.pathname.replace(/\/$/,'') === '/operations/network-traffic-analysis');
  assert.equal(await page.locator('.case-study h1').textContent(), 'Network Traffic Analysis');
  console.log('PASS hover/focus parity, visible outline, Tab order and keyboard case navigation');

  await page.goto(`${base}/projects`);
  await page.emulateMedia({ reducedMotion:'reduce' });
  await first.focus();
  const reduced = await first.evaluate(el => [...el.querySelectorAll('h2, .projects-index-arrow, .projects-index-preview')].every(child => getComputedStyle(child).transform === 'none' && getComputedStyle(child).transitionDuration === '0s'));
  assert.equal(reduced, true); await expectRows('en');
  await page.emulateMedia({ reducedMotion:'no-preference' });
  console.log('PASS reduced motion: content complete, project transforms/transitions disabled');

  const touch = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  await touch.addInitScript(() => sessionStorage.setItem('carwyn:initialized','1'));
  const mobile = await touch.newPage();
  await mobile.goto(`${base}/vi/projects`); await mobile.waitForLoadState('networkidle');
  assert.equal(await mobile.locator('.projects-index-preview').first().isVisible(), false);
  assert.equal(await mobile.locator('.projects-index-description').count(), 3);
  await mobile.locator('.menu-trigger').first().click();
  assert.equal(await mobile.locator('#site-index').evaluate(el => el.open), true);
  await mobile.locator('#site-index .index-links a[href*="/vi/projects"]').click();
  assert.equal(await mobile.locator('#site-index').evaluate(el => el.open), false);
  await mobile.locator('.projects-index-link').first().tap();
  await mobile.waitForURL(url => url.pathname.replace(/\/$/,'') === '/vi/operations/secure-api-gateway');
  assert.equal(await mobile.locator('html').getAttribute('lang'),'vi');
  await touch.close();
  console.log('PASS touch: all copy available without hover, menu and localized case navigation');

  const noJS = await browser.newContext({ javaScriptEnabled:false, viewport:{width:390,height:844} });
  const staticPage = await noJS.newPage();
  await staticPage.goto(`${base}/projects`);
  assert.equal(await staticPage.locator('.projects-index-link').count(),3);
  assert.ok(await staticPage.locator('.projects-index-description').first().isVisible());
  await noJS.close();
  console.log('PASS no-JavaScript: project text and semantic case links present');

  for (const locale of ['en','vi']) {
    const prefix = locale === 'vi' ? '/vi' : '';
    await page.goto(`${base}${prefix}/`); await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('main > section').count(), 9);
    for (const id of homepageHashSections) assert.equal(await page.locator(`#${id}`).count(),1);
    assert.equal(await page.locator('#operations .operation-row').count(),3);
    for (const slug of operationSlugs) {
      const response=await page.goto(`${base}${prefix}/operations/${slug}`); assert.equal(response.status(),200);
      assert.equal(await page.locator('.case-study h1').count(),1);
    }
  }
  console.log('PASS Home structure and all six existing case-study routes');
  assert.deepEqual(errors, [], 'browser console/page errors');
  await writeFile('test-results/projects/measurements.json',JSON.stringify(measurements,null,2));
  console.log('PASS browser console: no errors; screenshots and measurements saved under ignored test-results/projects');
} finally { await browser.close(); }

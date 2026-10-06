import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { writeupPublication, publishedWriteups } from '../src/data/writeup-publication.ts';
import { fixtureArticle } from './lib/writeup-fixtures.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? 'playwright');
const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext();
await context.addInitScript(() => sessionStorage.setItem('carwyn:initialized', '1'));
const page = await context.newPage(), errors = [], measurements = [], remote = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('request', request => { if (/github(?:usercontent)?\.com|hackmd\.io/.test(request.url())) remote.push(request.url()); });
const dimensions = [[1440,900],[1280,800],[1024,768],[768,1024],[430,812],[390,844],[360,800]];
const unpublished = writeupPublication.filter(entry => entry.state !== 'published');
async function noOverflow() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No page overflow');
}
async function visibleFocus(selector) {
  const link = page.locator(selector).first();
  await link.focus();
  const focus = await link.evaluate(element => ({ style: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth }));
  assert.notEqual(focus.style, 'none');
  assert.ok(parseFloat(focus.width) >= 2);
}
try {
  await mkdir('test-results/writeups', { recursive: true });
  for (const locale of ['en','vi']) for (const [width,height] of dimensions) {
    await page.setViewportSize({ width,height });
    const prefix = locale === 'vi' ? '/vi' : '';
    const response = await page.goto(`${base}${prefix}/writeups/`);
    assert.equal(response.status(), 200);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('main h1').count(), 1);
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(await page.title(), 'Writeups — carwyn.sec');
    assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), locale === 'vi' ? 'vi_VN' : 'en_US');
    const canonical = page.locator('link[rel="canonical"]');
    if (await canonical.count()) {
      assert.equal(new URL(await canonical.getAttribute('href')).pathname.replace(/\/$/, ''), `${prefix}/writeups`);
      assert.deepEqual((await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links => links.map(link => link.hreflang))).sort(), ['en','vi','x-default']);
    }
    assert.equal(await page.locator('main canvas, main video, .network-object').count(), 0);
    assert.equal(await page.locator('.writeups-row').count(), publishedWriteups().length);
    const text = await page.locator('main').innerText();
    for (const entry of unpublished) assert.ok(!text.includes(entry.title), entry.slug);
    assert.doesNotMatch(text, /pending|review|đang duyệt|chờ duyệt/i);
    if (publishedWriteups().length === 0) assert.ok(text.includes(locale === 'vi' ? 'Chưa có bài giải CTF nào được xuất bản.' : 'No CTF writeups are published yet.'));
    const log = page.locator('.writeups-index a').filter({ hasText: 'SECURITY LOG' });
    assert.equal(new URL(await log.getAttribute('href'), base).pathname.replace(/\/$/, ''), `${prefix}/log`);
    await noOverflow();
    await visibleFocus('.writeups-index a');
    measurements.push({ type: 'index', locale, width, height, overflow: false });
    if ([1440,390].includes(width)) {
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      await page.screenshot({ path: `test-results/writeups/index-${locale}-${width}.png`, fullPage: true });
    }
  }
  for (const slug of ['not-a-real-entry', ...unpublished.map(entry => entry.slug)]) for (const prefix of ['', '/vi']) {
    const result = await context.request.get(`${base}${prefix}/writeups/${slug}/`);
    assert.equal(result.status(), 404);
  }
  // Capture real production styles, then render the SAME article structure with
  // an in-memory fixture using setContent. No fixture route/source is published.
  const stylesheetUrls = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => link.href));
  const classes = await page.evaluate(() => ({ html: document.documentElement.className, body: document.body.className }));
  const styles = [];
  for (const url of stylesheetUrls) {
    const css = await (await context.request.get(url)).text();
    // Inlined fixture CSS needs original stylesheet-relative font URLs.
    styles.push(css.replace(/url\((["']?)([^)"']+)\1\)/g, (_, quote, asset) => `url("${new URL(asset, url).href}")`));
  }
  styles.push(await readFile('src/styles/writeups.css', 'utf8'));
  for (const language of ['en','vi','en-vi']) for (const [width,height] of dimensions) {
    await page.setViewportSize({ width,height });
    await page.setContent(`<!doctype html><html lang="en" class="${classes.html}"><head><link rel="icon" href="${new URL('/favicon.svg', base).href}"><style>${styles.join('\n')}</style></head><body class="${classes.body}">${fixtureArticle(language)}</body></html>`);
    assert.equal(await page.locator('article').count(), 1);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.writeup-body').getAttribute('lang'), language === 'en-vi' ? 'mul' : language);
    assert.equal(await page.locator('.writeup-body ul').first().evaluate(element => getComputedStyle(element).listStyleType), 'disc');
    assert.equal(await page.locator('script, iframe, object, canvas, video').count(), 0);
    assert.ok((await page.locator('pre').last().innerText()).includes('<script>alert(1)</script>'));
    await noOverflow();
    const code = await page.locator('pre').first().evaluate(element => ({ overflow: getComputedStyle(element).overflowX, long: element.scrollWidth > element.clientWidth, selectable: getComputedStyle(element.querySelector('code')).userSelect }));
    assert.equal(code.overflow, 'auto'); assert.equal(code.long, true); assert.equal(code.selectable, 'text');
    const table = await page.locator('.writeup-table-scroll').evaluate(element => ({ overflow: getComputedStyle(element).overflowX, long: element.scrollWidth > element.clientWidth }));
    assert.equal(table.overflow, 'auto'); assert.equal(table.long, true);
    const maxBody = await page.locator('.writeup-body').evaluate(element => element.getBoundingClientRect().width);
    assert.ok(maxBody <= 850, 'Comfortable reading width');
    await visibleFocus('.writeup-opening a');
    measurements.push({ type: 'fixture', language, width, height, overflow: false, codeScroll: true, tableScroll: true });
    if (language === 'en' && [1440,390].includes(width)) await page.screenshot({ path: `test-results/writeups/article-fixture-${width}.png`, fullPage: true });
  }
  await context.newPage().then(async reduced => {
    await reduced.emulateMedia({ reducedMotion: 'reduce' });
    await reduced.goto(`${base}/writeups/`);
    const transition = await reduced.locator('.writeups-index a').first().evaluate(element => getComputedStyle(element).transitionDuration);
    assert.ok(transition.split(',').every(value => parseFloat(value) <= 0.01));
    await reduced.close();
  });
  assert.deepEqual(errors, []); assert.deepEqual(remote, []);
  await writeFile('test-results/writeups/measurements.json', `${JSON.stringify(measurements, null, 2)}\n`);
  console.log(`PASS Writeups EN/VI index and safe fixture articles at ${dimensions.length} viewports; 404, focus, language, code/table scroll, no remote content requests`);
} finally { await browser.close(); }

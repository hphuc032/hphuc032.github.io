import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Read canonical server catalogs with their server-only condition, without
// weakening the application's client boundary or copying factual test arrays.
const catalogs = JSON.parse(execFileSync(process.execPath, ['--conditions=react-server', '--input-type=module', '--eval', `
  import { profile } from './src/data/profile.ts';
  import { publishedExpertise } from './src/data/expertise.ts';
  import { publishedExperience } from './src/data/experience.ts';
  import { publishedAchievements } from './src/data/achievements.ts';
  import { publicCv } from './src/data/contact.ts';
  console.log(JSON.stringify({profile, publicCv, locales: Object.fromEntries(['en','vi'].map(locale => [locale, {
    expertise: publishedExpertise(locale), experience: publishedExperience(locale), achievements: publishedAchievements(locale)
  }]))}));
`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ?? 'playwright');
const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const dimensions = [[1920,1080],[1440,900],[1280,800],[1024,768],[768,1024],[430,812],[390,844],[360,800],[320,800]];
const cvHash = 'f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9';
assert.equal(createHash('sha256').update(await readFile(`public${catalogs.publicCv.url}`)).digest('hex'), cvHash);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext();
const errors = [], measurements = [];
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

async function review(locale, width, height) {
  const records = catalogs.locales[locale];
  await page.setViewportSize({ width, height });
  const response = await page.goto(`${base}${locale === 'vi' ? '/vi' : ''}/about/`);
  assert.equal(response.status(), 200);
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('html').getAttribute('lang'), locale);
  assert.equal(await page.locator('main h1').count(), 1);
  assert.equal(await page.locator('main > section').count(), 5);
  for (const id of ['identity','expertise','experience','achievements','cv']) assert.equal(await page.locator(`main > #${id}`).count(), 1);
  assert.equal(await page.locator('.identity-name').getAttribute('aria-label'), catalogs.profile.name);
  assert.ok((await page.locator('.identity-biography').innerText()).includes(catalogs.profile.content[locale].value.biography));
  assert.equal(await page.locator('.identity-portrait img').getAttribute('alt'), catalogs.profile.portrait.alt[locale].value);
  assert.equal(await page.locator('.identity-portrait img').evaluate(image => image.complete && image.naturalWidth > 0), true);
  assert.deepEqual(await page.locator('.expertise-row h3').allTextContents(), records.expertise.map(item => item.content.title));
  assert.equal(records.expertise.length, 4);
  assert.deepEqual(await page.locator('.expertise-evidence li').allTextContents(), records.expertise.flatMap(item => item.record.toolIds));
  assert.equal(await page.locator('.experience-record').count(), records.experience.length);
  for (const { record, content } of records.experience) {
    const text = await page.locator('.experience-list').innerText();
    assert.ok(text.includes(content.role));
    if (record.organization) assert.ok(text.includes(record.organization));
  }
  assert.equal(await page.locator('.achievement-record').count(), records.achievements.length);
  assert.equal(await page.locator('.achievement-group').count(), 4);
  for (const record of records.achievements) {
    const content = record.content[locale].value;
    assert.ok((await page.locator('.achievements').innerText()).toLocaleLowerCase(locale).includes(content.title.toLocaleLowerCase(locale)));
  }
  assert.match(await page.locator('[data-status="in-progress"]').innerText(), locale === 'en' ? /in progress/i : /đang học/i);
  assert.match(await page.locator('[data-status="participated"]').innerText(), locale === 'en' ? /qualifying round participant/i : /tham dự vòng sơ khảo/i);
  assert.doesNotMatch(await page.locator('[data-status="participated"]').innerText(), /finalist|winner|champion|final round|chung kết|quán quân/i);
  assert.match(await page.locator('[data-status="top-4"]').innerText(), /Top 4/i);
  assert.doesNotMatch(await page.locator('[data-status="top-4"]').innerText(), /individual|team result|champion|cá nhân|đồng đội/i);
  assert.doesNotMatch(await page.locator('main').innerText(), /\b(?:expert|mastery|advanced|beginner|intermediate|rating)\b|\d\s*%/i);
  assert.equal(await page.locator('main [role="progressbar"], main meter').count(), 0);
  assert.equal(await page.locator('main canvas, main video, .network-object, .pointer-atmosphere').count(), 0);
  assert.ok(await page.locator('canvas').count() <= 1, 'Only existing global atmosphere is permitted');
  const cv = page.locator('.about-cv a');
  assert.equal(new URL(await cv.getAttribute('href'), base).pathname, catalogs.publicCv.url);
  assert.ok((await cv.innerText()).includes(locale === 'vi' ? 'XEM CV' : 'VIEW CV'));
  await cv.focus();
  const focus = await cv.evaluate(element => {
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    return { focused: element === document.activeElement, outline: style.outlineStyle, width: parseFloat(style.outlineWidth), height: rect.height };
  });
  assert.equal(focus.focused, true); assert.notEqual(focus.outline, 'none'); assert.ok(focus.width >= 2); assert.ok(focus.height >= 44);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${locale} ${width} overflow`);
  const nameFits = await page.locator('.identity-name').evaluate(element => element.scrollWidth <= element.clientWidth);
  assert.equal(nameFits, true, 'Real name must fit without clipping');
  measurements.push({ locale, width, height, overflow: false, focus: true, canvas: await page.locator('canvas').count() });
  if ([1440,430].includes(width)) {
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0,0); });
    await page.screenshot({ path: `test-results/about/${locale}-${width}-full.png`, fullPage: true });
    await page.screenshot({ path: `test-results/about/${locale}-${width}-opening.png` });
    for (const id of ['expertise','experience','achievements','cv']) {
      await page.locator(`#${id}`).screenshot({ path: `test-results/about/${locale}-${width}-${id}.png`, style: '.site-header,.system-status,.skip-link { visibility: hidden !important; }' });
    }
  }
}

try {
  await mkdir('test-results/about', { recursive: true });
  for (const locale of ['en','vi']) for (const [width,height] of dimensions) await review(locale,width,height);
  const pdf = await context.request.get(`${base}${catalogs.publicCv.url}`);
  assert.equal(pdf.status(),200); assert.equal(createHash('sha256').update(await pdf.body()).digest('hex'),cvHash);
  await page.setViewportSize({ width:1440, height:900 });
  for (const locale of ['en','vi']) {
    await page.goto(`${base}${locale === 'vi' ? '/vi' : ''}/about/`);
    const target = locale === 'vi' ? '/about' : '/vi/about';
    const switcher = page.locator('.site-header .language-selector a').filter({ hasText: locale === 'vi' ? 'EN' : 'VI' });
    await switcher.click(); await page.waitForURL(url => url.pathname.replace(/\/$/,'') === target);
    await page.waitForLoadState('networkidle');
  }
  for (const locale of ['en','vi']) {
    const staticContext = await browser.newContext({ javaScriptEnabled: false });
    const nojs = await staticContext.newPage();
    await nojs.goto(`${base}${locale === 'vi' ? '/vi' : ''}/about/`);
    assert.equal(await nojs.locator('main > section').count(),5);
    assert.equal(await nojs.locator('.about-cv a').isVisible(),true);
    assert.equal(await nojs.locator('.achievement-record').count(),4);
    await staticContext.close();
    await page.emulateMedia({ reducedMotion:'reduce' });
    await review(locale,430,812);
    const atmosphere = page.locator('.global-atmosphere');
    assert.equal(await atmosphere.count(),1);
    assert.equal(await atmosphere.getAttribute('data-mode'),'static');
    assert.equal(await atmosphere.getAttribute('data-running'),'false');
    const motion = await page.locator('.identity-name').evaluate(element => ({ opacity: getComputedStyle(element).opacity, transform: getComputedStyle(element).transform }));
    assert.deepEqual(motion,{ opacity:'1', transform:'none' });
    await page.emulateMedia({ reducedMotion:'no-preference' });
  }
  assert.deepEqual(errors,[]);
  await writeFile('test-results/about/measurements.json',`${JSON.stringify(measurements,null,2)}\n`);
  console.log('PASS About EN/VI: 9 viewports, canonical facts, truthful statuses, CV hash, focus, locale pairs, no-JS, reduced motion, no extra Canvas/WebGL, no browser errors');
} finally { await browser.close(); }

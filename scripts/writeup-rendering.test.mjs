import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { publishedWriteups, writeupPublication } from '../src/data/writeup-publication.ts';
import { renderMarkdown, safeImage, safeLink } from '../src/lib/writeups/render-markdown.ts';
import { articleStaticParams, articleSitemapPaths, publishedSummaries, readPublishedEntry, readPublishedWriteup } from './lib/writeup-publication.mjs';
import { contentRoot, inspectMarkdown, metadata, json, root, sha256 } from './lib/writeup-pipeline.mjs';
import { fixtureArticle, fixtureMarkdown, fixturePolicy } from './lib/writeup-fixtures.mjs';
import { prepareWriteupAssets } from './prepare-writeup-assets.mjs';
import nextConfig from '../next.config.mjs';

const render = (text, policy = fixturePolicy) => renderToStaticMarkup(renderMarkdown(text, policy));
test('canonical publication boundary excludes every draft/review record before filesystem IO', async () => {
  const params = articleStaticParams(), summaries = publishedSummaries(), sitemap = articleSitemapPaths();
  assert.deepEqual(params, publishedWriteups().map(({ slug }) => ({ slug })));
  const publicRoutes = JSON.parse(await readFile('src/data/writeup-public-routes.json', 'utf8'));
  assert.deepEqual(publicRoutes, params.map(({ slug }) => slug));
  for (const entry of writeupPublication.filter(item => item.state !== 'published')) {
    assert.ok(!summaries.some(item => item.slug === entry.slug));
    assert.ok(!params.some(item => item.slug === entry.slug));
    assert.ok(!sitemap.some(item => item.en.includes(entry.slug) || item.vi.includes(entry.slug)));
    assert.equal(await readPublishedWriteup(entry.slug), undefined);
    await assert.rejects(readPublishedEntry(entry), /Unpublished/);
  }
  for (const slug of ['not-a-real-entry', '../source', '/etc/passwd', '%2e%2e', 'a\\b']) assert.equal(await readPublishedWriteup(slug), undefined);
});

test('route discovery follows publication and zero-published preparation removes stale assets without network', async () => {
  const extensions = nextConfig('phase-production-build').pageExtensions;
  assert.equal(extensions.includes('writeup.tsx'), publishedWriteups().length > 0);
  if (publishedWriteups().length > 0) return; // Positive IO is separately fixture-tested below.
  const destination = join(root, 'public/generated/writeups');
  const routeFile = join(root, 'src/data/writeup-public-routes.json');
  const routesBefore = await readFile(routeFile, 'utf8');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('No external request allowed'); };
  try {
    await mkdir(join(destination, 'stale'), { recursive: true });
    await writeFile(join(destination, 'stale/image.png'), 'stale');
    await prepareWriteupAssets();
    await assert.rejects(readFile(join(destination, 'stale/image.png')), { code: 'ENOENT' });
    await prepareWriteupAssets();
    assert.equal(await readFile(routeFile, 'utf8'), routesBefore, 'Idempotent client publication artifact');
    const target = join(root, 'test-results/writeup-junction-target'); await mkdir(target, { recursive: true });
    await symlink(target, destination, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(prepareWriteupAssets(), /Symlink\/junction/);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(destination, { recursive: true, force: true });
  }
});

test('raw HTML is dropped; fenced HTML, JSX and code remain inert text', () => {
  for (const text of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<iframe src="https://example.com"></iframe>', '<svg onload="x"></svg>', '<object data="x"></object>']) {
    const html = render(text);
    assert.doesNotMatch(html, /<(?:script|img|iframe|svg|object)\b/i);
  }
  const html = render('```html\n<script>alert(1)</script>\n```\n\n```jsx\n<Component run={() => process.exit(1)} />\n```');
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;Component/);
  assert.doesNotMatch(html, /<script|<Component/);
});

test('parsed inline, reference and autolinks reject unsafe/encoded protocols', () => {
  for (const target of ['javascript:alert(1)', 'vbscript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'javascript%3Aalert(1)', '%6aavascript:alert(1)', 'java&#x73;cript:alert(1)', 'javascript&colon;alert(1)', 'java&Tab;script:alert(1)', '//evil.example/x', 'http://127.0.0.1/x', 'http://2130706433/x', 'http://[::1]/x', 'http://[::ffff:127.0.0.1]/x']) {
    assert.throws(() => render(`[unsafe](${target})`), undefined, target);
    assert.throws(() => render(`[unsafe][ref]\n\n[ref]: ${target}`), undefined, target);
  }
  assert.throws(() => render('<javascript:alert>'));
  assert.throws(() => render('[x](https://user:password@example.com)'));
  assert.throws(() => safeLink('/unapproved/', fixturePolicy.internalPaths));
  assert.throws(() => safeLink('../source.md', fixturePolicy.internalPaths));
  assert.match(render('[unknown](README.md)'), /<span>unknown<\/span>/);
  const html = render('[external](https://example.com/test) [local](/log/) [fragment](#analysis)');
  assert.match(html, /href="https:\/\/example.com\/test" rel="noopener noreferrer"/);
  assert.match(html, /href="\/log\/"/);
  assert.match(html, /href="#analysis"/);
});

test('remote, missing, escaping and unapproved images fail; reviewed local images render', () => {
  for (const target of ['https://example.com/a.png', '//example.com/a.png', 'data:image/png,x', '../a.png', '%2e%2e/a.png', '/a.png', 'missing.png', 'a.svg']) assert.throws(() => render(`![alt](${target})`), undefined, target);
  assert.throws(() => render('![alt][image]\n\n[image]: https://example.com/a.png'));
  const approved = { ...fixturePolicy, approvedImages: [{ sourcePath: 'Fixture/a.png', publicUrl: '/generated/writeups/test-fixture/Fixture/a.png' }] };
  assert.match(render('![Reviewed screenshot](a.png)', approved), /src="\/generated\/writeups\/test-fixture\/Fixture\/a.png" alt="Reviewed screenshot" loading="lazy"/);
  assert.match(render('![](a.png)', approved), /alt=""/);
  assert.throws(() => safeImage('a.png', null, approved));
  assert.throws(() => render('![alt](a.png)', { ...approved, approvedImages: [{ ...approved.approvedImages[0], publicUrl: '/generated/writeups/test-fixture/../../escape.png' }] }));
});

test('normal Markdown preserves technical text, tables, lists and one article H1', () => {
  const html = render(fixtureMarkdown);
  for (const tag of ['h2', 'h3', 'p', 'strong', 'em', 'ul', 'li', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'hr']) assert.match(html, new RegExp(`<${tag}\\b`));
  assert.match(html, /nmap -sV example/);
  assert.match(html, /CTF\{fixture_only\}/);
  assert.match(html, /class="language-sh"/);
  assert.match(html, /class="writeup-table-scroll" tabindex="0"/);
  for (const [language, expected] of [['en', 'en'], ['vi', 'vi'], ['en-vi', 'mul']]) {
    const article = fixtureArticle(language);
    assert.equal((article.match(/<h1\b/g) ?? []).length, 1);
    assert.match(article, /<article aria-labelledby="writeup-title">/);
    assert.match(article, new RegExp(`class="writeup-body" lang="${expected}"`));
  }
});

test('local published IO verifies normalized hashes, provenance, asset allowlist and junctions', async () => {
  const entry = { id: `render-test-${process.pid}`, slug: `render-test-${process.pid}`, source: { repository: 'hphuc032/ctf-writeups', ref: 'a'.repeat(40), path: 'Fixture/README.md' }, state: 'published', title: 'Fixture', event: 'Fixture', category: 'web', language: 'en', assetPaths: ['Fixture/a.png'] };
  const directory = join(contentRoot, entry.slug), imageDirectory = join(directory, 'assets/Fixture');
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT9sAAAAASUVORK5CYII=', 'base64');
  const text = '# Fixture\n\n![Reviewed screenshot](a.png)\n';
  const assets = [{ sourcePath: 'Fixture/a.png', localPath: 'assets/Fixture/a.png', sha256: sha256(image), bytes: image.length }];
  const meta = metadata(entry, text, Buffer.from(text), inspectMarkdown(text, entry), assets);
  try {
    await mkdir(imageDirectory, { recursive: true });
    await writeFile(join(directory, 'source.md'), text);
    await writeFile(join(directory, 'source-meta.json'), json(meta));
    await writeFile(join(imageDirectory, 'a.png'), image);
    const loaded = await readPublishedEntry(entry);
    assert.equal(loaded.markdown, text);
    assert.equal(loaded.approvedImages[0].publicUrl, `/generated/writeups/${entry.slug}/Fixture/a.png`);
    await writeFile(join(imageDirectory, 'a.png'), Buffer.concat([image, Buffer.from('changed')]));
    await assert.rejects(readPublishedEntry(entry), /hashes differ/);
    await writeFile(join(imageDirectory, 'a.png'), image);
    await writeFile(join(directory, 'source.md'), `${text}changed`);
    await assert.rejects(readPublishedEntry(entry), /hash mismatch/);
    await writeFile(join(directory, 'source.md'), text);
    await rm(join(directory, 'assets'), { recursive: true });
    const target = join(directory, 'elsewhere'); await mkdir(join(target, 'Fixture'), { recursive: true });
    await writeFile(join(target, 'Fixture/a.png'), image);
    await symlink(target, join(directory, 'assets'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(readPublishedEntry(entry), /Symlink/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

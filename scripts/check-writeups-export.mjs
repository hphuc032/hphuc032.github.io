import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { publishedWriteups, writeupPublication } from '../src/data/writeup-publication.ts';
import { publishedRoutes } from './test-fixtures.mjs';
import { contentRoot, root, safeLocal } from './lib/writeup-pipeline.mjs';

async function files(directory) {
  let children;
  try { children = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const result = [];
  for (const child of children) {
    const path = join(directory, child.name);
    if (child.isDirectory()) result.push(...await files(path));
    else if (child.isFile()) result.push(path);
    else throw new Error('Unexpected exported file type');
  }
  return result;
}
const unpublished = writeupPublication.filter(entry => entry.state !== 'published');
const output = await files('out');
assert.ok(output.length, 'Static export must exist');
const forbidden = ['source.md', 'source-meta.json', 'src/content/writeups', root, contentRoot, ...unpublished.flatMap(entry => [entry.slug, entry.title, entry.source.path]).filter(Boolean)];
for (const entry of unpublished) {
  const source = await readFile(await safeLocal(join(contentRoot, entry.slug, 'source.md')), 'utf8');
  forbidden.push(source, JSON.stringify(source).slice(1, -1), ...(source.match(/\b[A-Za-z]+\{[^}\n]+\}/g) ?? []));
}
for (const file of output) {
  assert.ok(!/source(?:-meta\.json|\.md)$/.test(file));
  if (/\.(?:html|js|json|txt|md|map)$/.test(file)) {
    const text = await readFile(file, 'utf8');
    for (const value of forbidden) assert.ok(!text.includes(value), `${file}: unpublished/source leak (${value})`);
  }
}
const sitemap = await readFile('out/sitemap.xml', 'utf8');
for (const entry of unpublished) assert.ok(!sitemap.includes(entry.slug));
// Next's existing 404/_not-found artifacts are error documents, not published
// pages. Exclude only those two known framework paths, never arbitrary routes.
const errorPages = new Set([join('out', '404/index.html'), join('out', '_not-found/index.html')]);
for (const file of errorPages) if (output.includes(file)) assert.match(await readFile(file, 'utf8'), /noindex/);
const actual = output.filter(file => /(?:^|[\\/])index\.html$/.test(file) && !errorPages.has(file));
const expected = publishedRoutes.map(path => join('out', path, 'index.html'));
assert.deepEqual(actual.sort(), expected.sort(), 'Exact independently expected public route catalog');
const assets = await files('public/generated/writeups');
assert.equal(assets.length, publishedWriteups().reduce((count, entry) => count + entry.assetPaths.length, 0));
for (const entry of unpublished) assert.ok(!assets.some(file => file.includes(entry.slug)));

// A plain static host, no Next fallback/rewrite, proves review/unknown URLs 404.
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://static.test').pathname;
    assert.ok(/^\/(?:vi\/)?writeups\/[a-z0-9-]+\/$/.test(path));
    const bytes = await readFile(join('out', path, 'index.html'));
    response.end(bytes);
  } catch (error) { response.statusCode = error.code === 'ENOENT' ? 404 : 400; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  for (const slug of ['not-a-real-entry', ...unpublished.map(entry => entry.slug)]) for (const prefix of ['', '/vi']) {
    const path = `${prefix}/writeups/${slug}/`;
    const result = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
    assert.equal(result.status, 404, path);
    console.log(`PASS static ${path}: 404`);
  }
} finally { await new Promise(resolve => server.close(resolve)); }
console.log(`PASS ${actual.length} public routes; published-only sitemap/assets; no source, metadata, candidate or client-bundle leaks`);

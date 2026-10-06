import { lstat, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { publishedWriteups } from '../src/data/writeup-publication.ts';
import { renderMarkdown } from '../src/lib/writeups/render-markdown.ts';
import { root, relativeWithin } from './lib/writeup-pipeline.mjs';
import { readPublishedEntry } from './lib/writeup-publication.mjs';

const destination = join(root, 'public/generated/writeups');
const routeFile = join(root, 'src/data/writeup-public-routes.json');
// Protect the generated directory, its parents and ALL old descendants before
// cleanup. Junctions/symlinks are refused rather than followed or deleted through.
async function safeDestination(path) {
  relativeWithin(destination, path);
  let cursor = root;
  for (const part of relativeWithin(root, path).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try { if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Symlink/junction in public image destination'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
async function inspectOld(path) {
  await safeDestination(path);
  let children;
  try { children = await readdir(path, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const child of children) {
    const next = join(path, child.name);
    await safeDestination(next);
    if (child.isDirectory()) await inspectOld(next);
    else if (!child.isFile()) throw new Error('Unsupported generated file');
  }
}

export async function prepareWriteupAssets() {
  const entries = publishedWriteups(), writes = [];
  // Validate the entire published batch before any mutation. There is no network.
  for (const entry of entries) {
    const result = await readPublishedEntry(entry);
    renderToStaticMarkup(renderMarkdown(result.markdown, {
      sourcePath: entry.source.path, approvedImages: result.approvedImages,
      internalPaths: ['/', '/vi/', '/writeups/', '/vi/writeups/', '/log/', '/vi/log/', ...entries.flatMap(item => [`/writeups/${item.slug}/`, `/vi/writeups/${item.slug}/`])],
    }));
    for (const asset of result.approvedImages) {
      const path = join(destination, entry.slug, asset.sourcePath);
      await safeDestination(path);
      writes.push([path, asset.bytes]);
    }
  }
  await inspectOld(destination);
  // This namespace belongs exclusively to R7; stale published/review assets
  // must disappear when publication changes. Never copy source or metadata.
  await rm(destination, { recursive: true, force: true });
  for (const [path, bytes] of writes) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  const routes = `${JSON.stringify(entries.map(({ slug }) => slug), null, 2)}\n`;
  if (await readFile(routeFile, 'utf8') !== routes) await writeFile(routeFile, routes);
  console.log(`PASS prepared ${entries.length} published writeups; ${writes.length} approved public images; no remote request`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { await prepareWriteupAssets(); }
  catch (error) { console.error(`FAIL prepare:writeups: ${error.message}`); process.exitCode = 1; }
}

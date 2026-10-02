import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { publishedWriteups } from '../../src/data/writeup-publication.ts';
import { contentRoot, inspectMarkdown, json, metadata, normalizeMarkdown, safeLocal, sha256, validateManifest, verifyImage } from './writeup-pipeline.mjs';

// Build/server IO only. No URL parameter can become a filesystem path here.
export function publishedRecord(slug) {
  return publishedWriteups().find(entry => entry.slug === slug);
}
export const publishedSummaries = () => publishedWriteups().map(publicSummary);
export const articleStaticParams = () => publishedWriteups().map(({ slug }) => ({ slug }));
export const articlePath = (slug, locale) => `${locale === 'vi' ? '/vi' : ''}/writeups/${slug}`;
export const articleSitemapPaths = () => publishedWriteups().map(({ slug }) => ({ en: articlePath(slug, 'en'), vi: articlePath(slug, 'vi') }));

export async function readPublishedEntry(entry) {
  assert.equal(entry.state, 'published', 'Unpublished source must not be read for rendering');
  validateManifest([entry]);
  const directory = join(contentRoot, entry.slug);
  const source = await readFile(await safeLocal(join(directory, 'source.md')));
  const meta = JSON.parse(await readFile(await safeLocal(join(directory, 'source-meta.json')), 'utf8'));
  const markdown = normalizeMarkdown(source);
  assert.ok(Buffer.from(markdown).equals(source), 'Source must already be normalized');
  const findings = inspectMarkdown(markdown, entry);
  assert.deepEqual(findings.errors, [], 'Published source has blocked/unresolved findings');
  assert.equal(meta.sourceSha256, sha256(source), 'Source hash mismatch');
  assert.match(meta.upstreamSha256, /^[a-f0-9]{64}$/);
  const assets = [], approvedImages = [];
  for (const path of entry.assetPaths) {
    const localPath = `assets/${path}`;
    const bytes = await readFile(await safeLocal(join(directory, localPath)));
    verifyImage(bytes, path);
    assets.push({ sourcePath: path, localPath, sha256: sha256(bytes), bytes: bytes.length });
    approvedImages.push({ sourcePath: path, publicUrl: `/generated/writeups/${entry.slug}/${path}`, bytes });
  }
  const expected = metadata(entry, markdown, Buffer.alloc(0), findings, assets);
  expected.upstreamSha256 = meta.upstreamSha256;
  assert.equal(json(meta), json(expected), 'Source provenance/findings/asset hashes differ from R6');
  return { markdown, approvedImages };
}

export async function readPublishedWriteup(slug) {
  const entry = publishedRecord(slug);
  if (!entry) return undefined;
  return { publication: publicSummary(entry), ...await readPublishedEntry(entry) };
}

// Deliberately omit source provenance, state, findings and filesystem information.
export function publicSummary(entry) {
  assert.equal(entry.state, 'published');
  validateManifest([entry]);
  return { slug: entry.slug, title: entry.title, event: entry.event, category: entry.category, language: entry.language };
}

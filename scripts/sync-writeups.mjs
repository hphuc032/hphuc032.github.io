import { join } from 'node:path';
import { contentRoot, inspectMarkdown, json, limits, metadata, normalizeMarkdown, sha256, sourceUrl, safeLocal, validateManifest, verifyImage, writeChanged } from './lib/writeup-pipeline.mjs';

async function download(entry, path, limit) {
  const response = await fetch(sourceUrl(entry, path), { redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (response.status !== 200) throw new Error(`Source ${entry.slug} ${path}: HTTP ${response.status}; local source retained`);
  if (Number(response.headers.get('content-length')) > limit) throw new Error('Source exceeds byte limit');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) { throw new Error('Source exceeds byte limit'); }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

try {
  if (process.argv.slice(2).some(arg => arg !== '--dry-run')) throw new Error('Only --dry-run is accepted; paths come exclusively from manifest');
  const dryRun = process.argv.includes('--dry-run');
  const entries = validateManifest();
  const writes = [];
  let downloadedBytes = 0;
  const addBytes = bytes => {
    downloadedBytes += bytes.length;
    if (downloadedBytes > limits.batch) throw new Error('Sync batch exceeds 64 MiB; split the allowlist batch');
  };
  // Prepare/validate the ENTIRE batch before touching any destination.
  for (const entry of entries) {
    console.log(`SOURCE ${entry.slug} ${entry.source.ref} ${entry.source.path} (${entry.state})`);
    const raw = await download(entry, entry.source.path, limits.markdown);
    addBytes(raw);
    const text = normalizeMarkdown(raw), findings = inspectMarkdown(text, entry);
    if (findings.errors.length) throw new Error(`${entry.slug}: ${findings.errors.join('; ')}`);
    findings.warnings.forEach(warning => console.log(`REVIEW ${entry.slug}: ${warning}`));
    const assets = [];
    for (const path of entry.assetPaths) {
      const bytes = await download(entry, path, limits.image); addBytes(bytes); verifyImage(bytes, path);
      const localPath = `assets/${path}`;
      assets.push({ sourcePath: path, localPath, sha256: sha256(bytes), bytes: bytes.length });
      writes.push([join(contentRoot, entry.slug, localPath), bytes]);
    }
    writes.push([join(contentRoot, entry.slug, 'source.md'), Buffer.from(text)]);
    writes.push([join(contentRoot, entry.slug, 'source-meta.json'), Buffer.from(json(metadata(entry, text, raw, findings, assets)))]);
  }
  for (const [path] of writes) await safeLocal(path);
  let changed = 0;
  for (const [path, bytes] of writes) if (await writeChanged(path, bytes, dryRun) !== 'unchanged') changed++;
  console.log(`${dryRun ? 'DRY RUN' : 'SYNC'}: ${entries.length} sources, ${changed} changed files; ${dryRun ? 'no files written' : 'review source diff before publication'}`);
} catch (error) { console.error(`FAIL sync:writeups: ${error.message}`); process.exitCode = 1; }

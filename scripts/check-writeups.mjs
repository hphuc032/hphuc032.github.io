import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { contentRoot, inspectMarkdown, json, localFiles, metadata, normalizeMarkdown, safeLocal, sha256, validateManifest, verifyImage } from './lib/writeup-pipeline.mjs';

try {
  const entries = validateManifest(), expected = new Set();
  for (const entry of entries) {
    const directory = join(contentRoot, entry.slug);
    const source = await readFile(await safeLocal(join(directory, 'source.md')));
    const meta = JSON.parse(await readFile(await safeLocal(join(directory, 'source-meta.json')), 'utf8'));
    const text = normalizeMarkdown(source), findings = inspectMarkdown(text, entry);
    assert.equal(Buffer.from(text).equals(source), true, 'Local source must already be normalized');
    assert.deepEqual(findings.errors, [], `${entry.slug}: blocked Markdown`);
    assert.equal(meta.sourceSha256, sha256(source), `${entry.slug}: source hash mismatch`);
    assert.match(meta.upstreamSha256, /^[a-f0-9]{64}$/);
    const assets = [];
    for (const path of entry.assetPaths) {
      const localPath = `assets/${path}`, full = await safeLocal(join(directory, localPath));
      const bytes = await readFile(full); verifyImage(bytes, path); expected.add(full);
      assets.push({ sourcePath: path, localPath, sha256: sha256(bytes), bytes: bytes.length });
    }
    const expectedMeta = metadata(entry, text, Buffer.alloc(0), findings, assets);
    expectedMeta.upstreamSha256 = meta.upstreamSha256;
    assert.equal(json(meta), json(expectedMeta), `${entry.slug}: provenance/findings/asset metadata mismatch`);
    expected.add(join(directory, 'source.md')); expected.add(join(directory, 'source-meta.json'));
    findings.warnings.forEach(warning => console.log(`REVIEW ${entry.slug}: ${warning}`));
    console.log(`PASS ${entry.slug}: local hash, provenance, Markdown and asset checks (${entry.state})`);
  }
  assert.deepEqual(await localFiles(), [...expected].sort(), 'Stale/unallowlisted local files: remove explicitly after review');
  console.log(`PASS ${entries.length} allowlisted local sources; ${entries.filter(entry => entry.state === 'published').length} published; no network request or route generation`);
} catch (error) { console.error(`FAIL check:writeups: ${error.message}`); process.exitCode = 1; }

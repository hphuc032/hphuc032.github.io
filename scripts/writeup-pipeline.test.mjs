import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { join, posix, resolve, win32 } from 'node:path';
import { test } from 'node:test';
import { contentRoot, inspectMarkdown, limits, normalizeMarkdown, relativeWithin, safeLocal, sourcePath, validateManifest, verifyImage, writeChanged } from './lib/writeup-pipeline.mjs';
import { writeupPublication } from '../src/data/writeup-publication.ts';
const entry = structuredClone(writeupPublication[1]);

test('rejects repository/path traversal, encoded paths, binaries, SVG and floating refs', () => {
  for (const path of ['../x.md', '/x.md', 'a/../../x.md', 'a\\x.md', 'a/%2e%2e/x.md', 'x.md?raw=1', 'x.dll', 'https://evil/x.md']) assert.throws(() => sourcePath(path));
  for (const path of ['x.svg', 'x.exe', 'x.zip']) assert.throws(() => sourcePath(path, true));
  assert.throws(() => validateManifest([{ ...entry, source: { ...entry.source, ref: 'main' } }]));
  assert.throws(() => validateManifest([{ ...entry, source: { ...entry.source, repository: 'evil/repo' } }]));
  assert.throws(() => validateManifest([entry, entry]));
  assert.throws(() => validateManifest([{ ...entry, state: 'published', title: null }]));
});
test('preserves literal PoCs and CTF flags while rejecting active markup/unsafe protocols', () => {
  const code = '```html\n<script onclick="x">javascript:alert(1)</script>\n```\nFlag: `CTF{original}`\n';
  assert.deepEqual(inspectMarkdown(code, entry).errors, []);
  for (const text of ['<script>alert(1)</script>', '<iframe src="https://example.com"></iframe>', '<img src="x.png" onerror="x">', '[run](javascript:alert)', '[run](data:text/html,x)', '[run](file:///etc/passwd)', '[x](javascript&colon;alert)', '[x](&#106;avascript:alert)', '[x](java&Tab;script:alert)']) assert.ok(inspectMarkdown(text, entry).errors.length, text);
  assert.ok(inspectMarkdown('![x][a]\n[a]: https://example.com/x.png', entry).warnings.some(x => x.startsWith('remote-image')));
  assert.ok(inspectMarkdown('![x](x.png)', entry).warnings.some(x => x.startsWith('unapproved-image')));
  assert.ok(inspectMarkdown('![x](../../escape.png)', entry).errors.length);
  assert.ok(inspectMarkdown('<b>plain</b>', entry).warnings.some(x => x.startsWith('raw-html')));
});
test('secret findings block sync, contextual findings block publication, code stays content', () => {
  assert.ok(inspectMarkdown('-----BEGIN PRIVATE KEY-----', entry).errors.length);
  const text = 'password = challenge-only\n<<<<<<< HEAD\n';
  assert.ok(inspectMarkdown(text, entry).warnings.length);
  assert.ok(inspectMarkdown(text, { ...entry, state: 'published' }).errors.length);
});
test('strict UTF-8, bounded source and deterministic line normalization', () => {
  assert.equal(normalizeMarkdown(Buffer.from('\ufeff# Title\r\nCTF{unchanged}\r')), '# Title\nCTF{unchanged}\n');
  assert.throws(() => normalizeMarkdown(Buffer.from([255,255])));
  assert.throws(() => normalizeMarkdown(Buffer.alloc(limits.markdown + 1)));
  assert.throws(() => normalizeMarkdown(Buffer.from('')));
  assert.throws(() => normalizeMarkdown(Buffer.from('a\0b')));
});
test('assets require image signatures and bounds, not merely a safe extension', () => {
  assert.throws(() => verifyImage(Buffer.from('executable'), 'a.png'));
  assert.throws(() => verifyImage(Buffer.alloc(limits.image + 1), 'a.png'));
  verifyImage(Buffer.from([137,80,78,71,13,10,26,10]), 'a.png');
});
for (const [platform, pathApi, base, outside] of [
  ['Linux', posix, '/portfolio/src/content/writeups', '/outside/source.md'],
  ['Windows drive', win32, 'C:\\portfolio\\src\\content\\writeups', 'D:\\outside\\source.md'],
  ['Windows UNC', win32, '\\\\server\\share\\portfolio\\writeups', '\\\\other\\share\\source.md'],
]) {
  test(`${platform} containment accepts descendants and rejects escapes`, () => {
    assert.equal(relativeWithin(base, base, pathApi), '');
    assert.equal(relativeWithin(base, pathApi.join(base, 'article', 'source.md'), pathApi), pathApi.join('article', 'source.md'));
    assert.equal(relativeWithin(base, pathApi.join(base, '..notes', 'source.md'), pathApi), pathApi.join('..notes', 'source.md'));
    assert.throws(() => relativeWithin(base, pathApi.join(base, '..', 'source.md'), pathApi));
    assert.throws(() => relativeWithin(base, `${base}-sibling`, pathApi));
    assert.throws(() => relativeWithin(base, outside, pathApi));
    assert.throws(() => relativeWithin(base, pathApi.join(pathApi.dirname(base), 'outside', 'source.md'), pathApi));
    if (pathApi === win32) {
      assert.equal(relativeWithin(base, pathApi.join(base, 'article', 'source.md').replaceAll('\\', '/'), pathApi), pathApi.join('article', 'source.md'));
    }
  });
}

test('native safeLocal accepts missing descendants and rejects escapes', async () => {
  assert.equal(await safeLocal(contentRoot), resolve(contentRoot));
  const file = join(contentRoot, 'missing-directory', 'nested', 'source.md');
  assert.equal(await safeLocal(file), resolve(file));
  await assert.rejects(safeLocal(join(contentRoot, '..', 'outside.md')));
  await assert.rejects(safeLocal(`${contentRoot}-sibling`));
});

test('local writes are dry-run safe, idempotent and reject symlink/junction destinations', async () => {
  await mkdir(contentRoot, { recursive: true });
  const directory = await mkdtemp(join(contentRoot, '.pipeline-test-'));
  const file = join(directory, 'source.md');
  try {
    assert.equal(await writeChanged(file, Buffer.from('content'), true), 'would-create');
    assert.equal(await writeChanged(file, Buffer.from('content'), false), 'would-create');
    assert.equal(await writeChanged(file, Buffer.from('content'), false), 'unchanged');
    const target = join(directory, 'outside'); await mkdir(target);
    await symlink(target, join(directory, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(safeLocal(join(directory, 'link')));
    await assert.rejects(safeLocal(join(directory, 'link', 'x.md')));
    await rm(join(directory, 'link'), { recursive: true, force: true });
    await writeFile(join(directory, 'regular'), 'file');
    await assert.rejects(safeLocal(join(contentRoot, '..', 'outside.md')));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

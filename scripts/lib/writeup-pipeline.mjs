import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeupPublication } from '../../src/data/writeup-publication.ts';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const contentRoot = join(root, 'src/content/writeups');
export const limits = { markdown: 1024 * 1024, image: 5 * 1024 * 1024, assets: 32, entries: 100, batch: 64 * 1024 * 1024 };
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const json = value => `${JSON.stringify(value, null, 2)}\n`;
const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sourcePath(path, image = false) {
  if (typeof path !== 'string' || !path || path.length > 512 || /[\\%?#:\x00-\x1f\x7f]/.test(path)
      || path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Unsafe source path');
  }
  const extension = extname(path).toLowerCase();
  if (image ? !imageExtensions.includes(extension) : extension !== '.md') throw new Error('Disallowed source extension');
  return path;
}

export function validateManifest(entries = writeupPublication) {
  if (!Array.isArray(entries) || entries.length > limits.entries) throw new Error('Invalid manifest size');
  const seen = { id: new Set(), slug: new Set(), source: new Set() };
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') throw new Error('Invalid manifest entry');
    for (const key of ['id', 'slug']) {
      if (typeof entry[key] !== 'string' || !slugPattern.test(entry[key]) || entry[key].length > 120 || seen[key].has(entry[key])) throw new Error(`Invalid/duplicate ${key}`);
      seen[key].add(entry[key]);
    }
    const s = entry.source;
    if (!s || s.repository !== 'hphuc032/ctf-writeups' || !/^[a-f0-9]{40}$/.test(s.ref ?? '')) throw new Error('Source requires approved repository and full pinned SHA');
    sourcePath(s.path);
    if (seen.source.has(s.path)) throw new Error('Duplicate source path');
    seen.source.add(s.path);
    if (!['draft', 'review', 'published'].includes(entry.state)) throw new Error('Invalid publication state');
    for (const field of ['title', 'event']) {
      if (entry[field] !== null && (typeof entry[field] !== 'string' || !entry[field].trim() || entry[field].length > 240)) throw new Error(`Invalid ${field}`);
    }
    if (entry.category !== null && !['web', 'crypto', 'forensics', 'reverse'].includes(entry.category)) throw new Error('Unsupported category');
    if (entry.language !== null && !['en', 'vi', 'en-vi'].includes(entry.language)) throw new Error('Unsupported language');
    if (entry.state === 'published' && ['title', 'event', 'category', 'language'].some(key => !entry[key])) throw new Error('Published metadata incomplete');
    if (!Array.isArray(entry.assetPaths) || entry.assetPaths.length > limits.assets || new Set(entry.assetPaths).size !== entry.assetPaths.length) throw new Error('Invalid asset allowlist');
    entry.assetPaths.forEach(path => sourcePath(path, true));
  }
  return entries;
}

export function sourceUrl(entry, path = entry.source.path) {
  sourcePath(path, path !== entry.source.path);
  return `https://raw.githubusercontent.com/${entry.source.repository}/${entry.source.ref}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function normalizeMarkdown(bytes) {
  if (bytes.length > limits.markdown) throw new Error('Markdown exceeds 1 MiB');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.trim()) throw new Error('Empty Markdown source');
  if (text.includes('\0')) throw new Error('NUL byte in Markdown');
  return text;
}

// Conservative preflight, NOT a Markdown sanitizer. R7 must disable raw HTML and
// separately validate rendered links/media. Code examples are never executed.
export function proseOnly(text) {
  let fence;
  return text.split('\n').map(line => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length && /^ {0,3}(`+|~+)\s*$/.test(line)) fence = undefined;
      return '';
    }
    if (match) { fence = match[1]; return ''; }
    return line.replace(/(`+)([\s\S]*?)\1/g, '');
  }).join('\n');
}

export function inspectMarkdown(text, entry) {
  const prose = proseOnly(text);
  const errors = [], warnings = [], referencedAssets = new Set();
  if (/<\s*\/?\s*(script|iframe|object|embed|style|svg|math|form|base|meta|link)\b/i.test(prose)
      || /<[^>]*\bon\w+\s*=/i.test(prose)) errors.push('Blocked active HTML');
  if (/<\/?[a-z][^>]*>/i.test(prose)) warnings.push('raw-html: R7 must render with raw HTML disabled');
  if (/^(?:<<<<<<<|=======|>>>>>>>)/m.test(text)) warnings.push('merge-conflict-markers');
  // Scan complete source, including code, for recognizable credentials. Findings
  // contain only diagnostic labels, never matched values. CTF flags are untouched.
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|sk-[A-Za-z0-9]{24,})/.test(text)) errors.push('Possible real credential/private key: manual review required');
  if (/\b(?:password|passwd|api[_-]?key|access[_-]?token|authorization|cookie)\s*[:=]/i.test(text)) warnings.push('credential-like-assignment: review challenge context manually');
  if (/(?:\b[A-Z]:\\|\/(?:home|Users)\/[^\s]+)/.test(text)) warnings.push('personal-filesystem-path: manual review required');
  const refs = new Map();
  for (const match of prose.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gm)) refs.set(match[1].trim().toLowerCase(), match[2] ?? match[3]);
  const links = [];
  for (const match of prose.matchAll(/(!?)\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))/g)) links.push({ image: match[1] === '!', target: match[2] ?? match[3] });
  for (const match of prose.matchAll(/(!?)\[([^\]]+)\](?:\[([^\]]*)\])?/g)) {
    const target = refs.get((match[3] || match[2]).trim().toLowerCase());
    if (target) links.push({ image: match[1] === '!', target });
    else if (match[1] && !prose.slice(match.index + match[0].length).startsWith('(')) warnings.push('unresolved-image-reference');
  }
  for (const match of prose.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) links.push({ image: /src/i.test(match[0]), target: match[1] });
  for (const match of prose.matchAll(/<((?:https?:\/\/|[a-z]+:)[^>\s]+)>/gi)) links.push({ image: false, target: match[1] });
  // Catch unsafe protocols even in malformed Markdown; code was masked above.
  if (/(?:javascript|vbscript|data|file)\s*:/i.test(prose) || /(?:javascript|data|file)(?:&#0*58;|&#x0*3a;|&colon;)/i.test(prose)) errors.push('Blocked unsafe link protocol');
  if (/https?:\/\/(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|\[::1\])/i.test(prose)) warnings.push('local/private-network-link: review challenge context');
  for (const { image, target } of links) {
    const decodedTarget = target.replace(/&#(?:x([0-9a-f]+)|(\d+));?/gi, (_, hex, decimal) => {
      const code = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
      return code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }).replace(/&colon;/gi, ':').replace(/&(?:Tab|NewLine);/gi, '').replace(/[\x00-\x20]/g, '');
    if (/^(?:javascript|vbscript|data|file):/i.test(decodedTarget)) errors.push('Blocked encoded unsafe link protocol');
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) {
      if (!/^https?:\/\//i.test(target) && !(!image && /^mailto:/i.test(target))) errors.push('Unsupported link protocol');
      if (image) warnings.push('remote-image: requires approved deterministic local copy');
    } else if (image) {
      try {
        const decoded = decodeURIComponent(target);
        sourcePath(decoded, true); // no traversal even if the final resolved path is inside the repo
        const path = posix.join(posix.dirname(entry.source.path), decoded);
        sourcePath(path, true);
        referencedAssets.add(path);
        if (!entry.assetPaths.includes(path)) warnings.push(`unapproved-image: ${path}`);
      } catch { errors.push('Unsafe local image path/format'); }
    } else if (target.startsWith('/') || target.includes('\\')) warnings.push('absolute/local-link: needs R7 resolution');
    else if (!target.startsWith('#')) {
      try { if (!new URL(target).protocol) warnings.push('relative-link: needs R7 resolution'); }
      catch { warnings.push('relative-link: needs R7 resolution'); }
    }
  }
  for (const path of entry.assetPaths) if (!referencedAssets.has(path)) errors.push(`Allowlisted asset not referenced: ${path}`);
  const result = { errors: [...new Set(errors)].sort(), warnings: [...new Set(warnings)].sort(), referencedAssets: [...referencedAssets].sort() };
  if (entry.state === 'published' && result.warnings.length) result.errors.push('Published source has unresolved review findings');
  return result;
}

export function verifyImage(bytes, path) {
  if (!bytes.length || bytes.length > limits.image) throw new Error('Image exceeds limits');
  const ext = extname(path).toLowerCase();
  const valid = ext === '.png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : ['.jpg', '.jpeg'].includes(ext) ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : ext === '.webp' && bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (!valid) throw new Error('Image signature does not match approved format');
}

export function metadata(entry, text, raw, findings, assets) {
  return {
    schemaVersion: 1, id: entry.id, slug: entry.slug,
    source: { ...entry.source, url: sourceUrl(entry) },
    normalization: 'UTF-8; BOM removed; CRLF/CR converted to LF; prose unchanged',
    upstreamSha256: sha256(raw), sourceSha256: sha256(Buffer.from(text)),
    findings, assets,
  };
}

// Injectable path semantics let the same containment rule be tested for both OSes.
export function relativeWithin(base, target, pathApi = { relative, resolve, sep, isAbsolute }) {
  const descendant = pathApi.relative(pathApi.resolve(base), pathApi.resolve(target));
  if (descendant === '..' || descendant.startsWith(`..${pathApi.sep}`) || pathApi.isAbsolute(descendant)) {
    throw new Error('Destination escapes content root');
  }
  return descendant;
}

// Do not follow symlinks/junctions in controlled destinations, including parent dirs.
export async function safeLocal(path) {
  const absolute = resolve(path);
  relativeWithin(contentRoot, absolute);
  const descendant = relativeWithin(root, absolute);
  let cursor = root;
  for (const part of descendant.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try {
      const info = await lstat(cursor);
      if (info.isSymbolicLink()) throw new Error('Symlink in content destination');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return absolute;
}
export async function readOptional(path) {
  await safeLocal(path);
  try { return await readFile(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export async function writeChanged(path, bytes, dryRun) {
  await safeLocal(path);
  const old = await readOptional(path);
  const status = !old ? 'would-create' : old.equals(bytes) ? 'unchanged' : 'would-update';
  if (status !== 'unchanged') console.log(`${status} ${relative(root, path).split(sep).join('/')} ${old ? sha256(old) : 'missing'} -> ${sha256(bytes)}`);
  if (!dryRun && status !== 'unchanged') { await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes); }
  return status;
}
export async function localFiles(directory = contentRoot) {
  await safeLocal(directory);
  const result = [];
  let children;
  try { children = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return result; throw error; }
  for (const child of children) {
    const path = await safeLocal(join(directory, child.name));
    if (child.isDirectory()) result.push(...await localFiles(path));
    else if (child.isFile()) result.push(path);
    else throw new Error('Unsupported local content file type');
  }
  return result.sort();
}

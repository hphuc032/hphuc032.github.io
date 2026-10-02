# Controlled CTF writeup source pipeline (R6)

This is a local source/data layer, not an article renderer. It adds no routes and
leaves the 22-route R1 public surface unchanged. Security Log remains separate.
No candidate has been approved for publication: two sources are synced for review,
zero are published, and zero assets are approved or copied.

## Source audit

Audited `hphuc032/ctf-writeups` at full commit
`f42cd29d383deafe0882020d91cb824eb03f342a` (main at inspection).
Tree inventory: **194 tracked files, 21 Markdown files**. A metadata-only Git tree
inventory was used; only Markdown candidates were read. Challenge code was not run.

- 13 challenge/analysis candidate documents (table below).
- Root `README.md`: repository overview, not an article.
- `Temp.md`: reusable placeholder template, never automatically ingested.
- Six `HCMUTE-CTF_2026/my_trip_checklist/deps/olefile/doc/*.md` documents:
  `API.md`, `Contribute.md`, `Home.md`, `Install.md`, `License.md`,
  `OLE_Overview.md`. These are vendored library documentation, not writeups.
- 18 PNG files, 40 MP4 videos, 15 DLLs, 14 SO files, four dylibs,
  two EXEs, three RAR archives, one encrypted `.db.ecdh` vault and one XLSX.
  Also Python/source/HTML/text/JSON/static-library and extensionless artifacts.
  No plain `.db` or `.sqlite` file was observed; the encrypted database is
  still an excluded challenge artifact.
- Extracted .NET application resources under `VerySecureVault_extracted/App`
  and vendored Python dependencies under `my_trip_checklist/deps` are excluded.
- CookieArena and three Pico challenge documents reference HackMD PNG images
  (four distinct remote URLs; Search-source and SOAP share the same image).
  Local PNG existence alone is not asset approval. None of the audited candidate
  Markdown documents explicitly referenced these local PNG files.

The following metadata is **candidate evidence**, not publication approval.
Event names are folder/platform hints pending confirmation. `en-vi` means a single
bilingual source, not two translated articles. Unknown categories are left unset;
Steganography is preserved as a source label rather than guessed as `forensics`.

| Source path | Candidate title / source heading | Event hint | Explicit category | Observed language | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `CookieArena/Upload-File-via-URL/README.md` | Upload File via URL (challenge H2; H1 is generic) | CookieArena | Web | vi | review; synced; remote image unresolved |
| `DailyAlpacahack/Web/Impossible_Puzzle/README.md` | Challenge: Impossible Puzzle | DailyAlpacahack | Web | en-vi | review; resolve committed merge-conflict markers first |
| `DailyAlpacahack/Web/Small_n/README.md` | Challenge: small-n | DailyAlpacahack | Crypto (source overrides Web folder) | en-vi | review; synced |
| `HCMUTE-CTF_2025/Mango Mutation — Writeup (chi tiết từng bước)-HCMUTE2025.md` | Mango Mutation — Writeup (chi tiết từng bước)-HCMUTE2025 | HCMUTE-CTF_2025 | unknown | vi | review |
| `HCMUTE-CTF_2026/VerySecureVault_extracted/WRITEUP_VerySecureVault.md` | A Very Secure Vault | HCMUTE-CTF_2026 | Reverse engineering / Cryptography / Forensics | vi | review; human must choose category |
| `HCMUTE-CTF_2026/be-careful/ANALYSIS_chall.md` | `chall` — static analysis | HCMUTE-CTF_2026 | unknown | vi | review; companion analysis, not automatically a standalone article |
| `HCMUTE-CTF_2026/be-careful/WRITEUP_BE_CAREFUL.md` | BE CAREFUL — Writeup | HCMUTE-CTF_2026 | unknown | vi | review |
| `HCMUTE-CTF_2026/bo_ba_lan/WRITEUP.md` | Bò ba lan | HCMUTE-CTF_2026 | Steganography | vi | review; category mapping requires decision |
| `HCMUTE-CTF_2026/my_trip_checklist/WRITEUP.md` | My Trip Checklist | HCMUTE-CTF_2026 | Forensics / Office Document | vi | review |
| `Pico-CTF/Pico-CTF-2024/SOAP-web-picoctf-2024/README.md` | Search source (source contradicts SOAP path) | Pico-CTF-2024 | Web | vi | hold for metadata/source correction; duplicates Search-source bytes |
| `Pico-CTF/Pico-CTF-2024/Search-source-web-picoctf-2024/README.md` | Search source (challenge H2) | Pico-CTF-2024 | Web | vi | review; remote image unresolved |
| `Pico-CTF/login-web-picoctf/README.md` | login (challenge H2) | Pico-CTF | Web | vi | review; remote images and copied description require editorial review |
| `V1T/B1tsy-Ducky-WRITEUP.md` | B1tsy Ducky Writeup | V1T | unknown | vi (unaccented prose, English headings) | review; source script example is fenced content |

Only CookieArena Upload File via URL and DailyAlpacahack small-n are in the
executable manifest, both in `review`. The other rows are inventory suggestions,
not ingest or publication decisions.

## Architecture and commands

`src/data/writeup-publication.ts` is the canonical typed allowlist. Node 24's
native TypeScript stripping lets the tools read exactly that manifest, without
an extra dependency or second JSON registry. It defines explicit IDs/slugs,
repository, full 40-character ref, source path, state, candidate metadata, language
and approved asset paths. `publishedWriteups()` currently returns an empty list.
Nothing in the page tree consumes it in R6.

Run from the portfolio repository root:

```bash
npm run sync:writeups -- --dry-run
npm run sync:writeups
npm run check:writeups
npm run test:writeups
```

Manual sync fetches only allowlisted files from `raw.githubusercontent.com` at
an immutable commit, honoring HTTPS proxy configuration through Node's
`--use-env-proxy`. TLS verification stays enabled. Public raw content needs no
PAT. Non-200 responses (including missing files/rate limits), redirects, timeout,
invalid UTF-8, oversized files, unsupported paths or blocked content fail clearly.
No arbitrary path CLI argument is accepted. No recursive repository download occurs.
The sync dependency is **only** raw.githubusercontent.com; normal builds do not
invoke synchronization. They still need the existing Google Fonts endpoints on a
clean font build, independently of the external CTF repository.

For each entry, local files are:

```text
src/content/writeups/<slug>/source.md
src/content/writeups/<slug>/source-meta.json
src/content/writeups/<slug>/assets/<approved source-relative path>  # if approved
```

Sources stay out of `public/`. R7 must explicitly decide what to render or expose.
Markdown is decoded strictly as UTF-8, BOM removed, and CRLF/CR normalized to LF;
prose, fences, examples and flags are otherwise unchanged. Provenance records the
repo, full ref, path, pinned URL, upstream byte SHA-256 and normalized SHA-256,
plus findings and approved asset hashes. No timestamp or machine path is saved.
Hashing tracks changes/integrity, not safety or authorship.

Dry-run performs the same download/validation, prints the pin and source path,
review findings, would-create/would-update and old/new hashes, and writes nothing.
Real sync validates the complete fetched batch and destination symlinks before
writing. Unchanged files are not rewritten. A repeated sync reports zero changed
files. Network/content validation failure retains the current local content.
Filesystem I/O failure is nonzero but may leave a partial write; this is not a
transactional database. Review the diff and rerun sync/check after fixing I/O.
Deleted upstream paths fail rather than delete local sources. Stale local files
fail `check:writeups`; removals require deliberate human review.

## Validation and safety boundaries

- Only `hphuc032/ctf-writeups`, full SHA pins and `.md` sources are accepted.
- Reject absolute paths, empty/dot/traversal segments, backslashes, percent-encoded
  paths, URL syntax and control characters. Stable slugs are lowercase kebab-case.
- No binaries, archives, executables or database assets can enter the image allowlist.
- Assets must be explicitly source-listed **and** referenced by the Markdown.
  Only PNG/JPEG/WebP are accepted with matching magic bytes. SVG is rejected.
  Images are not decoded/rendered by R6; magic checking is a format guard,
  not complete media-content safety verification. Human image review is required.
- Limits: 1 MiB per Markdown, 5 MiB per image, 32 assets per source,
  100 manifest entries and 64 MiB downloaded per sync batch. Split oversized batches.
- Missing/unallowlisted local image references and external images are reported.
  Nothing fetches HackMD or hotlinks it for site rendering. CookieArena's remote
  image remains a review finding and prevents changing that entry to `published`.
- Preflight rejects active HTML tags, event-handler attributes and dangerous
  protocols outside fenced/inline code. Raw harmless HTML and relative links
  are flagged for review. Reference-style images are checked too.
- Code blocks remain inert content. No PoCs, commands or downloaded scripts run.
- Obvious private keys and recognizable token formats block synchronization;
  credential-like assignments, personal filesystem paths and merge markers are
  review findings. Findings log labels rather than matched secret values.
  CTF flags are preserved; challenge credentials require contextual review.
- Symlink destination paths and unmanifested/stale local content are rejected.
- `check:writeups` uses local files only, verifies hashes, provenance, current
  findings and the exact local asset/content inventory. It does not fetch upstream.

This conservative regex preflight is **not a full Markdown parser or sanitizer**,
and does not prove that a source contains no secrets. R7 must keep raw HTML/MDX
execution disabled, use a safe Markdown renderer, validate all rendered URLs
(including entity decoding), resolve links/media deliberately and perform human
content/privacy review. Do not pass sources to `dangerouslySetInnerHTML` or compile
untrusted source as executable MDX. A source passing R6 is not publication approval.

Node may print `MODULE_TYPELESS_PACKAGE_JSON` when importing the `.ts` manifest.
That harmless module-detection warning does not justify changing the entire
repository's module mode or adding a TypeScript loader dependency.

## Publication and maintenance

`draft`: unfinished source; `review`: source/metadata awaiting human decisions;
`published`: complete metadata and no unresolved preflight findings. There is no
automatic state promotion. All allowlisted entries must have synced local files,
including draft/review entries. R6 generates no article routes, regardless of state.

1. Edit the upstream source and decide which files merit review/publication.
2. Inspect the new upstream commit. Set its full SHA explicitly in the manifest;
   never replace it with `main`. Add stable slug and source-supported metadata.
3. Add only referenced, personally reviewed image paths to `assetPaths`. External
   images need a reviewed upstream local copy and corresponding source reference;
   do not silently rewrite articles or auto-download arbitrary remote URLs.
4. Dry-run and inspect source/hash changes and unresolved findings.
5. Run real sync. Review `git diff`, including original flags and technical text.
6. Run `check:writeups`, `test:writeups`, lint, type-check, both builds and static checks.
7. Commit local Markdown and deterministic metadata together with the manifest.
8. Obtain human approval of title/event/category/language/assets and source content
   before changing state to published or implementing R7 rendering.

Later upstream changes do not silently change deployed content. To investigate,
compare the old and new pinned source URLs/hashes, and review a controlled sync diff.
If a source disappears, retain the old pin or deliberately change/remove the
manifest and local source after review. Do not make production builds, browsers,
page components or article routes fetch GitHub. R7 consumes checked local sources
via a server-only loader and explicit publication selectors, generating static
routes only for approved entries.

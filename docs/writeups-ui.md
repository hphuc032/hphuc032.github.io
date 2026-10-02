# Writeups presentation and safe rendering (R7)

CTF articles are separate from Security Log (`/log/` and its trusted MDX). R7
does not approve publication. Passing R6 validation is not publication approval.
The current manifest contains **0 draft, 2 review, 0 published** entries. Neither
review source is shown in the index, metadata, sitemap, client code or export.

## Publication and routes

`publishedWriteups()` in `src/data/writeup-publication.ts` is the sole selector.
The server/build helpers use it for public summaries, exact slug resolution,
static params, localized sitemap paths and image preparation. The loader resolves
the published record before reading any file. Unknown, malformed, draft and
review slugs return 404. Source content is never compiled as MDX.

Next.js **16.3.4 rejects an empty `generateStaticParams()` with `output: export`**.
Consequently, article files use `page.writeup.tsx`. `next.config.mjs` includes the
`writeup.tsx` extension only when the canonical selector is nonempty. With zero
published sources, both article helpers return zero params and article route
discovery is disabled in every mode: no placeholder slug, hidden preview route,
output pruning or state promotion. Both builds retain 22 public routes.
When a human publishes an entry, the same files participate in route discovery;
`dynamicParams = false` restricts both localized wrappers to approved slugs.

The English wrapper is `/writeups/<slug>/`; Vietnamese is
`/vi/writeups/<slug>/`. Canonical and language alternates follow existing site
metadata policy. No date, author or inferred event/category is added. Article
descriptions use only the approved title and a generic CTF label.

`writeup-public-routes.json` contains only published slugs. Preparation derives
it from the selector before either build and before `npm run dev`. This small
artifact lets the existing locale selector recognize article equivalents without
shipping the full source manifest (including review records) in client bundles.
It is not a second approval registry; never edit it manually.
The only navigation changes are this equivalent-route lookup and recognition of
`/writeups/*` as the existing WRITEUPS active item. Navigation UI is unchanged.

## Local IO and assets

`load-writeup.ts` and the public server helpers carry `server-only` boundaries.
`scripts/lib/writeup-publication.mjs` shares R6's validation, normalization,
path/symlink protection, SHA-256 checks and deterministic provenance comparison.
The R6 root helper retains module-relative CLI paths and uses the project working
directory in bundled Next Node code, avoiding Turbopack's directory asset import.

`npm run prepare:writeups` reads **only published** local sources. It validates
the whole batch, then exposes **only** explicitly allowlisted PNG/JPEG/WebP assets
under `public/generated/writeups/<slug>/<source-path>`. R6 metadata must match
the bytes, size and hash. SVG, binaries, missing assets and hash changes fail.
Old generated assets are removed when publication changes; symlinks/junctions in
the destination or any parent/descendant are rejected. This namespace is owned
by preparation and ignored by Git. Zero published entries means zero public CTF
images. No Markdown, metadata, findings or provenance is copied into `public/`.

Both build commands run preparation automatically. Preparation and rendering
make no network requests. The separate manual R6 sync command remains the only
external content retrieval step. Builds and browsers do not fetch GitHub.

## Markdown safety

Declared dependencies: `react-markdown` 10.1.0 and `remark-gfm` 4.0.1. There is
no highlighter, client parser, raw-HTML plugin, executable JSX or MDX compiler.
Raw HTML is skipped. Fenced HTML/JSX stays escaped, selectable code text.
R6 still rejects active content/unsafe source findings before publication.
R7 validates parsed Markdown links and images before URL transformation, including
reference links and autolinks. No commands, payloads or flags are executed or edited.

- Links allow public HTTP(S), fragments and explicitly supported index/article
  paths. Credentials in URLs, private/loopback destinations, unsafe/unsupported
  schemes, control characters, protocol-relative URLs and path traversal fail.
  Encoded protocol variants are checked after decoding. Unsupported relative file
  references render as non-clickable text, never guessed site routes.
- Internal paths currently supported: `/`, `/vi/`, EN/VI Writeups and Security Log
  indexes, and the published CTF article paths. External links stay in the same tab
  and carry `noopener noreferrer`. No arbitrary image hotlinks are allowed.
- Images must resolve from their source directory to a reviewed R6 asset path.
  Remote, missing, unapproved, absolute or escaping images fail. The source image
  alt is preserved; an explicitly empty Markdown alt means decorative. Human
  publication review must approve those alts/decorative choices along with assets.
  The renderer never guesses descriptions.
- The manifest title is the only H1. Source headings keep their text and hierarchy
  with one-level offset, capped at H6. No client heading parser or TOC is added.
- Code blocks and tables scroll within their containers. Lists, emphasis,
  blockquotes, horizontal rules, links and GFM tables remain practical Markdown.

Source prose is never translated. The EN/VI page shell is independent of body
language. EN bodies use `lang="en"`, VI bodies `lang="vi"`. Bilingual bodies use
the registered `mul` (multiple languages) language code and an explicit
English / Tiếng Việt label. This does not promise per-paragraph screen-reader
voice switching; that would require human-authored language annotations later.

## Verification

`npm run test:writeups` runs R6 and R7 unit tests, including unsafe Markdown,
inert code, approved images, hashes, provenance and portable directory junction
protection. Fixture records are isolated local test data; the manifest is never
temporarily promoted. `npm run check:writeups` still checks all local R6 sources.

`npm run check:writeups-ui -- <origin>` checks EN/VI indexes at seven desktop,
tablet and mobile sizes. It renders the actual shared article structure with
in-memory safe fixtures via browser `setContent`, not a published preview route.
It verifies reading width, focus, source language, contained code/table scrolling,
404 responses and absence of external source requests.

After static build, `npm run check:writeups-export` checks the exact expected
route count, unpublished 404s on a plain static host, sitemap exclusion, no copied
review assets and no source/meta/candidate leaks anywhere in HTML, RSC payloads
or client chunks. Existing localization, metadata, route, atmosphere and static
export checks remain required. Browser checks use the repository's Playwright
runner and can select the installed module through `PLAYWRIGHT_MODULE_PATH`.

## Intentional future publication

1. Human reviews the upstream source and explicitly approves publication.
2. Confirm title, event, category, language, images and source alts/decorative status.
3. Pin and sync approved source/assets with R6; resolve all findings. Remote image
   references must be intentionally replaced upstream with approved local ones.
4. Run R6 checks. Only explicit human approval permits changing state to `published`.
5. Run preparation and both builds. The selector now includes the entry in index,
   params, sitemap, locale equivalents and image generation automatically.
6. Review generated content and rerun every route, security and static check.
   Intentionally update the independent expected-route fixture when publication
   expands the public surface; never adjust it to hide accidental routes.

No publication state was changed during R7. Positive rendering and IO behavior
are covered by fixtures; public article export awaits the first approved source.

## Delivery validation

Feature branch: `feat/r7-writeups-ui`, based on integration commit `ec2ed61`.
R4/Home, Projects, Security Log content, navigation components, shell styles and
the atmosphere implementation were not changed. The R6 manifest and synced
Markdown/metadata remain byte-for-byte unchanged.

| Check | Final result |
| --- | --- |
| `npm run test:writeups` | PASS, 17 tests, zero failures/skips |
| `npm run check:writeups` | PASS, two review sources, zero published |
| `npm run sync:writeups -- --dry-run` | PASS, zero changed files; no writes |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `npm run build` | PASS |
| `npm run build:github-pages` | PASS |
| `npm run check:routes -- <normal-origin> --production` | PASS |
| `npm run check:localization` | PASS, normal and static hosts |
| `npm run check:metadata -- <static-origin> https://hphuc032.github.io` | PASS |
| `npm run check:static-export` | PASS, 22 published routes |
| `npm run check:writeups-export` | PASS, exact catalog, review/unknown 404s and output/bundle privacy |
| `npm run check:writeups-ui` | PASS, normal and static hosts, seven viewports |
| `node scripts/check-atmosphere-model.mjs` | PASS |

Browser QA used the available Chromium runtime through an external Playwright
adapter. Native Microsoft Edge was unavailable. The adapter selects Chromium
and disables WebGL for existing Home fallback checks; it does not change the
Writeups or Canvas2D assertions. Screenshots/measurements are ignored test outputs.

The existing optional `node scripts/check-atmosphere.mjs` failed its live media
transition counter assertion (one additional static redraw). Its wait only checks
`running=false`, which was already true in the preceding idle state; this can
snapshot before the media-change event updates `mode`. A diagnostic copy outside
the repository additionally awaited `mode=static/animated` at those transitions.
It passed the full lifecycle, navigation, modal, fallback, console and hydration
checks without changing any assertions. The original tracked test and R3 code
remain unchanged; the original test is **not reported as PASS**. Synchronizing
that R3 test is a separate follow-up, not an R7 atmosphere change.

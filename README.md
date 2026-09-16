# carwyn.sec

`carwyn.sec` is a bilingual cybersecurity portfolio for Nguyen Hoang Phuc. It
brings together security projects, technical learning, professional experience,
and concise Security Log field notes in an editorial, interaction-led website.

**Live site:** [https://hphuc032.github.io/](https://hphuc032.github.io/)

- English: `/`
- Vietnamese: `/vi/`

## Preview

The production site is the canonical preview. Repository screenshots are kept
intentionally minimal so QA captures and local debug images do not become public
assets.

## Features

- Editorial single-page portfolio with English and Vietnamese content
- Three published Operations case studies with evidence-conscious summaries
- MDX Security Log with an explicit, reviewed publication registry
- Professional experience, achievements, contact links, and public-safe CV
- Simulated portfolio Terminal with predefined local commands
- React Three Fiber network sphere with a static fallback
- Directional Canvas water-wake pointer interaction on eligible devices
- Responsive layouts, keyboard support, and reduced-motion behavior
- Static GitHub Pages deployment while retaining a server-capable Next.js build

Decorative interaction communicates the visual identity of the portfolio; it is
not presented as cybersecurity functionality or project evidence.

## Technology

Versions are locked in `package-lock.json`.

- Next.js 16.3.4 App Router and React 19.2.8
- TypeScript 6.0.3 and Tailwind CSS 4.3.3
- GSAP 3.15.0
- React Three Fiber 9.7.0 and Three.js 0.182.0
- MDX 3.1.1
- GitHub Actions and GitHub Pages

## Architecture

```text
Typed catalogs + reviewed MDX
              |
              v
       Server Components
              |
              v
 Homepage + case studies + Security Log
              |
              v
 Small client islands for navigation, Terminal,
 GSAP, WebGL, Canvas, and pointer interaction
```

Static content, metadata, routes, and prose remain server-rendered. Interactive
behavior is isolated to client components. Projects, achievements, experience,
contact details, and publication manifests have canonical typed sources rather
than section-specific copies.

## Project Structure

```text
src/app/         Routes, layouts, metadata, sitemap, robots, and 404 handling
src/components/  UI, page sections, motion, Terminal, and WebGL islands
src/content/     Reviewed bilingual Security Log MDX
src/data/        Typed content catalogs and publication manifests
src/i18n/        Locale definitions and EN/VI dictionaries
src/lib/         Deployment, metadata, motion, topology, and wake utilities
src/styles/      Fonts, tokens, global styles, and section styles
scripts/         Builds, validation, regression checks, and measurements
public/          Reviewed public web assets only
docs/            Engineering reviews and maintenance guidance
.github/         GitHub Pages deployment workflow
```

## Local Development

Requirements:

- Node.js 24.x
- npm 11.x

```bash
git clone https://github.com/hphuc032/hphuc032.github.io.git
cd hphuc032.github.io
npm ci
npm run dev
```

No secret is required for normal public-site operation. Copy `.env.example` only
when a build needs explicit deployment metadata.

Useful checks:

```bash
npm run lint
npm run type-check
npm run build
```

After `npm run start` is serving the production build, route checks default to
`http://127.0.0.1:3000`:

```bash
npm run check:routes -- http://127.0.0.1:3000 --production
npm run check:localization -- http://127.0.0.1:3000
```

`next/font/google` downloads the approved font assets during a clean build and
self-hosts them in the result. Build environments therefore need access to the
official Google Fonts endpoints; site visitors do not make runtime Google Fonts
requests.

## Deployment Modes

The same repository supports two build modes.

### Server-capable Next.js

```bash
npm run build
npm run start
```

This mode retains the Next.js Proxy and server redirects. `SITE_URL` may be set
to a public HTTPS origin to enable canonical, alternate-language, Open Graph, and
indexing metadata. Without it, local/test metadata remains non-indexable.

### GitHub Pages static export

```bash
npm run build:github-pages
npm run check:static-export
```

The GitHub Pages target uses static export, trailing-slash routes, and unoptimized
Next image delivery. Proxy runtime behavior is disabled for that build because
GitHub Pages serves files without a Next.js server. `out/` is generated and is
never committed.

Environment variables are documented in `.env.example`:

- `SITE_URL` — public HTTPS origin used for production metadata
- `DEPLOY_TARGET=github-pages` — selects static-export behavior

## GitHub Pages Deployment

```text
push main
    |
    v
GitHub Actions
    |
    v
npm ci -> lint -> type-check -> static build
    |
    v
static-export validation -> Pages artifact -> deployment
```

The workflow publishes to [https://hphuc032.github.io/](https://hphuc032.github.io/).
No manual `out/` upload is required.

## Content Architecture

Content follows an evidence-first publication model:

1. Confirm factual evidence outside the public repository.
2. Add or update the typed record and both locale variants.
3. Mark only reviewed content as published.
4. Add the slug to the relevant publication manifest.
5. Run route, localization, and static-export validation.

Draft, review, incomplete, and missing-locale content is excluded from public
selectors and static-route generation. Limited case-study detail is intentional
where supporting evidence is not yet available.

Security Log entries use reviewed `en.mdx` and `vi.mdx` files, typed metadata,
and explicit imports in a server-only registry. There is no CMS, arbitrary user
MDX, or runtime route-to-filesystem import.

See [maintenance guidance](docs/maintenance.md) for the update procedures.

## Localization

English is canonical and unprefixed. Vietnamese uses `/vi/`. Stable slugs are
shared between locales. Technical products, proper names, and approved brand
statements remain unchanged where intentional; surrounding prose, metadata, and
accessible labels are localized.

## Performance

The homepage ships static text before WebGL enhancement. Three.js, React Three
Fiber, and homepage GSAP do not load on case-study or Security Log routes.
Touch/reduced-motion visitors receive the static network design and no pointer
wake.

Representative synthetic results include approximately 154.9 KB initial
homepage JavaScript gzip, 77.8 KB English homepage font transfer, roughly
1.3–1.7 seconds local throttled-mobile LCP, and zero initial CLS in the final
static build. These are laboratory measurements, not field Core Web Vitals.
See [the performance review](docs/performance-qa.md) for method and limitations.

## Accessibility

The interface was designed and tested with WCAG 2.2 AA as an engineering target.
Implemented checks cover semantic structure, keyboard navigation, visible focus,
reduced motion, 200% zoom/reflow, localized 404 pages, touch targets, and
screen-reader-oriented labels.

This is not a formal accessibility certification. Native screen readers were not
comprehensively tested, and the public PDF has not received a formal PDF/UA audit.

## Security and Privacy

- Private CV sources and portrait originals are excluded from Git.
- Only reviewed web derivatives are published.
- The public CV has the stable path `/cv/nguyen-hoang-phuc-cv.pdf`.
- `.gitattributes` treats PDFs as binary to prevent line-ending normalization.
- Unknown or unpublished content slugs remain unavailable.
- The trusted MDX registry does not accept runtime uploads.

The Terminal is simulated. It performs exact matching against predefined command
tokens and never executes a shell, filesystem operation, child process, network
command, `eval`, or dynamically supplied code.

## Testing

Package scripts:

| Purpose | Command |
| --- | --- |
| Lint | `npm run lint` |
| Type checking | `npm run type-check` |
| Server-capable build | `npm run build` |
| GitHub Pages export | `npm run build:github-pages` |
| Routes | `npm run check:routes` |
| Localization | `npm run check:localization` |
| Metadata | `npm run check:metadata` |
| Contact/CV | `npm run check:contact` |
| Static artifact | `npm run check:static-export` |

Additional browser regression scripts cover responsive behavior, accessibility,
Terminal, Security Log, motion, Sphere fallbacks, and water wake. They currently
use a Playwright runtime supplied by the development environment; Playwright is
not installed as a repository dependency, so those scripts are not guaranteed to
run in a plain fresh clone without an equivalent runtime.

## Maintenance

See [docs/maintenance.md](docs/maintenance.md) for projects, localization,
Security Log, CV replacement, deployment checks, release preparation, and
rollback.

## Known Limitations

- Firefox and Safari have not been comprehensively tested.
- No field RUM or CrUX dataset is collected.
- PDF accessibility has not been formally audited.
- GitHub Pages locale switching uses normal static document navigation.
- Some case studies intentionally remain concise until verified evidence exists.

## Release

See [CHANGELOG.md](CHANGELOG.md) and the
[v1.0.0 release notes](docs/releases/v1.0.0.md). The Git tag and GitHub Release
are intentionally left for final human approval.

## License

**License decision required.** This repository does not currently include an
open-source license. Public source visibility does not grant permission to copy,
modify, or redistribute the project.

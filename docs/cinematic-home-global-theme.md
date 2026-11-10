# Cinematic Home and global themes

## Scope and baseline

Feature branch: `feat/cinematic-home-global-theme`, based on `2a5ff46` (the approved AWS writing update on main). No routes, published facts, projects, CV bytes, dependencies or deployment settings change. Baseline lint, type-check and normal production build passed before implementation. Existing upstream Node module-type and writeup filesystem-tracing warnings remain.

## Hero composition

The server-rendered Hero retains its slogan, canonical profile name, SectionLabel, native About anchor and the existing NetworkSphere/StaticNetwork implementation. The portrait is the foreground, the network is behind it, and two decorative copies of the outline name form a seamless left-to-right CSS loop. A low-contrast CSS perspective grid anchors the composition without another Canvas or renderer.

Desktop uses layered typography/portrait/network. Tablet and mobile put the slogan above the portrait, with the static network behind it. Below 900px the existing SVG and 13 semantic skill buttons remain; WebGL is not requested. Desktop rotation, focus, drag, pause, Save-Data, reduced motion and context-loss recovery remain in the original engine. Static instructions describe the tool areas rather than implying drag is available.

`HeroMarquee` owns pause state, an IntersectionObserver and visibility/reduced-motion listeners. CSS owns movement; there is no new RAF. It pauses offscreen, in hidden documents and when the visitor requests it. The duplicated name and floor are hidden from assistive technology; the real name, portrait alt and slogan remain meaningful text. No-JS leaves the name static and the supplied image visible. The existing status bar and EndSystem footer remain on Home and other routes.

## Supplied portrait

- Approved PNG: `/images/identity/nguyen-hoang-phuc-hero.png` (1121 × 1403, alpha preserved).
- Large WebP: `/images/identity/nguyen-hoang-phuc-hero.webp` (120,808 bytes).
- Small WebP: `/images/identity/nguyen-hoang-phuc-hero-640.webp` (55,814 bytes).
- PNG hash: `3ba0cd2540369f71d6982ca5f23babca0c6429f969be5d0df29aaadcebfc534e`.

The PNG is byte-identical to the supplied file. WebP derivatives resize/compress only, retaining proportions and transparency. There is no background removal, generated replacement, glow or photo filter. A responsive picture selects WebP; Next Image supplies dimensions, eager/high-priority loading and PNG fallback without requesting a static-host image optimization server. Only Home imports it. Source photo folders are not published.

To replace: review the new image for public use, preserve its private source, replace only the approved web PNG and regenerate the two WebPs with existing Sharp tooling. Update intrinsic dimensions/aspect ratio if proportions differ. Check both themes, actual source selection and transfer sizes. `HeroPortrait` handles load failure with a neutral, localized unavailable state and the canonical profile name; it never fabricates a person. The supplied portrait is integrated, not pending.

## Theme architecture

`src/lib/theme.ts` owns the `dark | light` type, storage key `carwyn:theme`, bootstrap and event subscription. A constant inline script in the App Router document head applies a validated stored choice during parsing, before paint. Only the document root suppresses the expected hydration difference. The script interpolates no external/request data. Global 404 uses the same bootstrap.

First visit, unknown storage values and unavailable storage default to Dark. The toggle applies immediately even if storage writes fail. No cookies, request-time rendering or theme dependency are needed. The small header island uses `useSyncExternalStore`, with a documented layout-effect restoration for development Strict Mode. It persists across refresh, EN/VI and routes, and responds to cross-tab storage changes. Icons follow root CSS immediately; labels and pressed state follow the shared theme snapshot. The control is hidden in no-JS, where the entire portfolio remains readable in its default theme.

Header structure, navigation, brand position, menu and language selector are retained; the only additional control is a 44px icon button. The existing focus treatment is reused. Labels are in the existing EN/VI dictionary. Moon denotes Dark and sun denotes Light; the accessible name describes the destination theme, and pressed state denotes Light enabled.

## Semantic palette

The existing `tokens.css` owns both palettes. Root `data-theme` selects them; `color-scheme` follows the selection. There is no second styling system.

| Role | Dark | Light |
| --- | --- | --- |
| Canvas | `#050505` | `#f1f3f4` |
| Surface | `#0b0d0f` | `#e8ecef` |
| Primary text | `#f5f5f5` | `#20272d` |
| Muted text | `#b6bdc3` | `#4e5c66` |
| Subtle text | `#88939b` | `#596772` |
| Cyber accent | `#00ffb2` | `#007567` |
| Digital accent | `#00c8ff` | `#006f94` |

Light metadata and accents deliberately use darker values than the initial reference palette for text contrast. About, achievements, Terminal, footer, abstract project visuals, reading surfaces, code and tables use semantic aliases. Existing Dark paper surfaces keep their art direction; Light uses neutral gray panels. Code remains readable and selectable. The existing atmosphere renderer keeps its deterministic model and schedule; CSS changes its luminance in Light. The network's decorative stage is dimmed in Light while its semantic labels use theme tokens. No topology/shader/physics implementation is replaced. Existing water wake, cursor and GSAP lifecycle remain authoritative.

## Validation and review

`scripts/check-theme.mjs` adds both-theme checks for all 22 published routes: initial paint, real keyboard switching, persistence across refresh and actual route/locale links, computed text contrast, six Hero widths, portrait loading, header dimensions, missing-image fault injection, no-JS, blocked storage, reduced motion, and marquee hidden/offscreen/pause lifecycle. Screenshots and detailed JSON stay in ignored `test-results/cinematic-theme/`.

Existing accessibility contrast inspection excludes only the decorative duplicated outline name; the real identity and slogan remain audited. Hero's mobile expectation now asserts the requested static fallback rather than a live Canvas. Other assertions and strict console gates remain.

Browser scripts use the existing external Playwright runtime via `PLAYWRIGHT_MODULE_PATH`; a fresh clone does not install a browser runner. Browser evidence is Chromium/Edge laboratory testing, not WCAG certification, native screen-reader coverage, real-user Core Web Vitals or a hardware-wide frame-rate guarantee.

### Normal-build results

- PASS `npm run lint`, `npm run type-check`, `npm run build`.
- PASS `npm run check:theme -- <normal-origin>`: both palettes on all 22 routes, 24 Hero locale/theme/width combinations, first paint, keyboard/persistence, optional storage, pause/hidden/offscreen, fault-injected portrait, no-JS and clean hydration.
- PASS `npm run check:responsive -- <normal-origin>`: final rerun, 308 combinations, 125/150/200% text, all-route 320/768px reflow, touch/menu and no-JS.
- PASS `npm run check:accessibility -- <normal-origin>`: full suite, 572 keyboard controls, semantic/contrast, Terminal, forced colors, localized 404 and no-JS checks.
- PASS `npm run check:localization -- <normal-origin>`.
- PASS `node scripts/check-global-ui.mjs <normal-origin> --production`.
- PASS `node scripts/check-hero.mjs <normal-origin>`: final rerun, live pixels, Pause, locale, resize, hidden/offscreen, context loss, reduced motion and requested mobile static fallback.
- PASS `node scripts/check-hero-fallbacks.mjs <normal-origin>`.
- PASS `node scripts/measure-hero.mjs <normal-origin>` before and after.

The initial Hero run exposed a marquee/Sphere Pause hit-target overlap; moving Sphere Pause to the lower-left edge resolved it. Responsive stress exposed a clipped slogan at 200%/1024px; enlarged type now wraps cleanly. Both suites were rerun without relaxing those assertions. The new theme test initially reseeded localStorage on every load and measured resize before chrome observers settled; its fixture now seeds once and waits two frames, retaining the original geometry/persistence assertions. These diagnostics are not claimed as initial passes.

### Measured impact

Using the same existing runner and local normal production build:

| Measurement | Baseline | After |
| --- | ---: | ---: |
| Observed initial script bodies, gzip-equivalent | 154,409 B | 161,059 B |
| Observed initial script requests | 9 | 10 |
| Deferred WebGL ready | 2,275 ms | 2,105 ms |
| Sampled active desktop idle task time | 703 ms/s | 431 ms/s |
| Reduced-motion idle task time | 1.72 ms/s | 1.04 ms/s |
| Desktop Canvas at DPR 1 | 589 × 589 | 784 × 784 |

The measured JS delta is +6,650 gzip-equivalent bytes (about 6.5 KiB). New portrait transfer is approximately 56 KB or 121 KB WebP, selected responsively; the 1.34 MB PNG is a compatibility/replacement source and is not requested by modern WebP-capable browsers. The Sphere's existing topology/DPR caps stay intact; a larger visual stage costs more raster area. Lab idle/WebGL samples are renderer-dependent and do not establish a speedup or hardware frame-rate guarantee. No new RAF, renderer, animation library or dependency was introduced. Fresh-load Hero CLS in the final live suite is `0.0001264`. Its later `0.5266` cumulative diagnostic includes scripted resize/DOM fixtures and is not a fresh-load or field CLS value.

### Static deployment results

PASS `npm run build:github-pages`, `npm run check:static-export`, `npm run check:pages-validation -- <static-origin>`, `npm run check:theme -- <static-origin>`, `npm run check:accessibility -- <static-origin>` (final full rerun) and `npm run check:localization -- <static-origin> --static-export`.

The Pages suite directly loads/reloads all 22 public routes, validates 175 case-sensitive physical artifact requests, sitemap/robots, EN/VI canonicals, runtime requests, menu/history, inert Terminal inputs, 18 compatibility hashes and real localized 404s. No public `/en` or review article is exported. Dedicated routes retain Home-only WebGL isolation. The original public CV and export copy retain SHA-256 `f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`. CSS fallbacks and theme persistence work without a Next.js server.

Remaining limits: Chromium/Edge was tested; Firefox/Safari, physical touch devices and native screen readers were not. High-contrast behavior is browser emulation. Visibility tests exercise the event branch rather than certify OS scheduling. The larger visual Sphere stage and supplied portrait should receive human visual/device review. PDF accessibility was not audited and the PDF was not changed. Source warnings listed above remain pre-existing. No new dependencies were added. The PR is for review only; do not merge/deploy without explicit approval.

## Exact file inventory

Modified:

- `package.json`
- `scripts/check-accessibility.mjs`
- `scripts/check-hero.mjs`
- `src/app/global-not-found.tsx`
- `src/components/home/Hero.tsx`
- `src/components/home/HeroScrollCue.tsx`
- `src/components/layout/GlobalInterface.tsx`
- `src/components/layout/LocaleDocument.tsx`
- `src/components/webgl/NetworkSphere.tsx`
- `src/i18n/global-ui.ts`
- `src/styles/about.css`
- `src/styles/achievements.css`
- `src/styles/contact.css`
- `src/styles/globals.css`
- `src/styles/hero.css`
- `src/styles/operations.css`
- `src/styles/security-log.css`
- `src/styles/shell.css`
- `src/styles/terminal.css`
- `src/styles/tokens.css`

Created:

- `docs/cinematic-home-global-theme.md`
- `public/images/identity/nguyen-hoang-phuc-hero-640.webp`
- `public/images/identity/nguyen-hoang-phuc-hero.png`
- `public/images/identity/nguyen-hoang-phuc-hero.webp`
- `scripts/check-theme.mjs`
- `src/components/home/HeroMarquee.tsx`
- `src/components/home/HeroPortrait.tsx`
- `src/components/layout/ThemeToggle.tsx`
- `src/lib/theme.ts`
- `src/styles/theme-surfaces.css`

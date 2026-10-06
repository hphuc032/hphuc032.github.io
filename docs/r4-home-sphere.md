# R4 — Home final UI and Network Skill Sphere

## Delivery boundary

- Branch: `feat/r4-home-sphere`, based on integration commit `ec2ed61`.
- Home only: Hero → About teaser → Featured Projects → Latest Writing → Contact teaser → End System.
- Dedicated pages, case studies, Security Log, contact values, public CV and the R2 navigation design remain intact.
- No R6 publication changes, external ingestion, new routes, dependencies, R7 work or R11 global interaction work.

## Content ownership

`HomeTeasers` is server-rendered. Its biography comes from `profile`; exactly three projects come from `publishedCases`; the single latest writing entry comes from `publishedSecurityLogs`. Links use the existing locale and deployment helpers. No factual record is copied into a page component.

The current published Security Log article is the approved Latest Writing fallback. No review-state CTF entry is displayed or linked from the teaser. The separate Writeups system is unchanged.

Home UI labels and chapter identities live in `src/data/home.ts`. The approved R4 sphere tool set lives in `src/data/sphere-skills.ts`; it is not a proficiency scale or a replacement for the Expertise catalog.

## Sphere architecture

The existing Three.js/R3F enhancement is still Home-only and loads after static Hero content and initialization. Thirteen deterministic Fibonacci coordinates sit on the sphere surface. The same coordinates drive WebGL points, projected HTML hit targets and the static fallback.

| Topology | Network nodes | Edges | Skill nodes | Signals | DPR cap |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 112 | 156 | 13 | 1 | 1.5 |
| Mobile/tablet below 900px | 48 | 68 | 13 | 1 | 1 |

The 13 skill nodes are additional to the decorative network nodes:

- Network: Wireshark, Nmap.
- Web testing: Burp Suite, OWASP ZAP, Metasploit.
- App/API: JWT, OAuth2, Keycloak, Kong.
- Backend/infrastructure: FastAPI, Spring Boot, Docker, Linux.

Back-facing skill points dim in both WebGL and HTML. Only the active label appears. Native 44px buttons provide hover, focus and touch equivalents, with a parallel semantic list for assistive technology.

Rotation is one revolution per 180 seconds. Drag modifies a bounded imperative controller; release waits 700ms and ramps automatic rotation over 1600ms. Hover/focus pauses automatic rotation while a tool is being inspected. A Pause Motion button stops rendering after motion settles; manual exploration remains available.

There is one actual WebGL context, not a capability-probe scene plus a rendering scene. A guarded R3F `createRoot` uses the visible canvas's context. This also catches unsupported WebGL explicitly: the R3F Canvas wrapper's asynchronous renderer creation did not reliably reach its surrounding React error boundary. ResizeObserver caches dimensions; animation frames project points using transforms without per-frame layout reads or React state writes.

Hidden and offscreen scenes suspend their render loop. Cleanup disconnects observers/listeners and disposes the R3F root. Immediate Strict Mode effect replay reuses its root; actual unmount disposes it. Reduced motion, Save-Data, missing WebGL, failed enhancements and no-JS keep the complete static network and skill representation. Touch uses horizontal drag while vertical native scrolling remains available.

## Integration details

New Home chapter hashes are `hero`, `about`, `featured-projects`, `latest-writing`, and `connect`. System status and locale preservation use those identities.

Legacy Home bookmarks and unchanged Terminal navigation continue resolving through `HomeHashCompatibility`: profile-related hashes go to About, Operations to Projects, Log to Security Log, Terminal and Contact to their dedicated pages. This compatibility enhancement needs JavaScript; native route links and all core content remain usable without JavaScript. R9 can later update Terminal targets directly.

R2 navigation destinations, labels and active states are unchanged. Disabling eager link prefetch in the shell resolves normal-build unused stylesheet preload warnings exposed by the new composition; GitHub Pages anchors are unaffected.

R3 atmosphere and the approved pointer-wake renderer are unchanged. Hero remains the only liquid surface on the shortened Home. Existing ChapterMotion patterns are reused for teaser typography; no new animation system is introduced.

## Validation — PASS

Commands actually run against the final implementation:

- `npm run lint`
- `npm run type-check`
- `npm run build` — normal server-capable mode, Proxy retained.
- `npm run build:github-pages`
- `npm run check:routes -- <normal-build-origin> --production`
- `npm run check:localization -- <static-origin> --static-export`
- `npm run check:metadata -- <static-origin> https://hphuc032.github.io`
- `npm run check:static-export`
- Browser scripts: `check-home`, `check-hero`, `check-hero-fallbacks`, `check-global-ui --production`, `check-creative-interaction`, `check-terminal`, `check-projects`, `check-security-log`, `check-atmosphere`, `check-accessibility`, and `check-responsive`.
- `check-atmosphere-model` on the unchanged R3 model.
- Development-mode Strict Mode smoke: one context per Home mount, disposal on navigation to About, one context after Home return, and no page errors.

Home-specific EN/VI checks cover 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024, 430×812, 390×844 and 360×800. Shared responsive checks cover all 22 routes at 375, 430, 768, 1024, 1440 and 1920px: 132 route/viewport combinations, plus zoom/text-size, touch, resize and no-JS checks.

Accessibility review covers semantic headings, localized controls, keyboard focus, modal behavior, 320px reflow, reduced motion, no-JS and localized 404 recovery. Testing uses automated DOM/browser checks in Chromium through Microsoft Edge; native screen readers and Safari/Firefox were not tested.

Static export still contains exactly 22 public localized routes, excludes `/en` and unpublished entries, retains genuine 404s, and passes direct static requests. Dedicated routes exclude Home Sphere/wake bundles. The public CV remains byte-identical, SHA-256:

`f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`

## Laboratory observations

- Initial modern-browser HTML scripts: 8 files, 154,029 bytes gzip (150.4 KiB); excludes the nomodule polyfill and later dynamic enhancements. This is an artifact measurement, not field data or a before/after performance claim.
- Fresh-load Hero CLS: 0 in the final normal-build Hero test. Creative-interaction viewport cases: approximately 0.00020–0.00118.
- Drag interaction: zero React commits in the instrumented paused/manual test; one actual WebGL context on a fresh Home load.
- Existing wake test: zero layout reads during drawing, zero React commits, frame interval p95 approximately 7.7ms, zero of 119 intervals over 25ms in the final run. This is a headless laboratory observation, not a guarantee on every GPU.
- Unchanged atmosphere drawing: p95 approximately 0.3ms, maximum 0.7ms in the final normal-build run.

The Hero test now reports fresh-load CLS separately from its cumulative resize/locale/DOM-fixture diagnostic. The latter is not a Core Web Vitals measurement. Test screenshots, probes and measurement files remain under ignored `test-results/`.

## Residual review points

- Live visual approval should include skill label discovery, slow rotation, touch drag, the four teaser transitions and mobile Hero balance.
- R11 owns future all-page wake/transition integration; this phase preserves current scope and lifecycle.
- R14 should exercise real mid-range mobile GPUs and broader browsers. Current geometry is lighter on mobile, but continuous visible rotation intentionally costs more than the old idle Sphere. Hidden/offscreen and user-paused rendering stop.
- Historical Contact-only screenshot tests still target the old long-form Home; Contact behavior is covered here through dedicated-page responsive, accessibility, localization and Terminal suites. No Contact redesign occurred.
- The development server's font fetch reported network restrictions and used its fallback fonts in this environment. Development lifecycle/navigation passed; visual and console acceptance use the normal production build and static export with their bundled fonts. No font configuration changed.

## File inventory

Created:

- `docs/r4-home-sphere.md`
- `scripts/check-home.mjs`
- `src/components/home/HomeHashCompatibility.tsx`
- `src/components/home/HomeTeasers.tsx`
- `src/data/home.ts`
- `src/data/sphere-skills.ts`
- `src/lib/skill-sphere.ts`
- `src/styles/home.css`

Modified:

- `src/components/home/EndSystem.tsx`, `Hero.tsx`, `HeroScrollCue.tsx`
- `src/components/pages/PortfolioPage.tsx`
- `src/components/webgl/NetworkCanvas.tsx`, `NetworkSphere.tsx`, `StaticNetwork.tsx`
- `src/components/layout/GlobalInterface.tsx`, `LanguageSelector.tsx` (prefetch only)
- `src/i18n/global-ui.ts`
- `src/lib/network-topology.ts`
- `src/styles/globals.css`, `hero.css`
- `scripts/check-accessibility.mjs`, `check-creative-interaction.mjs`, `check-global-ui.mjs`, `check-hero-fallbacks.mjs`, `check-hero.mjs`, `check-localization.mjs`, `check-projects.mjs`, `check-responsive.mjs`, `check-security-log.mjs`, `check-static-export.mjs`, `check-terminal.mjs`, `test-fixtures.mjs`

No dependency manifest, lockfile, public asset, public CV, canonical factual record, R3 renderer, wake renderer or R6 pipeline file changed.

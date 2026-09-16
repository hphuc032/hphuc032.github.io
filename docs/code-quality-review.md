# Phase 22 — Code Quality & Architecture Review

Review date: 2026-09-13. Scope: behavior-preserving maintainability, typing, publication safety, route generation, build/test reliability, and lifecycle ownership. No visual treatment, public copy, route, interaction, dependency, or approved asset changed.

## Starting point

Phase 21 was already represented by `544e8a2 feat:Performance QA.` on both `main` and `origin/main`. That commit contains the approved font-preload and portrait-loading changes plus the Phase 21 measurements and QA scripts. A duplicate checkpoint was not created and history was not rewritten.

The ordinary Next.js baseline passed lint, type generation/checking, a 22-page production build with Proxy enabled, route/publication checks, localization checks, and the accessibility regression. The GitHub Pages baseline exported 16 generated pages containing the 12 intended public routes.

## Architecture classification

### Good

- App Router content remains server-rendered. Client boundaries are limited to menu/language behavior, motion islands, WebGL, pointer wake/cursor, Terminal input, and small interactive controls.
- Profile, contact, projects, experience, expertise, achievements, Security Log metadata, and publication manifests have clear canonical owners under `src/data`.
- MDX uses a trusted explicit server-only registry. Route input never becomes an arbitrary filesystem import.
- Network Sphere, wake, cursor, and GSAP lifecycles are locally owned and cleaned up. There is no global `ScrollTrigger.killAll()`, unbounded trail storage, or dynamic Terminal execution.
- Normal Next.js and GitHub Pages builds are deliberately separate. Static export keeps origin-root paths, while the server build retains Proxy behavior.
- Private source portrait/CV directories, generated exports, screenshots, reports, environment files, and build output remain ignored.

### Acceptable

- GitHub Pages builds temporarily disable `src/proxy.ts` inside `scripts/build.mjs`. The rename is guarded and restored in `finally`; it is less elegant than a native static-export exclusion, but avoids duplicate route architecture and preserves `/en` behavior for server deployments. Replacing it would currently add more complexity than reliability.
- Section CSS remains split by visual chapter and compiled into one shared stylesheet. Phase 21 found its transfer cost small enough that a styling-system rewrite is not justified.
- Browser QA scripts remain independent executable files. Their setup has some repetition, but each suite keeps a focused failure surface; a large test-runner abstraction would create coupling without enough benefit.
- Local browser scripts consume Playwright from the Codex workspace runtime. They are reproducible in this environment and CI does not invoke them, but a fresh standalone clone does not have a declared Playwright dependency.

### Needs refactor — resolved

- Expertise and Experience rendering previously trusted the raw catalogs. Central published-record selectors now enforce record and locale publication states, validate required public fields, sort once, and feed both homepage and Terminal consumers.
- Case-study navigation duplicated publication filtering. A single `publishedCases(locale)` selector now owns that rule.
- GitHub profile data was duplicated in the project catalog. Operations now consumes the canonical contact catalog.
- Dynamic static parameters previously emitted every manifest slug for every locale. Route generation now filters each parent locale against its publication manifest, so an unavailable translation cannot be exported accidentally.
- The MDX registry type claimed every arbitrary slug and locale existed. It now models both levels as partial and keeps unknown content unavailable.
- Article JSON-LD duplicated the profile name and serialized trusted data without a script-boundary escape. It now uses the profile catalog and escapes `<` before insertion.
- Expected public routes and responsive widths were repeated across QA scripts. An intentionally independent test fixture now centralizes the expected surface while remaining separate from application catalogs, so tests can still detect missing exports.
- Build variables were implicit. `.env.example` records `SITE_URL` and `DEPLOY_TARGET`; deployment semantics remain documented in the existing Pages workflow/build script.
- Tailwind's automatic source discovery included repository documentation and QA scripts, allowing prose tokens to produce unused utilities. The source root is now explicitly limited to `src`, which contains every application and development-preview class.

## Findings and decisions

| Classification | Finding | Decision |
| --- | --- | --- |
| High | No high-confidence architectural, trust-boundary, or lifecycle defect found. | No manufactured rewrite. |
| Medium | Raw Expertise/Experience catalogs could expose a future review translation; locale static params could over-generate future unpublished locale combinations. | Fixed with centralized publication selectors and locale-aware static params. |
| Medium | Browser QA depended on repeated route/viewport literals. | Consolidated independent expected fixtures without deriving assertions from production catalogs. |
| Medium | Tailwind scanned non-product docs/scripts and could change CSS when documentation changed. | Scoped utility discovery to `src`; visual regression verifies the same rendered behavior. |
| Medium | Article JSON-LD duplicated identity data and needed defensive script serialization. | Canonicalized and hardened. |
| Low | Some browser setup and large scenario scripts remain repetitive. | Left as-is; current separation improves diagnosis and a shared harness would be disproportionate. |
| Low | The Phase-oriented documentation set is large. | Left for the planned documentation phase; none is imported by the product build. |
| Leave as-is | Proxy source renaming for GitHub Pages. | Retained because `finally` restores the tree and both build modes pass. |
| Leave as-is | Existing component/CSS organization and client islands. | Boundaries are coherent and Phase 21 measurements show good route isolation. |

## Types, data, and trust boundaries

No `any`, `as any`, `eval`, `Function`, shell/process execution, dynamic route-derived MDX import, or unbounded client collection was found in application code. Achievement and project discriminated states remain typed. Terminal accepts a normalized token from a fixed command registry and retains its 50-entry bound.

The application catalogs remain the source of factual output. The new QA fixture is intentionally not imported from those catalogs: validation would become circular if the route expectation and implementation shared the same list.

## Dependencies

All direct dependencies remain justified: Next/React form the application runtime; GSAP owns approved editorial motion; Three.js and React Three Fiber own the Hero sphere; MDX packages compile and render the reviewed Security Log; `server-only` protects server catalogs. Tailwind/PostCSS, TypeScript/types, and ESLint packages remain build/development dependencies. No package was added, removed, or upgraded.

`npm ls --depth=0` also reports platform-specific WASM/image binaries as extraneous in the current local install. They are not declared direct dependencies or application imports. The lockfile was left unchanged; `npm ci` remains the reproducible installation path.

## Performance and behavior guardrails

The refactor adds no client dependency and no client-side animation path. The homepage initial JavaScript, deferred Three/R3F and GSAP chunks, article/case isolation, portrait bytes, font bytes, Sphere topology, wake buffer/RAF behavior, and public CV are expected to remain unchanged. Scoping Tailwind discovery may remove non-product utilities that were generated from docs/scripts; visual regression must confirm that this CSS-only reduction does not alter the site. Phase 21 remains the performance baseline.

The completed validation record is reported in the Phase 22 completion response. Generated `out/` and `test-results/` artifacts remain ignored and must not be committed.

## Validation

| Check | Result |
| --- | --- |
| `npm run lint` | Passed with zero warnings. |
| `npm run type-check` | Passed after Next route type generation. |
| `npm run build` | Passed; ordinary Next.js build generated 22 pages and retained Proxy. |
| `npm run build:github-pages` | Passed; export generated only English unprefixed and Vietnamese `/vi` public routes. |
| `npm run check:routes -- http://127.0.0.1:4196 --production` | Passed, including published/unpublished/private/dev-route boundaries and CV. |
| `npm run check:static-export` | Passed, including 12 direct-load routes, unknown-route 404, origin-root assets, sitemap/robots, and CV hash. |
| `npm run check:metadata -- http://127.0.0.1:4197 https://hphuc032.github.io` | Passed canonical, EN/VI/x-default alternates, Open Graph, robots, and the 12-route sitemap. |
| Normal/static localization | Passed all six widths, eight homepage hashes, case/log parity, Terminal strings, and no-JavaScript reading. |
| Responsive | Passed 72 route/viewport combinations plus orientation, text-size stress, touch, and no-JavaScript checks. |
| Accessibility | Passed the existing semantic, keyboard, focus, 320 px/200%, reduced-motion, no-JavaScript, and localized-404 regression suite. |
| Feature regressions | Hero/fallback, Identity, Expertise, Operations, Experience, Achievements, Security Log, Terminal, Contact, motion, creative interaction, and water-wake suites passed. |

After source scoping, visual/interaction regression remained clean. CSS changed from the Phase 21 baseline of 72,981 bytes / 13,869 bytes gzip to 70,592 bytes / 13,412 bytes gzip (−2,389 raw / −457 gzip). Homepage initial JavaScript remained 154,925 bytes gzip; enhanced total JavaScript remained 414,500 bytes gzip; case/log route isolation, portrait/font bytes, wake frame behavior, and CLS remained within the Phase 21 baseline. Phase 24 later restored the public CV working copy to the valid repository/deployment SHA-256 `F1FA8676C5FC2F0E6D676529FE97100EAAA133021B589E80C7E940BDDE1F77C9` after adding binary Git handling.

Browser suites require the environment-provided Playwright module path in this workspace. Invoking a Playwright-backed npm script in a fresh clone without that runtime will fail with `Cannot find module 'playwright'`; no dependency was added because Phase 22 explicitly prohibits new dependencies. Static serving during validation used a threaded local HTTP server. A basic Python server does not emulate GitHub Pages custom-404 routing, so the dedicated static-export checker remains authoritative for exported 404 behavior.

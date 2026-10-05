# R14 — Runtime and delivery performance

## Baseline recorded before application changes

Integration base: `c0bb65092aff15c1989b372884fa31b3c92f5c0b` (merged R13).
Feature branch: `feat/r14-performance`. Commit email: `nhpntd@gmail.com`.

The production baseline was built with `npm run build` and
`npm run build:github-pages` before application optimization. The measurement
runner is `scripts/check-performance.mjs`; ignored detailed results and before
screenshots live in `test-results/performance/baseline-normal/` and
`baseline-static/`. No development-mode measurements are used.

The runner fetches unique initial script and stylesheet URLs from each route's
production HTML and computes raw bytes and local gzip-equivalent bytes. It uses
cold browser contexts at 1440, 390 and 320 pixels, with no simulated network or
CPU throttling. These byte sizes do not assert actual GitHub Pages compression.
PerformanceObserver records local LCP-like paint, non-input CLS, long tasks and
interaction-event duration. This is laboratory evidence, not field Web Vitals,
INP, CrUX or a Lighthouse score.

The initial baseline found 196,165 bytes gzip-equivalent JS on each dedicated
route (196,267 in static mode), versus 194,005/194,103 on Home. Contact downloads
a 19,299-byte raw chunk containing Terminal's command input and transcript
implementation. The shared server route registry imports all five page
compositions, thereby giving unrelated routes the same client dependency and
page-specific CSS graph. Sphere's heavy renderer is already lazy and isolated
from dedicated pages; it must remain so.

The pure atmosphere model reads its `starCount` getter 109 times for a static
108-star Home draw. That getter recomputes viewport density and allocates a
viewport configuration object. A synchronous burst of 100 scroll events causes
100 atmosphere clears in reduced-motion mode. These are unnecessary repeated
operations, without a need to change star density or approved visual behavior.

## Environment and baseline limits

Debian 13 x86_64 cloud container; Node 24.19.0; npm 11.9.0. Platform Playwright
1.57.0 uses extracted official Microsoft Edge 154.0.4258.53. The live adapter
`/workspace/browser-tools/playwright-live.cjs` does not disable WebGL, filter
console warnings or add unsafe renderer flags. The separate fallback adapter
`playwright.cjs` disables WebGL to exercise the real static fallback; its results
are labelled separately.

No GPU device is exposed under `/sys/class/drm`. Edge renders live WebGL using
its software fallback and reports automatic-software-fallback deprecation and
`GPU stall due to ReadPixels` driver warnings. The performance runner retains
these warnings verbatim in its JSON; application errors and unexpected external
requests are hard failures. Legacy Home/Hero suites retain their original strict
warning assertions, so those suites may fail on the driver warning even when
functional draw/focus/pause checks pass. A fallback pass is not live GPU evidence.
Lighthouse is unavailable; no dependency is added to obtain a score.

Baseline client navigation uses real site links through Projects, case study,
About, Terminal, Contact, Writeups, Security Log index/article and Home, for three
cycles. It scrolls Home back into view and waits for live WebGL before sampling.
One connected live context and one pending RAF were observed at each normal-mode
cycle end. Post-GC heaps were 8.55, 8.77 and 8.87 MB; listeners stayed at 435.
Hidden-tab simulation stopped WebGL draws and atmosphere redraws. Reduced motion
removed live WebGL and left static atmosphere. These bounded observations are
not proof of leak absence over arbitrary sessions. Static navigation reloads the
document; normal mode is the relevant persistent React-shell lifecycle test.

Instrumentation prunes disconnected contexts so it does not retain disposed
renderers itself. Visibility tests override `document.hidden` and dispatch its
event; real OS/browser background scheduling remains a deployment-browser check.



## Changes and bundle results

Each dedicated route now imports its own server composition and passes it into
the shared publication/metadata helper. The shared helper no longer imports all
five pages. This removes Terminal command JS and unrelated page CSS from other
routes without creating new client boundaries. About retains its own interactive
content. Home, articles and case studies retain their existing boundaries.

Atmosphere caches the star count once per draw and coalesces scroll events into
one cancellable RAF callback. Hidden/route/unmount cleanup cancels that callback.
The deterministic 20-second draw-command trace is unchanged:
`7a5f41f33f9f7ab6f5801be81e22008ca2760ffd2df44883ca2549016ebc83d7`.
Static draw getter evaluations drop 109 → 1; 100-event reduced-motion scroll
bursts drop 100 → 1 clears in both optimized modes. Density/timing are preserved.

All numbers below are bytes, expressed as **raw / gzip-equivalent**. Totals sum
unique HTML initial asset URLs per route, excluding deferred enhancement chunks.

### Normal production

| Route | JS before | JS after | CSS before | CSS after |
| --- | ---: | ---: | ---: | ---: |
| `/` | 623,240 / 194,005 | 623,320 / 194,036 | 84,857 / 15,665 | 84,857 / 15,665 |
| `/projects` | 629,972 / 196,165 | 611,386 / 189,450 | 101,316 / 18,895 | 89,464 / 16,897 |
| `/writeups` | 629,972 / 196,165 | 611,386 / 189,450 | 101,316 / 18,895 | 89,971 / 17,126 |
| `/about` | 629,972 / 196,165 | 626,061 / 194,851 | 101,316 / 18,895 | 91,595 / 17,052 |
| `/terminal` | 629,972 / 196,165 | 615,377 / 190,857 | 101,316 / 18,895 | 84,857 / 15,665 |
| `/contact` | 629,972 / 196,165 | 611,386 / 189,450 | 101,316 / 18,895 | 84,857 / 15,665 |
| `/operations/secure-api-gateway` | 625,456 / 194,559 | 625,536 / 194,590 | 84,857 / 15,665 | 84,857 / 15,665 |
| `/log/analyzing-http-and-https-traffic-with-wireshark` | 610,667 / 188,976 | 610,747 / 189,007 | 84,857 / 15,665 | 84,857 / 15,665 |

Before: CLS maximum 0, 0 observed long tasks (0 ms maximum); LCP-like paint 64–152 ms. Largest fetched JS chunk 660,965 bytes (deferred Home WebGL).

After: CLS maximum 0, 2 observed long tasks (61 ms maximum); LCP-like paint 64–228 ms. Largest fetched JS chunk 660,965 bytes (deferred Home WebGL).

After navigation-cycle heaps: 8542888, 8778520, 8868684 bytes; listeners: 463, 463, 463. Static cycles reload documents; do not compare their heap directly with persistent normal mode.

### Static production

| Route | JS before | JS after | CSS before | CSS after |
| --- | ---: | ---: | ---: | ---: |
| `/` | 622,904 / 194,103 | 622,984 / 194,132 | 84,857 / 15,665 | 84,857 / 15,665 |
| `/projects` | 629,637 / 196,267 | 611,050 / 189,546 | 101,316 / 18,895 | 89,464 / 16,897 |
| `/writeups` | 629,637 / 196,267 | 611,050 / 189,546 | 101,316 / 18,895 | 89,971 / 17,126 |
| `/about` | 629,637 / 196,267 | 625,726 / 194,951 | 101,316 / 18,895 | 91,595 / 17,052 |
| `/terminal` | 629,637 / 196,267 | 615,041 / 190,953 | 101,316 / 18,895 | 84,857 / 15,665 |
| `/contact` | 629,637 / 196,267 | 611,050 / 189,546 | 101,316 / 18,895 | 84,857 / 15,665 |
| `/operations/secure-api-gateway` | 625,121 / 194,661 | 625,201 / 194,690 | 84,857 / 15,665 | 84,857 / 15,665 |
| `/log/analyzing-http-and-https-traffic-with-wireshark` | 610,331 / 189,074 | 610,411 / 189,103 | 84,857 / 15,665 | 84,857 / 15,665 |

Before: CLS maximum 0, 0 observed long tasks (0 ms maximum); LCP-like paint 64–168 ms. Largest fetched JS chunk 660,965 bytes (deferred Home WebGL).

After: CLS maximum 0, 0 observed long tasks (0 ms maximum); LCP-like paint 64–192 ms. Largest fetched JS chunk 660,965 bytes (deferred Home WebGL).

After navigation-cycle heaps: 6319184, 6300348, 6332296 bytes; listeners: 390, 390, 390. Static cycles reload documents; do not compare their heap directly with persistent normal mode.

Largest initial chunk stays 228,922 raw / 71,576 gzip-equivalent bytes. Deferred
Home WebGL stays 660,965 raw bytes and is absent from dedicated-page loads. The
small Home/article JS increase reflects the scroll-coalescing callback, not a new
dependency. CSS savings come from route graph isolation, not selector removal.

## Runtime, asset and boundary audit

- Sphere remains a Home-only dynamic enhancement, requested 250 ms after ready
  initialization and intersection visibility; fallback Hero/13 semantic skills
  remain server rendered. DPR is bounded to 1 on mobile and 1.5 on desktop.
  Geometry, materials, skills, edges and motion are unchanged.
- Three real route cycles retain one connected Home WebGL context, one pending
  steady-state RAF and one document in normal mode. Listener totals plateau at
  463 (baseline 435); this is CDP's overall document count, not an improvement
  claim. Post-GC heap growth is similar to baseline and bounded over these cycles.
- Cold idle Home has three canvases: atmosphere, live Sphere and a dormant 1×1
  wake. Dedicated pages have atmosphere plus dormant wake, zero WebGL. Wake
  activation is separately covered by atmosphere/motion suites. Offscreen/hidden
  Sphere rendering stops; hidden simulation has zero draw/clear delta. Reduced
  motion removes WebGL and moving atmosphere; wake remains dormant.
- Wake uses preallocated typed arrays, 30 samples, 40 Hz sampling, 1,100 ms age
  limit, DPR ≤1 and visible-section buffer ≤1,024×640. Pointer state is imperative;
  no React update per pointer event. Mobile/reduced-motion does not load wake.
- GSAP is dynamically loaded only by ChapterMotion; contexts revert on cleanup.
  No ScrollTrigger remains. Existing reveal/intersection and resize observers have
  bounded owners and disconnect cleanup; passive scroll listeners remain passive.
  R11 transform/opacity timings and navigation's immediate availability remain.
- Terminal retains its bounded 50-command/transcript history. MDX/reading content
  remains server rendered. Interactive client islands retain genuine menu, locale,
  motion, Sphere, command-input or observer responsibilities.
- Portrait stays a lazy WebP, approximately 104 KB, declared 1,800×2,700 dimensions.
  Normal Next image requests use appropriate responsive variants (750w observed);
  static export serves the original image as expected without an image server.
  No blanket preload or eager image loading was introduced.
- Fonts remain locally served Next font files with swap, Latin preload and
  Vietnamese unicode ranges. Editorial weights 400/500/600/700 and mono 400/500
  have current consumers. Desktop font resource bodies total 73,120 bytes on most
  representative routes and 77,840 on About. No speculative weight/subset removal.
- All measured route loads have zero unexpected external requests and zero
  application console/page/hydration errors. No analytics, service worker, CDN,
  unsafe HTML, dependency, basePath or assetPrefix was added.
- Route count remains 22. Package manifest/lockfile, translations, content,
  publication manifests and CV are unchanged. Two review candidates stay private.
  CV SHA256: `f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`.

## Visual comparison

Compared all eight representative routes at 1440/390/320 against their normal
production baseline. All 21 non-Home pairs are pixel-identical. Three Home pairs
have only rotating-Sphere differences within its bounds (changed pixel fraction
0.000222 / 0.000686 / 0.000007); manually viewed full Home before/after images.
Typography, content, layout and approved effects remain present. Detailed local
JSON/screenshots are ignored measurement artifacts under `test-results/performance`.

## Checks actually run

Performance command (run for baseline/after in both modes):
`PLAYWRIGHT_MODULE_PATH=/workspace/browser-tools/playwright-live.cjs node scripts/check-performance.mjs <production-origin> <baseline-normal|baseline-static|after-normal|after-static>`.
Normal production origin: `http://127.0.0.1:3000`; baseline static: port 4188;
optimized static: port 4189.

PASS: `npm ci --cache /workspace/.npm-cache --no-audit --no-fund`;
`npm run lint`; `npm run type-check`; `npm run build`;
`npm run build:github-pages`; `npm run check:routes -- <normal> --production`;
`npm run check:accessibility -- <normal>`;
`npm run check:localization -- <normal>`;
`npm run check:static-export`; `npm run check:writeups`;
`npm run test:writeups` (17/17); `npm run check:writeups-export`;
`node scripts/check-atmosphere-model.mjs`; all four performance runs.

PASS normal production using the explicit WebGL-disabled fallback adapter:
`node scripts/check-global-ui.mjs <normal> --production`, and
`node scripts/check-{projects,writeups-ui,security-log,about,terminal,contact,atmosphere,motion}.mjs <normal>`
(each script executed separately). These cover keyboard, mobile dialog, no-JS,
reduced motion, touch, focus, interactions and route-specific behavior.

PASS live adapter: `node scripts/check-hero-fallbacks.mjs <normal>` (real no-WebGL,
save-data, blocked-module and no-JS fallback scenarios).

FAIL live adapter: `node scripts/check-home.mjs <normal>` and
`node scripts/check-hero.mjs <normal>`. Both reach their final strict console gate
after functional assertions, failing on the unchanged software-driver warnings:
`Automatic fallback to software WebGL has been deprecated` and
`GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`.
No warning filters or unsafe SwiftShader flags were introduced. Functional live
lifecycle coverage passes in the R14 runner; this does not turn the strict suites
into PASS or substitute for hardware GPU regression.

PASS optimized static: `npm run check:localization -- <static> --static-export`,
`npm run check:metadata -- <static> https://hphuc032.github.io`,
`npm run check:responsive -- <static>`. Responsive covers 264 route/viewport
combinations, actual 200% typography on all 22 routes at 320/768 pixels,
125/150/200% resize stress, constrained-height dialogs, touch, keyboard focus,
EN/VI menu recovery and no-JS reading.

The initial normal responsive run failed its root-font-doubled assertion on
`/vi/operations/vulnerability-assessment`, after passing the 264-route matrix
and resize stress. An intermediate rerun overlapped static rebuilding of `.next`
and failed a menu visibility timeout; this is not valid final-build evidence.
A final isolated production build/server rerun is recorded below. No existing
assertion or warning policy was relaxed.

## Delivery scope and remaining deployment checks

Added: `docs/r14-performance.md`, `scripts/check-performance.mjs`. Modified:
ten EN/VI dedicated page wrappers, their shared server route helper,
`GlobalAtmosphere.tsx`, `atmosphere/field.ts`, and the responsive test (14 existing files).
Dependencies remain 10 runtime / 13 development, with unchanged manifest and
lockfile. Public routes remain 22 → 22. No design/content/translation/publication,
CV, SEO, stylesheet source or deployment configuration changes.

Integration fetch before delivery still points at base
`c0bb65092aff15c1989b372884fa31b3c92f5c0b`; no rebase required.
The feature commit adds one commit above that base; no merge is performed.
Commit author/committer email is `nhpntd@gmail.com`.

Residual items for R15 (documented only, not undertaken here): run unchanged
Home/Hero strict warning suites on hardware GPU browsers; measure deployed Pages
transfer compression/cache headers and real-device/slow-network performance;
verify actual background-tab scheduling and long-session memory; native
assistive-technology and representative physical touch-device smoke tests.
No field INP/LCP claim or Lighthouse score is made from this cloud laboratory.

Additional diagnostic invocation: `npm run check:metadata -- <normal>
https://hphuc032.github.io` fails the canonical assertion when normal build has
no `SITE_URL`. This review configuration intentionally emits no canonical and
`noindex` (covered by route checks); the public metadata suite passes on the
actual static build, whose supported build wrapper supplies the production URL.
This is a configuration-incompatible invocation, not an SEO source change.
Final lint initially identified a reserved local `module` variable in the new
VM model loader; renamed to `compiledModule`, then lint passed without rule
suppression. Final type-check and normal/static builds also pass.

Responsive test stabilization: before overriding `html.style` for the per-route
200% test, wait for the existing chrome layout effect's `--header-height` marker.
This synchronizes the mutation with hydrated layout; all font-doubling, clipping,
geometry, menu and error assertions remain intact. The observed failures moved
between Vietnamese routes, consistent with an initialization race, but 35 focused
cold replays did not reproduce it; the precise framework scheduling cause is not
proven. The assertion now prints before/after pixel sizes for future diagnosis.
Both normal and static full responsive suites are rerun with this readiness gate.

Timing interpretation: normal after samples include two transient long tasks
(maximum 61 ms), versus none observed in the baseline window; static windows
observe none. LCP-like paints vary across cold contexts, so these single local
samples do not establish a latency improvement or causal regression. The demonstrated
gains are delivery bytes and redundant operation counts, with unchanged CLS.
Normal lifecycle maximum recorded event duration is 48 ms; this is Event Timing
observation, not a field INP score or a threshold guarantee.

Final results: **PASS** `npm run check:responsive -- <normal>` and
`npm run check:responsive -- <static>` with the hydration-readiness gate. Both
exit 0 after all functional, screenshot and strict console assertions
(`PASS responsive QA baseline (308 route/viewport combinations)`).
Final `npm run lint`, `npm run type-check`, `node --check
scripts/check-performance.mjs` and `git diff --check` pass. The remaining strict
live Home/Hero FAIL results are exclusively the driver-warning gate described
above. No GPU warning was suppressed.

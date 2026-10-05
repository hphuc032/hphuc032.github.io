# R15 — GitHub Pages validation and release readiness

Validation date: 2026-10-05 (client timezone Asia/Saigon).

## Integration and scope

Branch: `feat/r15-pages-validation`, targeting `redesign/multipage-v2` only.
Base: `b272498a1a91fea0b962e416ad8752174f004795`, the merge of R14 PR #14.
R12 PR #12 and R13 PR #13 are also ancestors. Integration was clean and
fast-forwarded before creating the feature branch. One scoped application fix
sets prefetch=false on the case-study Projects back link. No content, translations, metadata, route architecture, dependencies, deployment
workflow, CV or publication data changes are included.

Added `scripts/check-pages-validation.mjs` and this document; modified only
`package.json` to expose `check:pages-validation` and `CaseStudy.tsx` to stop unused
Projects CSS prefetch on normal case pages. The new suite complements the
existing R13/R14 suites rather than replacing or relaxing their assertions.

## Reproducible environment

Linux cloud container, Chromium 151.0.7922.173, external Playwright 1.63.0,
Node 24.19.0/npm 11.9.0. The external live adapter
`/workspace/r9-browser-tools/runtime.cjs` launches `/usr/bin/chromium`, without
unsafe renderer flags or warning filters. The explicitly separate fallback
adapter `fallback-runtime.cjs` uses `--disable-webgl`. No browser dependency was
added to the repository.

Clean install: `npm ci --cache /workspace/.npm-cache --no-audit --no-fund`.
Normal `.next` and `out` were removed before `npm run build`; normal serves at
`http://127.0.0.1:3150`. A separate clean source copy at
`/workspace/r15-static-validation` excludes `.git`, `.next`, `out`, local reports
and environment files. Its package files are the same installed dependency
versions; `npm run build:github-pages` creates fresh output and the repository's
`check:static-export -- --serve` serves it at `http://127.0.0.1:4195`.
No SPA rewrites or Next server emulate static navigation. Directory URLs receive
a slash redirect, files are served directly and missing paths receive 404.html
with HTTP 404. The application intentionally uses document navigation in Pages
mode. Normal build without SITE_URL intentionally uses review noindex metadata;
production canonical/SEO evidence comes from the supported Pages build wrapper.

## Route and artifact inventory

Canonical fixture: `scripts/test-fixtures.mjs`, including only approved CTF
publication selectors. Public route count stays **22 → 22**. All listed routes
use trailing slashes in the final Pages artifact:

- `/`
- `/vi/`
- `/projects/`
- `/vi/projects/`
- `/writeups/`
- `/vi/writeups/`
- `/about/`
- `/vi/about/`
- `/terminal/`
- `/vi/terminal/`
- `/contact/`
- `/vi/contact/`
- `/operations/secure-api-gateway/`
- `/vi/operations/secure-api-gateway/`
- `/operations/vulnerability-assessment/`
- `/vi/operations/vulnerability-assessment/`
- `/operations/network-traffic-analysis/`
- `/vi/operations/network-traffic-analysis/`
- `/log/`
- `/vi/log/`
- `/log/analyzing-http-and-https-traffic-with-wireshark/`
- `/vi/log/analyzing-http-and-https-traffic-with-wireshark/`

There are 25 exported HTML files: 22 public documents plus Next's framework
`404.html`, `404/index.html` and `_not-found/index.html`. These framework recovery
artifacts are not new publication routes. There are 170 physical artifact files;
all are fetched with exact case-sensitive paths and compared byte-for-byte to
output. No case-folding filename collisions, /en export, source Markdown, source
map or source/test directory exports are allowed. Next's fingerprinted JS/CSS
chunk names and local fonts are inventoried in the ignored JSON report. A clean
build excludes stale bundles; no new caching layer or service worker exists.

All physical assets return 200. HTML/CSS/JS/PDF/WebP/WOFF2/SVG content types are
checked against the local static server. Portrait image dimensions and successful
decode are checked in browser; CSS/font/script references are also observed on
all direct/reload route requests. Fonts remain local, including Vietnamese faces.
No asset-prefix, basePath, /en or subdirectory deployment assumption is introduced.

## URL, SEO and delivery behavior

Production origin: **https://hphuc032.github.io**. All 22 routes assert exact
canonical URLs, EN/VI/x-default equivalents and html lang. Page titles and social
title/description must be nonempty; og:url matches the canonical. Configured
social images must resolve as production-origin assets. Any structured JSON is
parsed and checked for development-origin leaks; no new structured data is added.
The existing metadata suite separately checks locale fields and robots policy.

Sitemap is exactly the fixture set, with no duplicate canonical variants, /en or
unpublished entries. Robots retains `Allow: /` and the production sitemap URL.
Every public route is loaded from a fresh browser context and reloaded, including
both locale case studies and the long Security Log article. Locale switching and
browser Back/Forward are checked on Home, Projects, About, Terminal, Contact,
a case study and the article. Locale transitions preserve the corresponding page.

All nine compatibility hashes are checked in EN and VI (18 cases): profile,
identity, expertise, experience, achievements, operations, log, terminal, contact.
They resolve to approved dedicated destinations, with fragments where applicable.
The menu opens using Enter, Escape returns focus, document navigation closes it,
and Back/Forward restores the right page without body scroll lock.

Unknown EN/VI routes, /en, unknown Log and an actual review writeup slug return
HTTP 404 without Home redirects. VI recovery localizes title/lang as supported by
existing architecture. The favicon URL returns 200. Expected document-404 console
messages are classified narrowly by exact URL/status; other console/page errors,
failed assets or warnings remain failures. They are not globally filtered.

## Publication, content and safety

Public CV: `/cv/nguyen-hoang-phuc-cv.pdf`, SHA-256
`f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`.
The artifact's bytes match the approved hash and every served physical asset
matches its file. Portrait and article assets remain unchanged.

There are zero published CTF articles; the two review candidates stay unpublished.
Existing pipeline/rendering/export checks verify source-path and publication
boundaries. The known review slug is included in actual 404 testing. Three real
project cases and both approved Wireshark article locale routes remain intact.
Home/Projects/About regression suites verify structure, canonical facts and claim
safety; there are no content edits in R15.

Terminal payloads `$(id)`, script markup and a curl-like string remain inert, retain
input focus and initiate no runtime requests. `clear` and `help` retain the current
catalog. Prompt stays `carwyn@sec:~$`. The existing Terminal suite covers bounded
history, safe output and no shell/eval/backend execution. Contact's canonical
email, GitHub, LinkedIn and CV URLs are verified by its regression; no form/API.
A separate outbound HEAD probe reaches GitHub with HTTP 200. LinkedIn returns no
HTTP response within the cloud probe deadline; its canonical href is verified,
but remote availability is not certified. No email was sent.

## Browser, accessibility and motion evidence

Both complete accessibility suites pass: 22 routes, 496 keyboard controls at
390/1440 pixels, native menu/focus/Back recovery, safe Markdown code/table scrollers
at 200%, 13 semantic Sphere skills, all-route no-JS and representative forced colors.
The normal and static responsive suites pass all 308 measurements (22×12 viewports plus
22×2 at actual 200% text); both final runs exit 0 at the unchanged console gate.
The 12 sizes are 1920×1080, 1440×900, 1280×800, 1024×768, 900×900, 768×1024,
430×812, 412×915, 390×844, 375×812, 360×800 and 320×800. Actual 200% root text is
32px at 320/768 widths; no DPR-only claim replaces it. Reduced motion and no-JS
reading/navigation are covered in both artifacts, including static Sphere and
Terminal's explanation. Existing touch/menu assertions retain minimum 44px targets.
Representative static Contact 390px, Terminal 320px and VI Home 430px captures
were visually reviewed; this is limited smoke evidence, not full visual certification.

The final R15-specific suite exits 0, including all direct/reload routes, exact
SEO/locale metadata, 18 compatibility hashes, terminal request safety and the
shortened-touch input/submit check. Its reduced-motion runtime report has no
application errors or warnings. The initial normal responsive run passed all
functional/capture checks but exited 1 on a single Chromium unused-CSS-preload
warning for /vi/operations/secure-api-gateway. No warning assertion was relaxed;
five focused cold replays reproduced it while the live stylesheets did not include
the warned Projects CSS. The case-study back link used Next default prefetch; the
Next 16 Link guide confirms prefetch=false disables viewport and hover prefetch.
Only this back link now opts out, matching existing shell navigation. Click
navigation remains intact, and Pages uses the same plain document link. Both
artifacts were rebuilt cleanly after the fix and final evidence is rerun below. Five post-fix cold replays
have zero warnings (5/5 warning reproductions before, 0/5 after), with no clipping.

Only Linux Chromium is available. No hardware GPU device is exposed; CDP reports
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`.
WebGL is available via software rendering, not hardware acceleration. Native Home
and Hero suites retain their strict console assertions; their exact status appears
below. A fallback PASS is not live hardware-GPU evidence. The performance runner
records driver warnings verbatim and fails application errors/external requests.

No Firefox/Edge-native/Safari/WebKit, physical iPhone/Android, Windows high contrast,
NVDA or VoiceOver testing is claimed. The touch test shortens a Chromium viewport
to 390×450 and keeps Terminal input/submit usable; it is not a physical OS keyboard
certification. Forced-colors evidence is Chromium emulation. Visibility tests use
synthetic document.hidden events, not OS-level tab scheduling.

## Runtime, bundle and cache audit

Every direct public load and reload is observed for page errors, console errors,
warnings, request failures and response failures. Runtime requests must remain
same-origin GET; commands must add none. Intentional outbound contact links are
not activated by the browser audit. No trackers, external fonts/scripts, GitHub
API, analytics or application backend calls are introduced.

R14's unchanged performance runner runs in both modes with an `after-` label,
asserting Terminal JS isolation, Home-only WebGL, one-context bounds, deterministic
atmosphere trace, coalesced redraws, repeated navigation and hidden/reduced-motion
cleanup. It records initial raw/gzip-equivalent assets and local paint/CLS/heap
observations. Final initial gzip-equivalent JS ranges are 189,007–194,851 bytes normal and
189,103–194,951 static across these eight representative pages. All measured
samples have zero observed non-input CLS. Three cycles retain one connected
WebGL context. Normal listeners are 463/464/464 and static 390/391/390; heaps are
8,287,276 / 8,651,476 / 8,936,828 normal and 6,386,388 / 6,325,636 / 6,253,216 static.
These are bounded three-cycle observations, not long-session leak certification.
The 100-scroll-event test yields one redraw; star-count getter is read once and
the deterministic trace matches R14. Four software-driver warnings remain verbatim
in each report. Concurrent lab runs observed maximum long tasks of 579ms normal
and 1489ms static while other browser suites were running. They are disclosed,
not interpreted as field performance or a causal source regression; serialized
follow-up results are recorded below.
Timing need not equal R14's samples. These are lab measurements,
not field Web Vitals, actual Pages compression or a CDN cache guarantee.

The local static server has no production cache-control policy and no compression
unless its optional lab flag is requested (not used for this audit). R15 does not
deploy or replace the current public site to obtain CDN headers. Actual Pages
cache/transfer/post-deploy behavior belongs to R16 verification.


Serialized follow-up after all other browser suites finished also exits 0 in both
modes, using the unchanged runner. Results:

| Mode | Max observed CLS | Max long task (ms) | Listeners over three cycles | Post-GC heaps (bytes) |
| --- | ---: | ---: | --- | --- |
| normal | 0 | 464 | 463, 463, 463 | 8652472, 8885508, 8976328 |
| static | 0 | 305 | 390, 390, 390 | 6313676, 6305524, 6319244 |

Each cycle retains one connected context and each report records four driver
warnings. Remaining long tasks are observed even without other suites; this
software-GPU cloud result does not establish target-device latency. Repeat cold
render/interaction timing on deployment browsers/hardware in R16; no claim of
a speedup, identical R14 timings or field Web Vitals is made.

## Exact commands and results

Browser commands use external PLAYWRIGHT_MODULE_PATH. N = normal origin 3150;
S = static origin 4195. “fallback” explicitly disables WebGL; “live” uses the
unaltered software-capable Chromium launcher. No final PASS replaces an earlier
failed invocation silently: the reproducible preload finding and its fix are above.

| Command actually executed | Result / mode |
| --- | --- |
| `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` | PASS |
| `npm run lint`; `npm run type-check` | PASS after the scoped fix |
| `npm run build`; `npm run build:github-pages` | PASS clean, both rebuilt after the fix |
| `npm run check:pages-validation -- S` | PASS final artifact, exit 0 |
| `npm run check:routes -- N --production` | PASS final normal |
| `npm run check:responsive -- N`; `-- S` | PASS complete final reruns, 308 measurements each |
| `npm run check:accessibility -- N`; `-- S` | PASS complete final reruns |
| `npm run check:localization -- N`; `-- S --static-export` | PASS final artifacts, fallback |
| `npm run check:metadata -- S https://hphuc032.github.io` | PASS final static, fallback |
| `npm run check:static-export` | PASS final static |
| `npm run check:writeups-export` | PASS final static; both review slugs EN/VI return 404 |
| `npm run check:writeups` | PASS, zero publication regression |
| `npm run test:writeups` | PASS 17/17 |
| `node scripts/check-atmosphere-model.mjs` | PASS |
| `node scripts/check-global-ui.mjs N --production` | PASS final normal, fallback |
| `npm run check:projects -- N` | PASS final normal, fallback |
| `npm run check:writeups-ui -- N` | PASS, fallback |
| `node scripts/check-security-log.mjs N` | PASS, fallback |
| `node scripts/check-about.mjs N` | PASS, fallback |
| `node scripts/check-terminal.mjs N` | PASS, fallback |
| `npm run check:contact -- N` | PASS, fallback |
| `node scripts/check-atmosphere.mjs N` | PASS, fallback |
| `node scripts/check-motion.mjs N` | PASS, fallback |
| `node scripts/check-hero-fallbacks.mjs N` | PASS, live launcher; explicit no-WebGL/save-data/blocked-module/no-JS scenarios |
| `node scripts/check-home.mjs N` | **FAIL exit 1**, live; final unchanged GPU ReadPixels warning assertion |
| `node scripts/check-hero.mjs N` | **FAIL exit 1**, live; final unchanged GPU ReadPixels warning assertion |
| `node scripts/check-performance.mjs N after-r15-final-normal` | PASS final normal, live |
| `node scripts/check-performance.mjs S after-r15-final-static` | PASS final static, live |
| `node scripts/check-performance.mjs N after-r15-serial-normal` | PASS serialized follow-up, exit 0 |
| `node scripts/check-performance.mjs S after-r15-serial-static` | PASS serialized follow-up, exit 0 |

All existing feature regressions were executed on the clean R14 baseline during
R15. After changing only the case-study back-link prefetch prop, builds, all-route
responsive/accessibility/localization, case/project/shared navigation, route/SEO/
asset/publication checks and both performance/lifecycle suites were rerun. Other
feature implementation and live Home/Hero source did not change. Both strict live
Home/Hero suites reached their final console gates after functional assertions;
ReadPixels warnings remain disclosed FAIL results. Initial baseline normal/static
performance runs also passed before the fix. The first full normal responsive
run exited 1 on the Projects preload warning; an unfinished diagnostic rerun was
stopped before replacing its server with the final build, and is not final evidence.

Build logs retain the upstream Node module-type and Writeups tracing warnings;
these are separate from browser application/request/hydration failures.


Detailed browser evidence lives under ignored `test-results/pages-validation`,
`responsive`, `accessibility` and `performance`. No failed assertion or GPU warning
is suppressed. During development, the new history test initially selected a
hidden desktop locale control at mobile width; its viewport was corrected before
retaining the locale/history assertions. A mistaken invocation from the normal
build directory had no `out`; final artifact checks run from the static copy.

## CI, blockers and R16 handoff

Existing PR workflow: `Source and normal Next.js` and `GitHub Pages static export`.
The deploy workflow triggers on main/workflow_dispatch; it was not dispatched.
GitHub GraphQL and REST return `Forbidden` from this environment, so PR creation/status and
remote green CI cannot be certified merely from local passes. Local equivalents
of the two jobs are run, but this does not satisfy the separate remote CI gate.

Release decision: **HOLD for remote PR/CI confirmation**. Source and artifact
checks pass locally, but unavailable GitHub APIs cannot prove green remote jobs.
The feature is delivered by an authorized Git push and must target integration,
never main. Final branch SHA/ahead/behind and PR creation outcome are reported in
the delivery response. An API failure must not be interpreted as a successful PR
or CI run. Hardware/device/screen-reader/CDN limits remain follow-up items; no
unresolved application failure is intentionally hidden as a driver warning.

R16 checklist (do not perform during R15):

1. Review/merge R15 into integration only after remote PR CI is green and behind=0.
   Deploy the resulting integration merge HEAD, not just R15's feature SHA. If
   integration changes, repeat deployment-sensitive regressions on that HEAD.
2. Preserve origin https://hphuc032.github.io, 22 public routes and zero published
   CTF articles; keep both review candidates private. Verify the CV hash above.
3. Record the actual pre-rollout main HEAD again. At R15 validation it was
   `73d6c14d14bbfc5832ef363b5a8a09d61c44bba6`; retain it as the rollback reference.
   Follow the repository's approved release/rollback process; no rollout here.
4. After the separately authorized rollout, verify every public route and deep
   reload, actual 404s EN/VI/writeup/Log, favicon/fonts/portrait/CV, canonical/
   hreflang/sitemap/robots, locale history and mobile menu on the real domain.
5. Confirm real Pages response MIME/cache/compression, hashed-asset reuse and
   runtime request cleanliness. Inspect both actual deployment and PR jobs.
6. Repeat live Home/Hero on a real hardware GPU and target browser. Verify native
   background scheduling, long-session navigation, physical touch keyboard,
   iOS/Android, Firefox/Safari, native screen reader and high contrast where available.
   Cloud software-driver warnings and emulation limits remain disclosed.

Main and production were not changed. R15 makes no unconditional rollout-ready
claim until remote CI and any newly discovered application blockers are resolved.

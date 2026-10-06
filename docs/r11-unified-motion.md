# R11 — Unified motion and interaction integration

## Scope and Git baseline

- Feature branch: `feat/r11-unified-motion`.
- Integration base: `2624df95ca18d15597886ad1da8a387f28726155` on `redesign/multipage-v2`, including R9 and R10.
- Production `main` is untouched. This work is delivered by a feature PR; it does not merge or deploy production.
- Published routes remain **22**. No new content, publication, routes, translations, commands, assets, dependency or Sphere topology is introduced.

## Motion vocabulary

CSS tokens remain authoritative. `motionTiming()` converts both milliseconds and seconds, including units rewritten by CSS minification.

| Purpose | Duration | Application |
| --- | --- | --- |
| Fast feedback | 160 ms | Existing controls; brief outgoing opacity dip |
| Chapter/record arrival | 350 ms | Existing restrained chapter pattern |
| Route arrival | 320 ms | Main opacity from .94 to 1 |
| Editorial/title arrival | 450 ms | Major headings and existing statement/record patterns |
| Existing long transition | 700 ms | Retained token for existing consumers; not a route delay |

The approved chapter, statement and record patterns remain the reusable text vocabulary. R11 brings their controller into the shared shell and uses route-qualified visit keys. It does not animate paragraphs, code, tables or each long-form reading block. Current-screen content, hashes, focus and restored scroll resolve immediately. Later chapter arrivals run once per route per session.

## Page transitions

`PageMotion` is an isolated, null Client Component. The server still renders all content in its final readable state. Only the mounted enhancement adds a transient `data-page-motion` attribute to the existing main.

- Incoming main fades .94 → 1 over 320 ms; its H1 translates 8 px → 0 over 450 ms concurrently.
- Below the existing desktop breakpoint, the title distance is 4 px.
- Internal page-link activation may start a brief 160 ms outgoing dip. Navigation is never intercepted, prevented or delayed to wait for it.
- Home does not replay its initial headline animation. Its approved Sphere/statement relationship stays intact.
- Same-page links, hashes, external anchors, mailto, modified clicks, downloads and PDF/new-tab links retain native semantics.
- Focus, hashes, hidden documents, reduced-motion changes and restored BFCache pages settle the enhancement immediately. A bounded timeout also resolves failed navigation.
- No route overlay, fake loading state, scroll hijacking, experimental transition API or focus/scroll replacement is added.

Visual duration and lifecycle timeout are distinct: the measured incoming lifecycle was 471.4 ms, including 20 ms of cleanup margin after the 450 ms title. It is not added navigation latency.

## Route profiles and pointer wake

`src/data/motion-config.ts` is a typed behavior registry using the existing public-path/page-publication architecture. It is not a content-publication gate.

| Route family | Relative wake energy |
| --- | --- |
| Home | 1.00 |
| Projects | .75 |
| Terminal | .60 |
| Contact | .45 |
| About | .30 |
| Writeups index | .25 |
| Security Log index | .25 |
| Operations case | .20 |
| Security Log / future writeup article | .12 |
| Unavailable route | 0 |

English and Vietnamese share these profiles. A future writeup article profile does not publish an article.

The existing fish-like `WaterWake` renderer is unchanged. It is dynamically imported on the first eligible mouse movement. The controller is mounted once in the shell; dedicated pages allocate one decorative canvas only on eligible movement in empty surface space. It reuses that canvas until unmount. Home keeps its established section canvases.

- Fine mouse with hover only; no finger tracking or renderer request on touch.
- No effect in Terminal input/transcript, native controls or text selection.
- Dedicated-page portraits, articles, prose, paragraphs, code, tables, figures and images are excluded.
- Wake geometry is cached at activation; no layout reads in its draw loop.
- Existing bounded 30-sample memory, curved path, velocity response and decay are preserved.
- One wake RAF, DPR at most 1, backing buffer at most 1024 × 640, and only the visible surface slice.
- Calm returns the buffer to 1 × 1 and stops RAF. Route/unmount removes any owned decorative canvas.
- No React state updates or per-frame DOM creation.

## Atmosphere, cursor and Sphere coordination

The R3 atmosphere renderer, density, meteors and route intensities remain authoritative. A scoped `carwyn:motion-busy` event pauses its animation during page arrival/exit. The wake clears while that event or the menu is active. The R3 menu, protected-region, reduced-motion, high-contrast and visibility policies remain in place.

Custom cursor semantics remain unchanged; native input/text selection has priority. Existing project focus/hover parity and approved preview depth stay intact. Sphere stays Home-only, with no topology, signals, drag, labels, budgets or resources added by R11.

No second atmosphere renderer, shader transition or global WebGL is introduced.

## Reduced motion, mobile and lifecycle

Reduced motion disables route spatial introductions and pointer wake. Text remains visible, the atmosphere is static, and the existing Sphere fallback is retained. Touch gets static pointer composition and smaller chapter/title arrivals, with no hover-only requirement.

The controllers own and release their listeners, observers, scoped GSAP contexts, timers, animation frames and optional canvas. No global `ScrollTrigger.killAll()` is used. Async imports check disposal before allocating. Menu/transition state is cached outside the draw loop. Hidden-tab, resize, scroll, section exit, locale and route changes clear stale geometry.

Repeated Projects → About → Terminal → Contact → Writeups → Projects navigation passed three cycles. Observed document/window listener counts stayed constant: 2 pointermove, 6 visibilitychange, 3 click. Back/Forward and reduced-motion toggles passed. A separate actual Next development/Strict Mode smoke passed repeated navigation and preference toggles without duplicate renderers or page errors.

Observed bounds: one atmosphere canvas; at most one activated wake on a dedicated page; at most one live Sphere/WebGL context on Home. Home retains its inert SSR wake surface, so the visible Home test can count atmosphere + wake + Sphere (at most three). Dedicated pages need at most two activated canvases. No WebGL context was created on dedicated content pages.

## Test corrections and genuine regression fixes

1. **Atmosphere preference synchronization:** the browser check now waits for both static mode and stopped running state after enabling reduced motion, and animated mode before testing hidden-tab behavior on return. The lifecycle assertions remain intact; arbitrary sleep or weaker assertions are not substitutes for the state transition.
2. **PDF file enumeration on Windows:** Contact's exact single-approved-PDF assertion normalizes path separators. No PDF changes.
3. **Vietnamese 404 title:** Next could insert its English metadata title after the existing Vietnamese early bootstrap. The existing localized title is now maintained idempotently by a small head observer, disconnected on pagehide and restored only for BFCache return. The established text and language are unchanged. The accessibility test waits for document loading before inspecting the final title.
4. **Minified duration units:** initial focused timing validation exposed `.45s` being interpreted as milliseconds in the new route controller. Using the existing CSS duration helper fixed it; the final normal and static focused suites pass the finite-duration assertion.
5. **No-JS responsive readiness:** the static no-JS sweep occasionally measured before web fonts finished loading. It now waits for `document.fonts.ready` before checking final wrapping/overflow. The same overflow and clipping assertions remain unchanged; the final static sweep is repeated below.

## Validation performed

Browser tooling: Playwright from the available host runtime, Microsoft Edge/Chromium headless. No new browser dependency was installed. Native NVDA/JAWS/VoiceOver, Safari and Firefox were not tested.

| Check | Result / environment |
| --- | --- |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `npm run build` | PASS, normal server-capable mode |
| `npm run build:github-pages` | PASS, final static artifact |
| `npm run check:routes` | PASS, normal production server with safe local/noindex config |
| `npm run check:localization` | PASS in normal and final static mode; static invocation uses its existing `--static-export` option |
| `npm run check:metadata` | PASS, normal production-origin build and final static artifact with expected production origin |
| `npm run check:static-export` | PASS, 22 direct-load routes, assets, SEO, CV and real 404 |
| `check-motion.mjs` | PASS, final normal and static builds |
| Home, Hero, Hero fallbacks, global UI | PASS, normal production server |
| Projects, About, Terminal, Contact | PASS, normal production server; Contact repeated on final static artifact |
| Security Log and Writeups UI | PASS, normal production server |
| Responsive | PASS, normal and final static builds, 132 route/viewport combinations plus no-JS font-ready reflow |
| Accessibility | PASS on static build after localized 404 correction |
| Creative interaction | PASS, normal and final static builds |
| Atmosphere | PASS, normal and final static builds; preference race resolved |
| Writeup catalog/export and 17 pipeline/rendering tests | PASS; two review entries remain unpublished |
| Strict Mode lifecycle | PASS, separate development-server browser smoke |

The full feature sweep ran on the normal production server. Final focused motion, atmosphere, creative interaction, accessibility, responsive, Contact, localization, metadata and export checks were repeated against the final static artifact. Setup mistakes were corrected rather than reported as product regressions: metadata requires its expected-origin argument; static localization requires `--static-export`; safe local route checking expects noindex. Development font retrieval was unavailable in the host during the Strict Mode smoke and used Next's fallback; cached production build fonts and static assets passed.

QA images, raw logs and measurement JSON remain ignored under `test-results/`. They are not public assets.

## Performance observations

Laboratory observations on this host, not field Core Web Vitals, GPU guarantees or target-hardware FPS promises:

- Incoming lifecycle: 471.4 ms; concurrent CSS visual durations 320 / 450 ms.
- Wake active frame interval p95: 7.8 ms in the focused suite; creative suite p95 8.8 ms with no sampled frame over 25 ms.
- Creative interaction: zero per-frame React commits and zero draw-loop layouts.
- Atmosphere draw p95 .6 ms, maximum .8 ms over 126 samples.
- Focused 22-route load CLS maximum .000154; creative viewport sweep maximum .001177.
- Focused initial-load long tasks: one 52 ms task on About, one 55 ms task on Terminal. Attribution was not established; no memory leak or animation-source claim is inferred from these isolated samples.

Initial HTML-referenced assets, independently gzip-compressed, compared with the saved R10 artifact before modification:

| Route | Before JS | After JS | JS delta | CSS delta |
| --- | ---: | ---: | ---: | ---: |
| Home | 193,696 B | 193,476 B | −220 B | +336 B |
| Projects / About / Terminal / Contact | 192,141 B | 195,504 B | +3,363 B | +336 B |
| Security Log index | 184,954 B | 188,317 B | +3,363 B | +336 B |

The shared shell controller adds roughly 3.28 KiB gzip to dedicated pages while deferring the wake renderer until actual eligible interaction. Dedicated route startup continues to exclude homepage Sphere/WebGL and the wake drawing implementation. No image, font or PDF transfer changes.

Approved public CV SHA-256 remains `f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9` in static output.

## Human review and deferred residuals

Review calm 320 ms page arrivals, 450 ms title arrivals, About chapter pacing, lower wake energy away from Home, and the cleared wake during menu/page changes. Browser/static checks cannot replace subjective timing review.

- R13/R14: broader browser coverage and target-device frame profiling, especially hybrid pointer capabilities and BFCache behavior.
- Preserve publication boundaries: article prose receives no reveal; review writeups remain unavailable.
- The existing Node module-type warning on typed writeup catalog imports is non-fatal and outside this motion scope. No package-mode migration was attempted.
- No claim of GPU profiling, formal accessibility certification, native screen-reader validation or field performance data.
- No new factual content, route, CMS, ingestion work or publication state change.

Stop after R11 feature delivery. No merge, production push, R12, R13 or R14 implementation.

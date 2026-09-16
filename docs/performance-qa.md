# Phase 21 — Performance QA

Review date: 2026-09-13. Production: https://hphuc032.github.io/. No deployment or commit performed.

## Scope and history

Started from clean `main`, `a42a134` (`origin/main`). The log includes `9c9d0b4 feat: Accessibility QA`, responsive checkpoint `8edcbe0`, and rewritten motion checkpoint `7b0ea19`. Approved accessibility fixes are already ancestors of HEAD; history was not rewritten. The unrelated root PNGs remain excluded.

Only two application changes were justified by measurement: reduce unnecessary font preloads and let the below-Hero portrait load using native lazy loading. No content, layout, animation, route, accessibility semantics, CV, or dependency changed.

## Method and limits

Cold headless Edge/Chromium contexts, cache disabled, CDP Performance/Network/Event Timing and PerformanceObserver. Desktop: 1440×1000, unthrottled. Mobile: touch, 375/430×900, DPR 2, 4× CPU slowdown, 150 ms added network latency, 1.6 Mbps download / 750 Kbps upload. Three cold runs per English mobile width; other page/mode combinations are single diagnostic samples.

These are laboratory measurements, **not field Core Web Vitals**. No CrUX/RUM dataset was available. Menu event durations are an interaction-responsiveness proxy, not a field INP score. Main-thread totals cover the observation period, not hydration in isolation. Small timing differences and host-load outliers must not be interpreted as guarantees.

The original local static server delivers uncompressed resources, unlike production. Its baseline is retained for reference but excluded from before/after conclusions. An optional `--compressed` mode was added to the local static checker to compare the same gzip delivery conditions before and after. It does not configure GitHub Pages headers.

Raw reports: `test-results/performance/{baseline-local,baseline-compressed,baseline-production,after-compressed}/measurements.json`; lifecycle and CPU sample summaries: `test-results/performance/lifecycle/measurements.json`. These generated artifacts remain ignored.

## Baseline and production measurements

All sizes below use decimal KB. Gzip JS/CSS sizes are calculated consistently from response bodies; actual browser transfer size is reported separately and includes protocol overhead. The production application code matched the baseline local JS payloads.

| Production page | LCP | CLS | Initial JS gzip | Total loaded JS gzip | Requests | Actual transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` desktop | 704 ms | 0 | 154.9 KB | 414.5 KB | 27 | 681.7 KB |
| `/vi/` desktop | 536 ms | 0 | 154.9 KB | 414.5 KB | 31 | 716.0 KB |
| Secure API Gateway | 856 ms | 0 | 147.3 KB | 147.3 KB | 23 | 276.5 KB |
| `/log/` | 848 ms | 0 | 141.7 KB | 141.7 KB | 22 | 269.8 KB |
| Wireshark article | 1,264 ms | 0 | 141.7 KB | 141.7 KB | 22 | 271.6 KB |

Production throttled mobile homepage LCP: **2,024 ms median at 375**, **1,988 ms median at 430** (all six runs 1,984–2,244 ms). Vietnamese 430 diagnostic: 2,236 ms. Menu event maxima in these runs: 88–104 ms; CLS 0. These samples meet the supplied LCP/CLS goals, but cannot establish field p75 or field INP.

## Before / after: equivalent compressed local export

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Homepage initial JS gzip | 154,925 B | 154,925 B | 0 |
| Enhanced desktop total JS gzip | 414,500 B | 414,500 B | 0 |
| Mobile total JS gzip | 182,081 B | 182,081 B | 0 |
| CSS gzip | 13,867 B | 13,869 B | +2 B |
| Font preload requests | 12 | 6 | −6 |
| EN homepage font transfer | 101,232 B | 77,840 B | −23,392 B / −23.1% |
| VI homepage font transfer | 133,004 B | 122,748 B | −10,256 B / −7.7% |
| EN article/case font transfer | 101,232 B | 73,120 B | −28,112 B / −27.8% |
| EN desktop homepage requests | 27 | 22 | −5 |
| EN article requests | 22 | 16 | −6 |
| EN desktop homepage transfer | 677,299 B | 652,080 B | −25,219 B |
| EN mobile homepage transfer | 444,580 B | 419,361 B | −25,219 B |
| Portrait bytes (eventually loaded) | 103,178 B | 103,178 B | 0 |
| 375 mobile LCP, median of 3 | 1,500 ms | 1,316 ms | −184 ms |
| 430 mobile LCP, median of 3 | 1,724 ms | 1,384 ms | −340 ms |
| VI 430 LCP, one sample | 1,864 ms | 1,552 ms | −312 ms |
| Initial-load CLS | 0 | 0 | 0 |

The LCP improvements are promising lab results; the deterministic result is the reduction in requests/bytes. Interaction timing is noisy: local 375 median menu event increased 136→176 ms, while 430 decreased 272→104 ms. One after-run reached 280 ms. No blanket claim that every interaction is under 200 ms is made.

## LCP, images, fonts and waterfall

Actual homepage LCP is the **UNDERSTAND** text span, not the Sphere or portrait. Other routes use their heading/entry title. HTML and blocking CSS/font scheduling therefore matter more than changing the visual effects.

`next/font` still self-hosts Be Vietnam Pro 400/500/600/700 and IBM Plex Mono 400/500, `font-display: swap`, with fallback adjustment. `subsets: ["latin"]` changes preload hints only: the generated Vietnamese and Latin Extended unicode-range faces remain available. No weight or glyph was removed. All 22 WOFF2 files, totaling 166,980 bytes in the export, remain available on demand; the browser loads the needed subset of them.

The only raster portrait remains 1800×2700 WebP, 103,178 bytes, with the same width/height, sizes and localized alt. Changing eager to lazy removes its early automatic preload. In the desktop sample its request moves from 23 ms / `link` initiation to 134 ms / `img` initiation. It still loads shortly afterward because Identity is near the viewport; **no total image-byte saving is claimed**. Space remains reserved. Private originals and approved public PDF were untouched.

CSS is one shared 13.9 KB gzip stylesheet. The live response uses gzip and `Cache-Control: max-age=600` for HTML, CSS and JS. Hashed `/_next/` filenames provide version separation, but the observed Pages header is **not immutable**. No unsupported header configuration or service worker was introduced. There were no third-party runtime requests in any measured page. Fonts are served from the site, not Google at runtime; outbound social links are ordinary links.

## JavaScript, hydration and route isolation

The homepage initial JavaScript remains 154.9 KB gzip. The deferred Three.js/R3F renderer chunk is 232.4 KB gzip; deferred GSAP is 27.2 KB gzip. The initial homepage-specific island chunk is about 13.0 KB gzip and includes small integration code. Static HTML is readable before enhancement. Production Sphere first-ready was about 2.56–2.78 seconds, after text LCP at 0.54–0.70 seconds.

Case studies, log index and article did not request the Sphere/Three.js/R3F chunk, GSAP, or the homepage wake chunk. Server-rendered prose remains server-rendered; global controls remain isolated client components. Reduced-motion homepage loads 154.9 KB gzip total with no deferred GSAP/Three.js. Touch loads no WebGL and never allocates an active wake buffer. The small shared homepage integration code is still downloaded on touch; splitting it further was not justified by current size/cost.

Terminal remains event-driven with a 50-command bound and 64-character normalized input. It has no timer, API request, or background processing. Shared server-derived catalog content remains unchanged.

## Sphere, wake, GSAP and CPU/GPU lifecycle

- Sphere: **112 nodes, 156 edges, two short signals**, DPR cap 1.5. Static fallback on touch/narrow/save-data/reduced-motion or WebGL failure. R3F uses demand/never rendering; work is limited to pointer settling and short packets. No topology, quality or timing changes made.
- In sampled visible-idle, hidden and offscreen windows, Sphere issued zero WebGL draw calls. Hidden state was exercised with synthetic visibility events; this validates handlers, not hardware power consumption. No claim of measured GPU watts/utilization is made.
- Wake: 30-sample fixed storage, one conditional RAF, no pointer-frequency React commits or DOM generation. Cache dimensions before drawing, capped buffer ≤1024×640, capped DPR ≤1, return to 1×1 after calm. Identity, Contact, reading content and Terminal input remain excluded as approved.
- Wake at 1440/1920, four gestures each: S-curves/circles/zigzag/reversal preserved; **0 layouts, 0 React commits**, draw p95 0.7–1.7 ms. Generated gesture pacing p95 about 21–21.4 ms includes automation delays and is not a measured physical display FPS. Separate creative-interaction RAF sample p95 was 7.8 ms, no frames over 25 ms.
- Wake memory after 12 activations and GC: +5,036 B at 1440, +4,988 B at 1920. This small bounded run does not show accumulating canvas buffers. Calm had zero additional draw calls. Offscreen, blur, hidden, locale replacement, touch and reduced-motion cleanup passed.
- Cursor: event-scheduled RAF, no perpetual idle loop; native text/input selection preserved. Temporary `will-change` on interactive depth elements is released on reset.
- GSAP: one dynamic homepage import, scoped contexts and IntersectionObservers. **No ScrollTrigger is imported or instantiated**, so active trigger count is zero by construction. Contexts revert on completion, hidden state, resize, hash/focus resolution and effect cleanup; no `killAll()` or additional ticker is used.
- Other RAFs are one-shot initialization/menu/section-discovery operations. There are no setInterval loops in application code. CSS has no broad blur/backdrop-filter or giant permanent compositing effect; the Terminal inset focus shadow is tiny and retained.

## Scroll, memory and main thread

Full-page native-scroll diagnostic at 1440, 1024 and touch 430 (unthrottled CPU): no overflow, no frame intervals >34 ms, p95 about 7.1 ms on this host's headless scheduler. That is a laboratory scheduling result, not a 144 Hz/60 fps device certification. Complete-scroll cumulative layout shifts remained below 0.001 in that run. The broader six-width creative/motion regressions reached 0.00131 on static and 0.00156 on the ordinary Next.js build, still below 0.002.

Three rounds of case/log/home return and EN/VI visits followed by GC kept **1 document, 1,188 nodes, 368 listeners and 4 canvases** in the current homepage. Heap settled from 6.44 MB to 5.78 MB and 5.78 MB; no monotonic retained growth was observed. GitHub Pages locale/route navigation intentionally performs normal document loads under the existing static architecture. Future Vercel client navigation also receives the existing effect cleanup.

CPU sampling attributed initial work primarily to browser rendering, Turbopack module execution, framework hydration, and (desktop only) shader/program setup. No long-form motion or unbounded wake loop emerged as a hotspot. Exact hydration-only duration and physical GPU utilization were not isolated.

Mobile throttled initial-load long tasks remain a **medium-priority risk**: after local runs had maximum tasks around 363–601 ms, with mixed rendering/initialization work; production baseline maxima were typically 200–241 ms. Host/network scheduling changes task grouping. Local median main-thread observation time decreased 1,842→1,716 ms at 375 and 2,542→2,045 ms at 430. It would be misleading to attribute every millisecond to the two resource changes. This does not justify removing approved visual features or undertaking a risky architecture rewrite in this pass.

## Static output

Export total: **3,503,629 bytes**. All 12 published routes remain exported; the 15 HTML files include duplicate/internal 404 artifacts, not extra published articles.

| Artifact group | Files | Bytes on disk | Gzip estimate where applicable |
| --- | ---: | ---: | ---: |
| HTML | 15 | 604,948 | 132,443 |
| JS, all routes/chunks | 18 | 1,615,497 | 470,409 |
| CSS | 1 | 72,981 | 13,869 |
| Fonts | 22 | 166,980 | already compressed |
| Portrait | 1 | 103,178 | already compressed |
| PDF | 1 | 4,604 | on demand only |
| RSC/static text and robots | 53 | 931,407 | 230,138 |

The whole-export total is not homepage transfer. The PDF is not fetched on normal page load. Phase 24 subsequently added binary Git handling and restored the working/export copy to the valid repository and deployment SHA-256 `F1FA8676C5FC2F0E6D676529FE97100EAAA133021B589E80C7E940BDDE1F77C9`. Sitemap, robots, original assets, routes and metadata were not edited during this performance phase.

## Optimization decisions

| Priority/value | Decision |
| --- | --- |
| Medium issue / high value, low risk | Remove unused subset preload pressure while retaining all faces; native lazy loading for non-LCP portrait. Applied after baseline, measured afterward. |
| Medium / investigate later | Throttled mobile initialization long tasks and occasional >200 ms lab menu event. Record and monitor on real devices; no speculative rewrite. |
| Low / not worth it | Re-encode a 103 KB portrait, remove font weights, split a 14 KB stylesheet, micro-optimize inactive Terminal. Rejected. |
| Not worth visual/architecture risk | Remove wake/Sphere, delay already-readable content, remove 3D/motion, add service worker or performance dependency. Rejected. |

No high-severity performance defect was established. No feature was removed for a synthetic score.

## Lighthouse and accessibility limits

Lighthouse is not installed in the available runtime. No package was installed solely to obtain scores. **Performance / Accessibility / Best Practices / SEO Lighthouse scores: not measured.** CDP and existing functional/accessibility regression suites supplement the source review; no field, formal accessibility certification or real screen-reader testing is claimed.

## Validation

| Command / suite | Result |
| --- | --- |
| `npm run lint` | Passed, zero warnings |
| `npm run type-check` | Passed |
| `npm run build:github-pages` | Passed, static export |
| `npm run build` | Passed, ordinary Next.js production with Proxy intact |
| `npm run check:routes -- http://127.0.0.1:4187 --production` | Passed, including private/unpublished/dev-route exclusion and public CV |
| `npm run check:static-export` | Passed: 12 direct-load routes, sitemap, robots, root assets, CV and unknown-slug 404 |
| `npm run check:localization -- http://127.0.0.1:4187` | Passed |
| `npm run check:localization -- http://127.0.0.1:4186 --static-export` | Passed, including eight hashes and locale-equivalent pages |
| `node scripts/check-responsive.mjs http://127.0.0.1:4186` | Passed: 72 route/viewport combinations, EN/VI 375/430/768/1024/1440/1920, orientation, text-size stress, no-JS |
| `node scripts/check-terminal.mjs http://127.0.0.1:4186 --static-export` | Passed: nine commands, invalid input, history, bounded records, focus, touch, no-JS and links |
| `node scripts/check-security-log.mjs http://127.0.0.1:4187` | Passed: six widths, article/locale/back navigation, no-JS, reduced motion, no WebGL on article |
| `node scripts/check-accessibility.mjs http://127.0.0.1:4187` | Regression passed: existing semantics, focus, keyboard, localized 404, 320 px/200% equivalent, reduced motion, no-JS |
| `node scripts/check-creative-interaction.mjs http://127.0.0.1:4186` | Passed: all six widths EN/VI, depth/reveals, input deferral, cleanup, console/hydration |
| `node scripts/check-water-wake.mjs http://127.0.0.1:4186` | Passed: 1440/1920 gestures, DPR, bounds, selection, memory, hidden/offscreen/re-entry/touch/reduced motion |
| `node scripts/check-motion.mjs http://127.0.0.1:4187` | Passed: six widths EN/VI, no listener growth/replayed initialization across route/locale changes |
| `node scripts/check-hero-fallbacks.mjs http://127.0.0.1:4186` | Passed: blocked enhancements, no WebGL, save-data and no-JS remain readable |

The first static-localization run exposed a **test synchronization race**: it accepted an already-present old `<main>` before the replacement document finished loading. The test now waits for the exact target URL/hash and document language. Existing assertions are preserved and both deployment modes pass; no application routing change was needed. An initial wake-test attempt also encountered a stopped local server after turn continuation; it was restarted and the entire wake suite passed.

Reviewed Identity captures at EN 1440 and VI 430: portrait appears normally, name/diacritics and composition remain intact. No visible redesign was required. Generated screenshots are in `test-results/localization/` and `test-results/responsive/`. Console/hydration checks passed in the suites above. The public PDF and original CV hashes are unchanged; original source remains private.

## Files and handoff

Application: `src/styles/fonts.ts`, `src/components/home/Identity.tsx`.

QA: `scripts/check-static-export.mjs` (optional local gzip serving), `scripts/check-localization.mjs` (static navigation synchronization), `scripts/measure-performance.mjs`, `scripts/measure-lifecycle.mjs`, this report. Zero added dependencies.

Review the same approved design at the local static preview. Production remains unchanged until a separately authorized deployment. Stop at Phase 21; suggested Phase 22 entry is review/maintainability of the existing motion lifecycle and test helpers, without changing approved visuals or facts.

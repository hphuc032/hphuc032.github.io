# Phase 18 — Motion polish

The approved baseline below is retained. See [Phase 18.5](creative-interaction.md)
for the additional, uncommitted creative-interaction pass and its measurements.

Phase 17 checkpoint: `3ccb31b feat: finalize carwyn.sec localization`.
The two unrelated root PNGs remain untracked. Phase 18 changes remain available
for review; no content, factual records, CV, dependencies, or section layouts changed.

## Whole-page review and inventory

The approved surface changes and editorial spacing already establish intensity,
pause, reading, interaction, and conclusion. They remain the primary pacing system.
There is no shared reveal applied indiscriminately to every section.

| Area | Decision | Final behavior |
| --- | --- | --- |
| Initialization | TUNE | Same nonblocking 1.2-second greeting, duration shared with CSS; completes when the document becomes hidden. Session/locale skips remain intact. |
| Hero typography | REMOVE | Remove the late GSAP dim-and-translate replay of text that was already visible. Heading, metadata and scroll cue resolve with the server content. |
| Sphere arrival | TUNE | Full SVG immediately; live enhancement starts after initialization resolves and crossfades over 350ms in the same reserved area. |
| Sphere topology, pointer and signals | KEEP | 112 nodes, 156 edges, two occasional signals; restrained pointer influence, demand draws capped at 30fps during activity. Existing pause/offscreen/hidden behavior remains. |
| Hero → Identity | TUNE | Preserve the warm photographic chapter boundary. A brief tonal arrival on the portrait and a small vertical arrival on the name begin just before visibility. No wipe or parallax. |
| Portrait hover | REMOVE | Remove the 2.5% hover zoom: the portrait has no zoom/open action to explain it. |
| Identity → Expertise | KEEP | Warm-to-dark contrast and editorial whitespace carry the transition; capabilities remain fully visible and static. |
| Expertise → Operations | KEEP | Large titles and responsive abstract previews supply the rise in energy. No continuous preview animation. |
| Operations hover/focus | TUNE | Keyboard focus receives the same 8px title emphasis as pointer hover. Existing preview mask and arrow response remain. Reduced motion suppresses displacement. |
| Case studies | KEEP | Static opening, figures and readable prose; no chapter-motion island or WebGL scene on these routes. |
| Operations → Experience | KEEP | Calmer surface, chronology and generous spacing reduce intensity without choreography. |
| Achievements | KEEP | Static category/record/status hierarchy. No celebratory motion. |
| Security Log index/article | KEEP | Reading surface and narrow prose measure; only existing small CTA feedback. No paragraph/table/code animations. |
| Security Log → Terminal | KEEP | Surface contrast introduces interaction; console and all commands remain immediate. |
| Terminal → Contact | TUNE | Final heading receives a small, finite arrival. Links remain immediately readable. No additional CTA cascade. |
| End System | KEEP | Static close and native back-to-top anchor. |
| Menu | TUNE | Opening shortened from 350ms to 240ms; closing/focus return remain immediate. |
| Links/buttons | KEEP / TUNE | Existing 160ms neutral color/underline/arrow feedback; header/locale/menu link colors now share that family. |
| Cursor | TUNE | One queued frame only when the pointer moves. Hide on scroll, selection, hidden document, keyboard use, route change and native input areas. Only update its text when context actually changes. |

## Timing and easing

CSS tokens remain the duration source. `src/lib/motion.ts` reads them only when
an enhancement starts; no repeated computed-style reads in a render loop.

| Token | Duration | Use |
| --- | ---: | --- |
| duration-fast | 160ms | Small link/control feedback |
| duration-interface | 240ms | Menu opening |
| duration-medium | 350ms | Preview/canvas transition; compact chapter arrival |
| duration-slow | 700ms | Desktop portrait/name/conclusion arrival |
| duration-stagger | 75ms | Desktop Contact line offset only |
| duration-initialization | 1200ms | Existing greeting, not extended |

CSS standard/editorial/exit curves remain the approved family. The finite GSAP
arrivals use the centralized non-overshooting `power3.out` editorial counterpart.
No bounce, elastic easing, letter scrambling, blur or simulated latency.

At widths below 1024px, arrivals use 350ms, at most 4px movement, and no stagger.
Desktop uses at most 8px. Portrait arrival changes opacity only, from 0.86 to 1;
text starts at 0.9, so even the brief enhancement remains readable.

## Lifecycle, accessibility and failure handling

- `ChapterMotion` is a homepage-only client island with three observed targets.
  It imports GSAP only as an eligible target approaches the viewport. Text and
  photography remain server-rendered; no hidden initial CSS or loading gate.
- IntersectionObserver starts arrivals within a 192px pre-entry margin. Direct
  hashes, restored scroll positions, fast scrolls and late imports stay resolved
  instead of dimming content the visitor has already seen.
- Each target runs at most once per SPA session. Locale changes do not replay
  arrivals. Every tween is scoped with `gsap.context` and reverted on completion,
  offscreen departure, effect cleanup, hidden document or reduced-motion change.
- There were **zero ScrollTriggers** before this phase and there are still zero.
  No trigger plugin, refresh loop, `killAll`, scroll listener for chapter motion,
  smooth-scroll library, scroll hijacking, or persistent GSAP timeline was added.
- Reduced motion keeps full static content and the network SVG. No chapter GSAP
  or WebGL is requested for a reduced-motion first visit. Touch gets no custom
  cursor; text selection and the entire native Terminal console take precedence.
- Cursor text previously changed on every pointer event, waking the global
  section-discovery MutationObserver. Identical cursor labels now cause no text
  mutation. Position updates remain imperative, without React state per frame.
- Menu, input and native links retain keyboard focus behavior. Styles cannot
  leave prose or headings hidden if GSAP fails, storage is blocked, or JavaScript
  is disabled. Fault-injection checks exercise both deferred enhancements.

## Validation and review

The EN and VI production builds were reviewed locally. Local test outputs are
ignored by Git. Screenshots retain the approved compositions; motion is best
reviewed in the browser. Video capture is unavailable in the installed Playwright
runtime because its FFmpeg binary is absent; no download/dependency was added.

The meaningful human review points are the still/readable opening, the static-to-
live sphere handoff, the barely raised Identity name, faster menu opening,
equivalent Operations focus feedback, and the final two-line Contact arrival.
The quieter middle sections and all article/case-study prose intentionally stay still.

### Commands and results

- `npm run lint` — pass, zero warnings.
- `npm run type-check` — pass, generated route types and strict TypeScript.
- `npm run build` — pass, 15 static outputs, no build errors.
- route validation against the local production build — pass; published
  EN/VI routes, redirects, 404s, CV, sitemap and production preview exclusion.
- localization validation against the local production build — pass; all section hashes,
  bilingual content/routes/metadata, Terminal, and no-JavaScript reading.
- Existing browser suites: `check-global-ui`, `check-hero`, `check-hero-fallbacks`,
  `check-identity`, `check-expertise`, `check-operations`, `check-experience`,
  `check-achievements`, `check-security-log`, `check-terminal`, `check-contact`
  — all pass on the production server.
- `check-motion` — pass for EN and VI at 375, 430, 768, 1024, 1440 and 1920px:
  finite arrivals, whole-page scroll, no Hero text replay, no overflow or stale
  tween styles. Hidden/reduced-motion changes settle active tweens. Three
  case/back/locale cycles leave listener counts unchanged (one pointer listener,
  four document visibility listeners in production).
- Development Strict Mode: `check-motion --lifecycle-only` and `check-global-ui`
  passed against the local development server. Listener counts
  remain stable there as well (one pointer listener, five visibility listeners,
  including development runtime behavior). No orphan handlers or hydration errors.
- The cursor test now starts its pointer inspection after independent navigation,
  rather than asserting visibility during a preceding native smooth scroll.
  Synthetic document visibility tests use a separate context from history tests.
  One transient headless `ERR_NETWORK_IO_SUSPENDED` interrupted localization QA;
  a clean isolated rerun passed, without changing application routing.
- Private source CV integrity was reverified. The approved public derivative
  also remained byte-for-byte unchanged.

### Performance comparison

Local production builds, headless Edge, 1440×1000, DPR 1. Compressed sizes below
are calculated gzip sizes of decoded bodies, not CDN transfer measurements.

| Measurement | Phase 17 | Phase 18 |
| --- | ---: | ---: |
| Initial homepage JavaScript | 499,464 B | 501,189 B |
| Initial homepage JavaScript, gzip | 150,833 B | 151,405 B |
| Deferred Three/R3F chunk, gzip | 232,419 B | 232,419 B |
| Deferred GSAP chunk, gzip | 27,156 B | 27,156 B |
| Case-page requested scripts, gzip, including prefetch | 156,416 B | 156,988 B |
| Idle main-thread task time, desktop | 1.249 ms/s | 1.148 ms/s |
| Idle main-thread task time, reduced motion | 1.070 ms/s | 1.021 ms/s |
| Live sphere ready, fresh session | 1.265 s | 2.224 s |

Initial JS increases by **572 bytes gzip (0.38%)**. GSAP remains a deferred chunk
and may be requested at initial tall desktop sizes when Identity is already
within the pre-entry margin. It is absent for a reduced-motion first visit.
Sphere readiness is deliberately later because it follows the unchanged greeting;
the full SVG and text are visible immediately, and crossfade adds no layout shift.
The tiny idle difference is measurement noise, not a claimed speed improvement.

Per-viewport full-flow CLS stayed below **0.002** in both languages. The older
Hero stress test prints an aggregate CLS after repeatedly resizing the same page
and injecting/removing a spacer; that total is not a valid real-visit CLS measure.
The new check uses a fresh context per viewport and asserts CLS below 0.01.

Pixel/render-call checks confirm actual sphere output, no continuous idle draw
loop, and zero additional draws while paused, hidden or offscreen. Case-study and
Security Log routes do not request Three/R3F or GSAP. Terminal responses remain
synchronous and no new persistent animation state tree was added.

These browser measurements establish demand-render behavior and main-thread
work; they do not measure physical GPU power or guarantee frame pacing on every
device. No new dependency or production media asset was introduced.

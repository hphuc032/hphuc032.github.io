# R3 — Global atmosphere engine

Starting integration commit: `f3dd5cf` (R1, R2 and R6 merged).
Delivery branch: `feat/r3-atmosphere`. This change does not redesign pages, alter content,
add routes, or modify the Network Sphere, pointer wake or writeup pipeline.

## Ownership

`GlobalAtmosphere` is a small client island mounted once by `PageShell`. The pure
`AtmosphereField` model owns drawing and scheduling; `atmosphere-config` owns route
presets; `random` owns the session seed and deterministic generator.

The Canvas2D layer is fixed, transparent, non-interactive and `aria-hidden`. Existing
sections have opaque backgrounds and isolated stacking contexts. Rather than changing
those sections, the layer uses cached knockout rectangles over headings, prose, links,
controls, media, chrome and paper surfaces. It paints only in unprotected dark whitespace.
Header, status and the native dialog retain their existing stacking order.

Geometry is measured on mounting, route changes, resizing, main-size changes and font
readiness. Animation frames only use cached geometry and scroll position. Future page
compositions should retain the protected selectors or explicitly extend them when adding
new reading surfaces. This is especially relevant to R4/R5/R11; no such work is included here.

## Presets

English and Vietnamese paths normalize through the existing route architecture.

| Surface | Intensity | Desktop stars | Meteor event interval |
| --- | --- | ---: | --- |
| Home | home | 108 | 6–12 s |
| Projects / Terminal | medium | 82 | 9–16 s |
| Contact | medium-low | 68 | 9–16 s |
| About / Writeups / Log index / Operations cases | light | 54 | 14–22 s |
| Log article / future writeup article paths | very-light | 32 | 20–30 s |

Paper sections, including the current Contact composition, receive no atmosphere ink.
An article retains its very-light preset while its paper reading surface suppresses drawing.
The future writeup-path mapping does not publish or create any article routes.

Below 768px, density is 50%, the meteor cap is one, bursts are disabled and meteor delays
are multiplied by 1.3. At 768–1023px density is 75%; desktop density is 100% with at most
two active meteors. Stars are stable normalized positions with low cool-neutral opacity.
Only one to three stars twinkle slowly at a time. Meteors travel down and right, last
900–1600 ms and occasionally have a smaller delayed companion on desktop.

One seed is generated per browsing session and stored in sessionStorage when available.
Blocked storage falls back to module memory. Star generation and event scheduling use
separate deterministic random streams. Drawing never calls random functions. Route changes
retain the seed and pending schedule rather than generating a new field.

## Lifecycle and cost

- One Canvas2D context; no extra WebGL context or dependency.
- No React state writes per frame, per-object DOM or unbounded object arrays.
- At most one R3 RAF, with drawing capped at approximately 30fps during active events.
- A single timeout waits for the next event; a calm field has no continuous RAF.
- Hidden documents, open navigation dialogs and fully covered reading surfaces suspend
  events. Resume schedules fresh events without replaying accumulated work.
- Reduced motion shows static stars without animation timers or RAF. Forced colors hides
  the layer. Media-query changes are handled during the session.
- Resize, visibility, scroll, preference and observer ownership is cleaned up on unmount.
- Resolution is capped at DPR 1 and a 1280×900 backing buffer (about 4.4 MiB RGBA).
- The existing pointer-wake lifecycle and WebGL topology are unchanged.

## Validation

Passed: lint, type-check, normal Next.js build, GitHub Pages build, route checks,
localization checks, metadata checks and static-export validation. The export still
contains **22 published routes**, excludes `/en`, retains a real unknown-route 404,
and preserves the public CV hash:
`f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`.

Existing global UI, accessibility, creative-interaction, Operations and Security Log
browser suites passed in normal Next.js mode. The legacy Operations suite uses exact
non-trailing-slash URL waits, so it times out on the static host's trailing-slash links;
static navigation is instead covered by the focused atmosphere/localization/export checks.
The creative suite covered both locales at 375, 430, 768, 1024, 1440 and 1920px;
observed CLS remained approximately 0.000239–0.001442. Dedicated pages still exclude
homepage Sphere and pointer-wake bundles. Older canvas-count assertions now explicitly
allow only the shared atmosphere while continuing to reject homepage WebGL on content routes.

Focused checks:

```sh
node scripts/check-atmosphere-model.mjs
node scripts/check-atmosphere.mjs <preview-origin>
```

The model check verifies repeatable randomness, route presets, scheduling, object caps,
direction and suspension over simulated four-minute runs. The browser check covers all
22 routes, six density breakpoints, reduced-motion changes, dialog pause/focus return,
blocked storage, repeated navigation, zero atmosphere WebGL contexts and console errors.
Browser tests use the existing external Playwright runtime via `PLAYWRIGHT_MODULE_PATH`;
Playwright is not a new project dependency.

Chromium/Edge headless measurements on the local static build: 201 drawing samples,
p95 0.4 ms and maximum 0.6 ms; no layout operations during the measured active interval.
The calm interval had no atmosphere drawing, with total page task time about 0.35 ms
over 400 ms. These are local laboratory observations, not a cross-device frame-rate
guarantee. Visibility was tested through a document-hidden lifecycle override and event,
not an operating-system tab benchmark.

The resulting shared-shell production chunk was 30,033 bytes raw / 10,990 bytes gzip.
It includes existing shell code; an isolated incremental R3 bundle delta was not measured.
QA captures and measurements remain under ignored `test-results/` rather than public assets.

## Review boundaries

Keep atmosphere understated. Future visual review may tune preset values without changing
the rendering architecture. Native screen-reader tools, Safari/Firefox and hardware GPU
profiling were not added or claimed. Later page compositions should recheck knockout geometry
and stacking, especially when introducing transformed reading containers.

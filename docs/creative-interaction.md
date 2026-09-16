# Phase 18.5 — Creative interaction review

Revision note: the typography/depth work below is approved. The CSS pointer
atmosphere was rejected and is superseded by [Phase 18.5B](water-wake.md).
Keep the earlier method/measurements below as historical comparison only.

Uncommitted visual work on top of the approved Phase 18 baseline. No Phase 18
checkpoint was created and Phase 19 has not started. The two unrelated root PNGs
remain untracked. Catalogs, translations, routes, metadata, sitemap and both CVs
are unchanged.

## Pointer water / color diffusion

**Method:** two bounded CSS gradient fields per selected surface, moved through
imperative `transform` and `opacity` updates. The gradients approximate displaced
subsurface light; they do not distort page pixels or simulate fluid physics.
CSS was visually sufficient, so canvas/shader alternatives were unnecessary.
There is no added WebGL renderer, backdrop filter, SVG circle trail, particle
spawning, or full-screen render target.

**Surfaces:** Hero (relative strength 1), Selected Operations (0.7), and Terminal
surrounding space (0.45). Only one surface responds at a time. Each has two fixed
light spans inside a clipped decorative layer. Identity, Expertise, Experience,
Achievements, Contact and all case/article reading routes have no liquid layer.
Paragraphs and native Terminal controls suppress the response.

**Color/intensity:** existing cyan/green dominate; a very small violet tint softens
the secondary field. Gradient stops carry their own low alpha, then a second
bounded envelope ranges up to 0.56 on Hero, 0.392 on Operations, and 0.252 around
Terminal. This is not equivalent to placing a flat opaque color at those values.
The glow sits behind selectable text rather than over it.

**Response:** a 110ms exponential position-follow interval separates the precise
cursor from the broader light. Measured pointer speed feeds a clamped energy
value, changing the two fields' relative scale, angle and displacement. Slow
movement produces less disturbance. Energy and opacity decay over roughly
260ms intervals after movement stops; after the residual opacity drops below
0.002, the RAF loop cancels and temporary styles are removed. Mouse leave fades
to calm. Scroll/offscreen/hidden/resize teardown is immediate to prevent stale
coordinates or invisible work.

The first prototype had a closed elliptical halo. It was removed after visual
review and replaced with offset, stretched fields of light. The result has no
concentric-ring vocabulary and does not leave a permanent glowing cursor halo.

## Reusable text introductions

All content is server-rendered and initially readable. There are three text
patterns, alongside the unchanged Phase 18 portrait/name arrival:

| Pattern | Treatment | Placement |
| --- | --- | --- |
| Chapter | Short upward mask, 6–12px displacement, up to 0.6° skew correction | Expertise heading, homepage Security Log heading, Terminal heading |
| Record | Brief lateral shutter, 3–6px offset; metadata remains visible | Three Operations titles and four Achievement identities |
| Statement | Two existing Contact lines, small perspective rotation and vertical offset, 75ms maximum desktop stagger | LET'S CONNECT. |

Chapter and Achievement reveals use the existing 350ms token. Desktop project
and Contact reveals use 700ms. Compact layouts use 350ms and no line stagger.
All use the Phase 18 editorial ease. No words/characters are split into separate
accessibility objects; natural EN/VI wrapping is preserved.

New chapter/record headings are prepared within the 192px pre-entry margin only
after GSAP loads successfully. A second IntersectionObserver starts them as the
first line enters roughly the bottom 92% of the viewport, before visual center.
Late imports and initial in-view content stay resolved. A fast jump placing an
armed heading above 45% of the viewport immediately resolves it.

Each identity key is visited once per SPA session. Hash/focus navigation, resize,
locale cleanup, hidden state and reduced motion revert owned GSAP contexts.
No global `killAll`, ScrollTrigger, geometry-refresh loop or scroll-position
polling was introduced. There are still **zero ScrollTriggers**.

Hero receives no replay or re-hiding of text. Identity retains the approved
portrait/name arrival without a new mask, tilt, zoom or synthetic treatment.
Experience stays static to lower the energy after Operations. Article/case-study
prose, tables, code, dates, statuses and Terminal output remain still.

## Selective depth

- **Hero:** its two statement groups separate by at most 1.5px and 2.5px
  horizontally and 1px vertically as light energy changes. They return to the
  original composition when calm. Metadata remains an alignment anchor.
  The Network Sphere's topology, rendering budget and pointer behavior are unchanged.
- **Operations:** only the existing preview SVG receives CSS perspective, at most
  3° tilt on each axis and an 8px forward-plane illusion. The row/title is never
  tilted. Caption and all project facts stay stable. Keyboard focus exposes the
  same preview and gets a static forward plane; Phase 18 title focus parity remains.
- **Contact:** entrance-only perspective (1000px), at most 8° X rotation on desktop
  or 3° compact, with an 8–16% line offset. After settling, all transform and mask
  styles are reverted. Letters do not float and Contact links do not tilt.

## Rejected effects

- Closed ripple halos: too literal and too close to a glowing cursor decoration.
- Canvas/fluid shaders: CSS produced sufficient atmosphere without another renderer.
- Liquid on Contact: diluted the clean closing surface and link clarity.
- Liquid/tilt on Identity: weakened the photographic, human chapter.
- Liquid on Expertise/Achievements: made too many dark chapters react alike.
- Universal tilt, moving Hero metadata and additional Sphere parallax: redundant
  movement and weaker alignment.
- Character splitting and long staggers: unnecessary wrapping/accessibility work.
- Masking every chapter, Experience record or article heading: removed the quieter
  parts of the narrative and would add homepage behavior to reading routes.

## Devices, accessibility and lifecycle

Fine-pointer + hover capability and actual `pointerType === "mouse"` are required.
Touch events never start a light/depth loop, including on hybrid devices.
Touch layouts retain static compositions and compact scroll entrances. There is
no finger-follow effect. No new cursor labels were added.

The existing precise cursor and soft atmospheric response use the same pointer
position, but different follow speeds. Text selection, dragging, paragraphs and
native controls take priority. The Terminal console retains its native cursor,
real input, keyboard shortcuts and immediate command responses. Heading/link
semantics, language annotations, focus outlines and factual status text remain.

Reduced motion skips pointer effects and all GSAP introductions, reverts any
active/armed masks, and retains the static network SVG. No-JavaScript visitors
get the full final composition. The decorative light layer is `aria-hidden` and
never receives events or focus.

The pointer loop caches geometry on surface/row acquisition and clears it on
scroll/resize. It reads no layout in RAF and writes no React state. DOM count is
fixed. Effects cancel on document hide, unmount, locale change and offscreen
departure; returning tabs wait for a new mouse movement. Finite GSAP contexts are
owned/reverted individually. Repeated route/locale navigation retains stable
listener counts in production and development Strict Mode.

GPU review found repeated gradient rasterization in the first implementation.
Temporary `will-change` is now applied only during interaction and removed on
settling. Inspection then showed two **544×416 CSS-pixel light layers**, one paint
each during the sampled gesture, with a non-painting container. This avoids a
full-screen effect buffer and releases the compositor hint when idle.

## Files

New: `PointerAtmosphere.tsx`, `motion/LiquidLight.tsx`,
`styles/creative-interaction.css`, `scripts/check-creative-interaction.mjs`, and
this report.

Extended Phase 18's `ChapterMotion.tsx`. Added opt-in decorative/reveal markup to
Hero, Expertise, Operations, Achievements, SecurityLog and Terminal, mounted the
homepage island in `app/[locale]/page.tsx`, and imported its CSS in globals.
`check-operations.mjs` now measures glyph ranges inside the reveal span rather
than treating that span's entire block box as text ink.

Dependencies added: **none**. No files were staged or committed.

## Final measurements against Phase 18

Production build, headless Edge, same measurement scripts and 1440px viewport.
Byte counts are summed response bodies compressed with gzip, not a claim about
Vercel's eventual wire encoding. Case totals include Next's homepage prefetch.

| Metric | Phase 18 | Phase 18.5 |
| --- | ---: | ---: |
| Initial homepage JS, raw bytes | 501,189 | 506,354 |
| Initial homepage JS, gzip bytes | 151,405 | 153,266 |
| Lazy Three/R3F chunk, gzip bytes | 232,419 | 232,419 |
| Lazy GSAP chunk, gzip bytes | 27,156 | 27,156 |
| Case route + prefetch JS, gzip bytes | 156,988 | 158,849 |
| Sampled desktop idle task time, ms/second | 1.148 | 1.337 |
| Sampled static/reduced idle task time, ms/second | 1.021 | 1.063 |

The addition is **1,861 gzip bytes (+1.23%)** of initial homepage JavaScript.
Idle differences are small single-run samples, not statistically established
regressions. Neither case-study measurement loaded the Three or GSAP chunk.
The existing sphere budget remains unchanged.

The new pointer test measured 119 frame intervals: p95 **7.3ms**, none over 25ms,
zero React commits, zero ongoing layout recalculations and constant DOM count.
One layout on initial cursor activation was measured separately. Aggregate
main-thread task time during the synthetic gesture was 258ms; settled idle was
0.486ms/second. These headless results support the implementation budget but do
not establish physical display refresh rate or GPU power consumption.

Across EN/VI at 375, 430, 768, 1024, 1440 and 1920, maximum observed CLS was
**0.001306**, matching the Phase 18 layout values. The layer inspection recorded
one paint per bounded light span during the gesture and no retained compositor
hint after settling.

## Validation results

Passed on the final production build:

- `npm run lint`
- `npm run type-check`
- `npm run build`
- route validation against the local production build
- localization validation against the local production build
- creative-interaction validation against the local production build
- motion lifecycle validation against the local production build

The full existing browser suites for Global UI, Hero/fallbacks, Identity,
Expertise, Operations, Experience, Achievements, Security Log, Terminal, Contact
and Motion also passed during this pass. The final compositor-only adjustment
was followed by the complete creative-interaction matrix, localization, routes,
motion lifecycle and fresh production measurements. Development Strict Mode's
motion lifecycle also passed; listener counts stayed constant across repeated
case/locale navigation (two pointer listeners; visibility listeners five in
production and six in development, including the existing infrastructure).

Coverage includes fresh/returning initialization, full-page traversal, hash
navigation, EN/VI switches, case/log routes, keyboard focus, Operations focus
parity, touch, paste/Terminal commands, native selection/input, Contact/CV and
Back to Top. Slow/fast pointer motion, leave/re-entry, resize, reduced motion,
hidden/visible state and no-JavaScript/failure fallbacks were checked. No console
errors, hydration warnings, overflow, accumulated ScrollTriggers or orphan
motion styles were observed. Screenshots include Contact mid-entrance and final
states; partial masking in the mid-entrance capture is intentional and clears.

Scope verification: no diff in data, i18n, MDX, public assets, metadata/sitemap or
package manifests. The private source CV integrity was reverified; the approved
public PDF was also byte-for-byte unchanged. Git had no staged files.

## Human review

The EN and VI views were reviewed using the local production build:

1. Move slowly and quickly across Hero's dark negative space; pause and leave it.
   The light should diffuse and disappear while the cursor stays precise.
2. Check the tiny Hero text separation without losing the tagline's alignment.
3. Scroll through Identity: the quiet portrait treatment is deliberately preserved.
4. Hover/focus Operations: compare readable titles, soft light and preview tilt.
5. Slowly approach chapter and record headings, then try a fast scroll/hash jump.
6. Watch Contact's two-line entrance, then inspect stable text and links after it settles.

Screenshots in `test-results/creative-interaction/` show Hero, Operations, Contact
mid/settled states and full-page desktop/mobile compositions. They cannot convey
the timing; the live review is the primary approval surface.

Physical GPU power and frame pacing across real desktop hardware remain outside
the headless measurements. The low-contrast effect also merits review on the
user's monitor. This pass changes visual interaction only; no Phase 19 work began.

# Phase 9 — Identity

Phase 8 checkpoint: `7f7a35b` (`feat: build carwyn.sec hero experience`).
Phase 9 adds Identity only. Hero composition, sphere and motion are unchanged.

## Art direction

A warm paper field (#E8E4DC) marks the transition out of the abstract black Hero.
The large natural-color portrait dominates the desktop grid. The real name uses
dark editorial typography; biography and two metadata fields remain secondary.
Mobile places the name before the portrait and biography, without sticky scrolling
or viewport-height constraints. The image has a restrained 2.5% hover crop on fine
pointers only; reduced motion and touch remain static. No new client island or
animation dependency was introduced.

The photo is not a button: no click affordance, scan cursor or biometric overlay.
The existing Hero cue and global navigation discover #identity automatically.
Editorial numbering remains 02 / IDENTITY; navigation numbering is 01 / IDENTITY,
as approved in the separate section and navigation systems.

## Portrait selection and privacy

All three originals were visually reviewed. CA1A3276.JPG offers the strongest
close portrait and a turned pose that opens toward the text. CA1A3265.JPG is more
distant; CA1A3266.JPG is landscape with a downward pose.

`scripts/prepare-identity-portrait.py` uses existing Python/Pillow. It reads the
original, applies EXIF orientation, resizes to 1800 × 2700 and writes a separate
103,178-byte WebP to `public/images/identity/nguyen-hoang-phuc.webp`. No exposure,
color grading, facial retouching or AI processing is applied. EXIF and embedded
metadata are stripped. No sharp dependency was installed.

Next Image generates responsive delivery sizes from this derivative. The frame
reserves its 4:5 crop before loading; the full derivative retains the 2:3 original.
Eager loading supports direct #identity visits and avoids the observed Next LCP
warning on hash navigation. It is not preloaded or assigned high fetch priority.
The original portrait and CV source directories stay ignored and private. All seven
original SHA-256 hashes matched their pre-phase values after implementation.

## Content

`src/data/profile.ts` uses the existing Profile model. Both locales are rendered
on the server. Name, Vietnam, information security and CEH in-progress come from
the supplied brief. The biography now uses the exact user-approved English copy
and a consistent Vietnamese equivalent. Explicit word spacing keeps HOANG PHUC
readable as two words at every tested breakpoint. Alt text remains review-state
copy for this already-noindex preview. Extended biography, objective and work
availability remain pending and are not invented. No certification completion
is implied. The requested undiacritized real-name spelling is retained in EN/VI.

## Validation

- `npm run lint`: passed.
- `npm run type-check`: passed.
- `npm run build`: passed, both locale homepages statically rendered.
- `npm run check:routes`: passed in development and production; original asset
  URLs remain 404 and the development specimen is absent from production.
- `node scripts/check-identity.mjs URL`: passed in development and production;
  EN/VI at 375, 430, 768, 1024, 1440, 1920, image decode, name fit, overflow,
  keyboard scroll cue/focus, menu destination, active index, locale/hash
  preservation, reduced motion, touch and no-JS content. No console/hydration errors.
- `node scripts/check-global-ui.mjs URL` (and `--production`): both passed. The
  future-section fixture now uses Expertise because Identity is real content.
- `node scripts/check-hero.mjs URL`: production regression passed, including
  actual WebGL pixels, locale persistence, paused/hidden/offscreen render work,
  context loss, reduced motion and touch. Observed layout shift: 0.
- Local text contrast against the paper field: primary 12.52:1, muted 5.91:1,
  subtle 4.92:1; the in-progress marker is 5.08:1 and includes a text label.

Browser checks use the existing external Playwright runtime and headless Edge,
not an installed application dependency. Test captures live in ignored
`test-results/identity/`. Desktop and mobile section captures hide fixed global
chrome only while taking the image, so it does not bisect the full-section image.
The transition capture retains the real persistent shell.

The EN and VI Identity views were reviewed locally before approval. Phase 9 is
visually approved with the name-spacing and biography corrections.
Those corrections passed the same visual and regression checks before checkpointing.

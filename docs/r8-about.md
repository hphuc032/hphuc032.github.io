# R8 — About profile page

Integration baseline: `b7fa9d6` (approved R4 merge). Work is isolated on
`feat/r8-about`; production `main` is not changed.

## Composition and ownership

`/about/` and `/vi/about/` compose the existing server-rendered Identity,
Expertise, Experience and Achievements components, followed by a public CV
link. `DedicatedPageFrame` retains the single H1, main/skip-link target and
existing End System footer. Section indices now run 01–05 within About.

`about.css` scopes every rule to `main[data-page="about"]`. The opening is
deliberately smaller than Home's Hero. Warm photography sits in dark editorial
framing; capabilities use open rows; work records use chronology; achievements
use four distinct factual categories. No cards, proficiency scores or new
animation system are introduced.

The existing section components currently have About as their sole composition
consumer. They were reused rather than copied into a second set of components.
Their legacy folder location is retained to avoid unnecessary file churn.

## Canonical sources and factual boundaries

| Area | Source | Publication boundary |
| --- | --- | --- |
| Name, biography, location, portrait | `src/data/profile.ts` | Existing EN/VI biography and approved web portrait unchanged |
| Four capability groups | `src/data/expertise.ts` | Published selector; tools indicate use, never mastery |
| Work records | `src/data/experience.ts` | Published selector; existing dates/responsibilities only |
| Four achievement categories | `src/data/achievements.ts` | Published selector and existing claim validation |
| PDF destination | `publicCv` in `src/data/contact.ts` | Canonical public-safe PDF; no contact duplication |

Two minimal canonical updates implement facts explicitly approved in R8:

- Add **Era Group** to the existing UAT record. Its August 2026–Present dates
  and four testing responsibilities already existed; none were inferred.
- Normalize the four expertise group titles to the requested R8 groups and
  include **Burp Suite** among the approved security-testing tools. Descriptions
  are retained; supporting tools remain curated.

Shared catalog consumers, including Terminal outputs, consequently see these
same approved facts. Terminal rendering, command logic and routes are unchanged.

**Memory Flower remains flower-arrangement work in Phu Nhuan.** The catalog
contains no evidence for a Memory Flower software project, so R8 does not
recast it as web/backend employment or add dates/responsibilities.

Achievement records remain exactly:

- Core Team — AWS Student Builder Group HCMUTE.
- Cybersecurity Student Competition 2025 — qualifying-round participant, NCA.
- Top 4 — HCMUTE CTF 2025, without an individual/team claim.
- CEH — In Progress, not completed certification.

No education record, metric, new public role or unsupported outcome is added.

## CV integrity

The link remains `/cv/nguyen-hoang-phuc-cv.pdf`, opens naturally in a new tab,
and announces PDF/new-tab behavior through its text and existing link primitive.
The source/public PDF is not regenerated, copied or modified.

Expected SHA-256:
`f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`.
Existing PDF binary Git attributes remain unchanged.

## Responsive and accessibility strategy

- Desktop: bounded 80rem content measure, portrait/name pairing and open rows.
- Tablet: chronology and achievement status move onto intentional secondary rows.
- Mobile: name before a bounded square portrait, single-column records, wrapping
  tools and readable metadata. No hover-dependent facts.
- Exactly one H1; existing H2–H4 hierarchy, lists, figures, localized alt text,
  semantic dates, visible focus and 44px CV target are retained.
- Core content and CV remain available without JavaScript.
- R8 adds no motion. Reduced motion leaves all About content static and permits
  only R3's existing static decorative atmosphere canvas, with its RAF stopped.
- No new Client Component, WebGL, pointer wake, image or dependency is introduced.

## Validation

About-focused command (requires the existing external Playwright runtime or an
equivalent available Playwright module, not a new application dependency):

```powershell
node scripts/check-about.mjs <review-origin>
```

It reads canonical server catalogs using Node's `react-server` condition, then
checks both locales at 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024,
430×812, 390×844, 360×800 and 320×800. Assertions cover facts, statuses,
heading structure, portrait loading, real-name fit, overflow, CV hash/focus,
locale switching, no-JS, reduced motion and console/hydration errors.

Review captures and measurements are written only to ignored
`test-results/about/`. Element-only captures temporarily hide fixed browser
chrome through screenshot options; application CSS is not changed for captures.

Validation actually run on Windows with Chromium/MS Edge:

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `npm run build` | PASS (existing upstream warnings noted below) |
| `npm run build:github-pages` | PASS |
| `npm run check:routes -- <normal-origin> --production` | PASS |
| `npm run check:localization -- <static-origin> --static-export` | PASS |
| `npm run check:metadata -- <static-origin> https://hphuc032.github.io` | PASS |
| `npm run check:static-export` | PASS: 22 routes, CV, 404, no public `/en`, route bundle isolation |
| `node scripts/check-about.mjs <origin>` | PASS on normal and static hosts; 18 viewport/locale combinations plus reduced-motion/no-JS checks |
| `node scripts/check-global-ui.mjs <normal-origin> --production` | PASS |
| `node scripts/check-accessibility.mjs <normal-origin>` | PASS: 22 routes, focus/menu, reflow, no-JS, reduced motion |
| `node scripts/check-responsive.mjs <static-origin>` | PASS: 132 combinations, resize, touch and no-JS |
| `node scripts/check-home.mjs <normal-origin>` | PASS: Sphere, lifecycle, compatibility and eight viewports |
| `npm run check:projects -- <normal-origin>` | PASS: EN/VI, focus/hover, touch, reduced motion, six case routes |
| `node scripts/check-terminal.mjs <normal-origin>` | PASS: commands, history, focus, navigation and fallbacks |
| `node scripts/check-security-log.mjs <normal-origin>` | PASS: index/article, TLS boundaries, locale, no-JS and CLS 0 |
| `node scripts/check-atmosphere-model.mjs` | PASS |
| `npm run check:writeups` | PASS: two review sources, zero published |
| `npm run test:writeups` | PASS: 17 tests |
| `npm run check:writeups-ui -- <static-origin>` | PASS: index and safe article fixture, seven viewports |
| `npm run check:writeups-export` | PASS: no unpublished source/route/asset leakage |
| `npm run check:contact -- <normal-origin>` | PARTIAL: dedicated-page checks pass; stale homepage assertion fails (below) |

Separate EN/VI Contact HTML anchor checks pass for all four canonical destinations.
The Security Log browser suite was also attempted on the static host: its exact
URL wait omits the trailing slash required by static export. The full suite passes
on the normal host; static article/localization/direct-route checks pass separately.
The first concurrent responsive run had a non-reproduced no-JS overflow assertion;
direct inspection and the full rerun both passed without application/test changes.
No native screen-reader, Firefox or Safari testing is claimed.

## Asset impact

The approved pre-R8 static About artifact and final artifact use the same nine
script requests and two stylesheet requests. Summed per-resource gzip sizes:

| Resource | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Initial JS | 192,106 bytes | 192,106 bytes | 0 |
| CSS | 16,930 bytes | 17,875 bytes | +945 bytes |

These are local artifact measurements, not field/CDN transfer measurements.
No media asset or dependency is added. Existing selectors keep page content on
the server and dedicated routes continue to exclude homepage WebGL/wake bundles.

## Parallel-wave boundaries and follow-ups

Home, Sphere, Projects, Writeups/pipeline, Terminal UI, Contact UI, global
navigation/atmosphere, route/publication registry, CI and package scripts are
untouched. No route is added; the independent fixture remains **22 routes**.
Existing localized About metadata remains truthful and unchanged.

- **R11:** unified route/motion work may reuse About's semantic sections; do not
  introduce paragraph-level choreography or another pointer layer here.
- **R13:** broader native screen-reader and browser coverage remains separate.
- **R14:** further performance review must preserve static content boundaries.
- The legacy `check-contact.mjs` passes its dedicated-page responsive checks but
  later assumes a full Contact panel at `/#contact`. R4 replaced that panel with
  a teaser and a redirect to `/contact/`; this assertion is stale on the approved
  integration baseline. It is reported rather than modified within R8 ownership.
- Upstream normal-build writeup filesystem-tracing and Node module-type warnings
  remain; R8 does not modify the R6/R7 pipeline to suppress them.

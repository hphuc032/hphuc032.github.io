# R13 — Responsive and accessibility QA

## Scope and integration

Branch: `feat/r13-responsive-a11y`, targeting `redesign/multipage-v2` without merging.
Baseline: `02370c55e9107dd17d1f0d01051c267ab7a0234c` (R9, R10 and R11 merged).
The public surface remains 22 HTML routes, plus the existing 404 and assets;
there are zero published CTF articles. No new routes, dependencies, publication
changes, factual claims, translations, metadata, contact values, commands or PDF
changes are included. R12 was not merged at baseline. Final integration status is
recorded in the PR/final delivery; if R12 subsequently merges, rebase and rerun the
full responsive, accessibility and localization suites before merging R13.

## Post-R12 integration refresh — 2026-10-03

The original R13 commit `4896ebb1add898cdc40557c85e2569e943491527` was rebased
without conflicts onto `a62e9fcb2466b09cee84368c92198e2d6f029f73`, the integration
merge of R12. Its rebased implementation commit is `12075cb`; no application or
test change was needed during rebase. R12 wording, route/fragment policy, canonical
backlinks and standalone 404 favicon are retained alongside the R13 reflow and
accessibility fixes.

The repeat review uses Windows Microsoft Edge/Chromium `154.0.4258.48`, external
Playwright `1.62.1` and Node `24.14.0`. Browser suites use their existing Edge
channel with live WebGL available; no fallback runtime or console-warning filter
was applied. Raw repeat logs remain ignored in `test-results/r13-rebase/`.

Normal-mode results after rebase:

| Check | Result |
| --- | --- |
| Lint / type-check / normal production build | PASS |
| Responsive | PASS; 308 route/viewport measurements, 200% text, no-JS and constrained menus |
| Accessibility | PASS; all 22 routes, 496 keyboard controls, code/table fixtures, reduced motion and 404 |
| Localization | PASS; all 22 public routes, EN/VI switching, Back/Forward, metadata policy, hashes, publication gates and no-JS |
| Home | PASS, exit 0; live Sphere rendering, rotation, focus/drag, hidden/offscreen lifecycle, mobile, fallback and clean console |
| Hero | PASS, exit 0; live network pixels, resize, pause/idle, context loss, reduced motion and clean console |
| Normal production route checker | PASS |

Fresh-load Hero CLS was `0` in this laboratory run. The scripted lifecycle/resize
accumulator was approximately `0.000323`; it is not a field performance metric.
The previously reported Linux cloud-driver `GPU stall due to ReadPixels` warnings
were not reproduced on this host. The earlier failures below are historical, not
the current repeat result. No failing assertion was waived or suppressed.

GitHub Pages repeat results:

| Check | Result |
| --- | --- |
| Static production build / export checker | PASS; 22 public routes, correct origin-root assets, real 404 and dedicated WebGL isolation |
| Responsive | PASS; all 308 measurements plus no-JS and menu/reflow checks |
| Accessibility | PASS; all 22 routes, 496 keyboard controls, fixture and recovery checks |
| Localization | PASS; published route pairs, legacy/current hashes, Back/Forward, source-language boundaries and clean console |
| Metadata / Writeups export | PASS; 22-route sitemap and no review-content leak |

The public and exported CV SHA-256 remains
`f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`.
No browser suite assertion or application code was changed for this repeat.
Target-GPU, Firefox/Safari, native screen-reader and real-device coverage remain
R14/R15 follow-ups; there is no current Home/Hero functional failure to defer.
Existing non-fatal Node module-type and normal-build Writeups tracing warnings
remain. No R14/R15 implementation, production merge or deployment was performed.

## Findings and remediation

- At 320px with 200% text, Home project rows exceeded the page width because
  their grid's middle track retained an intrinsic minimum. Shrinkable tracks and
  wrapping preserve the full titles. Hero lines, top/bottom metadata and Sphere
  labels now wrap within their available space. Focused FastAPI and Spring Boot
  tooltips previously crossed the screen edges at this size.
- The enlarged header could wrap while the layout still reserved its old height;
  its Menu button could leave the viewport. Header controls now wrap, and one
  cleaned-up ResizeObserver measures header/status heights. CSS minimum heights
  use their original rem bases rather than the measured variables, avoiding a
  feedback loop. The observer disconnects and restores inline variables on exit.
- The English menu's Close button exceeded the 320px dialog at 200%. The top
  line now wraps; the native dialog retains vertical scrolling and focus trapping.
  Menu links use the approved uppercase presentation without changing translations.
  At 200%, the status bar lets its section label occupy another row rather than
  compressing it into a column of individual letters.
- Native Tab could put Projects' Back to top link entirely behind the fixed status
  bar. Root scroll padding reserves both fixed bars. Section margins now add
  only a small gap, avoiding doubled header offsets and preserving chapter status.
- Back with an open menu could leave body scrolling locked on a hash history
  entry. Route changes and popstate close the native dialog; scroll lock always
  restores, while focus returns to the trigger only when staying on the same route.
- A native skip-link hash entry could restore Home's URL while Next retained the
  Projects render. The enhanced skip link focuses and scrolls to main without
  adding a history entry. Its native href still works without JavaScript and for
  modified clicks. The same localized label remains server-rendered.
- No-JS mobile navigation previously exposed an inert Menu button without visible
  primary destinations. A noscript navigation reuses the six canonical destinations
  and existing locale selector. Its header flows normally and inert controls hide.
- Enlarged Vietnamese footer branding, Security Log headings and case-study
  technology lists retained intrinsic widths. Targeted wrapping and shrinkable
  grid tracks fix them without shortening copy.
- MDX code blocks and the existing bounded article table now accept keyboard
  focus and expose a visible outline. Markdown column headers explicitly use
  scope=col; its named table region and code scrollers retain their safety policy.
- About's enlarged name, metadata, portrait caption, tool tokens and achievement
  status now wrap within their tracks. Portrait assets and profile facts stay intact.
- Terminal's prompt and command-reference names wrap, while its mobile form lets
  the input and submit button move to separate rows when enlarged text needs space.
  The native input adds autocorrect=off. Its command catalog, history cap, local
  responses, focus and announcements remain intact.

## Coverage and reproducibility

Browser: Linux Chromium 151.0.7922.173 through external Playwright 1.63.0;
Node 24.19.0/npm 11.9.0. No repository dependency was added. The repository's
browser scripts default to Edge; this workspace uses
`PLAYWRIGHT_MODULE_PATH=/workspace/r9-browser-tools/runtime.cjs` to select
`/usr/bin/chromium`. The separate external fallback runtime adds `--disable-webgl`
only for suites whose assertions permit the site's existing static fallback.

All public EN/VI routes are measured at 1920×1080, 1440×900, 1280×800,
1024×768, 900×900, 768×1024, 430×812, 412×915, 390×844, 375×812,
360×800 and 320×800. The responsive suite retains orientation/resizing,
height-constrained menus, touch-only behavior and visual captures. It additionally
checks every public route with actual root text scaling to 200% at 320/768px,
EN/VI menus at 320px/200%, and every public route without JS at 320/768px.
DPR checks are explicitly reported separately; DPR 2 is not a text zoom test.
Fonts and layout are allowed to settle before final measurements. No-JS checks
wait for load and force layout before awaiting the used font faces; a final
intermediate static run failed About overflow before this stabilization. The
original strict overflow assertion remains; both complete reruns passed.

The independent base-route fixture is augmented from the canonical approved
writeup publication selector, so future published articles participate without
hardcoded route counts. No unapproved entry is exposed by this change.

Visual browser captures were reviewed for Home, Projects, Writeups, About,
Terminal, Contact, a case study and the long Security Log article at
1440/768/390/320px. The responsive suite also retains focused 430/1024 captures.
Full-page screenshots contain the fixed status bar at the screenshot's initial
viewport position; that is a capture artifact, not a repeated content element.
Screenshots and machine measurements are under ignored `test-results/`.

The accessibility suite checks unique titles per locale, exactly one visible H1,
logical heading order, one main and shell header, named navigation, names/labels,
image alt attributes, decorative canvas exclusion, hidden focusables, IDs, secure
new-tab links and table semantics. Tab walks every route at 390/1440px and checks
visible indicators and complete fixed-chrome clearance for controls that fit
the available height; taller controls must remain partially visible.
EN/VI native-dialog tests cover skip first, Enter/Space, focus containment and
reverse wrapping, Escape, Close, scroll lock, route navigation, Back and recovery.

Sphere retains all 13 semantic skills and 13 labeled keyboard controls independent
of WebGL. Enlarged focused labels remain bounded. Terminal tests cover labeling,
help, concise polite announcements, clear, retained focus and Tab exit. Contact
regressions cover actual links, wrapping, keyboard reachability, secure rel and
unchanged public CV bytes. Real MDX scrollers are focusable; the existing safe
Markdown renderer is exercised with long code/table fixtures at 320/768px and
200% text in en/vi/en-vi. Fixtures stay in memory and are never published.

Reduced-motion checks cover final visible content, static Sphere, inert wake and
hidden contextual cursor. No-JS checks cover all public reading pages and the
Terminal explanation. Chromium forced-colors emulation checks focus, native menu,
Escape and focus return on Home EN/VI, Terminal, Contact and the article. Localized
404 checks cover status, title, H1/main, hierarchy, overflow and focused recovery.
Text contrast sampling runs on all public routes against composited solid CSS
backgrounds; it does not certify image/gradient backgrounds or every dynamic state.

## Original Linux results — before R12 integration

Commands below were actually executed against production builds (normal at
`http://127.0.0.1:3100`, exported Pages at `http://127.0.0.1:4183`). Browser commands
use the external runtime described above; “fallback” explicitly means WebGL disabled.

| Command / suite | Normal | Pages export | Details |
| --- | --- | --- | --- |
| `npm run lint` | PASS | same source | Zero ESLint warnings |
| `npm run type-check` | PASS | same source | Next type generation and TypeScript |
| `npm run build` / `npm run build:github-pages` | PASS | PASS | Production builds |
| `npm run check:routes -- <base> --production` | PASS | — | Existing public routes |
| `npm run check:responsive -- <base>` | PASS | PASS | 264 base viewport measurements + 44 actual 200% = 308; no-JS separately |
| `npm run check:accessibility -- <base>` | PASS | PASS | All 22 routes, 496 keyboard controls, fixtures, forced colors and 404 |
| `node scripts/check-global-ui.mjs <base> --production [--static-export]` | PASS | PASS | Fallback runtime; native dialog and shared shell |
| `npm run check:projects -- <base>` | PASS | — | Fallback runtime |
| `npm run check:writeups-ui -- <base>` | PASS | PASS | Fallback runtime; safe unpublished fixtures |
| `node scripts/check-security-log.mjs <base>` | PASS | — | Fallback runtime; actual EN/VI MDX |
| `node scripts/check-about.mjs <base>` | PASS | — | Fallback runtime; facts, portrait and CV |
| `node scripts/check-terminal.mjs <base>` | PASS | PASS | Catalog, history, focus, output and no-JS |
| `npm run check:contact -- <base>` | PASS | PASS | Links, CV, text scaling and no-JS |
| `node scripts/check-motion.mjs <base>` | PASS | PASS | Fallback runtime; final state, navigation and cleanup |
| `npm run check:localization -- <base> [--static-export]` | PASS | PASS | Fallback runtime; EN/VI routes and preservation |
| `node scripts/check-hero-fallbacks.mjs <base>` | PASS | — | Explicit fallback suite |
| `node scripts/check-atmosphere.mjs <base>` | PASS | — | Fallback runtime; lifecycle and unavailable storage |
| `npm run check:metadata -- <base>` | — | PASS | 22 routes; titles/canonical/alternates/structured data |
| `npm run check:writeups` | PASS | — | Zero published CTF, publication boundary intact |
| `npm run test:writeups` | PASS | — | 17/17 pipeline/rendering tests |
| `npm run check:writeups-export` | — | PASS | Approved export boundary |
| `npm run check:static-export` | — | PASS | 26 required files; 22 public sitemap routes; real 200/404 responses |
| `node scripts/check-home.mjs <base>` | **FAIL (exit 1)** | — | Live WebGL functional/lifecycle assertions passed; final console check rejects GPU ReadPixels warnings |
| `node scripts/check-hero.mjs <base>` | **FAIL (exit 1)** | — | Live rendering/pixels/CLS/idle/fallback assertions passed; final console check rejects GPU ReadPixels warnings |

Normal feature regressions were run after the scoped reflow fixes. Full responsive
and accessibility were rerun after the final shared-shell CSS change. Pages checks
use an isolated copy with byte-identical build/test source, avoiding interference
between normal `.next` and static `out`. Earlier intermediate failures (hydration,
animation timing and the fixture favicon) are not presented as final PASS results.
Live WebGL suites were run with the native runtime; no GPU warnings were filtered.
A final independent check also passed EN/VI menus on both builds at 320px with
32px computed root text, uppercase styling, bounded width, reachable last link and
Escape scroll-lock recovery. Sphere and Markdown fixtures assert 32px explicitly.


The atmosphere storage-failure regression now waits for the expected hydrated
intensity before asserting it. The assertion itself is unchanged; this avoids
reading an SSR node before its enhancement has mounted on a busy test machine.
The motion regression also waits for the final opacity before retaining its exact
opacity=1 assertion, instead of treating networkidle as animation completion.
The in-memory Markdown fixture declares the existing favicon to avoid an unrelated
static favicon.ico 404. No console warnings or failed assertions have been suppressed.

## Shared files and R12 coordination

`GlobalInterface.tsx`, `LocaleDocument.tsx`, the new `SkipLink.tsx`, shell/global/
multipage styles and Hero styles change only navigation, focus or reflow.
`home.css`, `about.css`, `terminal.css`, `contact.css`, `operations.css` and
`security-log.css` contain targeted
layout fixes. The two public Security Log MDX files change only table tabindex;
no prose, facts or translation is edited. `mdx-components.tsx` adds keyboard code
access; `render-markdown.ts` adds column scope. The shared route fixture and
existing QA scripts gain coverage, and package.json exposes the two existing QA
scripts as npm commands. The lockfile, dictionaries, publication data and metadata
are untouched. R12 should retain these structural attributes when editing copy.


## File inventory

Added: `docs/r13-responsive-a11y.md`, `src/components/layout/SkipLink.tsx`.

Modified:

- `package.json`
- `scripts/check-accessibility.mjs`
- `scripts/check-atmosphere.mjs`
- `scripts/check-motion.mjs`
- `scripts/check-responsive.mjs`
- `scripts/test-fixtures.mjs`
- `src/components/layout/GlobalInterface.tsx`
- `src/components/layout/LocaleDocument.tsx`
- `src/components/terminal/TerminalConsole.tsx`
- `src/content/security-log/analyzing-http-and-https-traffic-with-wireshark/en.mdx`
- `src/content/security-log/analyzing-http-and-https-traffic-with-wireshark/vi.mdx`
- `src/lib/writeups/render-markdown.ts`
- `src/mdx-components.tsx`
- `src/styles/about.css`
- `src/styles/contact.css`
- `src/styles/globals.css`
- `src/styles/hero.css`
- `src/styles/home.css`
- `src/styles/multipage.css`
- `src/styles/operations.css`
- `src/styles/security-log.css`
- `src/styles/shell.css`
- `src/styles/terminal.css`

## Limits and R14/R15 handoff

Native NVDA/VoiceOver testing was not performed. Semantic/ARIA and browser keyboard
checks are not screen-reader certification. Firefox, Safari, real iOS/Android,
native Windows high contrast and assistive-technology zoom were not tested.
Forced-colors results refer only to Chromium emulation; 200% results refer to
actual CSS text scaling, not a native browser zoom certification.

The original cloud Chromium driver emitted `GPU stall due to ReadPixels` during live WebGL.
Live Home/Hero suites keep their console assertions and their final exit status
must be read from the results table. A static-fallback PASS does not certify live
WebGL. Repeat live rendering and lifecycle suites on the intended deployment
browser/GPU in R14/R15; broader performance optimization remains R14's scope.
Normal builds also retain upstream Node module-type and Writeups tracing warnings.

R15 should repeat keyboard/200% checks with native screen readers and Firefox/
Safari, real touch keyboards, deployed Pages navigation/404 behavior and native
forced colors. If R12 changes text lengths, rerun the full three-suite regression
on the rebased integration result. No R14 implementation or merge is performed.

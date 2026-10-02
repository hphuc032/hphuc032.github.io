# R9 — Dedicated Terminal

Integration base: `a99cc0198e31e84aaa0fdecf5f4116c9a917ecd0`
(latest R8 CV canonical-data follow-up on `redesign/multipage-v2`). Feature branch:
`feat/r9-terminal`. Production `main` is unchanged.

## Page and ownership

`/terminal/` and `/vi/terminal/` retain their existing route publication,
localized metadata, locale switching and single H1 in `DedicatedPageFrame`.
The final composition is an opening, a numbered local-console section, the
interactive surface, a persistent command reference and the existing End System.
The former homepage-sized second introduction and `08` index are removed.

Every CSS rule belongs to `main[data-page="terminal"]`. The opening remains
site typography; the console uses a restrained border, near-black surface and
monospaced output. The native cursor takes precedence throughout the Terminal.
The obsolete `LiquidLight` canvas is removed from this composition. The existing
R3 medium-intensity global atmosphere is the only canvas on the route; no
atmosphere engine, pointer-wake engine or shared navigation is changed.

Only Terminal-owned application files, `scripts/check-terminal.mjs` and this
report change. The legacy `components/home/Terminal.tsx` location is retained
because moving it is unnecessary file churn. About, Contact, Home, Sphere,
Projects, Writeups, canonical catalogs, publication states, shared route fixtures,
CI, package declarations and lockfile remain untouched. No dependency is added.
Playwright used for QA is installed outside the repository.

## Deterministic commands and sources

The prompt is exactly `carwyn@sec:~$` in both languages. Exactly nine tokens are
accepted after a 64-character cap, trimming and case-insensitive matching:

| Command | Public source / behavior |
| --- | --- |
| `help` | Typed command inventory and localized descriptions |
| `whoami` | Canonical `profile` name/brand and existing approved field/location copy |
| `skills` | `publishedExpertise(locale)`; canonical group titles and tool IDs, including R8 Burp Suite |
| `projects` | `publishedProjects(locale)` and `casePath` for existing Operations URLs |
| `experience` | `publishedExperience(locale)`; Era Group and Memory Flower retain canonical roles |
| `achievements` | `publishedAchievements(locale)`; verified status wrappers, CEH remains in progress |
| `logs` | `publishedSecurityLogs(locale)` and Security Log publication route helpers |
| `contact` | `socialLinks` and `publicCv`; real semantic email/social/PDF links |
| `clear` | Clear local transcript, recall history and draft; retain locale, route and focus |

No second factual catalog is added. Command names and technical product names
remain English; interface copy, descriptions and response wrappers are localized.
Security Log remains distinct from CTF Writeups: `logs` opens `/log/`, never a
review-state writeup. The current CTF publication set is empty.

Navigation is explicit and user-initiated. Predefined CTA destinations use
`dedicatedPagePath`: Projects, About `#experience` / `#achievements`, and Contact.
Case/article links keep canonical helpers and locale. `DeploymentLink` handles
normal Next navigation versus trailing-slash static document navigation; output
links disable prefetch. There is no navigation derived from typed input. R4's
existing Home `#terminal` bookmark compatibility remains unchanged and tested.

Arguments and shell-shaped input are unknown commands, not partially accepted.
For example, `projects foo`, `help;whoami`, `help && projects`, substitutions,
paths, script markup and `javascript:` text produce a deterministic localized
command-not-found response. Empty/whitespace input creates no transcript record.

## Security and state boundaries

The page and catalog preparation remain Server Components. `TerminalConsole`
receives only serializable public response data and labels; it imports no server
catalog, pipeline, provenance, source path or environment value. Structured text,
lists and anchors are rendered by React, never HTML strings or
`dangerouslySetInnerHTML`. There is no shell grammar, `eval`, `Function`, process
execution, filesystem access, network API, polling, websocket or emulator library
in command handling.

Transcript and recall each keep at most 50 records, dropping oldest entries.
Input is capped at 64 UTF-16 code units at the DOM, controlled-state and command
normalization boundaries. Native paste inserts plain text without submission;
Enter or the explicit submit button is required. State is local to the mounted
console and is not persisted in browser storage. Decorative atmosphere activity
is independent of the deterministic responses.

## Keyboard, accessibility and responsive behavior

- No autofocus, global shortcut, modal or focus trap.
- Enter submits and retains input focus; ArrowUp/ArrowDown recall commands.
- The draft present before entering recall is restored on return to the newest
  position. Oldest/newest positions and empty history are stable.
- Input-focused Ctrl+L prevents its default and clears local Terminal state.
  Ctrl+L outside the input is left to the browser.
- Composition keystrokes do not trigger recall/clear handling.
- Input has a real localized label and associated keyboard instructions; a
  visible outline marks keyboard focus. A 44px submit control supports touch.
- The bounded transcript has `role="log"` with live updates disabled. A separate
  polite, atomic announcement reports only the newest result; repeated identical
  responses replace that announcement's child without re-reading all history.
- All actual output links and controls have 44px minimum height. URLs and labels
  wrap; desktop rows stack on mobile. The prompt moves above the input/button at
  narrow widths, preserving a useful input width at 320px. Transcript scrolling
  does not lock page scrolling.
- There are no new ornamental animations. Reduced motion removes link
  transitions while command behavior is unchanged.
- Without JavaScript, the inert console is hidden. Server-rendered command
  descriptions and five real links to published content remain usable in EN/VI.

## Validation

Use Node 24 / npm 11 from the repository directory. The focused script accepts a
normal or static origin:

```bash
PLAYWRIGHT_MODULE_PATH=<external-playwright-module> node scripts/check-terminal.mjs <origin>
```

The existing scripts default to Microsoft Edge. This cloud run uses an external
Playwright 1.63.0 adapter that selects installed Chromium 151.0.7922.173; it does
not modify repository browser dependencies. A separate adapter with WebGL
disabled is used only for the noted fallback regressions below. Assertions remain unchanged; fallback regressions exercise the existing
no-WebGL application path rather than claiming hardware WebGL coverage.

The Terminal script reads server catalogs with Node's `react-server` condition
and a test-only extensionless-TypeScript resolver. Security Log expectations use
its public manifest, avoiding imports of MDX/pipeline resources into native Node.
It checks both locales at 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024,
430×812, 390×844, 360×800 and 320×800. It exercises all commands, unknown/empty
input, hostile strings, independent input caps, history bounds/draft, paste,
Ctrl+L scope, explicit trusted navigation, real links, Home bookmark compatibility,
locale switching, focus/Tab/Escape, touch, reduced motion, no-JS and 200% text
scaling. Requests are recorded after hydration/idle and asserted empty throughout
command execution, including newly rendered links. It asserts exactly one global
atmosphere canvas, no Terminal canvas/WebGL and no review CTF/source leakage.
Browser console warnings/errors and page/hydration errors fail the script.

Captures and current-run JSON are saved only under ignored
`test-results/terminal/`. These are review artifacts, never public assets.

Checks executed in this cloud session:

| Check | Result and scope |
| --- | --- |
| `npm run lint` | PASS, zero warnings |
| `npm run type-check` | PASS |
| `npm run build` | PASS; existing module-type and Writeups filesystem-tracing warnings |
| `npm run build:github-pages` | PASS; existing Node module-type warnings |
| `npm run check:routes -- <normal-origin> --production` | PASS: new page pairs, existing URLs, CV, redirects, real 404s and production preview boundary |
| `node scripts/check-terminal.mjs <origin>` | PASS on normal and static hosts: 18 locale/viewport combinations plus command, security, focus/history, touch, no-JS and 200% text-scaling checks |
| `npm run check:static-export` | PASS: 22 public routes, sitemap/robots/CV/404 and dedicated-route bundle isolation |
| `npm run check:metadata -- <static-origin> https://hphuc032.github.io` | PASS: localized metadata, alternates, canonicals, Open Graph, robots and 22 sitemap routes |
| `npm run check:writeups` | PASS: two review sources, zero published |
| `npm run test:writeups` | PASS: 17 tests, zero failed/skipped |
| `npm run check:writeups-export` | PASS: no unpublished routes/assets/source or metadata leakage |
| `node scripts/check-atmosphere-model.mjs` | PASS: deterministic randomness, profiles, bounded lifecycle/density |
| `node scripts/check-about.mjs <normal-origin>` | PASS: 18 viewport/locale combinations and canonical data/CV/focus/fallback checks |
| `npm run check:projects -- <normal-origin>` | PASS: EN/VI, eight widths, truthful facts, case routes, keyboard/hover, touch, reduced motion and no-JS |
| `npm run check:localization -- <origin> [--static-export]` | Normal and static PASS with WebGL disabled, exercising existing Home fallback. Initial normal hardware-enabled run FAILS its final console-warning assertion (below); content and locale assertions passed |
| `node scripts/check-global-ui.mjs <normal-origin> --production` | PASS with WebGL disabled. Initial hardware-enabled run FAILS the final console-warning assertion; desktop/mobile routes/menu/focus/locale assertions passed |
| `node scripts/check-home.mjs <normal-origin>` | PARTIAL / exit 1: EN/VI composition/13 skills/eight viewports, rotation, focus parity, drag, single context, pause/hidden/offscreen lifecycle, dedicated isolation and bookmark checks pass; final console-warning assertion fails |

The three hardware-enabled broad suites collect Chromium's Home WebGL driver
message: `GPU stall due to ReadPixels`. Their overall result is not reported as
PASS. Terminal itself has no Canvas/WebGL and its full suites report zero browser
console or hydration errors. The fallback reruns test an explicit supported
configuration; they do not establish clean-console hardware rendering. Tests are
not weakened or filtered to conceal warnings. About, Projects and the R9 suite
use the ordinary Chromium adapter, not the WebGL-disabled adapter.

After the integration branch advanced from `0654ffd` to the R8 CV follow-up
`a99cc01`, the feature branch was rebased without conflicts. Lint, type-check,
both builds, routes, Terminal on both hosts, About, the R7 safety/export checks,
atmosphere model, static artifact checks, metadata and fallback localization
were rerun against that refreshed base. Projects/global-navigation/Home checks
listed above ran before this About-only refresh; those application areas and
Terminal changes are identical.

The independent public fixture is unchanged: **22 routes before and after R9**.
There are no new routes, dependencies, images or public assets. CV SHA-256 stays
`f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`.
A local static-artifact measurement for each Terminal locale sums nine initial
script resources to **192,141 gzip bytes** and two CSS resources to **17,987 gzip
bytes**. These are current artifact sizes, not a measured baseline delta or field
performance claim; shared application chunks contribute to those totals.

## Follow-ups

- R11 may integrate the existing global effects/route transitions; preserve native
  text interaction, deterministic responses and the absence of Terminal canvases.
- R13 should add native screen-reader, real mobile keyboard, Firefox and Safari
  review. Automated Chromium checks do not certify WCAG compliance.
- R14 should measure shared-bundle and device performance. This phase adds no
  renderer, media, dependency, timer or per-frame React state; history remains
  bounded. Static-export bundle isolation is required.
- Upstream Writeups Node module-type/filesystem tracing warnings remain outside
  R9 ownership. The Home WebGL driver warning observed by broad browser suites
  also requires review on hardware/browser combinations used for final QA.

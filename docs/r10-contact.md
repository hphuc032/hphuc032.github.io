# R10 — Contact destination

`/contact/` and `/vi/contact/` now use a single **LET'S CONNECT.** H1,
short localized supporting copy, four numbered editorial channel rows, minimal
identity context, and the existing End System footer. ContactPage remains a
Server Component inside DedicatedPageFrame; no new shell or client island was
introduced. The old Home Contact component is retained unchanged.

## Canonical data and privacy

All destinations come from `src/data/contact.ts` (`socialLink`, `publicCv`).
Identity context comes from `src/data/profile.ts`. GitHub's visible URL is derived
from its canonical destination rather than copied into presentation data.

- Email: `mailto:nhpntd@gmail.com`, no subject or tracking parameters.
- GitHub: `https://github.com/hphuc032`.
- LinkedIn: `https://www.linkedin.com/in/nguyen-phuc-71217332a/`.
- CV: `/cv/nguyen-hoang-phuc-cv.pdf` through the existing public asset helper.

GitHub, LinkedIn and CV open in a new tab with `noopener noreferrer` and localized
hidden new-tab announcements. Email uses ordinary mailto navigation. The public
CV bytes are unchanged: SHA-256
`f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`.

There is no form, API, phone, address, availability indicator, professional
service claim, clipboard interaction, or third-party embed. No dependencies,
public routes or publication entries were added. Public route count remains 22;
the two imported writeup sources remain under review and unpublished.

## Presentation and accessibility

Supporting prose, channel actions and new-tab labels are localized. The approved
brand heading stays English in both locales. Established name, field and location
remain canonical; no biography or other About content is copied.

Scoped rules in `src/styles/contact.css` give the dedicated destination a dark
editorial opening and thin-divider rows. Tablet/mobile rows stack the action
under the value. Important text wraps, including the email and GitHub URL. The
page reuses global typography and focus tokens. Exactly one H1, a labelled
contact section and address/list semantics provide reading structure.

Every channel is a normal link, has a visible keyboard outline, and exceeds the
44px touch target minimum. Hover/focus arrow movement is 3px; reduced motion
removes the transform and transitions. Content works without JavaScript.

The shared atmosphere retains its existing `medium-low` Contact profile. No
Contact-specific Canvas, WebGL, pointer wake, GSAP or transition code was added.
The content uses static HTML/CSS beyond the existing shared shell.

## Validation

Executed commands (browser commands used
`PLAYWRIGHT_MODULE_PATH=/workspace/browser-tools/playwright.cjs`):

```bash
npm run lint
npm run type-check
npm run build
npm run start
npm run check:routes -- http://127.0.0.1:3000 --production
npm run check:contact -- http://127.0.0.1:3000
npm run check:localization -- http://127.0.0.1:3000
node scripts/check-responsive.mjs http://127.0.0.1:3000
node scripts/check-accessibility.mjs http://127.0.0.1:3000
npm run check:writeups
npm run test:writeups
node scripts/check-atmosphere-model.mjs
```

All passed. Writeup unit tests: 17 passed, 0 failed. Responsive regression:
132 route/viewport combinations passed. Writeup validation retains the known
remote-image review requirement; no source was published by R10.

Focused Contact checks cover both locales at 1920×1080, 1440×900, 1280×800,
1024×768, 768×1024, 430×812, 390×844, 360×800 and 320×800, plus 200% text
scaling, keyboard focus, locale switching, reduced motion, no-JS reading,
metadata, safe links, unsupported/private content assertions, unchanged local
and served CV hashes, a single shared atmosphere Canvas, no external runtime
requests and clean browser console. Screenshots and measurements are ignored
outputs under `test-results/contact/`. Desktop and 320px Vietnamese captures
were visually inspected; fixed status chrome is hidden only in full-page
captures so it does not obscure channel rows in the image.

Static validation also passed:

```bash
npm run build:github-pages
npm run check:static-export
npm run check:writeups-export
# Static host started with PORT=4174 npm run check:static-export -- --serve
npm run check:contact -- http://127.0.0.1:4174
npm run check:localization -- http://127.0.0.1:4174 --static-export
npm run check:metadata -- http://127.0.0.1:4174 https://hphuc032.github.io
```

Both build modes passed. Static export verified all 22 public routes, sitemap,
root assets, immutable CV and unpublished-route 404s. All five dedicated routes
exclude Home Sphere/wake bundles. Writeup export verified that sources, review
candidates and private source metadata do not leak. Contact and localization
passed against both normal production and static hosts; production canonical,
alternates, Open Graph and robots checks passed. No failing check remains.
The existing Node typeless-package warning in writeup scripts is unchanged.

## Delivery scope

Feature branch: `feat/r10-contact`, based on integration commit
`b7fa9d659a3bb4af188b6746e1c569571ac31624` from
`redesign/multipage-v2`. Added: this document. Modified:
`src/components/pages/ContactPage.tsx`, `src/styles/contact.css`, and
`scripts/check-contact.mjs`. The existing shared contact stylesheet only gains
scoped rules for the dedicated destination; legacy selectors are unchanged.
No high-risk shared file was touched. Existing Contact metadata and route
wrappers already meet R10 requirements and remain unchanged.

The onboarding localization fix from the previous v1 checkout was preserved in
a named Git stash and an external patch before switching bases; integration
already contains its exact-path wait correction. It is not part of R10.

GitHub API requests for PR operations returned `Forbidden` in this environment.
This is separate from Git transport; feature-branch delivery and its exact SHA
are reported in the final chat result. No merge into integration/main or release
tag was performed.

## Parallel-wave boundaries and follow-ups

Only ContactPage, Contact-specific CSS, the focused check-contact script and
this document change. No shared/high-risk file was edited. Home, About,
Terminal commands, Projects, Writeups, global navigation and atmosphere remain
unchanged. No merge or release is part of R10 delivery.

R11 may tune shared motion without changing link semantics. R13 should include
human assistive-technology and cross-browser review. R14 should measure delivery
in the final integrated build; R10 adds no Contact-specific client JavaScript or
media. Headless browser checks use the site's static WebGL fallback on this
GPU-less machine, so they do not establish live Sphere/GPU performance.

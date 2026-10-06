# Dedicated Projects index (R5)

`/projects/` and `/vi/projects/` render the same three published cases from the
canonical `src/data/projects.ts` catalog. Home retains its existing Operations
component; case-study prose and `/operations/[slug]` paths remain unchanged.
The public static route catalog is still 22 entries.

`ProjectsPage` retains the existing dedicated page frame and metadata system.
`ProjectsIndex` is a Server Component with semantic headings and an ordered list.
Each row has one case-study anchor, labelled by its localized CTA and project
name. Numbers 01–03 come from the existing featured order. The canonical catalog's
optional `indexPresentation` holds only the reviewed index labels, concise prose
and selected tools. It does not replace Home summaries or case-study content.

The previews reuse the existing abstract `ProjectVisual` SVGs. They are labelled
as concept illustrations visually and excluded from assistive technology. No
project screenshots, operational telemetry, findings, packet captures or new
assets were created. Burp Suite on the assessment row comes from the explicit
R5 brief, not an inferred proficiency claim.

`projects.css` is scoped to the dedicated page opening and unique Projects index
classes. It adds no canvas, timers, pointer listeners, animation library or
Client Component. Desktop hover and keyboard focus both clarify the illustration
and move the title/arrow 3–4px. Reduced motion disables those transforms and
transitions. At widths below 1024px, previews are removed and the rows become
two columns; below 768px the number and copy stack. All meaningful content and
links remain visible without hover or JavaScript.

## Focused browser validation

With the same externally supplied Playwright/Edge runtime as the repository's
other browser checks, run:

```bash
npm run check:projects -- http://127.0.0.1:3000
```

`PLAYWRIGHT_MODULE_PATH` can select the environment-supplied module. This is not a
new repository dependency. The onboarding runtime used installed Chromium via
an external launch adapter; Microsoft Edge/Firefox/Safari were not tested.
For existing Home localization checks on this headless machine, WebGL was
disabled after software-GPU warnings triggered the suite's warning assertion.
Home's supported static fallback was exercised; no assertions were changed.

The focused check verifies both locales at 1440×900, 1280×800, 1024×768,
768×1024, 430×812, 390×844, 360×800 and 320×800. It checks order, tools,
links, headings, unclipped text, overflow, number/title overlap, keyboard
navigation, focus outline, preview parity, touch/menu navigation, no-JS content,
reduced motion, Home structure and all six case-study routes. Screenshots and
measurements are generated only under ignored `test-results/projects/`.

Run lint, type-check, normal build and server route/localization checks. Then
stop that server before building GitHub Pages. Validate `out/` with
`check:static-export` and serve it locally for `check:metadata` (passing
`https://hphuc032.github.io` as the expected origin), localized static checks and
the focused Projects check. Normal builds without SITE_URL intentionally use
noindex metadata and therefore are not the target for the public-origin check.

## Integration boundaries

R4 may reuse canonical index metadata if desired, but Home has not been changed
by R5. R11 may tune interaction while preserving native focus, reduced motion and
no pointer-only content. R3 atmosphere has no dependency on this presentation;
no atmosphere files, global shell, navigation, water wake or z-index rules were
modified. The index currently uses no pointer wake, matching the R1 baseline.

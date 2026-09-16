# Phase 11 — Selected Operations and case-study foundation

## Git checkpoint

`a03b805` — `feat: build carwyn.sec expertise section`. Only approved Phase 10
work was staged. This phase's audit and the two unrelated root PNGs were excluded.
Phase 11 implementation remains uncommitted for approval.

## Implemented

- 04 / SELECTED OPERATIONS: exactly three editorial project rows, large titles,
  categories, restrained summaries, clear case links and the approved GitHub CTA.
- Desktop hover and keyboard focus reveal an associated concept illustration.
  VIEW cursor is attached only to real case links. CSS mask/opacity and small
  title displacement use existing duration/easing tokens; no new timeline is needed.
- Mobile uses stacked title-led rows and omits index previews. All project context
  and links remain visible. Case illustrations are inline and static.
- One server-rendered case template for all three projects in EN and VI. It
  supports overview, confirmed technologies, published prose/evidence sections,
  verified public resources, return to Operations and the other two cases.
- Shared factual catalog, compact locale-publication manifest, derived metadata,
  and a sitemap filtered to published records and locales.

## Verified public content and evidence audit

The existing audit was read rather than repeated. Source: user-confirmed Phase 10
baseline and explicit Phase 11 approval to publish conservative briefs. See
`operations-evidence-audit.md` for confirmed/partial/missing distinctions.

| Case | Published | Omitted / pending |
| --- | --- | --- |
| 001 Secure API Gateway | API authentication/authorization focus, RBAC and authorization-testing practice; FastAPI, PostgreSQL, Keycloak, Kong, Docker, JWT, OAuth2, OpenID Connect (OIDC), RBAC | Architecture connections, exact tests/results, responsibilities, dates, vulnerabilities, outcomes and repository URL |
| 002 Vulnerability Assessment | Educational assessment identity, related service-enumeration and vulnerability-identification/assessment practice | Case-specific tool assignments, target/scope, findings, CVEs, severity, recommendations, dates/results and report/repository URL |
| 003 Network Traffic Analysis | Project identity, related Wireshark/TCP-IP/DNS/HTTP-HTTPS practice | Captures, packet values, protocol timeline, conclusions, dates/results and repository URL |

The confirmed general capability tools for assessment are not presented as a
verified per-case tool list. CASE 003 explicitly describes related practice, not
specific findings. These are concise project briefs, not completed technical
reports. No empty Architecture, Findings, Results or My Role headings render.

## Preview strategy and security/redaction

The three SVG concept studies use nested boundaries (access), a selected region
(assessment), and abstract bands (protocols). They contain no architecture flow,
measured values, real packets, terminal output or fake screenshots. Every figure
is labeled as an abstract illustration in the current language. SVG geometry is
decorative and hidden from assistive technology; the adjacent prose conveys all
actual information.

No source evidence was copied or published. No sanitization was necessary because
there are no evidence screenshots/logs. Private originals remain untouched and
ignored. The future evidence field is for reviewed public derivatives only;
it requires a published localized alt text before rendering. The approved GitHub
profile is the sole external project-related link; no repository URL is invented.

## Data and case-study architecture

`projects.ts` is server-only: summaries, category, overview, tool IDs and optional
sections/links remain centralized. Project identity and detail publication are
separate flags. The small `project-publication.ts` manifest supplies real slugs,
case numbers and available locales to both the catalog and language navigation.
`publishedCase` checks project, summary, detail and locale publication. Unknown
or unpublished cases return 404. Optional detail sections are rendered only when
both section and translated content are published, with no empty prose headings.

All consumers use the catalog: index, detail, metadata, next-case links, sitemap.
Technical identifiers and approved project titles remain English in VI; summaries,
overview, categories, navigation labels and figure captions are translated.
There is no silent English-prose fallback for missing translations.

## Routes created

- /operations/secure-api-gateway
- /operations/vulnerability-assessment
- /operations/network-traffic-analysis
- /vi/operations/secure-api-gateway
- /vi/operations/vulnerability-assessment
- /vi/operations/network-traffic-analysis
- /sitemap.xml

All six briefs are statically rendered. Metadata title/description derive from
each record. Existing site-wide noindex/nofollow remains until release approval.
Set `SITE_URL` to the approved HTTPS origin at deployment readiness. Without it,
the sitemap is empty rather than emitting a guessed domain or localhost URLs.
There are no invented last-modified dates. Canonical production origin is pending.

## Navigation integration and accessibility

The stable #operations ID uses the existing observer and focus destination.
Status/index numbering is 03 / OPERATIONS; editorial section numbering is 04.
Detail-page Index permits returning to the three published homepage sections;
future destinations remain disabled. Existing global UI appearance is unchanged.
Language controls preserve equivalent case routes and valid hashes without
reloading. Return links and next-case links are ordinary semantic navigation.

Native focus styles, keyboard parity, touch navigation and static reduced-motion
previews are retained. No modal, extra tab stops or hover-only factual content is
introduced. Article/heading/list/figure structure is server-rendered without JS.

## Files created / modified

Created: `src/components/home/Operations.tsx`, `src/components/operations/CaseStudy.tsx`,
`src/components/operations/ProjectVisual.tsx`, `src/data/projects.ts`,
`src/data/project-publication.ts`, `src/styles/operations.css`,
`src/app/[locale]/operations/[slug]/page.tsx`, `src/app/sitemap.ts`,
`scripts/check-operations.mjs`, `scripts/measure-operations.mjs`, this document
and the pre-implementation audit.

Modified: homepage and global stylesheet integration, Project type extension,
global publication routing, detail-page Index availability, route/global UI
regression scripts and README. Hero, Identity and Expertise implementation files
are unchanged from checkpoint a03b805.

Dependencies added: none. No video, raster preview, new font, WebGL or animation
library is added. CSS handles the short preview interaction. No Operations client
island is needed. The entire factual catalog stays out of client bundles.

## Validation and performance

Validation scripts use the existing external Playwright runtime with headless
Edge. `check-operations.mjs` covers both locales and all six widths, all six cases,
keyboard previews, navigation, status, locale/hash switching, touch, reduced motion,
server content without JS, metadata and console/hydration. Screenshots live under
ignored `test-results/operations/`; section captures hide fixed chrome only during
capture. The transition capture retains the real shell.

Production script payloads are measured by `measure-operations.mjs`, which asserts
that direct case loads do not request Three.js or GSAP bundles. These totals include
Next/React and the existing global shell, not just Phase 11. Static SVG adds no
image network request. Detailed measured results are in the ignored performance
JSON; do not conflate local browser observations with physical-device benchmarks.

Final validation: `npm run lint`, `npm run type-check`, `npm run build` and
`npm run check:routes` all passed. Development and production Operations/global UI
checks passed; production Hero, Identity and Expertise regressions passed. All
six widths were checked in EN/VI, including an explicit title/preview overlap
assertion. Browser console/hydration errors: none. Observed case layout shift: 0.
Original three camera files and four CV files retain their pre-phase SHA-256 values.

Measured direct Gateway load: 21,388 bytes HTML (5,045 bytes gzip); total requested
JavaScript including framework/shell was 510,009 bytes (155,026 bytes gzip).
No Three.js or GSAP script was requested on either measured case route. Operations
and case CSS is approximately 6.5 KB source, about 1.7 KB gzip; no standalone client
island or preview-media request is introduced. These are local build measurements.

The EN and VI Operations views and all three case paths were reviewed locally
before approval.

## Content withheld / risks / recommended Phase 12 entry point

Full project reports still need real evidence. No unsupported dates, metrics,
findings, responsibilities, architecture or repository links were published.
The deliberate deviation is brief-level content and concept art in place of
unavailable project media. The visual and route foundation is complete, while
technical depth remains limited by the evidence provided.

After explicit approval, Phase 12 should begin by confirming Experience records:
organization, role, date precision, actual responsibilities and permission to
publish. Do not infer employment from project or community participation.

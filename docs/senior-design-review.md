# Phase 23 — Senior Design Review

Review completed 2026-09-15. Production reviewed first at https://hphuc032.github.io/ and `/vi/`, followed by the local production build and static export. Starting repository: clean `main`, `0e6426c` (`refactor: improve carwyn.sec architecture and publication safety`), matching the locally recorded `origin/main`. No commit, push, dependency change, application edit, content edit, or asset regeneration was performed.

## Executive design assessment

**Keep the approved design.** The portfolio has a recognizable visual idea: precise editorial typography describes the system, warm photography introduces the person, and restrained technical records provide context. The strongest moments are the Hero, Hero-to-Identity transition, Operations index, and Contact conclusion. It avoids generic project cards and neon hacker decoration.

The principal weakness is the gap between the visual confidence of Operations and the limited evidence inside two case studies. That is a content-evidence limitation, not a problem that more animation or larger illustrations can solve. The long middle-page journey also asks for more attention than a recruiter may give; the Index provides an effective shortcut, but an uninterrupted scroll is substantially longer than a quick résumé scan.

These scores are subjective internal review aids, not user-research findings or public claims.

| Dimension | Score / 10 | Assessment |
| --- | ---: | --- |
| Visual identity | 9 | Distinctive type, sparse topology, and warm portrait contrast. |
| Hierarchy | 8.5 | Clear major anchors; supporting metadata remains secondary. Long middle chapters slightly dilute priority. |
| Typography | 8.5 | Strong scale contrast, readable prose, and well-handled Vietnamese. Some large all-caps records demand considerable scrolling. |
| Motion | 8.5 | Purposeful arrivals, immediate interface actions, quiet reading pages, and a usable static alternative. |
| Interaction | 8.5 | Wake and preview depth reinforce atmosphere; links and keyboard focus remain explicit. |
| Technical credibility | 8 | Honest learning/status language and evidence boundaries. Proof depth, especially cases 002/003, remains limited. |
| Recruiter usability | 8 | Name, focus, capabilities, projects, Contact and CV are findable through the Index. A full sequential read takes longer. |
| Mobile quality | 8.5 | Deliberate type/sphere positioning, photographic chapter, clean rows, and useful closing hierarchy. |
| EN/VI quality | 9 | Equivalent emphasis without forcing identical wrapping or shrinking Vietnamese. |
| Overall cohesion | 8.5 | One coherent editorial system; repeated chapter-heading structure is the main source of fatigue. |

## First impression and creative benchmark

In the first screen, the statement is dominant and the network object supports it. Information Security is visible as metadata, with Nguyen Hoang Phuc subtly identified above. The visitor gets a security portfolio identity without a conventional greeting or résumé header. The exact name becomes unmissable in Identity.

The creative-studio aspiration is met through asymmetry, generous negative space, confident type and controlled motion. Cybersecurity is conveyed through connections, disciplines and actual technical language, not props. This review did not perform a fresh side-by-side comparison with Alche or make a provenance claim; the assessment is against the approved quality/rhythm brief.

## Narrative and section review

| Chapter | Judgment | Decision |
| --- | --- | --- |
| Initialization | Brief system framing. Returning/localized navigation does not become another loading performance. | Keep. |
| Hero | The approved statement reads immediately. Sphere is secondary, mostly neutral, and works as a static object on touch/reduced motion. The long empty lower region on tall phones supplies breathing room, though it slows the first scroll slightly. | Keep composition, topology and timing. |
| Hero → Identity | Strongest chapter change: abstract black structure yields to warm portrait and a real name. The contrast feels intentional. | Keep. |
| Identity | Portrait is personal and visually confident. Sunglasses and styling introduce some fashion associations, but the name, security field and concise biography anchor it professionally. No scanner/dossier treatment. | Keep crop, scale and biography. |
| Identity → Expertise | Warm human chapter ends cleanly; a dark discipline index restores technical focus. The name does not compete with capability headings. | Keep. |
| Expertise | Four groups are easy to distinguish. Body descriptions lead and tools serve as evidence. Backend has the densest tool list, but no percentages, logos or mastery claims. | Keep calm DOM presentation. |
| Operations | Strongest project-discovery treatment: memorable titles, clear numbering, deliberate spacing, actual links, and restrained focus/hover previews. Abstract illustrations are explicitly labeled as concept studies. | Keep. No fake screenshots or architecture detail. |
| Case 001 | Concise API-security identity, verified overview and stack feel intentionally limited. Illustration/overview balance works. It communicates a project brief rather than a full engineering case study. | Keep; stronger evidence would be a later content task. |
| Case 002 | Clean educational-lab framing, but only a short overview follows the large opening. It is the weakest proof page because there are no published findings, scope artifacts or results. | Do not compensate with invented prose or media. |
| Case 003 | Similar concise brief. The protocol illustration is clearly abstract; it does not claim to be a capture or measured sequence. | Keep; actual reviewed evidence would add more value than spacing changes. |
| Operations → Experience | Cooler light surface and smaller, more structured hierarchy lower the energy after project titles. | Keep. |
| Experience | UAT responsibilities scan clearly. Memory Flower has a legitimate place and is not minimized or given artificial security relevance. Dates only appear where published. | Keep. |
| Achievements | Four categories and precise text statuses establish trajectory without medals or badges. However, this is the longest middle chapter—roughly three 1000px desktop viewports for four records. | Optional future pacing study; no change now. |
| Security Log preview | Light reading surface, one article, concise excerpt and honest count introduce thinking rather than another award. | Keep. |
| Log archive | A real small archive rather than a fake multi-post grid. Large opening remains related to the homepage, then transitions into a readable index. | Keep. |
| Log article | Comfortable prose measure, meaningful headings, modest code/filter block and explicit limitations. The note clearly separates plaintext HTTP from encrypted TLS content and does not pretend to reconstruct a missing capture. | Keep. Do not add paragraph choreography. |
| Terminal | Optional personality and navigation layer near the end, with immediate predefined responses. Its large panel feels like an invitation; some recruiters will skip it, and no essential information depends on using it. | Keep size/capabilities; do not expand. |
| Terminal → Contact | A dark interactive environment opens into the final light typographic statement. This restores whitespace and gives the ending authority. | Keep. |
| Contact | LET'S CONNECT. provides the final major payoff. Email leads; GitHub, LinkedIn and CV remain easy to understand and tap. `CV / RESUME` plus `VIEW PDF` is sufficiently clear together. | Keep; no redundant Hero CV button or clipboard feature. |
| End System | Small, quiet closure with usable Back to Top. It does not attempt another reveal spectacle. | Keep. |

## Water wake, 3D and motion restraint

The production S-curve review shows a dim cyan/green wake behind the precise cursor. It preserves the recent curved path, spreads and disappears. It does not remain as a stationary halo. The color is strongest near recent disturbance, but stays below typography in both contrast and visual importance. Rapid movement increases coverage without becoming a full-screen neon layer.

Operations depth is a subtle preview response, not universal card tilt. Keyboard focus exposes the preview and a clear outline. Contact perspective settles into stable DOM text. Hero depth does not alter the statement's reading order. No added motion, intensity adjustment, new cursor state, or rewrite is warranted.

The motion language has variation: strong opening, quiet photographic arrival, precise capability rows, more interactive project discovery, static professional records, stable article reading, immediate Terminal and a dimensional conclusion. Atmospheric motion is kept because it supports the identity without requiring attention. Additional floating, parallax, reveal patterns or louder wake colors were rejected.

## Typography, color and visual consistency

- Be Vietnam Pro carries statements and body copy; IBM Plex Mono supports short labels, indices and technical evidence. Substantive paragraphs remain proportional and comfortable.
- Large names and project titles wrap deliberately. HOANG PHUC remains two words. Vietnamese headings have comparable visual weight and natural line breaks; prose is not forced into uppercase.
- The observed Identity metadata-spacing concern was a capture artifact. Live DOM geometry showed separate equal columns with a 28.8px gap at 1440px, and a settled screenshot confirmed correct separation. No speculative CSS fix was made.
- Neutral surfaces dominate. Cream belongs to Identity; cooler pale surfaces distinguish Experience, Log and Contact. Dark chapters retain restrained differences. Alternation creates chapters, though the repeated light/dark resets can feel regular across a very long full-page overview.
- Thin dividers, small indices, limited arrows and textual statuses are consistent. Green focus outlines are stronger than decorative borders for usability; they should not be weakened in the name of restraint.
- Navigation indices 01–07 and chapter indices 01–10 are separate approved systems. Their mismatch can require a moment of interpretation, but renumbering would change the locked navigation/content convention; leave it as-is.

## Desktop, tablet, mobile and EN/VI

Production was visually sampled at 375, 430, 768, 1024, 1440 and 1920 CSS pixels, with deeper EN/VI walkthroughs at 1440 and 430. Existing responsive regression covered all 12 routes across all six viewport configurations.

At 1920, the capped content width prevents the layout from spreading across the entire monitor. Metadata is small but purposeful; the Hero and project titles still form clear anchors. At 768, Identity becomes a tighter two-column composition without losing the real name or biography; at 1024, project rows retain an intentional editorial structure. On 375/430, previews yield to bold readable titles, expertise details stack, dates remain connected to roles, and Contact links stay usable.

The mobile Hero is asymmetrical and includes the network object between statement groups, rather than merely stacking a desktop two-column layout. Identity places name before portrait; this is an appropriate mobile sequence. Achievements' longest titles remain readable without tiny text. Terminal output has its own bounded scrolling region, so wheel movement inside that region is not mistaken for a page-scroll failure.

VI retains the English brand statements and proper/technical names while localizing descriptions and UI. Cases and article preserve the same factual limits. No untranslated accidental UI label or stronger Vietnamese achievement claim was found in this pass.

## Recruiter, hiring-manager and creative-director review

**Recruiter:** A 60–90-second task-oriented scan is plausible using Index → Identity → Expertise/Operations → Contact. Name, field and key projects are immediate in those destinations. The full narrative scroll is longer, and CV is found under Contact rather than on the first screen. This was an expert walkthrough, not a timed study with recruited participants. There is no clear discovery failure that warrants moving CV into Hero.

**Security hiring manager:** Wording is credible for hands-on learning/project experience. CEH remains incomplete, CSCV is qualifying-round participation, and Top 4 is not embellished with individual/team or award-category claims. UAT and floral work are framed honestly. The biggest unanswered hiring questions concern actual project artifacts and demonstrated outcomes, especially cases 002/003. Those remain withheld; design must not imply they exist.

**Creative director:** Typography, network abstraction and the human portrait form one recognizable identity. The result is more cohesive than a collection of frontend demos. The terminal and wake are contained within this system. The repetitive chapter-heading formula and long record sections are the places to watch if future content increases.

**Generic-portfolio/cyber-cliché audit:** No bento skill wall, rounded SaaS CTA panel, logo grid, skill percentages, Matrix rain, skulls, binary wallpaper, trophy UI or fake clearance graphics. Terminal remains the element closest to a developer-portfolio convention, but its limited, useful behavior and late placement keep it from defining the whole site.

## Trust and CV review — separate repository finding

The live CV URL returns HTTP 200 with `application/pdf`. It is one readable page, retains the approved professional contact information, and includes Core Team, Top 4, qualifying-round participation and CEH In Progress. Extracted text and PDF metadata match the local approved file. No removed phone number, old encouragement-prize claim or unapproved AWS responsibilities reappeared. PDF accessibility/tagging was not formally audited.

**At the time of this review, the production PDF was valid while the Windows working copy was not byte-identical.** This was investigated read-only:

| Artifact | Bytes | SHA-256 | Strict PDF parse |
| --- | ---: | --- | --- |
| Production download and `HEAD` Git blob | 4604 | `F1FA8676C5FC2F0E6D676529FE97100EAAA133021B589E80C7E940BDDE1F77C9` | Passes; declared and actual xref offset 4151. |
| Local `public/cv/nguyen-hoang-phuc-cv.pdf` | 4702 | `86A384A790F4A696D8F4EB9B22CDEB31569D52B9ABC1533FA2CA735F0B4BEC33` | Fails: broken xref table; actual xref offset 4222. |

`core.autocrlf=true` and `git ls-files --eol` reports `i/lf w/crlf` for this PDF. Replacing the working copy's CRLF bytes with LF produces the exact production/Git blob. Therefore the mismatch is line-ending conversion, not changed CV claims. Tolerant PDF readers repair the local offsets, which explains why header/hash checks did not catch it previously.

The local static export faithfully copies that working PDF, so its route/header check passes but its PDF has the same strict-parse issue. Do not use this newly generated local export as a release artifact until binary handling is addressed. The currently deployed Linux Actions artifact uses the valid Git blob.

Recommended follow-up: mark PDF assets binary in Git attributes and restore this public PDF byte-for-byte from the already-valid repository blob, then validate both Windows and Linux-style checkout/export paths. That changes asset handling and the previously recorded local checksum; it is explicitly left for authorization outside this visual-only phase. No PDF, Git attributes, Git configuration or history was changed here. Original private CV/portrait files were not touched.

Phase 24 completed that follow-up: `*.pdf binary` now prevents line-ending normalization, and the working tree, repository blob, static export, and deployment use the valid 4,604-byte PDF with SHA-256 `F1FA8676C5FC2F0E6D676529FE97100EAAA133021B589E80C7E940BDDE1F77C9`. The historical values above are retained to explain the original diagnosis.

## Findings and decisions

| Priority | Finding | Action |
| --- | --- | --- |
| RESOLVED in Phase 24 | Git text conversion damaged local PDF byte offsets despite identical content. | PDF assets are now binary in Git; local, export, repository, and deployed copies were verified. |
| MUST FIX — visual | No confirmed visual defect requiring correction. | None. |
| SHOULD FIX — in-scope | No sufficiently clear benefit to justify changing locked visuals. | None. |
| OPTIONAL — do not implement | Study modestly shorter Achievements/middle-page spacing with actual recruiter tasks. | Not implemented; current mobile wrapping and status clarity take priority. |
| OPTIONAL — later content authorization | Add verified project artifacts/results when available. | Not implemented; no fabricated detail or new content. |
| OPTIONAL — do not implement | Consider a clearer relationship between menu and chapter numbers in a future navigation review. | Current approved numbering preserved. |
| KEEP AS-IS | Hero, portrait treatment, wake intensity, editorial reveal family, preview tilt, contact hierarchy, article measure, semantic focus styles. | All retained. |

Changes applied: review documentation and ignored QA captures only. Rejected changes include shrinking Vietnamese, condensing factual statuses into badges, adding a Hero CV CTA, enlarging decorative case visuals to disguise missing evidence, and increasing motion/color intensity.

## Validation and regression

| Command / method | Result |
| --- | --- |
| `npm run lint` | Pass, zero warnings. |
| `npm run type-check` | Pass. |
| `npm run build` | Pass, 22 generated pages with normal Proxy architecture. Initial sandbox attempt could not reach Google Fonts; network-enabled retry passed without a font change. |
| `npm run check:routes -- http://127.0.0.1:4230 --production` | Pass: public routes, unpublished/unknown/private boundaries, CV route, dev exclusion. |
| `npm run check:localization -- http://127.0.0.1:4230` | Pass: EN/VI, six widths, eight hashes, cases/log, Terminal and no-JS. |
| `node scripts/check-responsive.mjs http://127.0.0.1:4230` | Pass: 72 route/viewport combinations, orientation, text-size stress, touch and no-JS. |
| `node scripts/check-accessibility.mjs http://127.0.0.1:4230` | Pass: existing semantics, keyboard/focus, 320px/200% equivalent, reduced-motion and no-JS suite. Not assistive-technology certification. |
| `node scripts/check-creative-interaction.mjs http://127.0.0.1:4230` | Pass: preview/focus parity, input deferral, locale/route cleanup, resize, hidden-tab behavior, touch and reduced motion. |
| `node scripts/check-water-wake.mjs https://hphuc032.github.io` | Pass on production at 1440/1920: S-curves, circles, zigzag, reversal, bounded storage and lifecycle. Network-enabled run was needed after sandbox network denial. |
| `npm run build:github-pages` | Pass: 16 generated pages, containing 12 published routes plus framework/metadata output. |
| `npm run check:static-export` | Pass: 12 direct static routes, custom 404, origin-root assets, sitemap/robots and CV bytes copied unchanged. The historical PDF limitation was resolved in Phase 24 as documented above. |
| `npm run check:localization -- http://127.0.0.1:4231 --static-export` | Completed with an empty error list in the saved validation artifact. |
| `npm run check:metadata -- http://127.0.0.1:4232 https://hphuc032.github.io` | Pass: canonical, alternates, Open Graph, robots and exact 12-route sitemap. |
| `node scripts/measure-hero.mjs http://127.0.0.1:4231` | Performance smoke: dynamic desktop WebGL, static reduced-motion alternative, idle wake buffers. |

Browser scripts use the existing environment-provided Playwright module through `NODE_PATH`; no dependency was installed. A fresh metadata-check shell initially omitted that variable; rerunning with the established runtime path passed.

### Performance comparison

| Metric | Phase 22 baseline | Phase 23 | Delta / interpretation |
| --- | ---: | ---: | --- |
| Homepage initial JS, gzip | 154925 B | 154925 B | 0 |
| Homepage enhanced total JS, gzip | 414500 B | 414500 B | 0 |
| CSS, gzip | 13412 B | 13412 B | 0 |
| CSS, raw | 70592 B | 70592 B | 0 |
| Creative full-scroll CLS | Near-zero baseline | 0.000218–0.001306 | Within established range across EN/VI and six widths. |
| Production wake draw p95 | Approximately 1ms | 0.5–1.2ms | Consistent; no loop rewrite. |
| Pointer-loop React commits/layouts | 0 / 0 | 0 / 0 | Preserved in tested gestures. |

Desktop smoke reported WebGL ready at approximately 2380ms, with text independent of enhancement; reduced motion loaded no Three.js script. Whole-page idle task cost measured about 4.15ms/s on desktop and 1.11ms/s in static reduced motion. Production gesture pacing p95 was 21.1–21.9ms, with at most one frame above 25ms per 64-frame gesture; this includes automation timing and is not a claim of universal 60fps or field INP. No new LCP optimization was attempted. No field Core Web Vitals claim is made.

No application/style/content file changed, so there is no new route-bundle, font, image, motion or layout contribution. Existing console/hydration, focus, publication, responsive and motion checks remained clean.

## Deliverables and remaining boundaries

- New tracked document: `docs/senior-design-review.md`.
- Ignored review artifacts: `test-results/senior-design-review/`, including EN/VI 1440/430 screenshots, full-page desktop overview, a local capture helper following the existing motion-review workflow, and a read-only production CV comparison.
- Final deliverable screenshots use the freshly built local production version of unchanged application code. Live production was reviewed separately first. Full-page capture scrolls through sections to settle one-time reveals; viewport images preserve the normal header/status shell.
- Existing QA scripts wrote only ignored result artifacts. No application files, public assets, manifests, translations, factual records, packages or workflow files were modified. No commit or push.
- In-app captures intermittently clipped to the host panel, so final deliverable captures use the existing headless browser QA approach at explicit viewport dimensions.

**Recommended Phase 24 entry point:** retain the accepted design and use this review as its visual reference. Resolve the PDF binary-handling issue before any deployment from the Windows working tree. Then proceed only under the user's explicit Phase 24 scope; no Phase 24 work has begun.

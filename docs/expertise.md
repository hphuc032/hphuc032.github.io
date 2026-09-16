# Phase 10 — Expertise

## Checkpoint and scope

Phase 9 checkpoint: `821a8db` — `feat: build carwyn.sec identity section`.
Before committing, the exact approved English biography and its Vietnamese
equivalent replaced the provisional copy. Explicit word spacing preserves
HOANG PHUC as two readable words. Phase 9 visual, build and regression checks
passed. Private camera/CV originals and unrelated root PNGs were excluded.

Phase 10 adds only 03 / EXPERTISE. Hero and corrected Identity are unchanged.

## Confirmed content baseline

Source: the user's explicit Phase 10 clarification in this task, September 8, 2026.
These are actual use, not expert-level proficiency claims.

1. Network Security / Traffic Analysis: Wireshark, Nmap, TCP/IP analysis, DNS,
   HTTP / HTTPS traffic analysis, basic network enumeration.
2. Vulnerability Assessment / Security Testing (labs/projects): Kali Linux,
   Nmap, Metasploit, OWASP ZAP, service enumeration, vulnerability identification
   and assessment.
3. Application / API Security (Secure API Gateway): FastAPI, Keycloak, Kong,
   JWT, OAuth2, OpenID Connect (OIDC), RBAC, Docker, PostgreSQL, API authorization
   testing, authentication and authorization concepts.
4. Backend Development: Java, Spring Boot, Servlet, JSP / JSTL, JPA, JDBC,
   MySQL, Python, FastAPI, SQL.
5. Linux / Infrastructure Security Labs: Ubuntu, Kali Linux, FortiGate, Docker,
   Linux command line.
6. Concepts worked with: authentication, authorization, RBAC, JWT security,
   BOLA / object-level authorization, brute-force / rate-limit testing,
   SSRF concepts, web vulnerability assessment, packet / protocol analysis.

The user specified exactly four visual groups:

| Group | Supporting tools shown |
| --- | --- |
| Network Security | Wireshark, Nmap |
| Web & Vulnerability Assessment | Kali Linux, Nmap, Metasploit, OWASP ZAP |
| Application / API Security | FastAPI, Keycloak, Kong, JWT, OAuth2, OpenID Connect (OIDC), Docker, PostgreSQL |
| Backend & Infrastructure | Java, Spring Boot, Python, MySQL, Ubuntu, Docker, FortiGate |

The visible set is deliberately curated from the confirmed baseline. Other
confirmed backend technologies and concepts remain recorded here for later
case-study work; a full badge/tool wall is unnecessary. No AWS core expertise,
CEH credential, ratings, advanced/mastery claims, or unverified tools are shown.

## Composition and interaction

Near-black returns after Identity's warm photographic surface. A smaller
editorial heading introduces four open rows separated by neutral rules. Desktop
uses index, discipline, practical scope and supporting tools across the grid.
Tablet moves scope and evidence beneath the discipline; mobile stacks all
information into each row. No accordion, hidden details or cards are used.

All information is readable on arrival. Rows are semantic list items, not fake
controls, and do not add tab stops or a SCAN cursor. There is no entrance timeline
or hover dependency: motion adds no necessary meaning here. The existing header,
menu, cursor and focus-visible vocabulary remain intact.

## Localization and navigation

`src/data/expertise.ts` satisfies the existing Expertise model. Category titles
and descriptions are explicit EN/VI values; canonical technology labels are
shared across locales. The server component uses one rendering path. Vietnamese
uses the same modest scope as English. Product/protocol names stay untranslated.

`#expertise` is discovered by the existing section observer. Index navigation
focuses the section; status shows 02 / EXPERTISE (or 02 / CHUYÊN MÔN). The section
label is 03 / EXPERTISE because editorial numbering includes Hero. Locale changes
preserve the hash without a document reload or initialization replay. The global
regression's temporary future-section fixture now uses Operations, not Expertise.

## Accessibility and performance

Semantic section, h2, h3, ordered capability list and labeled tool lists. All
descriptions and tools remain available without JavaScript, hovering or motion.
The keyboard-focusable section destination retains the existing visible outline.
No new client component, GSAP import, WebGL, imagery, font or package is added.
Expertise is server-rendered HTML and a small CSS file using existing tokens.

## Review and validation

Run the existing lint/type/build/routes commands, plus the external Playwright
runtime with `scripts/check-expertise.mjs`, `scripts/check-identity.mjs`,
`scripts/check-global-ui.mjs` and `scripts/check-hero.mjs`. Expertise checks cover
both locales at 375, 430, 768, 1024, 1440, 1920; text fit, content visibility,
keyboard navigation, active tracking, refresh, equivalent locale hash routes,
reduced motion, touch, no-JS content and console/hydration errors.

Review captures and measured geometry are ignored under `test-results/expertise/`.
Full-section captures hide fixed chrome for the screenshot only; the Identity
to Expertise transition capture retains the real global shell.

Final results: lint, type-check and production build passed. Development and
production route checks passed, as did Expertise, Identity and global UI browser
checks. The production Hero regression passed with real WebGL pixels, pause,
offscreen/hidden suspension, context-loss fallback and locale persistence.
No console or hydration warnings were recorded. The Expertise browser run
observed zero layout shift. Source CSS is 3,388 bytes before minification; no
dedicated client JavaScript is introduced. Git confirms no Hero or Identity
implementation changes relative to the Phase 9 checkpoint. The original three
camera files and four CV files retain their previous SHA-256 hashes.

The EN and VI Expertise views were reviewed locally before the Phase 10
checkpoint.

## Phase 11 entry point

Only after explicit approval, inspect the actual source/evidence for Secure API
Gateway, Vulnerability Assessment and Network Traffic Analysis before writing
Selected Operations details. The confirmed tool baseline does not establish
specific findings, outcomes, metrics, ownership or completed case studies.

# carwyn.sec v2 — Agent Handoff & Multi‑Page Upgrade Plan

> **Purpose:** Single handoff file for another coding agent. Read this before editing. The repository remains the final source of truth; verify branch, HEAD and working tree before making changes.

## 0. Project identity

- Brand: `carwyn.sec`
- Public identity: **Nguyen Hoang Phuc**
- Field: **Information Security**
- Public location: **Vietnam**
- Tagline: **UNDERSTAND SYSTEMS. DEFEND THEM.**
- Production: `https://hphuc032.github.io/`
- Portfolio repo: `https://github.com/hphuc032/hphuc032.github.io`
- External CTF writeups repo: `https://github.com/hphuc032/ctf-writeups`
- English default, Vietnamese under `/vi`
- Dark-only, cinematic/editorial/technical visual direction
- Avoid Matrix, binary rain, hacker-template, gaming HUD, glitch spam, CRT clichés

---

# 1. Verified repository snapshot

Verified against public GitHub on **2026-10-02**.

Current `main`:

```text
73d6c14 docs: prepare carwyn.sec v1.0.0 release
```

The redesign branch already exists and currently points to the same commit:

```text
redesign/multipage-v2
```

**All v2 redesign work belongs on `redesign/multipage-v2`. Do not redesign directly on `main`.**

Production `main` must stay stable until v2 passes full review.

---

# 2. Current stack

Current repository versions:

```text
Next.js              16.3.4
React                 19.2.8
React DOM             19.2.8
TypeScript            6.0.3
Tailwind CSS          4.3.3
GSAP                  3.15.0
React Three Fiber     9.7.0
Three.js              0.182.0
MDX                   3.1.1
Node.js               24.x
npm                   11.x
```

Core dependencies include `@mdx-js/react`, `@react-three/fiber`, `gsap`, `next`, `react`, `react-dom`, `server-only`, `three`.

Do not add dependencies unless a phase explicitly proves they are necessary.

---

# 3. Build and deployment baseline

The repo supports two modes.

## Normal Next.js

```bash
npm run dev
npm run build
npm run start
```

Normal build retains current Next.js Proxy/server behavior.

## GitHub Pages

```bash
npm run build:github-pages
```

GitHub Pages mode conditionally uses:

```text
output: "export"
trailingSlash: true
images.unoptimized: true
```

This is a GitHub **user site**, so production is at origin root:

```text
https://hphuc032.github.io/
```

Never introduce:

```text
basePath: "/carwyn.sec"
assetPrefix: "/carwyn.sec"
```

Environment variables already used:

```text
SITE_URL
DEPLOY_TARGET
```

Production metadata origin:

```text
SITE_URL=https://hphuc032.github.io
DEPLOY_TARGET=github-pages
```

Current deployment flow:

```text
push main
  → GitHub Actions
  → npm ci
  → lint + type-check
  → static build
  → static-export validation
  → Pages artifact
  → deploy
```

`out/` is generated and must remain uncommitted.

---

# 4. Current v1 information architecture

Current Home composition lives in:

```text
src/components/pages/PortfolioPage.tsx
```

Current order:

```text
Hero
Identity
Expertise
Operations
Experience
Achievements
Security Log
Terminal
Contact
End System
```

The page also mounts:

```text
ChapterMotion
PointerAtmosphere
```

This long homepage is the reason for v2.

Current global navigation is still section/hash oriented via:

```text
src/components/layout/GlobalInterface.tsx
src/i18n/global-ui.ts
```

Current section IDs:

```text
identity
expertise
operations
experience
achievements
log
contact
```

R2 will replace primary navigation with route navigation.

---

# 5. Existing public routes that MUST remain valid

## Home

```text
/
/vi/
```

English is canonical and unprefixed; Vietnamese uses `/vi`.

## Operations case studies — keep exact URLs

```text
/operations/secure-api-gateway/
/operations/vulnerability-assessment/
/operations/network-traffic-analysis/

/vi/operations/secure-api-gateway/
/vi/operations/vulnerability-assessment/
/vi/operations/network-traffic-analysis/
```

Do **not** rename these to `/projects/[slug]`.

The new `/projects/` route is only the index.

## Security Log — keep separate from CTF Writeups

```text
/log/
/vi/log/

/log/analyzing-http-and-https-traffic-with-wireshark/
/vi/log/analyzing-http-and-https-traffic-with-wireshark/
```

Security Log = technical learning/analysis.
CTF Writeups = challenge solutions.

## CV

Stable public path:

```text
/cv/nguyen-hoang-phuc-cv.pdf
```

Do not rename/regenerate it during the redesign unless explicitly requested.
`.gitattributes` already treats PDFs as binary; preserve that rule.

---

# 6. Current canonical data architecture

Evidence-first typed data already exists:

```text
src/data/profile.ts
src/data/expertise.ts
src/data/projects.ts
src/data/project-publication.ts
src/data/experience.ts
src/data/achievements.ts
src/data/contact.ts
src/data/security-log.ts
src/data/security-log-publication.ts
```

Desired pattern:

```text
canonical typed data
      ↓
publication selectors
      ↓
Server Components
      ↓
small Client interaction islands
```

Do not duplicate facts in page components. Draft/review/missing-locale entries must remain unpublished.

---

# 7. Public identity baseline

Approved current public facts:

```text
Brand: carwyn.sec
Name: Nguyen Hoang Phuc
Field: Information Security
Location: Vietnam
Current learning: CEH — In Progress
```

Approved English biography:

```text
I’m Nguyen Hoang Phuc, based in Vietnam. carwyn.sec is where I document
security projects, technical learning, and the systems I study.
```

Do not expand this into unsupported availability, seniority, employer, or certification claims.

---

# 8. Expertise baseline

## Network Security

Focus:

```text
TCP/IP
DNS
HTTP / HTTPS traffic
packet / protocol analysis
basic network enumeration
```

Current tools:

```text
Wireshark
Nmap
```

## Web & Vulnerability Assessment

Focus:

```text
service enumeration
web vulnerability identification
vulnerability assessment
brute-force / rate-limit testing
```

Current tools:

```text
Kali Linux
Nmap
Metasploit
OWASP ZAP
```

### v2 user-approved addition

Add conservatively:

```text
Burp Suite
```

Use it as a tool/skill, not a proficiency claim.

## Application / API Security

Focus:

```text
authentication
authorization
RBAC
JWT security
API authorization testing
```

Tools/technologies:

```text
FastAPI
Keycloak
Kong
JWT
OAuth2
OpenID Connect (OIDC)
Docker
PostgreSQL
```

## Backend & Infrastructure

Current tools:

```text
Java
Spring Boot
Python
MySQL
Ubuntu
Docker
FortiGate
```

No percentages. No `expert`, `advanced`, `mastery` labels.

---

# 9. Current published projects

Canonical source: `src/data/projects.ts`.

Exactly three featured projects are public.

## Secure API Gateway

```text
Category: API Security
Summary: A project focused on API authentication and authorization.
```

Verified stack:

```text
FastAPI
PostgreSQL
Keycloak
Kong
Docker
JWT
OAuth2
OpenID Connect (OIDC)
RBAC
```

Do not invent architecture flows, findings, dates, metrics, responsibilities, outcomes, or per-project repository URLs.

## Vulnerability Assessment

```text
Category: Security Lab
Summary: Security assessment practice in an educational lab context.
```

Keep educational/lab framing.

## Network Traffic Analysis

```text
Category: Network Security
Summary: Packet and protocol analysis as a hands-on learning practice.
```

Related verified practice:

```text
Wireshark
TCP/IP
DNS
HTTP / HTTPS traffic analysis
```

---

# 10. Current achievements

Canonical source: `src/data/achievements.ts`.

Exactly four public records:

```text
COMMUNITY
Core Team — AWS Student Builder Group HCMUTE

COMPETITION
Cybersecurity Student Competition 2025
Qualifying Round Participant
Organizer: National Cybersecurity Association (NCA)
https://cscv.vn

RECOGNITION
Top 4 — HCMUTE CTF 2025
Sinh Viên Với An Toàn Thông Tin

CERTIFICATION
CEH — In Progress
```

Do not claim CSCV finalist/winner/final qualification.
Do not claim HCMUTE CTF team/individual status unless separately verified.
Never present CEH as completed.

---

# 11. Existing Security Log

Current content lives under:

```text
src/content/security-log/
```

Current article:

```text
Analyzing HTTP and HTTPS Traffic with Wireshark
```

The article intentionally distinguishes:

```text
plaintext HTTP visibility
vs
encrypted HTTPS / TLS Application Data
```

Current architecture:

```text
typed metadata
+ explicit publication manifest
+ explicit MDX registry
+ reviewed EN/VI MDX
```

No CMS. No arbitrary route-to-filesystem runtime import.

---

# 12. Current interaction systems

These are already approved and should be preserved unless a later v2 phase explicitly modifies them.

## Network Sphere

Relevant files:

```text
src/components/webgl/NetworkCanvas.tsx
src/components/webgl/NetworkSphere.tsx
src/components/webgl/StaticNetwork.tsx
src/lib/network-topology.ts
```

Current intent:

```text
Hero signature visual
sparse network topology
interactive enhancement
static fallback for reduced motion / unavailable WebGL
```

Do not load Sphere on article/content routes.

## Directional water wake

Relevant files:

```text
src/components/home/PointerAtmosphere.tsx
src/lib/water-wake.ts
```

Concept:

```text
pointer behaves like a body moving through water
recent trajectory remains behind
curved wake
velocity-dependent disturbance
diffusion
decay to calm
```

This is not a radial halo. Preserve the fish-like path-memory behavior.

## Custom cursor

Relevant file:

```text
src/components/layout/ContextCursor.tsx
```

Existing restrained states include concepts such as:

```text
OPEN
VIEW
```

Native text/input cursor behavior must take precedence in text fields and selectable content.

## Editorial motion

Existing system includes:

```text
ChapterMotion
GSAP / ScrollTrigger
section reveals
Operations depth
Contact perspective
```

Do not introduce Matrix/glitch effects.

---

# 13. v1 performance/accessibility baseline

The project already passed prior responsive, accessibility and performance review.

Representative synthetic baseline:

```text
Initial homepage JS gzip   ≈ 154.9 KB
EN homepage font transfer  ≈ 77.8 KB
Local mobile LCP           ≈ 1.3–1.7s
CLS                        near zero / ~0.001 range
```

These are lab measurements, not field Core Web Vitals.

Accessibility engineering target:

```text
WCAG 2.2 AA
```

Existing behavior includes:

```text
semantic landmarks
keyboard navigation
visible focus
reduced motion
200% zoom/reflow
localized 404
touch-target review
screen-reader-oriented labels
```

PDF accessibility has not been formally audited.

v2 must not regress this baseline.

---

# 14. Why v2 exists

The user considers the current long single-page Home too long.

The approved v2 direction is:

```text
short Home
+
dedicated Projects
+
dedicated Writeups
+
dedicated About
+
dedicated Terminal
+
dedicated Contact
```

Reuse validated v1 code/content. Do not rebuild the site from scratch.

---

# 15. User-approved v2 route map

## English

```text
/
/projects/
/writeups/
/about/
/terminal/
/contact/
```

## Vietnamese

```text
/vi/
/vi/projects/
/vi/writeups/
/vi/about/
/vi/terminal/
/vi/contact/
```

Keep existing case-study and Security Log routes unchanged.

---

# 16. Target global navigation

Desktop target:

```text
carwyn.sec     PROJECTS   WRITEUPS   ABOUT   TERMINAL   CONTACT      EN / VI
```

Rules:

- `carwyn.sec` links Home.
- No visible desktop `HOME` item unless testing proves it is needed.
- Active route state is visible.
- No rounded SaaS-nav pills.

Mobile:

```text
carwyn.sec                                  MENU
```

Full-screen/index menu:

```text
01 HOME
02 PROJECTS
03 WRITEUPS
04 ABOUT
05 TERMINAL
06 CONTACT

EN / VI
```

Preserve correct dialog/focus semantics.

---

# 17. Target Home

Approved v2 composition:

```text
HERO
↓
ABOUT TEASER
↓
FEATURED PROJECTS
↓
LATEST WRITEUPS
↓
CONTACT TEASER
↓
FOOTER
```

After dedicated routes are ready, remove the full Home versions of:

```text
Identity
Expertise
Experience
Achievements
Terminal
Contact
```

Do not remove them in R1.

## About teaser

Approved direction:

```text
Nguyen Hoang Phuc
Information Security
Vietnam
ABOUT ME →
```

## Featured Projects

Use the three canonical published projects.

Link:

```text
VIEW ALL PROJECTS → /projects/
```

Individual project links remain `/operations/...`.

## Latest Writeups

Eventually populated only by real approved CTF writeups.
Do not fabricate entries.

## Contact teaser

Short ending only. Full contact lives at `/contact/`.

---

# 18. Projects page target

Routes:

```text
/projects/
/vi/projects/
```

Approved layout: **editorial rows**, not generic cards.

Concept:

```text
01
SECURE API GATEWAY
API Security
summary
VIEW CASE →

02
VULNERABILITY ASSESSMENT
Security Lab
summary
VIEW CASE →

03
NETWORK TRAFFIC ANALYSIS
Network Security
summary
VIEW CASE →
```

Footer CTA:

```text
VIEW MORE ON GITHUB →
```

Case URLs remain `/operations/...`.

---

# 19. About page target

Routes:

```text
/about/
/vi/about/
```

Approved composition:

```text
01 IDENTITY
02 EXPERTISE
03 EXPERIENCE
04 ACHIEVEMENTS
05 CV
```

Reuse current validated sections and canonical data.
Do not create About-specific copies of facts.

---

# 20. Terminal page target

Routes:

```text
/terminal/
/vi/terminal/
```

Reuse current Terminal and security model.

Commands remain:

```text
help
whoami
skills
projects
experience
achievements
logs
contact
clear
```

No shell, filesystem, child process, network command or dynamic code execution.

Later route target updates may include:

```text
projects → /projects/
logs → /writeups/ or suitable content index
contact → /contact/
```

Do not change command semantics before the routes exist.

---

# 21. Contact page target

Routes:

```text
/contact/
/vi/contact/
```

Approved public channels only:

```text
Email      nhpntd@gmail.com
GitHub     https://github.com/hphuc032
LinkedIn   https://www.linkedin.com/in/nguyen-phuc-71217332a/
CV         /cv/nguyen-hoang-phuc-cv.pdf
```

No phone number, address, form or backend.

Main statement may remain:

```text
LET'S CONNECT.
```

---

# 22. External CTF Writeups repository

Source:

```text
https://github.com/hphuc032/ctf-writeups
```

Default branch:

```text
main
```

Observed top-level groups include:

```text
CookieArena/
DailyAlpacahack/
HCMUTE-CTF_2025/
HCMUTE-CTF_2026/
Pico-CTF/
V1T/
Temp.md
README.md
```

Observed Markdown examples include:

```text
CookieArena/Upload-File-via-URL/README.md
DailyAlpacahack/Web/Impossible_Puzzle/README.md
DailyAlpacahack/Web/Small_n/README.md
HCMUTE-CTF_2025/Mango Mutation — Writeup ... .md
```

The repo also contains large non-Markdown challenge artifacts, including extracted application files, DLLs, databases and images.

**Never mirror the full repo into the portfolio.**

---

# 23. CTF Writeups publication model

## Taxonomy

Keep separate:

```text
SECURITY LOG
= technical notes / learning / analysis
= existing /log system

CTF WRITEUPS
= challenge solutions / event writeups
= new /writeups system
```

## No runtime GitHub dependency

Forbidden:

```text
browser → GitHub API → render article
```

Required direction:

```text
external writeup repo
      ↓
controlled build-time sync/import
      ↓
explicit publication manifest
      ↓
static route generation
      ↓
GitHub Pages
```

## Explicit allowlist

Do **not** auto-publish every `.md` or `README.md`.

`Temp.md` is the clearest reason.

Conceptual manifest:

```ts
{
  sourcePath: "CookieArena/Upload-File-via-URL/README.md",
  slug: "cookiearena-upload-file-via-url",
  event: "CookieArena",
  category: "web",
  published: true,
  sourceRef: "<pinned commit SHA>"
}
```

## Reproducibility

Prefer a pinned external repo commit SHA for a release/sync batch.
Do not depend on mutable `main` at visitor runtime.

## Allowed synced material

Primary:

```text
.md
README.md
```

Referenced images may be copied only when:

- directly referenced by an approved article;
- safe image type;
- safe size;
- intentionally public;
- no private or credential-like data.

Never automatically copy:

```text
.dll
.exe
.db
archives
challenge binaries
keys
credentials
unknown extracted artifacts
```

## Markdown security

Approved source paths are trusted reviewed content, but still:

- no runtime path construction from the URL;
- no script evaluation;
- avoid uncontrolled raw HTML;
- keep explicit slug → source mapping;
- static-generate only published routes.

---

# 24. Writeups page target

Routes:

```text
/writeups/
/vi/writeups/
```

Only real published writeups appear.

Potential categories may include:

```text
ALL
WEB
CRYPTO
FORENSICS
REVERSE
PWN
MISC
```

Render a category only if published content exists in it.

Entry concept:

```text
HCMUTE CTF 2025
Mango Mutation

WEB
READ →
```

Article route:

```text
/writeups/[slug]/
```

Vietnamese shell may be localized while the source article stays in its original language.
Do not machine-translate CTF content automatically.

---

# 25. Global atmospheric visual system

User approved four visual layers with different responsibilities:

```text
STAR FIELD
→ subtle atmosphere

METEOR SYSTEM
→ occasional background motion

WATER WAKE
→ direct pointer response

NETWORK SKILL SPHERE
→ Home-only signature object
```

Do not let all four peak at the same time.

---

# 26. Star field specification

Approved:

```text
very subtle star field
```

Rules:

- low contrast;
- mostly static;
- minimal twinkle;
- no dense galaxy;
- no fantasy space background;
- no obvious looping pattern;
- never reduce text contrast.

The site must still read as a cybersecurity editorial portfolio, not a space website.

---

# 27. Meteor system specification

## Direction

```text
top-left ↘ bottom-right
```

Vary entry/exit position slightly.

## Randomness

Approved:

```text
pseudo-random with a session seed
```

Seed may determine:

```text
spawn interval
entry position
trail length
size
brightness
duration
minor angle variation
```

Do not call uncontrolled `Math.random()` continuously per frame.

## Starting intensity

| Page | Relative intensity | Starting interval |
| --- | ---: | --- |
| Home | 100% | ~6–12s |
| Projects | 70% | ~9–16s |
| Terminal | 65% | ~9–16s |
| Contact | 60% | ~9–16s |
| About | 35% | ~14–22s |
| Writeups index | 30% | ~14–22s |
| Case study | 20% | ~18–28s |
| Writeup article | 10–15% | ~20–30s |

These are tuning targets, not hard constants.

## Rare double event

Occasionally allow:

```text
meteor A
  ↓
~0.6–1.4s
  ↓
smaller meteor B
```

Never create a meteor shower.

## Appearance

Preferred:

```text
cool-white head
very subtle cyan
thin fading trail
fast diagonal travel
natural fade
```

Avoid:

```text
rainbow
fire
particle explosion
huge glow
lens flash
constant streak spam
```

## Concurrency

Bound the system:

```text
desktop: max 2–3 active
mobile:  max 1–2 active
```

No unbounded DOM creation.

## Lifecycle

Stop/reduce when:

```text
document.hidden
route unmounted
reduced motion active
```

## Mobile

User explicitly wants meteors on mobile.
Do not disable them merely because the pointer is touch-based.
Reduce density/cost only as needed for performance.

## Reduced motion

Meteor animation OFF.
Static star field may remain if it is visually harmless.

---

# 28. Global water wake in v2

User wants water wake available across all pages, but intensity should vary.

Starting target:

```text
Home              100%
Projects            75%
Terminal            60%
Contact             45%
About               30%
Writeups index      25%
Case study          20%
Writeup article     10–15%
```

Article pages must remain reading-first.

Locked behavior:

```text
recent pointer trajectory
curved wake
velocity response
directional trail
diffusion
return to calm
```

Do not replace this with a simple glow.

---

# 29. Home-only Skill Sphere upgrade

Network Sphere remains **Home only**.

Never load Three.js/R3F on Projects, Writeups, About, Terminal, Contact, case-study or article routes unless a later measured reason explicitly changes this rule.

## Approved skill-star list — 13 total

### Network / Analysis

```text
Wireshark
Nmap
```

### Web / Security Testing

```text
Burp Suite
OWASP ZAP
Metasploit
```

### Application / API Security

```text
JWT
OAuth2
Keycloak
Kong
```

### Backend / Infrastructure

```text
FastAPI
Spring Boot
Docker
Linux
```

## Visual behavior

Default:

```text
network sphere
+
normal nodes
+
13 slightly stronger skill-star nodes
```

Do not display all skill labels simultaneously.

Hover/focus concept:

```text
✦
BURP SUITE
Web Security Testing
```

## Motion

Approved:

```text
slow continuous 360° auto rotation
```

Optional if clean and performant:

```text
subtle pointer depth
drag rotation
```

Skill stars must be attached to real 3D sphere coordinates and move with the surface.

## Interaction

Recommended:

```text
hover/focus → skill name/category
click        → brief focus/highlight only
```

Do not navigate away when clicking a skill star.

## Mobile

Gentle auto-rotation is acceptable.
Touch drag is optional, not required.

## Reduced motion

Static designed skill-sphere arrangement.

---

# 30. Page transition direction

User approved short route transitions.

Target:

```text
~250–450ms
```

Style:

```text
short fade / clip / editorial title reveal
```

Rules:

- navigation must still feel immediate;
- do not add 1–2s cinematic loaders;
- do not replay full Initialization on every route;
- reduced motion should be nearly immediate.

---

# 31. v2 design language

Keep:

```text
dark cinematic
editorial
technical
minimal
high contrast
sparse cyan / cyber-green accent
creative-studio confidence
```

Avoid:

```text
Matrix rain
binary rain
CRT noise
scanline overload
hacking skulls
gaming HUD
bright cyberpunk borders
glitch spam
generic SaaS cards
rounded button grids
```

Meteor/star atmosphere must not turn the product into a space-themed demo.

---

# 32. Server / Client architecture rules

Continue the current pattern:

```text
Server Components
→ route composition + static content

Client Components
→ interaction only
```

Client islands may include:

```text
navigation
language selector
custom cursor
route transitions
meteor/star atmosphere
water wake
Terminal
Network Sphere
Operations interaction
motion wrappers
```

Do not turn dedicated pages into large client components.

---

# 33. SEO / metadata rules

Production origin:

```text
https://hphuc032.github.io
```

Every new route needs:

```text
localized title
localized description
canonical
EN alternate
VI alternate
x-default where current architecture uses it
Open Graph metadata
correct html lang
```

No localhost or test origins in production.

Eventually sitemap must include the new public route pairs plus existing Operations/Log/writeup entries.

---

# 34. Static export rules

GitHub Pages is static.

Public v2 routes must not require:

```text
runtime Node server
server actions
runtime filesystem lookup from URL
visitor-time GitHub API
database
Proxy/middleware at GitHub Pages runtime
```

Unknown/unpublished slugs remain real 404s.

---

# 35. Git / release strategy

## Work branch

```text
redesign/multipage-v2
```

## Commit strategy

One reviewed checkpoint per phase.
Never create one giant v2 commit.

## Merge rule

Do not merge to `main` until:

```text
routing complete
visual review complete
writeup pipeline verified
EN/VI complete
responsive QA
accessibility QA
performance QA
static export verified
production-preview review complete
```

## Version

Because IA changes significantly, recommended eventual release:

```text
v2.0.0
```

---

# 36. MASTER v2 ROADMAP

## R0 — Safety / baseline freeze

**Model:** GPT-5.6 Sol  
**Reasoning:** ~50%

- verify branch/HEAD/working tree;
- confirm redesign branch starts from stable v1;
- capture baseline tests;
- no visual changes.

Exit: baseline healthy.

---

## R1 — Multi-Page Architecture & Route Foundation

**Model:** GPT-6 Astra  
**Reasoning:** ~85%

Create route foundations:

```text
/projects/
/writeups/
/about/
/terminal/
/contact/

/vi/projects/
/vi/writeups/
/vi/about/
/vi/terminal/
/vi/contact/
```

Preserve:

```text
/
/vi/
/operations/*
/vi/operations/*
/log/*
/vi/log/*
current homepage hashes
```

Rules:

- no Home redesign;
- no new header;
- no meteor/star field;
- no skill sphere;
- no external writeup ingestion;
- no route transitions;
- reuse existing components/data;
- keep Server Components for route composition;
- new routes static-exportable;
- dedicated routes must not accidentally load Three.js.

Suggested checkpoint after approval:

```text
feat: establish multipage portfolio architecture
```

R1 exit criteria:

```text
both build modes pass
new route pairs direct-load
old public URLs still work
locale switching understands new pages
static export includes new pages
no dependencies
Home visually remains the v1 baseline
```

---

## R2 — Global Multi-Page Navigation

**Model:** GPT-5.6 Sol  
**Reasoning:** ~70%

Implement desktop header and mobile route menu.
Preserve accessible dialog/focus behavior.

Checkpoint:

```text
feat: introduce multipage navigation
```

---

## R3 — Global Star Field + Seeded Meteor Engine

**Model:** GPT-6 Astra  
**Reasoning:** ~90%

Create reusable atmosphere layer, e.g.:

```text
AtmosphereLayer
├─ StarField
└─ MeteorSystem
```

Requirements:

- session-seeded PRNG;
- top-left → bottom-right;
- page-specific intensity;
- bounded concurrency;
- hidden-tab cleanup;
- mobile support;
- reduced-motion off;
- zero per-frame React state;
- no unbounded DOM nodes.

Checkpoint:

```text
feat: add seeded atmospheric meteor system
```

---

## R4 — Home Redesign + Skill Sphere

**Model:** GPT-6 Astra  
**Reasoning:** ~90–95%

Home becomes:

```text
Hero
About teaser
Featured Projects
Latest Writeups
Contact teaser
Footer
```

Upgrade Sphere with the 13 approved skill stars including Burp Suite.

Checkpoint:

```text
feat: redesign homepage and skill sphere
```

---

## R5 — Projects Index

**Model:** GPT-5.6 Sol  
**Reasoning:** ~70%

Build final editorial `/projects/` and `/vi/projects/` using canonical project data.

Checkpoint:

```text
feat: build projects index
```

---

## R6 — Verified CTF Writeup Pipeline

**Model:** GPT-6 Astra  
**Reasoning:** ~90%

Audit `hphuc032/ctf-writeups` and implement:

```text
explicit source manifest
source paths
slugs
event/category
publication state
pinned source ref
sync/build validation
safe referenced image handling
```

No browser-time GitHub fetch.
No auto-publish-all behavior.

Checkpoint:

```text
feat: establish verified writeup pipeline
```

---

## R7 — Writeups Index + Article Experience

**Model:** GPT-6 Astra  
**Reasoning:** ~80–85%

Build:

```text
/writeups/
/writeups/[slug]/
/vi/writeups/
/vi/writeups/[slug]/
```

Prioritize article readability.

Checkpoint:

```text
feat: publish markdown writeup experience
```

---

## R8 — About Page

**Model:** GPT-5.6 Sol  
**Reasoning:** ~70%

Finalize Identity + Expertise + Experience + Achievements + CV.

Add Burp Suite to canonical web-security tool data modestly.

Checkpoint:

```text
feat: compose about profile experience
```

---

## R9 — Terminal Dedicated Route

**Model:** GPT-5.6 Sol  
**Reasoning:** ~65%

Finalize `/terminal/` and `/vi/terminal/` and update predefined route targets where appropriate.

Checkpoint:

```text
feat: move terminal into dedicated route
```

---

## R10 — Contact Dedicated Route

**Model:** GPT-5.6 Sol  
**Reasoning:** ~60%

Finalize `/contact/` and `/vi/contact/`.

Checkpoint:

```text
feat: build dedicated contact experience
```

---

## R11 — Unified Motion / Water Wake / Route Transition Pass

**Model:** GPT-6 Astra  
**Reasoning:** ~90%

Unify:

```text
meteor
star field
water wake
route transitions
text reveals
custom cursor
3D interactions
```

Key rule: not every effect peaks simultaneously.

Checkpoint:

```text
feat: unify multipage motion language
```

---

## R12 — EN / VI Multipage Localization

**Model:** GPT-5.6 Sol  
**Reasoning:** ~70%

Review all route pairs.
Do not machine-translate CTF source articles.

Checkpoint:

```text
feat: complete multipage localization
```

---

## R13 — Responsive + Accessibility QA

**Model:** GPT-5.6 Sol  
**Reasoning:** ~75%

Required widths:

```text
375
430
768
1024
1440
1920
```

Also test:

```text
200% zoom
~320px reflow
keyboard
touch
reduced motion
no-JS content
```

Reduced motion:

```text
meteor OFF
wake OFF
sphere static
page transitions minimal
```

---

## R14 — Performance QA

**Model:** GPT-6 Astra  
**Reasoning:** ~85%

Key constraints:

- Three/R3F Home only;
- writeup articles extremely light;
- meteor near-zero idle cost;
- no touch pointer-wake work;
- no hidden-tab animation;
- bounded allocations;
- no homepage bundles leaking to content routes.

Compare against v1 baseline.

---

## R15 — GitHub Pages Static Export Validation

**Model:** GPT-5.6 Sol  
**Reasoning:** ~70%

Verify every v2 route generates static HTML.
Test direct refresh, 404, sitemap, robots, metadata, CV, EN/VI.
No runtime GitHub dependency.

---

## R16 — Production Rollout

**Model:** GPT-5.6 Sol  
**Reasoning:** ~60%

Flow:

```text
redesign/multipage-v2
  → full validation
  → human visual approval
  → merge main
  → GitHub Pages deploy
  → production verification
  → v2.0.0
```

No force-push production history.

---

# 37. Immediate task for the next agent

The next agent should start with **R1 only**.

Before coding:

```bash
git status
git branch --show-current
git log --oneline --decorate -n 12
```

Expected branch:

```text
redesign/multipage-v2
```

If local checkout is elsewhere:

```bash
git switch redesign/multipage-v2
```

Do not recreate the branch if it already exists.

Then audit at minimum:

```text
src/app/
src/components/pages/PortfolioPage.tsx
src/components/layout/GlobalInterface.tsx
src/components/layout/PageShell.tsx
src/i18n/global-ui.ts
src/app/sitemap.ts
src/lib/site-metadata.ts
src/proxy.ts
scripts/build.mjs
scripts/check-routes.mjs
scripts/check-localization.mjs
scripts/check-static-export.mjs
```

The R1 visual goal is intentionally boring:

```text
new route architecture works
while current Home still looks effectively unchanged
```

---

# 38. R1 expected route foundation

After R1:

```text
/
/vi/

/projects/
/vi/projects/

/writeups/
/vi/writeups/

/about/
/vi/about/

/terminal/
/vi/terminal/

/contact/
/vi/contact/
```

Existing routes remain valid:

```text
/operations/[slug]/
/vi/operations/[slug]/

/log/
/vi/log/

/log/[slug]/
/vi/log/[slug]/
```

---

# 39. R1 temporary composition guidance

## `/projects/`

May temporarily reuse existing Operations components/data.
Do not final-polish the page until R5.

## `/writeups/`

Route foundation only.

**Do not ingest `hphuc032/ctf-writeups` during R1.**

Render an honest route shell without invented article titles.

## `/about/`

Reuse:

```text
Identity
Expertise
Experience
Achievements
CV access
```

No copied factual datasets.

## `/terminal/`

Reuse current Terminal.
Temporary duplication between Home and dedicated page is acceptable until R4/R9.

## `/contact/`

Reuse canonical contact data.
Temporary duplication between Home and dedicated page is acceptable until R4/R10.

---

# 40. Files most likely to matter during v2

## Routing / composition

```text
src/app/(english)/
src/app/[locale]/
src/app/_shared/
src/components/pages/
src/components/layout/PageShell.tsx
```

## Navigation / localization

```text
src/components/layout/GlobalInterface.tsx
src/components/layout/LanguageSelector.tsx
src/i18n/global-ui.ts
src/i18n/locales.ts
```

## Metadata / deployment

```text
src/app/sitemap.ts
src/app/robots.ts
src/lib/site-metadata.ts
src/lib/deployment-path.ts
src/proxy.ts
next.config.mjs
scripts/build.mjs
```

## Canonical data

```text
src/data/profile.ts
src/data/expertise.ts
src/data/projects.ts
src/data/experience.ts
src/data/achievements.ts
src/data/contact.ts
src/data/security-log.ts
```

## Hero / WebGL

```text
src/components/home/Hero.tsx
src/components/webgl/NetworkCanvas.tsx
src/components/webgl/NetworkSphere.tsx
src/components/webgl/StaticNetwork.tsx
src/lib/network-topology.ts
```

## Motion / pointer

```text
src/components/home/ChapterMotion.tsx
src/components/home/PointerAtmosphere.tsx
src/components/layout/ContextCursor.tsx
src/lib/motion.ts
src/lib/water-wake.ts
```

## Styles

```text
src/styles/tokens.css
src/styles/globals.css
src/styles/shell.css
src/styles/hero.css
src/styles/operations.css
src/styles/security-log.css
src/styles/terminal.css
src/styles/contact.css
src/styles/creative-interaction.css
```

---

# 41. Validation baseline

Core commands already available:

```bash
npm run lint
npm run type-check
npm run build
npm run build:github-pages
npm run check:routes
npm run check:localization
npm run check:metadata
npm run check:contact
npm run check:static-export
```

Repository also has deeper scripts for:

```text
accessibility
achievements
creative interaction
experience
expertise
global UI
Hero / Hero fallbacks
Identity
motion
Operations
responsive
Security Log
Terminal
water wake
performance/lifecycle measurements
```

Important current limitation:

```text
Playwright is not a repository dependency.
```

Some browser scripts depend on the development/Codex environment supplying a Playwright runtime. Do not claim plain fresh-clone browser automation unless that changes.

---

# 42. Responsive validation matrix

Minimum widths:

```text
375
430
768
1024
1440
1920
```

Also preserve:

```text
200% zoom / text scaling
~320 CSS px reflow
touch
keyboard
reduced motion
no-JavaScript content availability
```

---

# 43. Visual priority by page

## Home

```text
Skill Sphere
> typography
> meteor atmosphere
> water wake
> star field
```

## Projects

```text
project content
> project interaction
> meteor
> water wake
> star field
```

## About

```text
portrait / factual content
> typography
> subtle atmosphere
> water wake
```

## Writeups

```text
reading
> typography
> extremely subtle atmosphere
```

## Terminal

```text
terminal usability
> meteor
> water wake
```

## Contact

```text
LET'S CONNECT.
> contact links
> meteor
> water wake
```

No effect may reduce comprehension.

---

# 44. Accessibility rules for new effects

Decorative star/meteor/wake layers:

```text
not focusable
not announced
not blocking pointer events
not reducing contrast
```

Skill stars are different because they expose meaningful skill names.
If hoverable, provide keyboard/focus equivalent.

Reduced motion final behavior:

```text
Meteor OFF
Water Wake OFF
Sphere static
3D/parallax OFF
Page transition minimal
Content immediately visible
```

---

# 45. Performance rules for v2 effects

## Star field

Prefer cheap static/CSS or bounded rendering.

## Meteor

- no React state per frame;
- no layout reads in the animation loop;
- bounded pool;
- hidden-tab stop;
- cleanup on route change;
- no runaway timers.

## Water wake

Preserve current bounded Canvas architecture.

## Skill Sphere

- Home only;
- no post-processing;
- no environment map unless proven necessary;
- no shadows;
- no uncontrolled geometry/material allocation;
- HTML/DOM labels projected from skill coordinates are preferable to expensive 3D text when practical.

---

# 46. Security / privacy rules

Never publish:

```text
private CV sources
private portrait originals
.env
tokens
credentials
local QA captures
unapproved challenge binaries
local filesystem paths
```

External writeup sync must never mirror binary challenge artifacts by default.

Terminal remains simulated.

Never add:

```text
eval
Function
child_process
shell execution
visitor-supplied code execution
```

---

# 47. Evidence / trust rules

Do not invent:

```text
project outcomes
vulnerability findings
metrics
dates
responsibilities
repository URLs
certification completion
competition advancement
skill percentages
```

Concise evidence-bound case studies are preferable to fabricated completeness.

---

# 48. DO NOT DO

Do not:

- implement R1–R16 in one pass;
- redesign directly on `main`;
- rename existing Operations URLs;
- remove the existing Security Log;
- auto-publish every Markdown file from `ctf-writeups`;
- fetch GitHub writeups in the visitor browser;
- copy all challenge binaries/assets into the portfolio;
- load Three.js on article/content pages;
- apply strong wake over long-form text;
- display all 13 Sphere skill labels simultaneously;
- spam meteors continuously;
- add Matrix rain, CRT, binary rain, HUD or glitch spam;
- add sound;
- add light mode;
- add a contact backend/form;
- add fake evidence;
- add dependencies just for convenience.

---

# 49. Required agent report after each phase

At the end of each R-phase report:

```text
Git State
Scope Completed
Architecture Changes
Files Created
Files Modified
Dependencies Added
Routes Added/Changed
EN/VI Status
Static Export Status
Normal Build Status
Responsive Smoke
Accessibility Smoke
Performance Impact
Existing URL Regression
Known Issues
Deferred Work
Suggested Commit
Next Phase Entry Point
```

Then **STOP for human review**.

---

# 50. Suggested commit messages

```text
R1  feat: establish multipage portfolio architecture
R2  feat: introduce multipage navigation
R3  feat: add seeded atmospheric meteor system
R4  feat: redesign homepage and skill sphere
R5  feat: build projects index
R6  feat: establish verified writeup pipeline
R7  feat: publish markdown writeup experience
R8  feat: compose about profile experience
R9  feat: move terminal into dedicated route
R10 feat: build dedicated contact experience
R11 feat: unify multipage motion language
R12 feat: complete multipage localization
R13 fix: complete v2 responsive and accessibility QA
R14 perf: complete v2 performance QA
R15 ci: validate v2 GitHub Pages deployment
```

Do not commit a phase before review if the user asked for review-first workflow.

---

# 51. Definition of Done for v2

v2 is merge-ready only when all are true:

- Home is substantially shorter.
- Dedicated Projects, Writeups, About, Terminal and Contact routes exist.
- Existing Operations case studies remain intact.
- Existing Security Log remains intact.
- CTF Writeups come from an explicit reviewed pipeline.
- No runtime GitHub fetch is required.
- New desktop/mobile navigation is clear and accessible.
- Star field remains subtle.
- Meteors are atmospheric, session-seeded and performant.
- Mobile meteors work without scroll degradation.
- Water wake works across pages with page-specific intensity.
- Sphere remains Home-only.
- Skill Sphere contains the 13 approved stars, including Burp Suite.
- Skill-star interaction has keyboard/focus parity.
- EN/VI route parity is correct.
- GitHub Pages export generates every published route.
- Direct refresh works.
- Unknown routes remain real 404s.
- CV remains valid and unchanged.
- No private source data leaks.
- Reduced motion disables strong motion correctly.
- Responsive QA passes 375–1920.
- Accessibility does not regress from v1.
- Performance remains acceptable.
- Human visual approval is complete.

---

# 52. First response expected from a new agent

A new agent receiving this file should **not immediately implement the whole roadmap**.

First report:

```text
1. Current branch / HEAD
2. Working tree status
3. Current route tree
4. Current Home composition
5. Current locale architecture
6. Current static-export architecture
7. R1 implementation plan
8. Files likely to change
9. Risks
```

Then implement **R1 only**.

---

# 53. Final v2 product vision

```text
HOME
│
├─ cinematic Hero
│  └─ rotating skill sphere
│
├─ short About teaser
├─ featured Projects
├─ latest real Writeups
└─ Contact teaser

        ↓ choose a route

PROJECTS
→ security case studies

WRITEUPS
→ real CTF challenge writeups

ABOUT
→ person + expertise + experience + achievements + CV

TERMINAL
→ interactive portfolio command interface

CONTACT
→ email + GitHub + LinkedIn + CV
```

Across the site:

```text
subtle stars
+
occasional seeded meteors
+
directional water wake
+
editorial typography
+
restrained page transitions
```

The result should feel like:

```text
a serious cybersecurity portfolio
with a memorable atmospheric interaction system
```

not:

```text
a hacker template
a gaming HUD
or a space-themed demo
```

---

## END OF HANDOFF

**Current next implementation phase: R1 — Multi‑Page Architecture & Route Foundation.**

Do not begin R2 until R1 is reviewed and approved.

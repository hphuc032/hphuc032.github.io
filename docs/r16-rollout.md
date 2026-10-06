# R16 — Final production rollout

## Release status

**RELEASED WITH NON-BLOCKING LIMITATIONS**

The application release was completed by production PR #16 and its main-push GitHub Pages deployment. This closeout independently verified the live release on **2026-10-06** and records it; it is not another deployment, redesign phase or R17. No release-blocking issue was found.

## Release identifiers

| Identifier | Verified value |
| --- | --- |
| Previous production main | `73d6c14d14bbfc5832ef363b5a8a09d61c44bba6` |
| Release candidate / integration | `64ee67cd07f428fa15b2fd0608182c27ae5ca245` |
| Production merge / current main at verification | `83a84af30855575007e26265e362e41c9fbdc835` |
| Production PR | [#16 — R16: release carwyn.sec multipage redesign](https://github.com/hphuc032/hphuc032.github.io/pull/16) |
| Production URL | <https://hphuc032.github.io/> |
| Release merge time | 2026-10-06 02:45:07 UTC / 09:45:07 Asia/Saigon |
| Deployment completion | 2026-10-06 02:46:19 UTC / 09:46:19 Asia/Saigon |
| Closeout branch | `docs/r16-closeout`, based on the production merge above |

Live PR metadata confirms merged=true, base=`main`, head=`redesign/multipage-v2`, head SHA equal to the release candidate and merge SHA equal to current main. Local fetch, main switch and ff-only pull completed from a clean worktree. `git rev-list --left-right --count origin/main...origin/redesign/multipage-v2` returned **1 / 0**; tree diff is empty. Integration contains no unreleased application changes; main is ahead only by its production merge commit.

Existing tags are `v1.0.0` and `v1.0.0-pre-redesign`; no explicit v2 release-tag convention was found. **No release tag created during closeout.**

## CI validation

[Validate carwyn.sec PR — run 37405475034](https://github.com/hphuc032/hphuc032.github.io/actions/runs/37405475034): **completed / success**, event `pull_request`, head `64ee67cd07f428fa15b2fd0608182c27ae5ca245`. Verified live with GitHub run metadata and job results.

| Job | Result | Important successful steps |
| --- | --- | --- |
| Source and normal Next.js | completed / success | Install dependencies; Lint and type-check; Validate atmosphere model; Validate local writeups and safe Markdown renderer; Build normal Next.js; Validate normal routes |
| GitHub Pages static export | completed / success | Install dependencies; Build static export; Validate static routes, assets and SEO |

These are actual remote run results, distinct from historical local R15 evidence. The earlier R15 remote-CI hold has been satisfied by the released PR/deployment.

## GitHub Pages deployment

[Deploy carwyn.sec — run 37405659200](https://github.com/hphuc032/hphuc032.github.io/actions/runs/37405659200): **completed / success**, event `push`, head `83a84af30855575007e26265e362e41c9fbdc835`.

| Job | Result | Important successful steps |
| --- | --- | --- |
| build | completed / success | Install dependencies; Validate source; Build static export; Validate static export; Upload Pages artifact |
| deploy | completed / success | Deploy to GitHub Pages |

Workflow source remains `.github/workflows/deploy-pages.yml`. No dispatch, workflow change, deployment architecture change or production code modification was performed during closeout.

## Production route verification

The inventory was imported from the canonical `publishedRoutes` in `scripts/test-fixtures.mjs`, which consumes the publication selector. Actual count: **22**, with 11 EN routes and their 11 VI counterparts. Sequential direct production HTTP requests returned **200 for all 22**:

- `/` and `/vi/`.
- `/projects/`, `/writeups/`, `/about/`, `/terminal/`, `/contact/`, plus all `/vi/` equivalents.
- `/operations/secure-api-gateway/`, `/operations/vulnerability-assessment/`, `/operations/network-traffic-analysis/`, plus all `/vi/operations/` equivalents.
- `/log/` and `/log/analyzing-http-and-https-traffic-with-wireshark/`, plus both VI equivalents.

EN is unprefixed; VI is under `/vi`. No public `/en` alias or unexpected draft/review route appears in the fixture or sitemap.

Browser direct navigation followed by reload succeeded for:

- `/operations/secure-api-gateway/`.
- `/vi/operations/network-traffic-analysis/`.
- `/log/analyzing-http-and-https-traffic-with-wireshark/`.
- `/vi/terminal/`.

These routes load independently; they do not require SPA-only navigation.

Actual **404** responses: `/r16-closeout-not-real/`, `/vi/r16-closeout-not-real/`, `/en/`, and both review candidates' canonical EN/VI article URLs (four checks). Review slugs/content are intentionally omitted here. Total negative checks: **7**, all 404.

## Production metadata

All 22 production HTML responses were checked for canonical, alternate links and `html lang`:

- Canonicals exactly match `https://hphuc032.github.io` plus each canonical route.
- EN pages have `lang=en`; VI pages have `lang=vi`.
- Each page exposes EN, VI and x-default alternates on the production origin.
- No localhost, preview origin or `/en` alias in the checked canonical metadata.
- `/sitemap.xml`: 200, `application/xml`, **22 loc entries** on the production origin, no `/en` alias.
- `/robots.txt`: 200, `text/plain; charset=utf-8`, references the production origin/sitemap.

No metadata, localization or SEO file was changed.

## Assets and CV

Representative production assets returned 200 with the expected MIME:

| Asset | Result |
| --- | --- |
| CSS `/_next/static/chunks/2p4u41hibccko.css` | 200, text/css, 84,857 bytes |
| JS `/_next/static/chunks/19mx3mg6lkumu.js` | 200, application/javascript, 28,907 bytes |
| CSS-referenced WOFF2 `53e45098eac42afb-s.1uklb5el4zgvl.woff2` | 200, font/woff2, 4,720 bytes |
| Declared favicon `/favicon.svg` | 200, image/svg+xml, 237 bytes |
| Portrait `/images/identity/nguyen-hoang-phuc.webp` | 200, image/webp, 103,178 bytes; browser lazy-load completed, natural width 1800 |
| CV `/cv/nguyen-hoang-phuc-cv.pdf` | 200, application/pdf, 4,604 bytes |

CSS, JS and CV sample responses reported `Cache-Control: max-age=600`. This is a sample, not a full CDN/cache/compression audit. An initial conventional `/favicon.ico` probe returned 404; production HTML actually declares `/favicon.svg`, which passed. This is not a broken declared asset.

Production CV bytes and `public/cv/nguyen-hoang-phuc-cv.pdf` independently hashed to:

```text
f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9
```

The CV and all public assets remain unchanged.

## Publication safety

The current `src/data/writeup-publication.ts` selector reports **0 published CTF writeups** and **2 review candidates**; `src/data/writeup-public-routes.json` is empty. All four candidate EN/VI production article URLs return 404. No hidden source/content is reproduced in this report.

The production Writeups page renders the published-empty state and a separate link to Security Log. Security Log index/article remain public in both languages. No publication state or project claim changed.

## Feature smoke

| Surface | Actual closeout observation |
| --- | --- |
| Home | Hero and content visible at mobile and desktop; no blank page |
| Sphere/fallback | Live DOM reached `data-network-mode=webgl` with one sphere canvas; 13 accessible skill nodes/list entries remain. Direct server HTML contains Hero, main content and semantic skills independently of WebGL. Initial static and enhanced states both rendered. GPU hardware/driver was not identified; no hardware-GPU coverage claim |
| Projects | Three public case-study links render and match the released routes |
| About | Identity, expertise, experience, achievements and CV sections render; portrait loads with descriptive alt |
| Terminal | Prompt `carwyn@sec:~$`; help, whoami, skills, projects, experience, achievements, logs and contact produce local predefined responses; clear resets history. `$(id)` produces literal command-not-found text and remains inert. No real shell command/exploit performed |
| Contact | Exact Email/GitHub/LinkedIn/CV links below; DOM contains zero forms |
| Security Log | Direct index/article HTTP checks and article browser reload pass; separate from unpublished CTF archive |

Verified Contact destinations:

- `mailto:nhpntd@gmail.com`.
- `https://github.com/hphuc032`.
- `https://www.linkedin.com/in/nguyen-phuc-71217332a/`.
- `/cv/nguyen-hoang-phuc-cv.pdf`.

## Production network / console observations

Read-only production checks used the Codex in-app Chromium browser and sequential HTTP GETs. All fixture routes and declared sampled assets passed; invalid/review paths produced the intended 404s. Browser captured warn/error logs were empty at the checked Home, Terminal, deep-route and Contact observations. This does not claim exhaustive request interception, long-session cleanliness, every asset, or field performance.

The Node fixture import emitted its existing module-type warning in the local checker; no package.json change was made to silence it. No runtime regression suite was rerun solely for this documentation change; live production evidence and the already successful remote release jobs are recorded separately.

## Accessibility / responsive smoke

Browser viewport smoke at **375×812** and **1440×900**: visible Hero/navigation, no measured horizontal document overflow. Mobile menu opened and showed all six destinations and locale links. Escape closed it and returned focus to Menu; Tab on a sphere skill node advanced to the next node. Terminal commands were submitted by keyboard. Semantic skill list and portrait alt were observed.

This is a targeted smoke, not a rerun of R13 accessibility/responsive matrices or a screen-reader certification. Temporary viewport overrides were reset.

## Known non-blocking limitations

- GPU renderer/hardware identification and dedicated hardware-GPU validation were not performed. This browser displayed the WebGL enhancement, but that alone does not prove hardware acceleration.
- Native Firefox/Safari and physical iOS/Android were not tested during closeout.
- NVDA/VoiceOver, physical touch/keyboard behavior and high-contrast assistive setups were not tested.
- Forced context-loss/blocked-module/no-JS browser scenarios were not repeated on production; server HTML fallback availability and normal static-to-enhanced rendering were checked. Historical R15 fallback tests remain historical evidence, not new passes.
- Long-session/background scheduling, exhaustive CDN/cache/compression behavior and field Core Web Vitals are outside this lightweight closeout. Lab results are not field measurements.

None of these produced a discovered functional blocker. Do not reinterpret historical software-GPU warning failures as new passing tests; closeout only reports observations actually made.

## Rollback strategy

Previous production reference: `73d6c14d14bbfc5832ef363b5a8a09d61c44bba6`.
Production rollout merge: `83a84af30855575007e26265e362e41c9fbdc835`.

If rollback is required, use a reviewed branch/PR and revert the R16 merge through normal Git history, then let the normal main-push Pages deployment run. Example concept only:

```sh
git revert -m 1 83a84af30855575007e26265e362e41c9fbdc835
```

Do not force-push main, reset public history or delete release history. No rollback was executed. Recheck intervening main changes before applying this concept later.

## Documentation verification and final roadmap status

Verified closeout diff: **only `docs/r16-rollout.md`**. No src, dependency, Next config, workflow, asset, route, localization or publication-manifest change. `git diff --check` and `git diff --cached --check` passed; staged diff and status confirm this is the only changed file before commit. The documentation PR targets main for human review; it is not the production deployment and is not automatically merged.

**R1–R16 redesign roadmap is closed.**

**No R17 is required for this release.**

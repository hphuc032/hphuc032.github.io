# R12 — EN / VI localization and parity

## Baseline and scope

- Integration base: `02370c55e9107dd17d1f0d01051c267ab7a0234c` on `redesign/multipage-v2`, including merged R11 PR #11.
- Delivery branch: `feat/r12-localization`. No change to `main`, no merge, no release.
- Locale/copy corrections only. No responsive CSS, accessibility architecture, motion, Sphere, wake, performance or publication changes.
- English remains unprefixed; Vietnamese uses `/vi`. The current catalog has 22 public routes, unchanged. Two CTF sources remain `review`; zero CTF article routes are published.

## Terminology decisions

| Concept | Vietnamese policy |
| --- | --- |
| Global navigation: Home / Projects / Writeups / About / Terminal / Contact | Existing English brand/navigation labels retained in both header and menu; page explanations and accessibility UI remain localized. |
| About / Identity | Giới thiệu, with Hồ sơ used for profile access rather than literal “danh tính” in the About description. |
| Expertise | Chuyên môn for the existing section label; năng lực for descriptive metadata. Network Security consistently uses An ninh mạng. |
| Traffic Analysis | Phân tích lưu lượng. |
| Authentication / Authorization | Xác thực / Phân quyền. |
| User Acceptance Testing | Kiểm thử nghiệm thu người dùng (UAT). |
| Experience / Achievements | Kinh nghiệm / Thành tựu. |
| Security Log / Field notes | Security Log retained as archive identity; Ghi chép kỹ thuật for explanatory text. |
| CTF writeups | Bài giải CTF in prose; Writeups retained as route/navigation identity. |
| Core Team / Top 4 | Approved identities retained verbatim. |
| Qualifying Round Participant | Tham dự vòng sơ khảo; never finalist or final-round qualification. |
| CEH — In progress | CEH — Đang học; never completed certification. |
| VIEW CV / new tab | XEM CV / mở trong thẻ mới. The PDF remains English. |

`carwyn.sec`, `Nguyen Hoang Phuc`, `UNDERSTAND SYSTEMS. DEFEND THEM.`, `LET'S CONNECT.`, proper organization names, product names, protocol identifiers and command tokens remain unchanged. Vietnamese typography does not need identical English line breaks. No factual scope, achievement, role, date, proficiency level or outcome was expanded.

## Page-by-page review and changes

| Area | Decision / correction |
| --- | --- |
| Global UI / Initialization | Existing localized controls, labels and status retained. Brand navigation intentionally remains English. Initialization must not replay on locale navigation. |
| Home | Vietnamese Sphere instruction now says “CHỌN MỘT ĐIỂM” instead of mixed-language “FOCUS VÀO ĐIỂM”. The thirteen skill identities and behavior are unchanged. |
| Projects | Network category normalized to An ninh mạng. Vietnamese API summary now explicitly includes the existing English controlled-environment qualification. Exactly three published projects remain. |
| Case studies | Back link uses the canonical localized Projects path directly. All existing slugs, concise verified content and omitted technical sections remain unchanged. |
| Writeups | Natural Vietnamese empty state: “Chưa có bài giải CTF nào được xuất bản.” Archive and source language policy remain unchanged; no content was published or ingested. |
| About / Expertise | Network discipline terminology normalized. Existing bio, Memory Flower neutral label, role facts and four achievement statuses preserved. |
| Experience | UAT description uses standard Vietnamese “nghiệm thu người dùng”; responsibilities, title and dates are unchanged. |
| Terminal | Mode label uses “Các lệnh cục bộ”. Shared parser, commands, output data, history, focus and route actions are unchanged. |
| Contact / Footer / CV | Existing localization, approved destinations and intentional English closing statement retained. PDF bytes unchanged. |
| Security Log index | “Ghi chép kỹ thuật” replaces literal “ghi chép hiện trường”. Home backlink targets actual `#latest-writing`, avoiding the legacy `#log` redirect loop. |
| Security Log article | Explicit body `lang` equals its reviewed locale. Neither MDX file was edited. Plain HTTP visibility versus encrypted TLS Application Data limitations are preserved. |
| 404 | Existing localized title, heading and recovery links verified. Its standalone metadata now references the existing public favicon, avoiding Chromium's implicit request for an absent `/favicon.ico`. No copy, recovery, layout, fallback route or redirect hack changed. |

## Locale navigation policy

`src/i18n/locale-navigation.ts` centralizes fragment policy and the existing legacy Home map. Publication/equivalent-route ownership remains in the existing catalogs and `localizedPath`.

- Switch to the published equivalent route, not Home by default. Unknown or unpublished equivalents stay unavailable.
- Keep a fragment only if the current page actually contains its decoded target ID. Stable IDs are shared by the paired locales. Malformed or foreign fragments are discarded.
- Query parameters have no approved content/navigation meaning here and are not carried between locales.
- Legacy Home bookmarks resolve to existing dedicated pages: `#profile` / `#identity` → About identity; expertise/experience/achievements → corresponding About sections; operations → Projects; log → Security Log; terminal/contact → their dedicated sections.
- `#profile` compatibility is explicitly covered. Property names such as `#constructor` cannot resolve through the mapping prototype.
- Normal Next.js mode retains client navigation; GitHub Pages retains real document navigation. Modified clicks and no-JS real route links are preserved.
- Current language remains text plus `aria-current`; unavailable translations use the existing disabled representation. No ARIA/focus architecture was redesigned.

## Metadata and publication boundaries

Only Vietnamese Writeups/About descriptions were polished. Metadata titles, canonical origin, stable slugs, robots policy and generation architecture remain unchanged. Production checks use `https://hphuc032.github.io`.

Every current public route has paired EN/VI and x-default alternates. Sitemap remains exactly 22 published entries. Static export omits `/en`; server-capable mode retains its existing 308 compatibility redirect to unprefixed English.

Security Log has reviewed EN and VI MDX. CTF article body language continues to derive from its source record (`en`, `vi`, or mixed `mul`), independently of the localized surrounding shell. No automatic article translation, source Markdown edit, publication-state change or English fallback was introduced. Both review CTF entries still return 404 in both locales.

## Validation

Tooling: existing Node 24/npm scripts and host-provided Playwright with headless Microsoft Edge/Chromium. No new dependency. Native screen readers, Safari and Firefox were not tested.

The localization suite now exercises the actual pure locale helper, all 22 public routes, both switch directions, active navigation, document language, title/description/OG, canonical/alternates when configured, Back/Forward, current Home fragments, legacy destinations, deliberate 404s, source-language markers, publication filtering, query/hash policy, Terminal tokens, TLS limitations and no-JS content. Expected document-only 404 console messages are narrowly excluded; broken assets, runtime errors and hydration warnings remain failures. URL comparison normalizes browser serialization of the root slash without relaxing origin/path checks.

| Check | Result |
| --- | --- |
| `npm run lint`, `npm run type-check` | PASS |
| `npm run build` | PASS; normal server-capable mode, safe local config and explicit production-origin config |
| `npm run build:github-pages` | PASS |
| `npm run check:routes` | PASS; safe local normal production server |
| `npm run check:localization` | PASS; final normal production server and final static build, including standalone 404 favicon validation. |
| `npm run check:metadata` | PASS; normal production-origin and static build |
| `npm run check:static-export` | PASS; 22 routes, dedicated bundle isolation, CV, SEO and real 404 |
| Home / Projects / Writeups UI / About / Terminal / Contact / Security Log browser suites | PASS; normal production server |
| Atmosphere model | PASS |
| Global UI browser suite | PASS; normal production server and static build, using `--production` and static mode where appropriate |
| R11 `check-motion.mjs` | PASS; static build, 22 routes, repeated navigation, RAF/listener bounds, locale/hash behavior, six widths, touch, hidden/reduced-motion and no-JS |
| `check:writeups`, `test:writeups`, `check:writeups-export` | PASS; 17 unit tests, both review entries unavailable, no export leak |

The feature suites cover EN/VI with the six requested viewport widths (and their existing additional reflow sizes), keyboard, touch, reduced motion and no-JS checks. Representative desktop/mobile Vietnamese images were also inspected visually. No CSS correction was necessary.

The first extended static run exposed the missing standalone 404 favicon rather than a language failure. It was fixed in metadata, not suppressed in the console assertion. The only excluded console messages are document responses for deliberately tested unknown routes, whose status, localized title/language and valid favicon are explicitly asserted. The canonical/OG comparison also normalizes equivalent root-URL slash serialization. These test setup corrections did not relax route/content gates.

Public and exported CV SHA-256: `f1fa8676c5fc2f0e6d676529fe97100eaaa133021b589e80c7e940bdde1f77c9`. Source article files, publication states, public assets, styles and effects have no diff.

Raw logs, measurement JSON and screenshots stay ignored under `test-results/`, not public assets. Existing non-fatal Node module-type warnings and normal-build Turbopack filesystem-tracing warnings are unchanged and outside this locale phase.

## Shared-file changes and R13 handoff

- `LanguageSelector` and `HomeHashCompatibility`: shared locale/legacy fragment policy only; no focus, motion, menu, CSS or structural changes.
- Dedicated metadata factory: two Vietnamese description strings only.
- Standalone global 404 metadata: existing favicon reference only, necessary to finish clean-console EN/VI unknown-route checks; no R13 accessibility or recovery changes.
- Case-study / Log rendering: canonical backlinks and explicit article language, plus one Vietnamese heading correction.
- Localization suite: extended parity checks. Writeups UI suite: exact assertion updated to its corrected Vietnamese empty-state wording; no weaker gate/assertion.
- Global UI suite: the locale-switch assertion now requires discarded `?review=global`, matching the explicit R12 query policy; hash, initialization and navigation assertions are retained.
- Canonical public content catalogs: narrow Vietnamese terminology/parity corrections only.
- No `globals.css`, responsive/accessibility suite, motion controller, atmosphere/wake renderer, Sphere, pipeline manifest, source MDX, CV or public asset edit.

R13 should preserve the route/fragment policy and publication gates when reviewing focus and reflow. Longer Vietnamese names should wrap naturally, not shrink to imitate English. Existing feature suites already cover the requested 375/430/768/1024/1440/1920 widths and additional reflow sizes. Broader native screen-reader/browser/device testing remains an R13/R14 responsibility. No unresolved substantive-copy approval question was identified.

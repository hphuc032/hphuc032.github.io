# Phase 12 — Experience

## Git checkpoint

`3afa4f1` — `feat: build carwyn.sec selected operations`. The checkpoint contains
only the approved Phase 11 Operations, case-study, data, route, documentation and
validation work. The two unrelated root PNGs remain untracked and excluded.

## Experience records published

| Organization | Role / label | Dates | Confirmed responsibilities | Withheld |
| --- | --- | --- | --- | --- |
| Not published | UAT Tester - Web & Mobile Applications | August 2026 - Present (month precision) | UAT for web/mobile; scenarios from business requirements; defect reporting/tracking; regression testing and fix verification | Employer, employment type, product/tool names, outcomes and metrics |
| Memory Flower | Flower Arrangement (neutral work label) | Not published | Flower-arrangement work in Phu Nhuan | Formal title, dates, employment type, detailed responsibilities, tools and outcomes |

The source evidence and confirmed/partial/missing classification are recorded in
`experience-evidence-audit.md`. The fifth confirmed UAT responsibility was omitted
only to keep the public entry concise. AWS community work, education, events and
student projects are intentionally absent from Experience.

## Composition

05 / EXPERIENCE uses a cool, desaturated paper field after the near-black
Operations section. It lowers visual intensity through whitespace, calmer type
and two open records separated by neutral rules. Desktop distributes chronology,
primary role/organization and factual detail across the editorial grid. At tablet
widths, detail moves below the primary field while the date rail stays distinct.
Mobile places index/date first, followed by the work identity and readable detail.

The UAT role is the visual anchor because its organization is unavailable. Memory
Flower is the anchor for the craft record, with Flower Arrangement beneath it as
the explicitly allowed neutral label. Memory Flower is not visually hidden or
given cybersecurity language, floral graphics or unsupported transferable claims.
The undated record follows the confirmed current record but displays no placeholder
date, preserving the boundary between chronology and missing evidence.

## Architecture and localization

`src/data/experience.ts` is the sole factual source and conforms to the existing
Experience model. The model now supports optional organization because hiding a
missing employer is safer than inserting a placeholder. Dates retain explicit
year/month/day precision through DateRange; the renderer formats August 2026 /
Tháng 8/2026 directly and never adds day precision.

One server component renders both locales. Proper names remain unchanged;
Phu Nhuan receives the Vietnamese display spelling Phú Nhuận. Role descriptions,
responsibilities, UI labels and current-date text are localized without stronger
Vietnamese claims. Missing values produce no empty metadata fields.

The stable #experience destination is discovered by the existing observer. Index
navigation focuses it, navigation status uses 04 / EXPERIENCE (or KINH NGHIỆM),
and the section label uses editorial number 05. Locale switches preserve the hash
without reloading. The global future-section fixture advances to Achievements.

## Accessibility and performance

The section is a semantic section with an h2, ordered work chronology, h3 anchors,
machine-readable start time and a labeled responsibilities list. All content is
visible without hover or JavaScript. No links, fake controls, cursor states,
animation timelines, images, WebGL or client component are added. Native section
focus remains visible after Index navigation. Reduced motion receives identical
static content.

`experience.css` is the only Phase 12 presentation payload. No dependency was
added. The source PDFs, portrait files and CV directory remain private and
unchanged. Screenshots and the rendered evidence-review page remain under ignored
`test-results/experience/`.

## Validation and review

`check-experience.mjs` checks EN/VI at 375, 430, 768, 1024, 1440 and 1920;
record count, line fit, visibility, exact responsibility count, missing Memory
Flower date/title claims, keyboard navigation, focus, active status, locale/hash
switching, reduced motion, touch, no-JS content, console/hydration and CLS.

Existing Hero, Identity, Expertise, Operations, global UI and route checks are
rerun in production after the final build. Implementation diffs are checked against
checkpoint 3afa4f1 so earlier section and case-study files stay unchanged.

The EN and VI Experience views were reviewed locally before the Phase 12
checkpoint.

## Phase 13 entry point

After explicit approval, reconcile Community, Competition, Recognition and
Certification evidence before building Achievements. Keep CEH as In Progress and
do not convert AWS community participation into employment retroactively.

# Maintenance Guide

This guide covers the routine content and release work for `carwyn.sec`. Public
content should remain factual, localized, and traceable to reviewed evidence.

## Projects and case studies

1. Review evidence before writing public claims.
2. Add or update the typed project record in `src/data/projects.ts`.
3. Keep factual identifiers and technologies shared; add concise English and
   Vietnamese prose at the same level of specificity.
4. Use the publication state to keep incomplete records out of public selectors,
   routes, metadata, and the sitemap.
5. Run route, localization, normal-build, and static-export validation.

Do not invent dates, outcomes, vulnerabilities, responsibilities, metrics, or
repository links to complete a case study. A concise published record is safer
than an unsupported claim.

## Security Log entries

1. Add the typed metadata record to the Security Log catalog.
2. Create the real slug directory under `src/content/security-log/`.
3. Add reviewed `en.mdx` and `vi.mdx` files.
4. Register both files explicitly in the trusted server-side MDX registry.
5. Publish only after metadata, localized prose, privacy review, and route checks
   are complete.

Unknown and unpublished slugs must remain unavailable. The site has no CMS and
does not import a filesystem path constructed from route input.

## Localization

English is unprefixed and Vietnamese uses `/vi`. Keep technology, brand, and
proper names unchanged where intended. Vietnamese text must preserve the same
factual boundaries as English. Run `npm run check:localization` after changing
localized content or navigation.

## Public CV

- Replace only the reviewed public-safe file at
  `public/cv/nguyen-hoang-phuc-cv.pdf`.
- Preserve the stable public filename unless a deliberate migration is planned.
- Check the document for unintended personal information before publication.
- Confirm the PDF opens and record its SHA-256.
- Keep the `*.pdf binary` Git attribute so line-ending normalization cannot
  damage PDF offsets.
- Run the normal build, static export, and deployed-URL verification.

Private source documents must remain outside Git.

## Validation

Run the core checks before release:

```bash
npm run lint
npm run type-check
npm run build
```

Start the production build in one terminal:

```bash
npm run start
```

Then run the server-mode checks in another terminal:

```bash
npm run check:routes -- http://127.0.0.1:3000 --production
npm run check:localization -- http://127.0.0.1:3000
```

Finally, validate the GitHub Pages artifact:

```bash
npm run build:github-pages
npm run check:static-export
```

Browser-based scripts under `scripts/` cover responsive behavior,
accessibility, Terminal, Security Log, motion, creative interaction, and feature
fallbacks. Some use the Codex-provided Playwright runtime and therefore are not
guaranteed to run in a plain fresh clone without that runtime.

## Deployment and rollback

Pushing `main` triggers the GitHub Pages workflow. It validates, builds, uploads
the generated `out/` artifact, and deploys it; `out/` is never committed.

For a normal rollback, revert the problematic commit and push the revert:

```bash
git revert <bad-commit>
git push origin main
```

GitHub Actions will build and deploy the reverted state. Avoid force-pushing the
production branch as a routine rollback method.

## Repository hygiene

Keep private source assets, generated output, local screenshots, test results,
environment files, and secrets out of Git. Public derivatives belong under
`public/` only after review.

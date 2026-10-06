import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderArticleContent, renderMarkdown } from '../../src/lib/writeups/render-markdown.ts';

export const fixturePolicy = { sourcePath: 'Fixture/README.md', approvedImages: [], internalPaths: ['/', '/writeups/', '/vi/writeups/', '/log/', '/vi/log/'] };
export const fixtureMarkdown = `# Safe technical fixture

A paragraph with **strong text**, *emphasis*, and \`inline code\`.

## Analysis

- list item
- another item

> A technical observation.

\`\`\`sh
nmap -sV example
${'long_literal_payload_'.repeat(35)}
\`\`\`

| A | B | ${'Long header '.repeat(8)} |
| --- | --- | --- |
| 1 | 2 | ${'Long unbroken table cell '.repeat(12)} |

[Security Log](/log/)

---

\`\`\`html
<script>alert(1)</script>
\`\`\`

CTF{fixture_only}
`;

export function fixtureArticle(language = 'en') {
  return renderToStaticMarkup(renderArticleContent({
    publication: { title: 'Safe technical article fixture with a title that wraps', event: 'Test fixture', category: 'web', language },
    body: renderMarkdown(fixtureMarkdown, fixturePolicy),
    backLink: createElement('a', { href: '/writeups/' }, 'Back to Writeups'),
    footer: createElement('a', { href: '/log/' }, 'Security Log'),
  }));
}

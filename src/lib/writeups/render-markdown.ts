import { createElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownImage { sourcePath: string; publicUrl: string }
export interface MarkdownPolicy {
  sourcePath: string;
  approvedImages: readonly MarkdownImage[];
  internalPaths: readonly string[];
}
type MarkdownNode = { type: string; url?: string; alt?: string | null; depth?: number; children?: MarkdownNode[] };

function decodedUrl(url: string) {
  let decoded = url;
  for (let i = 0; i < 3; i++) {
    const next = decodeURIComponent(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  if (/[\u0000-\u0020\u007f\\]/.test(decoded)) throw new Error("Unsafe URL characters");
  return decoded;
}

/** Unknown relative files are inert text; only explicitly supported site paths link. */
export function safeLink(url: string, internalPaths: readonly string[]): string | undefined {
  const decoded = decodedUrl(url);
  if (/^(?:javascript|vbscript|data|file):/i.test(decoded) || decoded.startsWith("//")) throw new Error("Blocked link protocol");
  if (decoded.startsWith("#")) return url;
  if (/^https?:\/\//i.test(decoded)) {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Unsafe external URL");
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith(".localhost") || /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[(?:::|f[cd]|fe[89ab])|0\.)/.test(host)) throw new Error("Local/private network link");
    return url;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) throw new Error("Unsupported link protocol");
  const path = decoded.split(/[?#]/)[0]!;
  if (path.split("/").some(part => part === "." || part === "..")) throw new Error("Link path traversal");
  if (decoded.startsWith("/")) {
    if (!internalPaths.includes(path)) throw new Error("Unapproved internal link");
    return url;
  }
  return undefined;
}

export function safeImage(url: string, alt: string | null | undefined, policy: MarkdownPolicy): string {
  const decoded = decodedUrl(url);
  if (!decoded || decoded.startsWith("/") || /[:?#%]/.test(decoded)
    || decoded.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Remote/escaping image is forbidden");
  if (typeof alt !== "string") throw new Error("Image needs reviewed source alt or explicit empty decorative alt");
  const directory = policy.sourcePath.split("/").slice(0, -1).join("/");
  const sourcePath = directory ? `${directory}/${decoded}` : decoded;
  const approved = policy.approvedImages.find(image => image.sourcePath === sourcePath);
  if (!approved || !/^\/generated\/writeups\/[a-z0-9]+(?:-[a-z0-9]+)*\//.test(approved.publicUrl)) throw new Error("Unapproved image");
  if (/[\\%?#:\u0000-\u0020]/.test(approved.publicUrl) || approved.publicUrl.split("/").some(part => part === "." || part === "..") || !/\.(?:png|jpe?g|webp)$/i.test(approved.publicUrl)) throw new Error("Unsafe approved image URL");
  return approved.publicUrl;
}

// Runs on parsed Markdown BEFORE ReactMarkdown's URL transform. Entities and
// reference/autolinks have already been decoded/resolved by the parser.
function policyPlugin(policy: MarkdownPolicy) {
  return () => (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (node.type === "link" && node.url !== undefined) {
        const href = safeLink(node.url, policy.internalPaths);
        if (href === undefined) node.url = ""; // rendered as non-clickable inline text
      }
      if (node.type === "image" && node.url !== undefined) safeImage(node.url, node.alt, policy);
      // The approved manifest title is the article's only H1. Source headings
      // keep their text and relative hierarchy, shifted one level, capped at H6.
      if (node.type === "heading" && node.depth !== undefined) node.depth = Math.min(node.depth + 1, 6);
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

/** Pure server-renderable component; no MDX compilation, HTML parsing or execution. */
export function renderMarkdown(markdown: string, policy: MarkdownPolicy): ReactNode {
  const components: Components = {
    a: ({ href, children }) => href
      ? createElement("a", { href, ...(href.startsWith("http") ? { rel: "noopener noreferrer" } : {}) }, children)
      : createElement("span", null, children),
    img: ({ src, alt }) => createElement("img", {
      src, alt, loading: "lazy", decoding: "async",
    }),
    table: ({ children }) => createElement("div", { className: "writeup-table-scroll", tabIndex: 0, role: "region", "aria-label": "Table / Bảng" }, createElement("table", null, children)),
    pre: ({ children }) => createElement("pre", { tabIndex: 0 }, children),
  };
  return createElement(ReactMarkdown, {
    skipHtml: true,
    remarkPlugins: [remarkGfm, policyPlugin(policy)], components,
    urlTransform: (url, key, node) => key === "src"
      ? safeImage(url, typeof node.properties.alt === "string" ? node.properties.alt : undefined, policy)
      : safeLink(url, policy.internalPaths) ?? "",
  }, markdown);
}

/** Shared article structure for production and in-memory fixture layout checks. */
export function renderArticleContent({ publication, body, backLink, footer }: {
  publication: { title: string; event: string; category: string; language: "en" | "vi" | "en-vi" };
  body: ReactNode; backLink: ReactNode; footer: ReactNode;
}) {
  const language = publication.language === "en-vi" ? "mul" : publication.language;
  return createElement("main", { id: "main-content", className: "writeup-page", tabIndex: -1 },
    createElement("article", { "aria-labelledby": "writeup-title" },
      createElement("header", { className: "writeup-opening" }, backLink,
        createElement("p", { className: "writeups-label" }, `${publication.event} / ${publication.category.toUpperCase()}`),
        createElement("h1", { id: "writeup-title" }, publication.title),
        createElement("p", { className: "writeup-language" }, publication.language === "en-vi" ? "English / Tiếng Việt" : publication.language === "vi" ? "Tiếng Việt" : "English")),
      createElement("div", { className: "writeup-body", lang: language }, body),
      createElement("footer", { className: "writeup-footer" }, footer)));
}

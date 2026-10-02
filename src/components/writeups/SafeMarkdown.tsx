import "server-only";
import { renderMarkdown, type MarkdownPolicy } from "@/lib/writeups/render-markdown";

export function SafeMarkdown({ markdown, policy }: { markdown: string; policy: MarkdownPolicy }) {
  return renderMarkdown(markdown, policy);
}

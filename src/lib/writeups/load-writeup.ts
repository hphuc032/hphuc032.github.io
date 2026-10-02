import "server-only";
import { notFound } from "next/navigation";
import { readPublishedWriteup, publishedRecord } from "../../../scripts/lib/writeup-publication.mjs";
import { publishedWriteups } from "@/data/writeup-publication";

export async function loadPublishedWriteup(slug: string) {
  const result = await readPublishedWriteup(slug);
  if (!result) notFound();
  const record = publishedRecord(slug)!;
  return {
    publication: result.publication,
    markdown: result.markdown,
    policy: {
      sourcePath: record.source.path,
      approvedImages: result.approvedImages.map(({ sourcePath, publicUrl }) => ({ sourcePath, publicUrl })),
      internalPaths: ["/", "/vi/", "/writeups/", "/vi/writeups/", "/log/", "/vi/log/", ...publishedWriteups().flatMap(entry => [`/writeups/${entry.slug}/`, `/vi/writeups/${entry.slug}/`])],
    },
  };
}

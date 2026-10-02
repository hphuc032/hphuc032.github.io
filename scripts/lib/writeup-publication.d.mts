import type { WriteupManifestEntry, WriteupCategory } from "../../src/data/writeup-publication";
export interface PublicWriteup {
  slug: string;
  title: string;
  event: string;
  category: WriteupCategory;
  language: "en" | "vi" | "en-vi";
}
export interface ApprovedImage { sourcePath: string; publicUrl: string; bytes: Buffer }
export function publishedSummaries(): PublicWriteup[];
export function articleStaticParams(): { slug: string }[];
export function articlePath(slug: string, locale: "en" | "vi"): string;
export function articleSitemapPaths(): { en: string; vi: string }[];
export function publishedRecord(slug: string): WriteupManifestEntry | undefined;
export function publicSummary(entry: WriteupManifestEntry): PublicWriteup;
export function readPublishedEntry(entry: WriteupManifestEntry): Promise<{ markdown: string; approvedImages: ApprovedImage[] }>;
export function readPublishedWriteup(slug: string): Promise<({ publication: PublicWriteup; markdown: string; approvedImages: ApprovedImage[] }) | undefined>;

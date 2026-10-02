/** R6 source allowlist only. R7 must explicitly consume published local sources. */
export type WriteupPublicationState = "draft" | "review" | "published";
export type WriteupCategory = "web" | "crypto" | "forensics" | "reverse";
export interface WriteupManifestEntry {
  id: string;
  slug: string;
  source: { repository: "hphuc032/ctf-writeups"; ref: string; path: string };
  state: WriteupPublicationState;
  title: string | null;
  /** Source folder/event hint; still subject to human review. */
  event: string | null;
  category: WriteupCategory | null;
  language: "en" | "vi" | "en-vi" | null;
  assetPaths: readonly string[];
}

export const writeupPublication: readonly WriteupManifestEntry[] = [
  {
    id: "cookiearena-upload-file-via-url",
    slug: "cookiearena-upload-file-via-url",
    source: {
      repository: "hphuc032/ctf-writeups",
      ref: "f42cd29d383deafe0882020d91cb824eb03f342a",
      path: "CookieArena/Upload-File-via-URL/README.md",
    },
    state: "review",
    title: "Upload File via URL",
    event: "CookieArena",
    category: "web",
    language: "vi",
    assetPaths: [],
  },
  {
    id: "dailyalpacahack-small-n",
    slug: "dailyalpacahack-small-n",
    source: {
      repository: "hphuc032/ctf-writeups",
      ref: "f42cd29d383deafe0882020d91cb824eb03f342a",
      path: "DailyAlpacahack/Web/Small_n/README.md",
    },
    state: "review",
    title: "small-n",
    event: "DailyAlpacahack",
    // Explicit source Category: Crypto overrides the misleading Web directory.
    category: "crypto",
    language: "en-vi",
    assetPaths: [],
  },
];

export function publishedWriteups(): readonly WriteupManifestEntry[] {
  return writeupPublication.filter(entry => entry.state === "published");
}

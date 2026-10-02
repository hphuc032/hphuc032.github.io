import createMDX from "@next/mdx";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { publishedWriteups } from "./src/data/writeup-publication.ts";

const withMDX = createMDX({});
const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages";

export default function nextConfig(phase) {
  return withMDX({
    reactStrictMode: true,
    poweredByHeader: false,
    experimental: { globalNotFound: true },
    // Next 16.3 export rejects empty dynamic params. Article source exists but
    // participates in route discovery only after explicit human publication.
    // No sentinel route, preview candidate or post-export pruning is involved.
    pageExtensions: phase === PHASE_DEVELOPMENT_SERVER
      ? ["preview.tsx", ...(publishedWriteups().length ? ["writeup.tsx"] : []), "ts", "tsx", "mdx"]
      : [...(publishedWriteups().length ? ["writeup.tsx"] : []), "ts", "tsx", "mdx"],
    devIndicators: false,
    env: {
      NEXT_PUBLIC_DEPLOY_TARGET: isGitHubPages ? "github-pages" : "",
    },
    ...(isGitHubPages ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
    } : {
      // Preserve convenient aliases only on deployments with a Next.js server.
      skipProxyUrlNormalize: true,
      async redirects() {
        return [
          { source: "/favicon.ico", destination: "/favicon.svg", permanent: true },
        ];
      },
    }),
  });
}

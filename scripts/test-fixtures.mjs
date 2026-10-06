import { publishedWriteups } from "../src/data/writeup-publication.ts";

// Independent expected public surface for browser/static validation. Keep this
// separate from application catalogs so tests still detect missing exports.
// Approved CTF article routes below follow the canonical publication selector.
export const responsiveWidths = [375, 430, 768, 1024, 1440, 1920];
export const homepageHashSections = ["hero", "about", "featured-projects", "latest-writing", "connect"];
export const operationSlugs = [
  "secure-api-gateway",
  "vulnerability-assessment",
  "network-traffic-analysis",
];
export const securityLogSlug = "analyzing-http-and-https-traffic-with-wireshark";
export const dedicatedPageSegments = ["projects", "writeups", "about", "terminal", "contact"];

export const publishedRoutes = [
  "/",
  "/vi",
  ...dedicatedPageSegments.flatMap(segment => [`/${segment}`, `/vi/${segment}`]),
  ...operationSlugs.flatMap(slug => [`/operations/${slug}`, `/vi/operations/${slug}`]),
  "/log",
  "/vi/log",
  `/log/${securityLogSlug}`,
  `/vi/log/${securityLogSlug}`,
  ...publishedWriteups().flatMap(entry => [`/writeups/${entry.slug}`, `/vi/writeups/${entry.slug}`]),
];

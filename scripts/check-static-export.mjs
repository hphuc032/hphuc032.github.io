import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import { dedicatedPageSegments, publishedRoutes } from "./test-fixtures.mjs";

const outputDirectory = join(process.cwd(), "out");
const siteUrl = "https://hphuc032.github.io";
const staleProjectPath = ["/", "carwyn.sec"].join("");
const routes = publishedRoutes.map(route => route === "/" ? route : `${route}/`);
const requiredFiles = [
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "cv/nguyen-hoang-phuc-cv.pdf",
  ...routes.filter(route => route !== "/").map(route => `${route.slice(1)}index.html`),
];

async function exists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

async function directoryIndex(path) {
  try { return (await stat(path)).isDirectory() && await exists(join(path, "index.html")); } catch { return false; }
}

for (const file of requiredFiles) {
  assert.ok(await exists(join(outputDirectory, file)), `missing static artifact: out/${file}`);
}
assert.ok((await stat(join(outputDirectory, "_next"))).isDirectory(), "missing out/_next directory");
assert.equal(await exists(join(outputDirectory, "en", "index.html")), false, "the unsupported /en alias must not be exported");

const htmlFiles = await Promise.all(requiredFiles.filter(file => file.endsWith(".html")).map(async file => ({
  file,
  html: await readFile(join(outputDirectory, file), "utf8"),
})));
for (const { file, html } of htmlFiles) {
  assert.equal(/https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(html), false, `${file}: localhost URL leaked`);
  assert.equal(html.includes(staleProjectPath), false, `${file}: stale project-site path leaked`);
  assert.ok(html.includes(`${siteUrl}/`) || file === "404.html", `${file}: production base URL missing`);
}

const homeRecord = htmlFiles.find(item => item.file === "index.html");
assert.ok(homeRecord, "home export must exist");
const home = homeRecord.html;
assert.ok(home.includes("/images/identity/nguyen-hoang-phuc.webp"), "portrait must resolve from the site root");
assert.ok(home.includes("/cv/nguyen-hoang-phuc-cv.pdf"), "CV must resolve from the site root");
assert.ok(home.includes("/_next/"), "Next.js assets must resolve from the site root");

for (const segment of dedicatedPageSegments) {
  const record = htmlFiles.find(item => item.file === `${segment}/index.html`);
  assert.ok(record, `${segment}: exported HTML missing`);
  assert.equal(/class="network-object"|class="pointer-atmosphere"/.test(record.html), false, `${segment}: homepage-only visual mounted`);
  const scripts = [...record.html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map(match => match[1])
    .filter(source => source.startsWith("/_next/"));
  const routeJavaScript = (await Promise.all(scripts.map(source => readFile(join(outputDirectory, source.slice(1)), "utf8")))).join("\n");
  assert.equal(/THREE\.WebGLRenderer|NetworkSphere|pointer-atmosphere|wake-canvas/.test(routeJavaScript), false, `${segment}: homepage-only WebGL/wake code shipped`);
}
console.log(`PASS ${dedicatedPageSegments.length} dedicated routes exclude homepage Network Sphere and pointer-wake bundles`);

const sitemap = await readFile(join(outputDirectory, "sitemap.xml"), "utf8");
assert.equal((sitemap.match(/<url>/g) ?? []).length, routes.length, "sitemap route count");
assert.equal(sitemap.includes("localhost"), false, "sitemap must not contain localhost");
const sitemapRoutes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]).pathname);
assert.deepEqual(new Set(sitemapRoutes), new Set(routes), "sitemap must contain exactly the published route catalog");
assert.ok(routes.every(route => sitemap.includes(`${siteUrl}${route}`)), "sitemap must contain every published route at the origin root");

const robots = await readFile(join(outputDirectory, "robots.txt"), "utf8");
assert.ok(robots.includes("Allow: /"), "robots must allow the origin-root site");
assert.ok(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), "robots sitemap URL must use the production origin");

const cv = await readFile(join(outputDirectory, "cv", "nguyen-hoang-phuc-cv.pdf"));
assert.ok(cv.subarray(0, 5).toString() === "%PDF-", "public CV is not a PDF");
console.log(`PASS artifact structure (${requiredFiles.length} required files, CV SHA256 ${createHash("sha256").update(cv).digest("hex")})`);
console.log(`PASS origin-root asset references, SEO URLs, robots and ${routes.length} published sitemap routes`);

const mime = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".svg", "image/svg+xml"],
  [".webp", "image/webp"], [".woff2", "font/woff2"], [".pdf", "application/pdf"],
  [".xml", "application/xml; charset=utf-8"], [".txt", "text/plain; charset=utf-8"],
]);

function fileForRequest(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const relative = pathname.replace(/^\/+/, "");
  const candidate = relative === "" ? "index.html" : relative.endsWith("/") ? `${relative}index.html` : relative;
  const resolved = normalize(join(outputDirectory, candidate));
  return resolved.startsWith(normalize(outputDirectory)) ? resolved : null;
}

const server = createServer(async (request, response) => {
  const requested = fileForRequest(request.url || "/");
  const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
  if (requested && !requestUrl.pathname.endsWith("/") && await directoryIndex(requested)) {
    response.statusCode = 308;
    response.setHeader("Location", `${requestUrl.pathname}/${requestUrl.search}`);
    response.end();
    return;
  }
  const file = requested && await exists(requested) ? requested : join(outputDirectory, "404.html");
  response.statusCode = requested && await exists(requested) ? 200 : 404;
  response.setHeader("Content-Type", mime.get(extname(file)) || "application/octet-stream");
  const body = await readFile(file);
  // Optional local laboratory delivery; production headers remain owned by Pages.
  const compressed = process.argv.includes("--compressed") && /\b gzip\b|^gzip\b|,gzip\b/.test(request.headers["accept-encoding"] || "") && /\.(html|css|js|svg|xml|txt)$/.test(file);
  if (compressed) {
    response.setHeader("Content-Encoding", "gzip");
    response.setHeader("Vary", "Accept-Encoding");
  }
  response.end(compressed ? gzipSync(body) : body);
});

const serve = process.argv.includes("--serve");
const requestedPort = serve ? Number(process.env.PORT || 4173) : 0;
await new Promise(resolve => server.listen(requestedPort, "127.0.0.1", resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const localOrigin = `http://127.0.0.1:${address.port}`;
  for (const route of routes) {
    const response = await fetch(`${localOrigin}${route}`);
    assert.equal(response.status, 200, `direct request failed: ${route}`);
    assert.match(response.headers.get("content-type") || "", /^text\/html/, `direct route must serve HTML: ${route}`);
  }
  const missing = await fetch(`${localOrigin}/log/not-published/`);
  assert.equal(missing.status, 404, "unpublished route must remain unavailable");
  console.log(`PASS direct static-host requests for ${routes.length} published routes; unpublished route returns 404`);
  if (serve) {
    console.log(`Static export available at ${localOrigin}/`);
    await new Promise(resolve => {
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
    });
  }
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

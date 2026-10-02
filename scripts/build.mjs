import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { prepareWriteupAssets } from "./prepare-writeup-assets.mjs";

await prepareWriteupAssets();

const productionUrl = "https://hphuc032.github.io";
const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages" || process.argv.includes("--github-pages");
const proxy = join(process.cwd(), "src", "proxy.ts");
const disabledProxy = join(process.cwd(), "src", "proxy.github-pages-disabled");
if (isGitHubPages && !existsSync(proxy)) throw new Error("Expected src/proxy.ts before GitHub Pages build");
if (isGitHubPages && existsSync(disabledProxy)) throw new Error("Stale disabled Proxy file found; restore the source tree before building");

let result;
if (isGitHubPages) renameSync(proxy, disabledProxy);
try {
  result = spawnSync(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...(isGitHubPages ? {
          DEPLOY_TARGET: "github-pages",
          SITE_URL: process.env.SITE_URL || productionUrl,
        } : {}),
      },
      stdio: "inherit",
    },
  );
} finally {
  if (isGitHubPages && existsSync(disabledProxy)) renameSync(disabledProxy, proxy);
}

if (result?.error) throw result.error;
process.exit(result?.status ?? 1);

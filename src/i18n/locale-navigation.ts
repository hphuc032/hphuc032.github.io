import { localizedPath, publicPath } from "./global-ui";
import type { Locale } from "./locales";

// Legacy Home bookmarks resolve to dedicated pages, never stale Home fragments.
const legacyChapters: Readonly<Record<string, string>> = {
  profile: "/about#identity", identity: "/about#identity", expertise: "/about#expertise",
  experience: "/about#experience", achievements: "/about#achievements",
  operations: "/projects", log: "/log", terminal: "/terminal#terminal", contact: "/contact#contact",
};

function fragmentId(hash: string) {
  try { return decodeURIComponent(hash.replace(/^#/, "")); } catch { return ""; }
}

export function legacyHomeDestination(hash: string, locale: Locale) {
  const id = fragmentId(hash);
  if (!Object.hasOwn(legacyChapters, id)) return undefined;
  const target = legacyChapters[id];
  if (!target) return undefined;
  const [path, fragment] = target.split("#");
  const equivalent = localizedPath(path!, locale);
  return equivalent ? `${equivalent}${fragment ? `#${fragment}` : ""}` : undefined;
}

/** Published equivalent only; no query carry-over or foreign-page fragment. */
export function localeDestination(path: string, locale: Locale, hash: string, hasTarget: (id: string) => boolean) {
  if (publicPath(path) === "/") {
    const legacy = legacyHomeDestination(hash, locale);
    if (legacy) return legacy;
  }
  const equivalent = localizedPath(path, locale);
  if (!equivalent) return undefined;
  const id = fragmentId(hash);
  return equivalent + (id && hasTarget(id) ? hash : "");
}

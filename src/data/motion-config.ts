import { canonicalPublicPath, dedicatedPagePublication, type PageIdentity } from "@/data/page-publication";

type MotionIdentity = PageIdentity | "writeup-entry" | "unavailable";
type MotionProfile = { wake: number; reading: boolean };

/** Relative wake energy in empty dark space only; never a publication registry. */
export const motionProfiles = {
  home: { wake: 1, reading: false },
  projects: { wake: .75, reading: false },
  writeups: { wake: .25, reading: true },
  about: { wake: .3, reading: false },
  terminal: { wake: .6, reading: false },
  contact: { wake: .45, reading: false },
  operation: { wake: .2, reading: true },
  "security-log": { wake: .25, reading: true },
  "security-log-entry": { wake: .12, reading: true },
  "writeup-entry": { wake: .12, reading: true },
  unavailable: { wake: 0, reading: true },
} as const satisfies Record<MotionIdentity, MotionProfile>;

export function motionIdentity(path: string): MotionIdentity {
  const canonical = canonicalPublicPath(path);
  if (canonical === "/") return "home";
  if (canonical.startsWith("/operations/")) return "operation";
  if (canonical === "/log") return "security-log";
  if (canonical.startsWith("/log/")) return "security-log-entry";
  if (canonical.startsWith("/writeups/")) return "writeup-entry";
  return dedicatedPagePublication.find(page => canonical === `/${page.segment}`)?.id ?? "unavailable";
}

export function motionProfile(path: string) { return motionProfiles[motionIdentity(path)]; }

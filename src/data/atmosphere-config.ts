import { canonicalPublicPath, dedicatedPagePublication } from "@/data/page-publication";

export type AtmosphereIntensity = "home" | "medium" | "medium-low" | "light" | "very-light";
export type AtmosphereProfile = {
  stars: number;
  twinkles: number;
  delay: readonly [number, number];
  opacity: number;
  meteorScale: number;
  burstChance: number;
};

export const atmosphereProfiles = {
  home: { stars: 108, twinkles: 3, delay: [6000, 12000], opacity: .25, meteorScale: 1, burstChance: .12 },
  medium: { stars: 82, twinkles: 2, delay: [9000, 16000], opacity: .2, meteorScale: .85, burstChance: .07 },
  "medium-low": { stars: 68, twinkles: 2, delay: [9000, 16000], opacity: .16, meteorScale: .75, burstChance: .04 },
  light: { stars: 54, twinkles: 1, delay: [14000, 22000], opacity: .15, meteorScale: .7, burstChance: .03 },
  "very-light": { stars: 32, twinkles: 1, delay: [20000, 30000], opacity: .1, meteorScale: .55, burstChance: 0 },
} as const satisfies Record<AtmosphereIntensity, AtmosphereProfile>;

const pageIntensity = {
  projects: "medium", writeups: "light", about: "light", terminal: "medium", contact: "medium-low",
} as const satisfies Record<(typeof dedicatedPagePublication)[number]["id"], AtmosphereIntensity>;

export function atmosphereIntensity(path: string): AtmosphereIntensity {
  const canonical = canonicalPublicPath(path);
  if (canonical === "/") return "home";
  if (canonical.startsWith("/operations/")) return "light";
  if (canonical.startsWith("/log/") || canonical.startsWith("/writeups/")) return "very-light";
  const page = dedicatedPagePublication.find(record => canonical === `/${record.segment}`);
  return page ? pageIntensity[page.id] : "light";
}

export function atmosphereViewport(width: number) {
  const mobile = width < 768;
  return { density: mobile ? .5 : width < 1024 ? .75 : 1, maxMeteors: mobile ? 1 : 2, mobile };
}
